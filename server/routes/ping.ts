import { Router, Request, Response } from 'express'
import { verifyTypedData, getAddress } from 'viem'
import db from '../db'
import { users, sessions, employers } from '../db/schema'
import { eq, isNull, and, sql } from 'drizzle-orm'
import { budgetGuard } from '../agents/budgetGuard'
import { paymentEngine, getSessionTotal, getWorkerTodayTotal } from '../agents/paymentEngine'
import { getIO } from '../socket'

const router = Router()

// Ping sequence counter per session (in-memory, good enough for demo)
const pingSequences = new Map<string, number>()

/**
 * POST /api/ping
 * Core payment loop: verify activity proof → budget check → Nanopayment → WebSocket update
 */
router.post('/ping', async (req: Request, res: Response) => {
  try {
    const { proof, signature } = req.body

    if (!proof || !signature) {
      return res.status(400).json({ error: 'missing_proof_or_signature' })
    }

    const { workerId, sessionId, timestamp, activityScore } = proof

    // 1. Look up worker
    const worker = db.select().from(users).where(eq(users.id, workerId)).get()
    if (!worker) {
      return res.status(404).json({ error: 'worker_not_found' })
    }

    // 2. Verify EIP-712 signature 
    // Skip if stub mode OR if signature is a demo signature (all zeros)
    const isStubMode = process.env.STUB_MODE === 'true'
    const isDemoSignature = signature?.startsWith('0x' + '0'.repeat(130))
    
    if (worker.walletAddress && !isDemoSignature && !isStubMode) {
      try {
        const walletAddr = worker.walletAddress as string
        let validAddr = walletAddr
        try {
          validAddr = getAddress(walletAddr)
        } catch {
          validAddr = walletAddr
        }
        
        const isValid = await verifyTypedData({
          address: validAddr as `0x${string}`,
          domain: {},
          types: {
            ActivityProof: [
              { name: 'workerId', type: 'string' },
              { name: 'sessionId', type: 'string' },
              { name: 'timestamp', type: 'uint256' },
              { name: 'activityScore', type: 'uint256' },
            ],
          },
          primaryType: 'ActivityProof',
          message: {
            workerId,
            sessionId,
            timestamp: BigInt(timestamp),
            activityScore: BigInt(activityScore),
          },
          signature: signature as `0x${string}`,
        })
        if (!isValid) {
          return res.status(401).json({ error: 'invalid_signature' })
        }
      } catch (err) {
        console.warn('[Ping] EIP-712 verification skipped:', err)
      }
    } else {
      console.log('[Ping] Signature verification skipped (demo mode or demo signature)')
    }

    // 3. Check session is active
    const session = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), isNull(sessions.endedAt)))
      .get()

    if (!session) {
      return res.status(404).json({ error: 'session_not_found' })
    }

    // 4. Budget check
    const budget = await budgetGuard.checkPayment(session.employerId, workerId, 0.009)
    if (!budget.allow) {
      return res.status(402).json({ error: budget.reason })
    }

    // 5. Get employer wallet ID
    const employer = db
      .select()
      .from(employers)
      .where(eq(employers.id, session.employerId))
      .get()

    if (!employer) {
      return res.status(404).json({ error: 'employer_not_found' })
    }

    // 6. Get/increment ping sequence
    const pingSeq = (pingSequences.get(sessionId) ?? 0) + 1
    pingSequences.set(sessionId, pingSeq)

    // 7. Dispatch Nanopayment using the Payment Engine
    const payment = await paymentEngine.dispatchPayment({
      employerWalletId: employer.circleWalletId ?? '',
      workerAddress: worker.walletAddress ?? '',
      sessionId,
      pingSeq,
      amount: '0.009',
      workerId,
      employerId: session.employerId,
    })

    // 8. Get updated totals
    const sessionTotal = getSessionTotal(sessionId)
    const todayTotal = getWorkerTodayTotal(workerId)

    // 9. Emit WebSocket events
    const io = getIO()
    io.to(`worker:${workerId}`).emit('earnings:update', {
      added: 0.009,
      totalSession: sessionTotal,
      totalToday: todayTotal,
      txnId: payment.id,
      pingSeq,
    })

    io.to(`employer:${session.employerId}`).emit('payment:confirmed', {
      workerId,
      workerName: worker.name,
      amount: 0.009,
      txnId: payment.id,
      arcTxHash: payment.arcTxHash,
      timestamp: new Date().toISOString(),
      spentToday: budget.spentToday! + 0.009,
      budgetCap: budget.cap,
    })

    return res.json({
      paid: true,
      amount: '0.009',
      txnId: payment.id,
      sessionTotal,
    })
  } catch (err) {
    console.error('[Ping] Error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router
