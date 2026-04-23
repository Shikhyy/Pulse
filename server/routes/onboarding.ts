import { Router, Request, Response } from 'express'
import { db } from '../db'
import { users, employers, sessions } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import crypto from 'crypto'

const router = Router()

/**
 * GET /api/onboarding/status
 * Check onboarding completion status for a user
 */
router.get('/onboarding/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    
    if (!userId) {
      return res.json({
        step: 'not_started',
        progress: 0,
      })
    }

    const user = db.select().from(users).where(eq(users.id, userId)).get()
    
    if (!user) {
      return res.json({ step: 'not_started', progress: 0 })
    }

    // Check what steps are complete
    const hasWallet = Boolean(user.walletAddress && user.circleWalletId)
    
    const hasActiveSession = db
      .select()
      .from(sessions)
      .where(eq(sessions.workerId, userId))
      .where(sql`ended_at IS NULL`)
      .get()

    let step = 'signup'
    let progress = 10

    if (user.role === 'worker') {
      if (hasWallet) {
        progress = 50
        step = hasActiveSession ? 'ready' : 'ready_to_work'
      }
    } else if (user.role === 'employer') {
      const employer = db.select().from(employers).where(eq(employers.userId, userId)).get()
      
      if (employer?.walletAddress) {
        progress = 50
        const hasWorkers = db.select({ count: sql`COUNT(*)` }).from(users)
          .where(eq(users.employerId, employer.id))
          .get()
        
        step = (hasWorkers?.count ?? 0) > 0 ? 'ready' : 'add_workers'
      }
    }

    res.json({
      step,
      progress,
      userRole: user.role,
      hasWallet,
      hasActiveSession: Boolean(hasActiveSession),
    })
  } catch (err) {
    console.error('[Onboarding] status error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/onboarding/next-step
 * Get the next action the user should take
 */
router.get('/onboarding/next-step', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    
    if (!userId) {
      return res.json({
        action: 'signup',
        title: 'Create your account',
        description: 'Sign up as a Worker or Employer to get started',
        cta: 'Sign Up',
      })
    }

    const user = db.select().from(users).where(eq(users.id, userId)).get()
    
    if (!user) {
      return res.json({
        action: 'signup',
        title: 'Create your account',
        description: 'Sign up to continue',
        cta: 'Sign Up',
      })
    }

    const hasWallet = Boolean(user.walletAddress)

    if (!hasWallet) {
      return res.json({
        action: 'setup_wallet',
        title: 'Set up your wallet',
        description: 'Create a Circle wallet to receive payments',
        cta: 'Connect Wallet',
      })
    }

    if (user.role === 'worker') {
      const hasSession = db.select()
        .from(sessions)
        .where(eq(sessions.workerId, userId))
        .where(sql`ended_at IS NULL`)
        .get()

      if (!hasSession) {
        return res.json({
          action: 'clock_in',
          title: 'Start working',
          description: 'Clock in to begin earning',
          cta: 'Clock In',
        })
      }
    }

    // All done
    return res.json({
      action: 'ready',
      title: 'You\'re all set!',
      description: 'Your account is ready',
    })
  } catch (err) {
    console.error('[Onboarding] next-step error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * POST /api/onboarding/complete-step
 * Mark a step as complete and get next instructions
 */
router.post('/onboarding/complete-step', async (req: Request, res: Response) => {
  try {
    const { step } = req.body
    const userId = (req as any).userId

    // Log step completion (in production, track in DB)
    console.log(`[Onboarding] User ${userId} completed step: ${step}`)

    // Return next step
    const nextSteps: Record<string, any> = {
      signup: {
        action: 'setup_wallet',
        title: 'Wallet Setup',
        description: 'Set up your Circle wallet',
        cta: 'Continue',
      },
      setup_wallet: {
        action: user?.role === 'worker' ? 'clock_in' : 'add_workers',
        title: user?.role === 'worker' ? 'Start Working' : 'Add Workers',
        description: user?.role === 'worker' ? 'Clock in to start earning' : 'Add workers to your team',
        cta: user?.role === 'worker' ? 'Clock In' : 'Add Workers',
      },
    }

    return res.json({
      completed: step,
      next: nextSteps[step] || { action: 'ready', title: 'Complete!' },
    })
  } catch (err) {
    console.error('[Onboarding] complete-step error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/onboarding/guide
 * Get onboarding guide based on user role
 */
router.get('/onboarding/guide', async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string
    
    const workerGuide = [
      { step: 1, title: 'Create Account', description: 'Sign up with your email', status: 'pending' },
      { step: 2, title: 'Connect Wallet', description: 'Set up your payment wallet', status: 'pending' },
      { step: 3, title: 'Verify Identity', description: 'Confirm your worker profile', status: 'pending' },
      { step: 4, title: 'Clock In', description: 'Start your work session', status: 'pending' },
      { step: 5, title: 'Earn', description: 'Get paid per inference in real-time', status: 'pending' },
    ]

    const employerGuide = [
      { step: 1, title: 'Create Account', description: 'Sign up as an employer', status: 'pending' },
      { step: 2, title: 'Fund Wallet', description: 'Add USDC to your payment wallet', status: 'pending' },
      { step: 3, title: 'Set Budget', description: 'Configure daily spending limits', status: 'pending' },
      { step: 4, title: 'Add Workers', description: 'Invite workers to your team', status: 'pending' },
      { step: 5, title: 'Monitor', description: 'Track payments in real-time', status: 'pending' },
    ]

    res.json({
      role,
      steps: role === 'employer' ? employerGuide : workerGuide,
    })
  } catch (err) {
    console.error('[Onboarding] guide error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router