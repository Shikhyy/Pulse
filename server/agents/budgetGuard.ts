import db from '../db'
import { sqlite } from '../db'
import { payments, workerStates, employers } from '../db/schema'
import { sql, eq } from 'drizzle-orm'
import { getIO } from '../socket'

/**
 * Budget Guard Agent
 * Enforces employer daily cap + worker pause state before each Nanopayment.
 */
export async function budgetGuard(
  employerId: string,
  workerId: string,
  amount: number
): Promise<{ allow: boolean; reason?: string; spentToday?: number; cap?: number }> {
  // 1. Check if worker is paused
  const workerState = db
    .select()
    .from(workerStates)
    .where(eq(workerStates.workerId, workerId))
    .get()

  if (workerState?.paused) {
    return { allow: false, reason: 'worker_paused' }
  }

  // 2. Query today's employer spend from payments table
  const spentRow = db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(
      sql`employer_id = ${employerId} AND created_at > datetime('now', '-1 day')`
    )
    .get()

  const spentToday = spentRow?.total ?? 0

  // 3. Get employer daily cap (from employers table or fallback default)
  const capRow = db.select({ dailyCap: employers.dailyCap }).from(employers)
    .where(eq(employers.id, employerId)).get()
  const cap = capRow?.dailyCap ?? Number(process.env.DEFAULT_DAILY_CAP_USD ?? 50)

  // 4. Check if adding this payment would exceed cap
  const newTotal = spentToday + amount
  const pct = (newTotal / cap) * 100

  if (spentToday + amount > cap) {
    // Emit exceeded alert
    try {
      getIO().to(`employer:${employerId}`).emit('budget:exceeded', {
        spent: spentToday,
        cap,
        pct: 100,
      })
    } catch {}
    return { allow: false, reason: 'employer_daily_cap_exceeded', spentToday, cap }
  }

  // 5. Emit 80% warning
  if (pct >= 80 && pct < 100) {
    try {
      getIO().to(`employer:${employerId}`).emit('budget:warning', {
        spent: newTotal,
        cap,
        pct: Math.round(pct),
      })
    } catch {}
  }

  return { allow: true, spentToday, cap }
}

/**
 * Pause a worker
 */
export function pauseWorker(workerId: string) {
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

/**
 * Resume a worker
 */
export function resumeWorker(workerId: string) {
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
