import { Router, Request, Response } from 'express'
import db from '../db'
import { sessions, payments } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'

const router = Router()

/**
 * GET /api/worker/sessions
 * Get worker's session history
 */
router.get('/worker/sessions', async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).userId

    const sessionsList = db
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        endedAt: sessions.endedAt,
        earnings: sql<number>`COALESCE((SELECT SUM(amount) FROM ${payments} WHERE ${payments.sessionId} = ${sessions.id}), 0)`,
        paymentCount: sql<number>`(SELECT COUNT(*) FROM ${payments} WHERE ${payments.sessionId} = ${sessions.id})`,
      })
      .from(sessions)
      .where(eq(sessions.workerId, workerId))
      .orderBy(desc(sessions.startedAt))
      .limit(50)
      .all()

    const sessionsWithDuration = sessionsList.map((s) => ({
      ...s,
      durationSeconds: s.endedAt
        ? Math.floor((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 1000)
        : s.startedAt
          ? Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000)
          : 0,
    }))

    res.json({ sessions: sessionsWithDuration })
  } catch (err) {
    console.error('[Sessions] list error:', err)
    res.status(500).json({ error: 'fetch_failed' })
  }
})

/**
 * GET /api/worker/earnings
 * Get worker's earnings summary
 */
router.get('/worker/earnings', async (req: Request, res: Response) => {
  try {
    const workerId = (req as any).userId

    const today = db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payments)
      .where(sql`worker_id = ${workerId} AND created_at > datetime('now', 'start of day')`)
      .get()

    const week = db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payments)
      .where(sql`worker_id = ${workerId} AND created_at > datetime('now', '-7 days')`)
      .get()

    const allTime = db
      .select({
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payments)
      .where(eq(payments.workerId, workerId))
      .get()

    const pings = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(eq(payments.workerId, workerId))
      .get()

    res.json({
      today: today?.total ?? 0,
      week: week?.total ?? 0,
      allTime: allTime?.total ?? 0,
      pingCount: pings?.count ?? 0,
    })
  } catch (err) {
    console.error('[Earnings] fetch error:', err)
    res.status(500).json({ error: 'fetch_failed' })
  }
})

export default router