import 'dotenv/config'
import axios from 'axios'
import { EventEmitter } from 'events'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export enum AgentRole {
  COMPUTE = 'compute',
  VERIFIER = 'verifier',
  ORCHESTRATOR = 'orchestrator',
  MONITOR = 'monitor',
}

export enum AgentState {
  IDLE = 'idle',
  STARTING = 'starting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ERROR = 'error',
  STOPPED = 'stopped',
}

export interface ActivityMetrics {
  totalPings: number
  successfulPings: number
  failedPings: number
  idlePeriods: number
  totalEarned: number
  averageActivityScore: number
  uptime: number
  lastActivityAt: number
}

export interface AgentConfig {
  workerId: string
  sessionId: string
  role: AgentRole
  circleWalletId?: string
  activityProfile: 'always_active' | 'mostly_active' | 'intermittent' | 'mostly_idle'
  pingIntervalMs: number
  authToken: string
  maxIdleScore?: number
  autoRetry?: boolean
}

interface PingResult {
  success: boolean
  amount?: number
  sessionTotal?: number
  error?: string
  timestamp: number
}

/**
 * Enhanced Activity Agent with sophisticated behavior modeling
 * 
 * Features:
 * - Role-based behavior patterns
 * - Activity score smoothing (moving average)
 * - Idle detection and recovery
 * - Metrics collection
 * - State machine transitions
 * - Event-based notifications
 */
export class ActivityAgent extends EventEmitter {
  private config: AgentConfig
  private state: AgentState = AgentState.IDLE
  private pingSeq: number = 0
  private metrics: ActivityMetrics
  private interval?: NodeJS.Timeout
  private activityHistory: number[] = []
  private consecutiveIdleCount: number = 0
  private startedAt: number = 0
  
  constructor(config: AgentConfig) {
    super()
    this.config = {
      maxIdleScore: 10,
      autoRetry: true,
      ...config,
    }
    this.metrics = this.initMetrics()
  }

  private initMetrics(): ActivityMetrics {
    return {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      idlePeriods: 0,
      totalEarned: 0,
      averageActivityScore: 0,
      uptime: 0,
      lastActivityAt: 0,
    }
  }

  /**
   * Start the activity agent
   */
  start(): void {
    if (this.state === AgentState.ACTIVE) {
      console.warn(`[ActivityAgent:${this.config.workerId}] Already running`)
      return
    }

    this.state = AgentState.STARTING
    this.startedAt = Date.now()
    this.emit('started', { workerId: this.config.workerId, role: this.config.role })

    console.log(
      `[ActivityAgent] Starting ${this.config.role} agent ${this.config.workerId} ` +
      `(${this.config.activityProfile}, interval: ${this.config.pingIntervalMs}ms)`
    )

    this.runPingCycle()
    this.state = AgentState.ACTIVE
  }

  /**
   * Stop the activity agent
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
    this.state = AgentState.STOPPED
    this.metrics.uptime = Date.now() - this.startedAt
    this.emit('stopped', { workerId: this.config.workerId, metrics: this.getMetrics() })
    console.log(`[ActivityAgent:${this.config.workerId}] Stopped. Uptime: ${this.metrics.uptime}ms`)
  }

  /**
   * Pause the agent (budget exceeded or manual)
   */
  pause(): void {
    this.state = AgentState.PAUSED
    this.emit('paused', { workerId: this.config.workerId })
    console.log(`[ActivityAgent:${this.config.workerId}] Paused`)
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (this.state !== AgentState.PAUSED) return
    this.state = AgentState.ACTIVE
    this.emit('resumed', { workerId: this.config.workerId })
    console.log(`[ActivityAgent:${this.config.workerId}] Resumed`)
  }

  /**
   * Main ping cycle
   */
  private async runPingCycle(): Promise<void> {
    this.interval = setInterval(async () => {
      if (this.state !== AgentState.ACTIVE) return

      try {
        const result = await this.executePing()
        
        if (result.success) {
          this.handleSuccess(result)
        } else {
          this.handleFailure(result)
        }
      } catch (err) {
        this.handleError(err)
      }
    }, this.config.pingIntervalMs)

    // Execute immediately on start
    this.executePing().then(result => {
      if (result.success) this.handleSuccess(result)
      else this.handleFailure(result)
    }).catch(err => this.handleError(err))
  }

  /**
   * Execute a single ping with activity proof
   */
  private async executePing(): Promise<PingResult> {
    const activityScore = this.generateActivityScore()
    const smoothedScore = this.smoothActivityScore(activityScore)
    
    this.activityHistory.push(smoothedScore)
    if (this.activityHistory.length > 100) {
      this.activityHistory.shift()
    }

    // Check if worker is idle
    if (smoothedScore < (this.config.maxIdleScore || 10)) {
      this.consecutiveIdleCount++
      if (this.consecutiveIdleCount > 3) {
        this.metrics.idlePeriods++
        this.emit('idle', { workerId: this.config.workerId, score: smoothedScore })
      }
      return { success: false, error: 'idle', timestamp: Date.now() }
    }

    this.consecutiveIdleCount = 0
    this.pingSeq++
    this.metrics.totalPings++
    this.metrics.lastActivityAt = Date.now()

    const proof = {
      workerId: this.config.workerId,
      sessionId: this.config.sessionId,
      timestamp: Date.now().toString(),
      activityScore: smoothedScore.toString(),
      role: this.config.role,
      pingSeq: this.pingSeq,
    }

    const signature = await this.signProof(proof)

    try {
      const res = await axios.post(
        `${API_URL}/api/ping`,
        { proof, signature },
        { headers: { Authorization: `Bearer ${this.config.authToken}` } }
      )

      return {
        success: true,
        amount: parseFloat(res.data.amount),
        sessionTotal: res.data.sessionTotal,
        timestamp: Date.now(),
      }
    } catch (err: any) {
      const errorCode = err.response?.data?.error
      return {
        success: false,
        error: errorCode || err.message,
        timestamp: Date.now(),
      }
    }
  }

  /**
   * Generate activity score based on role and profile
   */
  private generateActivityScore(): number {
    const { role, activityProfile } = this.config

    // Role-specific base scores
    const roleMultipliers: Record<AgentRole, number> = {
      [AgentRole.COMPUTE]: 1.0,
      [AgentRole.VERIFIER]: 0.85,
      [AgentRole.ORCHESTRATOR]: 0.9,
      [AgentRole.MONITOR]: 0.95,
    }

    const baseScore = this.simulateByProfile(activityProfile)
    const multiplier = roleMultipliers[role]

    return Math.min(100, Math.floor(baseScore * multiplier))
  }

  /**
   * Profile-based activity simulation with variance
   */
  private simulateByProfile(profile: string): number {
    const variance = () => Math.floor(Math.random() * 10) - 5

    switch (profile) {
      case 'always_active':
        return 90 + variance()
      case 'mostly_active':
        return Math.random() > 0.15 ? 80 + variance() : 5 + variance()
      case 'intermittent':
        return Math.random() > 0.4 ? 70 + variance() : 5 + variance()
      case 'mostly_idle':
        return Math.random() > 0.7 ? 60 + variance() : 5 + variance()
      default:
        return 0
    }
  }

  /**
   * Apply exponential moving average smoothing
   */
  private smoothActivityScore(newScore: number): number {
    const alpha = 0.3 // Smoothing factor
    
    if (this.activityHistory.length === 0) {
      return newScore
    }

    const lastScore = this.activityHistory[this.activityHistory.length - 1]
    return Math.floor(alpha * newScore + (1 - alpha) * lastScore)
  }

  /**
   * Sign the activity proof (EIP-712)
   */
  private async signProof(proof: any): Promise<string> {
    const isStubMode =
      !process.env.CIRCLE_API_KEY ||
      process.env.CIRCLE_API_KEY === 'your_api_key' ||
      process.env.STUB_MODE === 'true'

    if (isStubMode || !this.config.circleWalletId) {
      return '0x' + 'a'.repeat(130)
    }

    try {
      const { initiateDeveloperControlledWalletsClient } = await import(
        '@circle-fin/developer-controlled-wallets'
      )
      const client = initiateDeveloperControlledWalletsClient({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
      })

      const signRes = await client.signTypedData({
        walletId: this.config.circleWalletId,
        data: {
          types: {
            ActivityProof: [
              { name: 'workerId', type: 'string' },
              { name: 'sessionId', type: 'string' },
              { name: 'timestamp', type: 'uint256' },
              { name: 'activityScore', type: 'uint256' },
              { name: 'role', type: 'string' },
              { name: 'pingSeq', type: 'uint256' },
            ],
          },
          primaryType: 'ActivityProof',
          message: proof,
        },
      })
      return signRes.data?.signature ?? '0x' + 'a'.repeat(130)
    } catch (err) {
      console.warn(`[ActivityAgent:${this.config.workerId}] Signing failed, using stub`)
      return '0x' + 'a'.repeat(130)
    }
  }

  /**
   * Handle successful ping
   */
  private handleSuccess(result: PingResult): void {
    this.metrics.successfulPings++
    this.metrics.totalEarned += result.amount || 0
    
    // Update average activity score
    const recentScores = this.activityHistory.slice(-10)
    this.metrics.averageActivityScore = Math.floor(
      recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    )

    console.log(
      `[ActivityAgent:${this.config.workerId}] Ping ${this.pingSeq}: ✓ $${result.amount} ` +
      `(total: $${result.sessionTotal?.toFixed(3)}, score: ${this.metrics.averageActivityScore})`
    )

    this.emit('ping:success', {
      workerId: this.config.workerId,
      amount: result.amount,
      totalEarned: this.metrics.totalEarned,
      sessionTotal: result.sessionTotal,
    })
  }

  /**
   * Handle failed ping
   */
  private handleFailure(result: PingResult): void {
    this.metrics.failedPings++

    console.log(`[ActivityAgent:${this.config.workerId}] Ping ${this.pingSeq}: ✗ ${result.error}`)

    this.emit('ping:failure', {
      workerId: this.config.workerId,
      error: result.error,
    })

    // Handle specific error types
    if (result.error === 'worker_paused') {
      this.pause()
    } else if (result.error === 'employer_daily_cap_exceeded') {
      this.emit('budget_exceeded', { workerId: this.config.workerId })
    }
  }

  /**
   * Handle unexpected errors
   */
  private handleError(err: any): void {
    this.state = AgentState.ERROR
    console.error(`[ActivityAgent:${this.config.workerId}] Error:`, err.message)
    
    this.emit('error', { workerId: this.config.workerId, error: err.message })

    // Auto-recovery for transient errors
    if (this.config.autoRetry) {
      setTimeout(() => {
        if (this.state === AgentState.ERROR) {
          this.state = AgentState.ACTIVE
          console.log(`[ActivityAgent:${this.config.workerId}] Recovered from error`)
        }
      }, 5000)
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): ActivityMetrics {
    return {
      ...this.metrics,
      uptime: this.startedAt ? Date.now() - this.startedAt : 0,
    }
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.state
  }

  /**
   * Get agent info
   */
  getInfo(): any {
    return {
      workerId: this.config.workerId,
      role: this.config.role,
      state: this.state,
      pingSeq: this.pingSeq,
      metrics: this.getMetrics(),
    }
  }
}

/**
 * Factory function to create and start an activity agent
 */
export function startActivityAgent(config: AgentConfig): NodeJS.Timeout {
  const agent = new ActivityAgent(config)
  agent.start()
  
  // Return interval that stops the agent when cleared
  const interval = setInterval(() => {}, Number.MAX_SAFE_INTEGER)
  interval.unref()
  
  // Store agent reference for stopping
  ;(interval as any)._agent = agent
  
  const originalClear = interval.clearInterval
  interval.clearInterval = function() {
    agent.stop()
    originalClear.call(this)
  }
  
  return interval
}

/**
 * Create multiple agents for a scenario
 */
export function createAgentFleet(
  configs: AgentConfig[],
  onEvent?: (event: string, data: any) => void
): Map<string, ActivityAgent> {
  const agents = new Map<string, ActivityAgent>()

  for (const config of configs) {
    const agent = new ActivityAgent(config)
    
    if (onEvent) {
      agent.on('ping:success', (d) => onEvent('ping:success', d))
      agent.on('ping:failure', (d) => onEvent('ping:failure', d))
      agent.on('idle', (d) => onEvent('idle', d))
      agent.on('budget_exceeded', (d) => onEvent('budget_exceeded', d))
      agent.on('error', (d) => onEvent('error', d))
    }
    
    agent.start()
    agents.set(config.workerId, agent)
  }

  return agents
}

/**
 * Stop all agents in a fleet
 */
export function stopAgentFleet(agents: Map<string, ActivityAgent>): void {
  for (const [id, agent] of agents) {
    console.log(`Stopping agent: ${id}`)
    agent.stop()
  }
  agents.clear()
}