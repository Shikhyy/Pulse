import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db'
import { sessions, payments, users, employers } from '../db/schema'
import { eq, isNull, and, sql } from 'drizzle-orm'
import { getIO } from '../socket'
import { sqlite } from '../db'

const router = Router()

/**
 * POST /api/sessions/start — Worker clock-in
 */
router.post('/sessions/start', async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).userId // set by auth middleware

    // Verify worker exists
    const worker = db.select().from(users).where(eq(users.id, workerId)).get()
    if (!worker || worker.role !== 'worker') {
      return res.status(403).json({ error: 'not_a_worker' })
    }

    // Resolve employer — use linked employerId, or fall back to first employer in DB
    let resolvedEmployerId = worker.employerId
    if (!resolvedEmployerId) {
      const firstEmployer = db.select().from(employers).get()
      if (firstEmployer) resolvedEmployerId = firstEmployer.id
    }

    if (!resolvedEmployerId) {
      return res.status(400).json({ error: 'no_employer_found' })
    }

    // Close any existing open sessions for this worker
    sqlite.prepare('UPDATE sessions SET ended_at = datetime(\'now\') WHERE worker_id = ? AND ended_at IS NULL').run(workerId)

    // Create new session
    const sessionId = uuidv4()
    db.insert(sessions)
      .values({
        id: sessionId,
        workerId,
        employerId: resolvedEmployerId,
        startedAt: new Date().toISOString(),
      })
      .run()

    // Notify employer dashboard
    try {
      getIO().to(`employer:${resolvedEmployerId}`).emit('worker:clocked_in', {
        workerId,
        workerName: worker.name,
        sessionId,
        timestamp: new Date().toISOString(),
      })
    } catch {}

    return res.json({ sessionId, workerId, employerId: resolvedEmployerId })
  } catch (err) {
    console.error('[Sessions] start error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * POST /api/sessions/end — Worker clock-out
 */
router.post('/sessions/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    const workerId = (req as any).userId

    const session = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.endedAt)))
      .get()

    if (!session) {
      return res.status(404).json({ error: 'session_not_found' })
    }

    // End the session
    sqlite.prepare('UPDATE sessions SET ended_at = datetime(\'now\') WHERE id = ?').run(sessionId)

    // Calculate summary
    const paymentSummary = db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(eq(payments.sessionId, sessionId))
      .get()

    const totalEarned = paymentSummary?.total ?? 0
    const pingCount = paymentSummary?.count ?? 0

    // Duration in seconds
    const startedAt = new Date(session.startedAt!).getTime()
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000)

    const summary = {
      sessionId,
      totalEarned,
      pingCount,
      durationSeconds,
      idleCount: Math.max(0, Math.floor(durationSeconds / 30) - pingCount),
    }

    // Notify employer
    try {
      getIO().to(`employer:${session.employerId}`).emit('worker:clocked_out', {
        workerId,
        sessionId,
        totalEarned,
        timestamp: new Date().toISOString(),
      })
    } catch {}

    return res.json(summary)
  } catch (err) {
    console.error('[Sessions] end error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/worker/earnings — Worker earnings summary
 */
router.get('/worker/earnings', async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).userId

    // Active session
    const activeSession = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.workerId, workerId), isNull(sessions.endedAt)))
      .get()

    // Today's total
    const todayRow = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(
        sql`worker_id = ${workerId} AND created_at > datetime('now', '-1 day')`
      )
      .get()

    // This week's total
    const weekRow = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(
        sql`worker_id = ${workerId} AND created_at > datetime('now', '-7 days')`
      )
      .get()

    // Session total (if active)
    let sessionTotal = 0
    if (activeSession) {
      const sessionRow = db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(payments)
        .where(eq(payments.sessionId, activeSession.id))
        .get()
      sessionTotal = sessionRow?.total ?? 0
    }

    // Recent payments
    const recentPayments = sqlite.prepare(
      'SELECT id, amount, arc_tx_hash, created_at FROM payments WHERE worker_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(workerId) as { id: number; amount: number; arc_tx_hash: string; created_at: string }[]

    return res.json({
      activeSession: activeSession
        ? {
            id: activeSession.id,
            startedAt: activeSession.startedAt,
            sessionTotal,
          }
        : null,
      todayTotal: todayRow?.total ?? 0,
      weekTotal: weekRow?.total ?? 0,
      recentPayments,
    })
  } catch (err) {
    console.error('[Sessions] earnings error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router
