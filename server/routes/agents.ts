import { Router, Request, Response } from 'express'
import { activityAgent, paymentEngine, budgetGuard } from '../agents/index'

const router = Router()

interface AgentLog {
  id: string
  timestamp: string
  agent: string
  level: 'info' | 'warn' | 'error'
  message: string
  data?: Record<string, unknown>
}

const logs: AgentLog[] = []
const MAX_LOGS = 500

function addLog(agent: string, level: AgentLog['level'], message: string, data?: Record<string, unknown>) {
  const log: AgentLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    agent,
    level,
    message,
    data,
  }
  logs.unshift(log)
  if (logs.length > MAX_LOGS) logs.pop()
}

router.get('/agents/metrics', (_req: Request, res: Response) => {
  try {
    const activityMetrics = activityAgent.getMetrics?.() ?? {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      idlePeriods: 0,
      totalEarned: 0,
      averageActivityScore: 0,
      uptime: 0,
      lastActivityAt: Date.now(),
    }

    const paymentMetrics = paymentEngine.getMetrics?.() ?? {
      totalDispatched: 0,
      totalFailed: 0,
      totalAmount: 0,
      averageSettlementTime: 0,
      lastPaymentAt: Date.now(),
    }

    const budgetInfo = budgetGuard.getInfo?.() ?? {
      dailyCap: 50,
      dailySpent: 0,
      dailyRemaining: 50,
      hourlyCap: 10,
      hourlySpent: 0,
      hourlyRemaining: 10,
      warningThreshold: 0.8,
      isExceeded: false,
      isWarning: false,
      workerBudgets: [],
    }

    res.json({
      activity: activityMetrics,
      payment: { ...paymentMetrics, totalAmount: paymentMetrics.totalAmount },
      budget: budgetInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Agents] metrics error:', err)
    res.status(500).json({ error: 'metrics_failed' })
  }
})

router.get('/agents/logs', (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100)
    const agent = req.query.agent as string | undefined
    const level = req.query.level as string | undefined

    let filtered = logs
    if (agent) {
      filtered = filtered.filter(l => l.agent.toLowerCase().includes(agent.toLowerCase()))
    }
    if (level) {
      filtered = filtered.filter(l => l.level === level)
    }

    res.json({
      logs: filtered.slice(0, limit),
      total: logs.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Agents] logs error:', err)
    res.status(500).json({ error: 'logs_failed' })
  }
})

export function pushAgentLog(agent: string, level: AgentLog['level'], message: string, data?: Record<string, unknown>) {
  addLog(agent, level, message, data)
}

export default router