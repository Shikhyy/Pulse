import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db'
import { users, employers } from '../db/schema'
import { eq } from 'drizzle-orm'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET ?? 'pulse-dev-secret-change-in-prod'

/**
 * POST /api/auth/signup/worker
 */
router.post('/auth/signup/worker', async (req: Request, res: Response) => {
  try {
    const { email, name, password, inviteCode } = req.body
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    // Check if email exists
    const existing = db.select().from(users).where(eq(users.email, email)).get()
    if (existing) {
      return res.status(409).json({ error: 'email_exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = uuidv4()

    // Find employer by invite code (simple: match employer ID)
    let employerId: string | undefined
    if (inviteCode) {
      const emp = db.select().from(employers).where(eq(employers.id, inviteCode)).get()
      if (emp) employerId = emp.id
    }

    // If no invite code, use the demo employer
    const demoEmployer = db.select().from(employers).get()
    if (!employerId && demoEmployer) {
      employerId = demoEmployer.id
    }

    // Create wallet via Circle (in stub mode, generate a mock address)
    const isStubMode =
      !process.env.CIRCLE_API_KEY ||
      process.env.CIRCLE_API_KEY === 'your_api_key' ||
      process.env.STUB_MODE === 'true'

    let circleWalletId: string | undefined
    let walletAddress: string | undefined

    if (!isStubMode) {
      try {
        const { initiateDeveloperControlledWalletsClient } = await import(
          '@circle-fin/developer-controlled-wallets'
        )
        const client = initiateDeveloperControlledWalletsClient({
          apiKey: process.env.CIRCLE_API_KEY!,
          entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
        })

        // Use existing worker wallet set or create one
        const walletSetId = process.env.WORKER_WALLET_SET_ID
        const walletRes = await client.createWallets({
          blockchains: ['ARC-TESTNET'],
          count: 1,
          walletSetId: walletSetId!,
        })
        const wallet = walletRes.data?.wallets?.[0]
        if (wallet) {
          circleWalletId = wallet.id
          walletAddress = wallet.address
        }
      } catch (err) {
        console.warn('[Auth] Circle wallet creation failed, using stub:', err)
      }
    }

    // Stub wallet address
    if (!walletAddress) {
      walletAddress = `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`
      circleWalletId = `stub-worker-${userId}`
    }

    db.insert(users)
      .values({
        id: userId,
        email,
        name,
        role: 'worker',
        passwordHash,
        circleWalletId,
        walletAddress,
        employerId: employerId ?? null,
      })
      .run()

    const token = jwt.sign({ userId, role: 'worker' }, JWT_SECRET, { expiresIn: '7d' })

    return res.status(201).json({
      token,
      user: { id: userId, name, email, role: 'worker', walletAddress },
    })
  } catch (err) {
    console.error('[Auth] signup/worker error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * POST /api/auth/signup/employer
 */
router.post('/auth/signup/employer', async (req: Request, res: Response) => {
  try {
    const { email, name, password, companyName, dailyCap } = req.body
    if (!email || !name || !password || !companyName) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    const existing = db.select().from(users).where(eq(users.email, email)).get()
    if (existing) return res.status(409).json({ error: 'email_exists' })

    const passwordHash = await bcrypt.hash(password, 10)
    const userId = uuidv4()
    const employerId = uuidv4()

    // Stub employer wallet
    const walletAddress = process.env.CIRCLE_EMPLOYER_WALLET_ADDRESS ??
      `0x${uuidv4().replace(/-/g, '').slice(0, 40)}`
    const circleWalletId = process.env.CIRCLE_EMPLOYER_WALLET_ID ??
      `stub-employer-${employerId}`

    db.insert(users)
      .values({
        id: userId,
        email,
        name,
        role: 'employer',
        passwordHash,
        circleWalletId,
        walletAddress,
      })
      .run()

    db.insert(employers)
      .values({
        id: employerId,
        userId,
        companyName,
        circleWalletId,
        walletAddress,
        dailyCap: dailyCap ?? 50,
      })
      .run()

    const token = jwt.sign({ userId, role: 'employer' }, JWT_SECRET, { expiresIn: '7d' })

    return res.status(201).json({
      token,
      user: { id: userId, name, email, role: 'employer', walletAddress },
      employer: { id: employerId, companyName, inviteCode: employerId },
    })
  } catch (err) {
    console.error('[Auth] signup/employer error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * POST /api/auth/login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'missing_fields' })
    }

    const user = db.select().from(users).where(eq(users.email, email)).get()
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) return res.status(401).json({ error: 'invalid_credentials' })

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    })

    // Get employer ID if this user is an employer
    let employerInfo = null
    if (user.role === 'employer') {
      const emp = db.select().from(employers).where(eq(employers.userId, user.id)).get()
      if (emp) {
        employerInfo = { id: emp.id, companyName: emp.companyName, inviteCode: emp.id }
      }
    }

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        employerId: user.employerId,
      },
      employer: employerInfo,
    })
  } catch (err) {
    console.error('[Auth] login error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * Auth middleware — attaches userId and role to request
 */
export function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  try {
    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    ;(req as any).userId = decoded.userId
    ;(req as any).userRole = decoded.role
    next()
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

export default router
