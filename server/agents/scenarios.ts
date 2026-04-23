import 'dotenv/config'
import { startActivityAgent } from '../agents/activityAgent'
import { analyzeWorkComplexity, getAIGeneratedTask } from '../agents/aiAgent'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface ScenarioConfig {
  name: string
  description: string
  workers: {
    id: string
    activityProfile: 'always_active' | 'mostly_active' | 'intermittent'
    role: 'compute' | 'verifier' | 'orchestrator'
  }[]
  duration: number
  targetPayments: number
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  ai_marketplace: {
    name: 'AI Agent Marketplace',
    description: 'Multiple AI agents competing for compute tasks',
    workers: [
      { id: 'agent-1', activityProfile: 'always_active', role: 'compute' },
      { id: 'agent-2', activityProfile: 'mostly_active', role: 'compute' },
      { id: 'agent-3', activityProfile: 'intermittent', role: 'verifier' },
    ],
    duration: 60000,
    targetPayments: 100,
  },

  freelance_platform: {
    name: 'Freelance Platform',
    description: 'Traditional freelancers getting paid per task',
    workers: [
      { id: 'dev-1', activityProfile: 'always_active', role: 'compute' },
      { id: 'designer-1', activityProfile: 'mostly_active', role: 'compute' },
      { id: 'writer-1', activityProfile: 'intermittent', role: 'compute' },
    ],
    duration: 120000,
    targetPayments: 50,
  },

  api_monetization: {
    name: 'API Monetization',
    description: 'Pay-per-call API with nanopayments',
    workers: [
      { id: 'api-worker', activityProfile: 'always_active', role: 'orchestrator' },
      { id: 'api-compute-1', activityProfile: 'always_active', role: 'compute' },
      { id: 'api-compute-2', activityProfile: 'always_active', role: 'compute' },
    ],
    duration: 30000,
    targetPayments: 30,
  },

  continuous_monitoring: {
    name: 'Continuous Monitoring',
    description: 'Long-running monitoring with variable activity',
    workers: [
      { id: 'monitor-1', activityProfile: 'always_active', role: 'verifier' },
      { id: 'monitor-2', activityProfile: 'mostly_active', role: 'verifier' },
    ],
    duration: 180000,
    targetPayments: 40,
  },

  burst_workload: {
    name: 'Burst Workload',
    description: 'High-intensity short-duration tasks',
    workers: [
      { id: 'burst-1', activityProfile: 'always_active', role: 'compute' },
      { id: 'burst-2', activityProfile: 'always_active', role: 'compute' },
      { id: 'burst-3', activityProfile: 'always_active', role: 'compute' },
      { id: 'burst-4', activityProfile: 'always_active', role: 'compute' },
      { id: 'burst-5', activityProfile: 'always_active', role: 'compute' },
    ],
    duration: 30000,
    targetPayments: 50,
  },
}

/**
 * Demo Scenarios Runner
 * 
 * Pre-configured scenarios to demonstrate different use cases:
 * 1. AI Agent Marketplace - Multiple agents competing
 * 2. Freelance Platform - Traditional work patterns  
 * 3. API Monetization - Pay-per-call
 * 4. Continuous Monitoring - Long-running tasks
 * 5. Burst Workload - High-intensity short tasks
 */
export async function runScenario(
  scenarioName: string,
  authToken: string
): Promise<{
  scenario: ScenarioConfig
  results: any
}> {
  const scenario = SCENARIOS[scenarioName]
  
  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioName}. Available: ${Object.keys(SCENARIOS).join(', ')}`)
  }

  console.log(`\n🎬 Running scenario: ${scenario.name}`)
  console.log(`   ${scenario.description}`)
  console.log(`   Workers: ${scenario.workers.length}`)
  console.log(`   Duration: ${scenario.duration}ms\n`)

  const intervals: NodeJS.Timeout[] = []
  let totalPayments = 0

  // Start workers
  for (const worker of scenario.workers) {
    // Create session for worker
    try {
      const sessionRes = await axios.post(
        `${API_URL}/api/sessions/start`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      const sessionId = sessionRes.data.sessionId

      // Get AI-generated task for this worker
      const task = await getAIGeneratedTask()
      console.log(`   [${worker.id}] Assigned task: ${task.task}`)

      // Start activity agent
      const interval = startActivityAgent({
        workerId: worker.id,
        sessionId,
        activityProfile: worker.activityProfile,
        pingIntervalMs: 30000,
        authToken,
      })

      intervals.push(interval)

      // Track payments
      let pingCount = 0
      const paymentTracker = setInterval(async () => {
        pingCount++
        totalPayments++
        
        // Analyze work complexity periodically
        if (pingCount % 5 === 0) {
          const analysis = await analyzeWorkComplexity({
            workerId: worker.id,
            sessionId,
            activityScore: 80,
            previousPings: pingCount,
            timeInSession: pingCount * 30,
          })
          console.log(`   [${worker.id}] Complexity: ${analysis.complexity}, Rate: $${analysis.suggestedRate}`)
        }
      }, 30000)

      intervals.push(paymentTracker)
    } catch (err) {
      console.error(`   [${worker.id}] Failed to start:`, err)
    }
  }

  // Run for specified duration
  await new Promise(resolve => setTimeout(resolve, scenario.duration))

  // Stop all intervals
  intervals.forEach(clearInterval)

  // Get results
  const proofRes = await axios.get(`${API_URL}/api/demo/proof`)
  const metricsRes = await axios.get(`${API_URL}/api/demo/metrics`)

  console.log(`\n✅ Scenario complete: ${scenario.name}`)
  console.log(`   Total payments: ${totalPayments}`)
  console.log(`   Target: ${scenario.targetPayments}\n`)

  return {
    scenario,
    results: {
      totalPayments,
      targetMet: totalPayments >= scenario.targetPayments,
      proof: proofRes.data,
      metrics: metricsRes.data,
    },
  }
}

/**
 * Run all scenarios sequentially
 */
export async function runAllScenarios(authToken: string): Promise<void> {
  console.log('\n' + '='.repeat(50))
  console.log('🧪 Running All Demo Scenarios')
  console.log('='.repeat(50) + '\n')

  for (const scenarioName of Object.keys(SCENARIOS)) {
    try {
      await runScenario(scenarioName, authToken)
      // Brief pause between scenarios
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (err) {
      console.error(`Scenario ${scenarioName} failed:`, err)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ All scenarios complete!')
  console.log('='.repeat(50) + '\n')
}

/**
 * Quick demo - single scenario with high activity
 */
export async function quickDemo(authToken: string): Promise<void> {
  console.log('\n🚀 Starting Quick Demo (High Activity)\n')

  const workers = [
    { id: 'worker-1', profile: 'always_active' as const },
    { id: 'worker-2', profile: 'always_active' as const },
    { id: 'worker-3', profile: 'mostly_active' as const },
    { id: 'worker-4', profile: 'mostly_active' as const },
    { id: 'worker-5', profile: 'intermittent' as const },
  ]

  const intervals: NodeJS.Timeout[] = []

  for (const w of workers) {
    try {
      const sessionRes = await axios.post(
        `${API_URL}/api/sessions/start`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      )

      const interval = startActivityAgent({
        workerId: w.id,
        sessionId: sessionRes.data.sessionId,
        activityProfile: w.profile,
        pingIntervalMs: 2000, // Very fast for demo
        authToken,
      })

      intervals.push(interval)
      console.log(`✓ Started ${w.id} (${w.profile})`)
    } catch (err) {
      console.error(`✗ Failed to start ${w.id}:`, err)
    }
  }

  // Run for 60 seconds
  await new Promise(resolve => setTimeout(resolve, 60000))

  // Cleanup
  intervals.forEach(clearInterval)
  
  console.log('\n✅ Quick demo complete!')
}

/**
 * Get available scenarios
 */
export function getScenarios(): ScenarioConfig[] {
  return Object.values(SCENARIOS)
}

export default {
  runScenario,
  runAllScenarios,
  quickDemo,
  getScenarios,
}