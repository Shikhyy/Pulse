import { Router, Request, Response } from 'express'
import db from '../db'
import { sqlite } from '../db'
import { payments, sessions } from '../db/schema'
import { sql } from 'drizzle-orm'

const router = Router()

/**
 * GET /api/demo/proof
 * Returns comprehensive transaction proof with real-time metrics
 */
router.get('/demo/proof', async (req: Request, res: Response) => {
  try {
    // Basic stats
    const statsRow = db
      .select({
        count: sql<number>`COUNT(*)`,
        total: sql<number>`COALESCE(SUM(amount), 0)`,
      })
      .from(payments)
      .get()

    const dbPaymentCount = statsRow?.count ?? 0
    const totalPaid = statsRow?.total ?? 0

    // Real-time metrics
    const lastHourRow = db
      .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(sql`created_at > datetime('now', '-1 hour')`)
      .get()

    const lastHourPayments = lastHourRow?.count ?? 0
    const lastHourVolume = lastHourRow?.total ?? 0

    // Today's metrics
    const todayRow = db
      .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(sql`created_at > datetime('now', '-1 day')`)
      .get()

    const todayPayments = todayRow?.count ?? 0
    const todayVolume = todayRow?.total ?? 0

    // Active sessions count
    const activeSessions = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sessions)
      .where(sql`ended_at IS NULL`)
      .get()

    // Unique workers
    const uniqueWorkers = db
      .select({ count: sql<number>`COUNT(DISTINCT worker_id)` })
      .from(payments)
      .get()

    // Recent payments
    const recentPayments = sqlite.prepare(`
      SELECT p.id, p.worker_id, p.employer_id, p.amount, p.arc_tx_hash, p.created_at as recorded_at,
             u.name as worker_name
      FROM payments p
      JOIN users u ON u.id = p.worker_id
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all() as any[]

    // Calculate rates
    const paymentRatePerMinute = lastHourPayments / 60
    const volumeRatePerHour = lastHourVolume * 60

    // Network stats (Arc)
    let arcTransactionCount = dbPaymentCount
    let arcExplorerLink = 'https://testnet.arcscan.app'

    const employerAddress = process.env.CIRCLE_EMPLOYER_WALLET_ADDRESS
    if (employerAddress) {
      arcExplorerLink = `https://testnet.arcscan.app/address/${employerAddress}`

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
      } catch {}
    }

    return res.json({
      // Basic stats
      arcTransactionCount,
      dbPaymentCount,
      totalPaid: totalPaid.toFixed(3),
      
      // Real-time metrics
      realtime: {
        paymentsLastHour: lastHourPayments,
        volumeLastHour: lastHourVolume.toFixed(3),
        paymentsToday: todayPayments,
        volumeToday: todayVolume.toFixed(3),
        paymentRatePerMinute: paymentRatePerMinute.toFixed(2),
        volumeRatePerHour: volumeRatePerHour.toFixed(3),
        activeSessions: activeSessions?.count ?? 0,
        uniqueWorkers: uniqueWorkers?.count ?? 0,
      },
      
      // Network
      arcExplorerLink,
      chainId: 5042002,
      network: 'Arc Testnet',
      rpc: 'https://rpc.testnet.arc.network',
      faucet: 'https://faucet.circle.com',
      
      // Economic comparison
      marginComparison: {
        nanopayments: {
          perPayment: '$0.000001 gas fee',
          feeRatio: '< 0.001%',
          minViable: '$0.000001',
        },
        stripe: {
          perPayment: '$0.30 + 2.9%',
          feeRatio: '3.3%+ per charge',
          minViable: '$0.50',
        },
        savings: {
          at50Payments: '$15+ saved',
          at200Payments: '$60+ saved',
          at1000Payments: '$300+ saved',
        },
      },
      
      // Circle products
      circleProducts: [
        '✓ Circle Nanopayments (gas-free sub-cent)',
        '✓ Circle Developer-Controlled Wallets',
        '✓ Circle Gateway (batched settlement)',
        '✓ Arc Testnet (Chain ID: 5042002)',
        '✓ x402 Payment Protocol v2',
        '✓ USDC (native gas token)',
      ],
      
      // x402
      x402: {
        supported: true,
        version: 2,
        endpoint: '/api/inference',
        pricePerRequest: '$0.009',
        currency: 'USDC',
        chain: 'ARC-TESTNET',
        gatewayDomain: 26,
      },
      
      // Unit economics
      unitEconomics: {
        paymentAmount: '$0.009',
        paymentInterval: '30 seconds',
        ratePerSecond: '$0.0003',
        ratePerHour: '$1.08',
        ratePerDay_8h: '$8.64',
        nodesInDemo: 5,
        paymentsIn10Min: 100,
        paymentsIn1Hr: 600,
      },
      
      // Smart contracts
      smartContracts: {
        solidity: {
          name: 'PulseComputeNetwork.sol',
          network: 'Arc Testnet',
          chainId: 5042002,
          features: [
            'Session creation and management',
            'Budget enforcement',
            'Worker pause/resume',
            'Daily spending caps',
            'USDC transfers',
          ],
        },
        agentIdentity: {
          name: 'PulseAgentIdentity.sol (ERC-8004)',
          features: [
            'Agent registration',
            'Reputation tracking',
            'Trust level management',
            'Capability bitfield',
          ],
        },
        vyper: {
          name: 'PulseComputeNetwork.vy',
          features: [
            'ERC-8004 agent identity',
            'Trust layer primitives',
            'Nanopayment primitives',
          ],
        },
      },
      
      // Recent transactions
      recentTransactions: recentPayments,
    })
  } catch (err) {
    console.error('[Demo] proof error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/demo/metrics
 * Real-time streaming metrics for dashboard
 */
router.get('/demo/metrics', async (req: Request, res: Response) => {
  try {
    const now = Date.now()
    
    // Last 5 minutes
    const last5min = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(sql`created_at > datetime('now', '-5 minutes')`)
      .get()

    // Last 15 minutes
    const last15min = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(payments)
      .where(sql`created_at > datetime('now', '-15 minutes')`)
      .get()

    // Last hour by minute (for chart)
    const byMinute = sqlite.prepare(`
      SELECT 
        strftime('%H:%M', created_at) as time,
        COUNT(*) as count,
        SUM(amount) as volume
      FROM payments
      WHERE created_at > datetime('now', '-1 hour')
      GROUP BY time
      ORDER BY time
    `).all() as any[]

    res.json({
      timestamp: new Date().toISOString(),
      paymentsLast5Min: last5min?.count ?? 0,
      paymentsLast15Min: last15min?.count ?? 0,
      ratePerMinute: (last5min?.count ?? 0) / 5,
      ratePerSecond: ((last5min?.count ?? 0) / 5) / 60,
      chartData: byMinute,
    })
  } catch (err) {
    console.error('[Demo] metrics error:', err)
    return res.status(500).json({ error: 'internal_error' })
  }
})

/**
 * GET /api/demo/csv
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