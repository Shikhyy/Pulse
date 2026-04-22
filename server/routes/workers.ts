import { Router, Request, Response } from 'express'
import db from '../db'
import { sqlite } from '../db'
import { users, sessions, payments, employers } from '../db/schema'
import { eq, isNull, and, sql } from 'drizzle-orm'
import { pauseWorker, resumeWorker } from '../agents/budgetGuard'
import { getIO } from '../socket'

const router = Router()

/**
 * POST /api/workers/:id/pause
 */
router.post('/workers/:id/pause', async (req: Request, res: Response) => {
  try {
    const { id: workerId } = req.params
    const userId = (req as any).userId

    // Look up employer record for this user
    const employer = db.select().from(employers).where(eq(employers.userId, userId)).get()
    const employerId = employer?.id ?? userId

    // Verify worker belongs to this employer (users.employer_id stores employers.id)
    const worker = db
      .select()
      .from(users)
      .where(and(eq(users.id, workerId), eq(users.employerId, employerId)))
      .get()

    if (!worker) {
      return res.status(404).json({ error: 'worker_not_found' })
    }

    pauseWorker(workerId)

    try {
      getIO().to(`employer:${employerId}`).emit('worker:paused', { workerId, workerName: worker.name })
      getIO().to(`worker:${workerId}`).emit('session:paused', { reason: 'employer_paused' })
    } catch {}

    return res.json({ success: true, workerId, paused: true })
  } catch (err) {
    console.error('[Workers] pause error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * POST /api/workers/:id/resume
 */
router.post('/workers/:id/resume', async (req: Request, res: Response) => {
  try {
    const { id: workerId } = req.params
    const userId = (req as any).userId

    // Look up employer record for this user
    const employer = db.select().from(employers).where(eq(employers.userId, userId)).get()
    const employerId = employer?.id ?? userId

    const worker = db
      .select()
      .from(users)
      .where(and(eq(users.id, workerId), eq(users.employerId, employerId)))
      .get()

    if (!worker) {
      return res.status(404).json({ error: 'worker_not_found' })
    }

    resumeWorker(workerId)

    try {
      getIO().to(`employer:${employerId}`).emit('worker:resumed', { workerId, workerName: worker.name })
      getIO().to(`worker:${workerId}`).emit('session:resumed', {})
    } catch {}

    return res.json({ success: true, workerId, paused: false })
  } catch (err) {
    console.error('[Workers] resume error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/employer/dashboard
 */
router.get('/employer/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId

    // Get employer info (employer record is looked up by the user's userId)
    const employer = db
      .select()
      .from(employers)
      .where(eq(employers.userId, userId))
      .get()

    const employerId = employer?.id ?? userId

    // Get all workers for this employer
    const workerList = db
      .select()
      .from(users)
      .where(and(eq(users.employerId, employerId), eq(users.role, 'worker')))
      .all()

    // Get active sessions
    const activeSessions = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.employerId, employerId), isNull(sessions.endedAt)))
      .all()

    const activeSessionMap = Object.fromEntries(
      activeSessions.map((s) => [s.workerId, s])
    )

    // Get today's spend per worker
    const workerSpend = sqlite.prepare(`
      SELECT worker_id, COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE employer_id = ? AND created_at > datetime('now', '-1 day')
      GROUP BY worker_id
    `).all(employerId) as { worker_id: string; total: number }[]
    const spendMap = Object.fromEntries(workerSpend.map((r) => [r.worker_id, r.total]))

    // Today's total
    const todayRow = db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(
        sql`employer_id = ${employerId} AND created_at > datetime('now', '-1 day')`
      )
      .get()

    const todaySpend = todayRow?.total ?? 0
    const dailyCap = employer?.dailyCap ?? 50

    // Recent payments feed
    const recentPayments = sqlite.prepare(`
      SELECT p.id, p.worker_id, p.amount, p.arc_tx_hash, p.created_at,
             u.name as worker_name
      FROM payments p
      JOIN users u ON u.id = p.worker_id
      WHERE p.employer_id = ?
      ORDER BY p.created_at DESC
      LIMIT 30
    `).all(employerId) as any[]

    // Worker states
    const workerIds = workerList.map(w => w.id)
    const workerStatesData = workerIds.length > 0
      ? sqlite.prepare(`SELECT worker_id, paused FROM worker_states WHERE worker_id IN (${workerIds.map(() => '?').join(',')})`).all(...workerIds) as { worker_id: string; paused: number }[]
      : [] as { worker_id: string; paused: number }[]
    const pauseMap = Object.fromEntries(
      workerStatesData.map((w) => [w.worker_id, Boolean(w.paused)])
    )

    const workers = workerList.map((w) => {
      const session = activeSessionMap[w.id]
      const durationSeconds = session
        ? Math.floor((Date.now() - new Date(session.startedAt!).getTime()) / 1000)
        : 0

      return {
        id: w.id,
        name: w.name,
        walletAddress: w.walletAddress,
        isActive: Boolean(session),
        isPaused: pauseMap[w.id] ?? false,
        sessionId: session?.id,
        sessionDurationSeconds: durationSeconds,
        earnedToday: spendMap[w.id] ?? 0,
      }
    })

    return res.json({
      todaySpend,
      dailyCap,
      budgetPct: Math.round((todaySpend / dailyCap) * 100),
      activeWorkerCount: activeSessions.length,
      totalWorkerCount: workerList.length,
      workers,
      recentPayments,
      employerWalletAddress: employer?.walletAddress,
    })
  } catch (err) {
    console.error('[Workers] dashboard error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router
