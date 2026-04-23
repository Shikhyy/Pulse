import { Router, Request, Response } from 'express'
import { db } from '../db'
import { users, employers, invites } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import crypto from 'crypto'

const router = Router()

/**
 * Generate an invite code for a worker
 */
router.post('/invites/generate', async (req: Request, res: Response) => {
  try {
    const employerId = (req as any).userId
    
    if (!employerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if user is an employer
    const employer = db.select().from(employers).where(eq(employers.userId, employerId)).get()
    
    if (!employer) {
      return res.status(403).json({ error: 'Only employers can generate invites' })
    }

    const { maxUses = 1, expiresIn = 7 } = req.body // days
    
    const code = crypto.randomBytes(8).toString('hex').toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresIn)

    db.insert(invites)
      .values({
        code,
        employerId: employer.id,
        maxUses,
        expiresAt: expiresAt.toISOString(),
      })
      .run()

    const inviteUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/node/signup?invite=${code}`

    res.json({
      code,
      inviteUrl,
      maxUses,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (err) {
    console.error('[Invites] Generate error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * List all invites for an employer
 */
router.get('/invites', async (req: Request, res: Response) => {
  try {
    const employerId = (req as any).userId
    
    if (!employerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const employer = db.select().from(employers).where(eq(employers.userId, employerId)).get()
    
    if (!employer) {
      return res.status(403).json({ error: 'Only employers can view invites' })
    }

    const allInvites = db.select().from(invites).where(eq(invites.employerId, employer.id)).all()

    // Get usage counts
    const invitesWithUsage = allInvites.map(invite => {
      const usedCount = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(sql`invite_code = ${invite.code}`)
        .get()

      return {
        ...invite,
        usedCount: usedCount?.count ?? 0,
      }
    })

    res.json({ invites: invitesWithUsage })
  } catch (err) {
    console.error('[Invites] List error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * Revoke an invite
 */
router.delete('/invites/:code', async (req: Request, res: Response) => {
  try {
    const employerId = (req as any).userId
    const { code } = req.params
    
    if (!employerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const employer = db.select().from(employers).where(eq(employers.userId, employerId)).get()
    
    if (!employer) {
      return res.status(403).json({ error: 'Only employers can revoke invites' })
    }

    // Delete the invite
    db.delete(invites)
      .where(sql`code = ${code} AND employer_id = ${employer.id}`)
      .run()

    res.json({ success: true })
  } catch (err) {
    console.error('[Invites] Revoke error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * Validate an invite code
 */
router.get('/invites/validate/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params

    const invite = db
      .select()
      .from(invites)
      .where(eq(invites.code, code.toUpperCase()))
      .get()

    if (!invite) {
      return res.json({ valid: false, reason: 'Invalid invite code' })
    }

    // Check expiration
    if (new Date(invite.expiresAt) < new Date()) {
      return res.json({ valid: false, reason: 'Invite code has expired' })
    }

    // Check usage
    const usedCount = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(sql`invite_code = ${code}`)
      .get()

    if (usedCount && usedCount.count >= invite.maxUses) {
      return res.json({ valid: false, reason: 'Invite code has reached max uses' })
    }

    // Get employer info
    const employer = db.select().from(employers).where(eq(employers.id, invite.employerId)).get()

    res.json({
      valid: true,
      employer: employer ? { name: employer.companyName } : null,
      expiresAt: invite.expiresAt,
      remainingUses: invite.maxUses - (usedCount?.count ?? 0),
    })
  } catch (err) {
    console.error('[Invites] Validate error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router