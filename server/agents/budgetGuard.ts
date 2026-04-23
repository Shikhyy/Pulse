import db from '../db'
import { sqlite } from '../db'
import { payments, workerStates, employers } from '../db/schema'
import { sql, eq } from 'drizzle-orm'
import { getIO } from '../socket'
import { EventEmitter } from 'events'

export enum BudgetState {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EXCEEDED = 'exceeded',
}

export interface BudgetInfo {
  employerId: string
  spentToday: number
  cap: number
  pct: number
  state: BudgetState
  predictedExhaustion: number | null
  recommendedAction: string
}

export interface WorkerBudgetInfo {
  workerId: string
  isPaused: boolean
  earnedToday: number
  lastActivityAt: number
  efficiency: number
}

/**
 * Enhanced Budget Guard Agent with predictive analytics
 * 
 * Features:
 * - Real-time budget tracking
 * - Predictive spending analysis
 * - Smart alerts (warning, critical, exceeded)
 * - Per-worker budget allocation
 * - Spending velocity monitoring
 * - Budget optimization recommendations
 */
export class BudgetGuard extends EventEmitter {
  private employerBudgets: Map<string, BudgetInfo> = new Map()
  private spendingHistory: Map<string, number[]> = new Map() // employerId -> spending per minute
  private updateInterval?: NodeJS.Timeout
  private readonly HISTORY_WINDOW = 60 // Keep last 60 minutes

  constructor() {
    super()
  }

  /**
   * Start the budget monitoring loop
   */
  start(intervalMs: number = 60000): void {
    if (this.updateInterval) return
    
    this.updateInterval = setInterval(() => {
      this.analyzeAllBudgets()
    }, intervalMs)

    // Run immediately
    this.analyzeAllBudgets()
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = undefined
    }
  }

  /**
   * Check if payment is allowed and update budgets
   */
  async checkPayment(
    employerId: string,
    workerId: string,
    amount: number
  ): Promise<{
    allow: boolean
    reason?: string
    spentToday?: number
    cap?: number
    budgetInfo?: BudgetInfo
  }> {
    // Check worker pause state
    const workerState = db
      .select()
      .from(workerStates)
      .where(eq(workerStates.workerId, workerId))
      .get()

    if (workerState?.paused) {
      return { allow: false, reason: 'worker_paused' }
    }

    // Get current spending
    const spentRow = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(sql`employer_id = ${employerId} AND created_at > datetime('now', '-1 day')`)
      .get()

    const spentToday = spentRow?.total ?? 0

    // Get employer cap
    const employer = db
      .select({ dailyCap: employers.dailyCap })
      .from(employers)
      .where(eq(employers.id, employerId))
      .get()

    const cap = employer?.dailyCap ?? Number(process.env.DEFAULT_DAILY_CAP_USD ?? 50)

    // Calculate new total
    const newTotal = spentToday + amount
    const pct = (newTotal / cap) * 100
    const state = this.calculateState(pct)

    // Check if exceeding
    if (newTotal > cap) {
      this.emitBudgetExceeded(employerId, spentToday, cap)
      return { 
        allow: false, 
        reason: 'employer_daily_cap_exceeded', 
        spentToday, 
        cap 
      }
    }

    // Record this spending for velocity analysis
    this.recordSpending(employerId, amount)

    // Check for warnings
    if (pct >= 80 && pct < 100) {
      this.emitBudgetWarning(employerId, newTotal, cap, Math.round(pct))
    }

    // Store budget info
    const budgetInfo = this.calculateBudgetInfo(employerId, spentToday, cap)
    this.employerBudgets.set(employerId, budgetInfo)

    return { allow: true, spentToday, cap, budgetInfo }
  }

  /**
   * Calculate budget state based on percentage
   */
  private calculateState(pct: number): BudgetState {
    if (pct >= 100) return BudgetState.EXCEEDED
    if (pct >= 90) return BudgetState.CRITICAL
    if (pct >= 80) return BudgetState.WARNING
    return BudgetState.HEALTHY
  }

  /**
   * Record spending for velocity analysis
   */
  private recordSpending(employerId: string, amount: number): void {
    const history = this.spendingHistory.get(employerId) || []
    history.push(amount)
    
    // Keep only recent history
    if (history.length > this.HISTORY_WINDOW) {
      history.shift()
    }
    
    this.spendingHistory.set(employerId, history)
  }

  /**
   * Calculate spending velocity (amount per minute)
   */
  calculateVelocity(employerId: string): number {
    const history = this.spendingHistory.get(employerId) || []
    if (history.length === 0) return 0
    
    // Sum all spending in history window
    const totalSpent = history.reduce((a, b) => a + b, 0)
    return totalSpent / this.HISTORY_WINDOW
  }

  /**
   * Predict when budget will be exhausted
   */
  predictExhaustion(employerId: string, currentSpent: number, cap: number): number | null {
    const velocity = this.calculateVelocity(employerId)
    if (velocity <= 0) return null

    const remaining = cap - currentSpent
    const minutesRemaining = remaining / velocity
    
    // Return predicted exhaustion time (minutes from now)
    return Math.ceil(minutesRemaining)
  }

  /**
   * Calculate comprehensive budget info
   */
  private calculateBudgetInfo(
    employerId: string,
    spentToday: number,
    cap: number
  ): BudgetInfo {
    const pct = (spentToday / cap) * 100
    const state = this.calculateState(pct)
    const predictedExhaustion = this.predictExhaustion(employerId, spentToday, cap)

    // Generate recommendation
    let recommendedAction = 'Continue normal operations'
    if (state === BudgetState.WARNING) {
      recommendedAction = 'Consider reducing active workers or lowering payment rate'
    } else if (state === BudgetState.CRITICAL) {
      recommendedAction = 'URGENT: Reduce spending immediately to avoid service interruption'
    } else if (state === BudgetState.EXCEEDED) {
      recommendedAction = 'Budget exceeded - payment blocked'
    }

    return {
      employerId,
      spentToday,
      cap,
      pct: Math.round(pct),
      state,
      predictedExhaustion,
      recommendedAction,
    }
  }

  /**
   * Analyze all active budgets
   */
  private async analyzeAllBudgets(): Promise<void> {
    const allEmployers = db.select().from(employers).all()

    for (const employer of allEmployers) {
      const spentRow = db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(sql`employer_id = ${employer.id} AND created_at > datetime('now', '-1 day')`)
        .get()

      const spentToday = spentRow?.total ?? 0
      const budgetInfo = this.calculateBudgetInfo(employer.id, spentToday, employer.dailyCap ?? 50)
      
      this.employerBudgets.set(employer.id, budgetInfo)

      // Emit state changes
      if (budgetInfo.state === BudgetState.CRITICAL && budgetInfo.pct >= 90) {
        this.emit('budget:critical', budgetInfo)
      }
    }
  }

  /**
   * Get budget info for an employer
   */
  getBudgetInfo(employerId: string): BudgetInfo | null {
    return this.employerBudgets.get(employerId) || null
  }

  /**
   * Get all active budgets
   */
  getAllBudgets(): BudgetInfo[] {
    return Array.from(this.employerBudgets.values())
  }

  /**
   * Get worker-specific budget info
   */
  getWorkerBudgetInfo(workerId: string): WorkerBudgetInfo | null {
    const workerState = db
      .select()
      .from(workerStates)
      .where(eq(workerStates.workerId, workerId))
      .get()

    const earnedToday = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(sql`worker_id = ${workerId} AND created_at > datetime('now', '-1 day')`)
      .get()

    const lastPayment = sqlite.prepare(`
      SELECT created_at FROM payments 
      WHERE worker_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).get(workerId) as any

    // Calculate efficiency (payments per active minute)
    const workerPayments = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(sql`worker_id = ${workerId} AND created_at > datetime('now', '-1 hour')`)
      .get()

    const efficiency = workerPayments?.count ? Math.min(100, workerPayments.count * 2) : 0

    return {
      workerId,
      isPaused: workerState?.paused ?? false,
      earnedToday: earnedToday?.total ?? 0,
      lastActivityAt: lastPayment?.created_at ? new Date(lastPayment.created_at).getTime() : 0,
      efficiency,
    }
  }

  /**
   * Set employer daily cap
   */
  setDailyCap(employerId: string, cap: number): void {
    db.update(employers)
      .set({ dailyCap: cap })
      .where(eq(employers.id, employerId))
      .run()
    
    // Clear cached budget
    this.employerBudgets.delete(employerId)
  }

  /**
   * Get budget optimization suggestions
   */
  getOptimizationSuggestions(employerId: string): string[] {
    const suggestions: string[] = []
    const budget = this.employerBudgets.get(employerId)
    
    if (!budget) return suggestions

    const velocity = this.calculateVelocity(employerId)

    if (budget.pct > 80) {
      suggestions.push('Reduce active worker count')
    }

    if (velocity > 1) {
      suggestions.push('Increase payment interval from 30s to 60s')
    }

    if (budget.predictedExhaustion && budget.predictedExhaustion < 30) {
      suggestions.push(`Budget will exhaust in ${budget.predictedExhaustion} minutes - consider immediate action`)
    }

    // Check for inefficient workers
    const allWorkerStates = db.select().from(workerStates).all()
    const inefficientWorkers = allWorkerStates.filter(ws => {
      const info = this.getWorkerBudgetInfo(ws.workerId)
      return info && info.efficiency < 30
    })

    if (inefficientWorkers.length > 0) {
      suggestions.push(`Pause ${inefficientWorkers.length} underperforming workers`)
    }

    return suggestions
  }

  /**
   * Emit budget warning event
   */
  private emitBudgetWarning(employerId: string, spent: number, cap: number, pct: number): void {
    try {
      getIO().to(`employer:${employerId}`).emit('budget:warning', {
        spent,
        cap,
        pct,
      })
    } catch {}
    this.emit('budget:warning', { employerId, spent, cap, pct })
  }

  /**
   * Emit budget exceeded event
   */
  private emitBudgetExceeded(employerId: string, spent: number, cap: number): void {
    try {
      getIO().to(`employer:${employerId}`).emit('budget:exceeded', {
        spent,
        cap,
        pct: 100,
      })
    } catch {}
    this.emit('budget:exceeded', { employerId, spent, cap })
  }
}

// Export singleton instance
export const budgetGuard = new BudgetGuard()

// Export functions for backward compatibility
export async function checkBudget(
  employerId: string,
  workerId: string,
  amount: number
): Promise<{ allow: boolean; reason?: string; spentToday?: number; cap?: number }> {
  return budgetGuard.checkPayment(employerId, workerId, amount)
}

export function pauseWorker(workerId: string): void {
  const existing = db
    .select()
    .from(workerStates)
    .where(eq(workerStates.workerId, workerId))
    .get()

  if (existing) {
    db.update(workerStates)
      .set({ paused: true })
      .where(eq(workerStates.workerId, workerId))
      .run()
  } else {
    db.insert(workerStates).values({ workerId, paused: true }).run()
  }
}

export function resumeWorker(workerId: string): void {
  const existing = db
    .select()
    .from(workerStates)
    .where(eq(workerStates.workerId, workerId))
    .get()

  if (existing) {
    db.update(workerStates)
      .set({ paused: false })
      .where(eq(workerStates.workerId, workerId))
      .run()
  } else {
    db.insert(workerStates).values({ workerId, paused: false }).run()
  }
}