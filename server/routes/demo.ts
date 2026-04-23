import { Router, Request, Response } from 'express'
import db from '../db'
import { sqlite } from '../db'
import { payments, sessions } from '../db/schema'
import { sql } from 'drizzle-orm'

const router = Router()

/**
 * GET /api/demo/proof
 * Returns transaction count, unit economics comparison, and recent Arc transactions.
 */
router.get('/demo/proof', async (req: Request, res: Response) => {
  try {
    // Local DB stats
    const statsRow = db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payments)
      .get()

    const dbPaymentCount = statsRow?.count ?? 0
    const totalPaid = statsRow?.total ?? 0

    // Recent payments from DB
    const recentPayments = sqlite.prepare(`
      SELECT p.id, p.worker_id, p.amount, p.arc_tx_hash, p.created_at,
             u.name as worker_name
      FROM payments p
      JOIN users u ON u.id = p.worker_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all() as any[]

    // Try Arc Block Explorer for onchain count (optional)
    let arcTransactionCount = dbPaymentCount
    let arcExplorerLink = '#'

    const employerAddress = process.env.CIRCLE_EMPLOYER_WALLET_ADDRESS
    if (employerAddress) {
      arcExplorerLink = `https://explorer.arc.network/address/${employerAddress}`

      try {
        const arcRes = await fetch(
          `https://api.explorer.arc-testnet.network/api?module=account&action=tokentx&address=${employerAddress}`,
          { signal: AbortSignal.timeout(5000) }
        )
        if (arcRes.ok) {
          const arcData = await arcRes.json()
          if (arcData.result && Array.isArray(arcData.result)) {
            arcTransactionCount = arcData.result.length
          }
        }
      } catch {
        // Arc explorer may not be accessible — use DB count
      }
    }

    return res.json({
      arcTransactionCount,
      dbPaymentCount,
      totalPaid: totalPaid.toFixed(3),
      arcExplorerLink,
      recentTransactions: recentPayments,
      marginComparison: {
        nanopayments: {
          perPayment: '$0.000001 gas fee',
          feeRatio: '< 0.001%',
          ninetySession: 'viable ✓',
          nineMilliPayment: 'viable ✓',
        },
        stripe: {
          perPayment: '$0.30 + 2.9%',
          feeRatio: '3.3%+ per charge',
          ninetySession: '$0.56 in fees = 6.2%',
          nineMilliPayment: 'impossible ✗',
        },
      },
      circleProducts: [
        '✓ Circle Nanopayments',
        '✓ Circle Developer-Controlled Wallets',
        '✓ Arc Testnet',
        '✓ Circle Gateway',
      ],
      unitEconomics: {
        paymentAmount: '$0.009',
        paymentInterval: '30 seconds',
        ratePerSecond: '$0.0003',
        ratePerHour: '$1.08',
        ratePerDay_8h: '$8.64',
        nodesInDemo: 5,
        paymentsIn10Min: 100,
        paymentsIn1Hr: 600,
        stripeMinCharge: '$0.50',
        stripeImpossibleBelow: '$0.50',
      },
    })
  } catch (err) {
    console.error('[Demo] proof error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/demo/csv
 * Downloads arc_proof.csv
 */
router.get('/demo/csv', async (req: Request, res: Response) => {
  try {
    const allPayments = sqlite.prepare(`
      SELECT p.*, u.name as worker_name
      FROM payments p
      JOIN users u ON u.id = p.worker_id
      ORDER BY p.created_at ASC
    `).all() as any[]

    const csv = [
      'id,arc_tx_hash,worker_name,worker_id,amount,nanopayment_id,created_at',
      ...allPayments.map(
        (p) =>
          `${p.id},${p.arc_tx_hash ?? ''},${(p as any).worker_name ?? ''},${p.worker_id},${p.amount},${p.nanopayment_id ?? ''},${p.created_at}`
      ),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="arc_proof.csv"')
    return res.send(csv)
  } catch (err) {
    console.error('[Demo] csv error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

export default router
