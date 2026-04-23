import { Router, Request, Response } from 'express'
import crypto from 'crypto'

const router = Router()

const ARC_CHAIN_ID = 5042002
const GATEWAY_WALLET = '0x0077777d7EBA4688BDeF3E311b846F25870A19B9'
const GATEWAY_DOMAIN = 26

const activeStreams = new Map<string, any>()

function createPaymentRequirement(maxAmount: string, path: string) {
  return {
    protocol: 'x402',
    version: 2,
    scheme: 'EVM',
    chainId: ARC_CHAIN_ID,
    domain: GATEWAY_DOMAIN,
    verifyingContract: GATEWAY_WALLET,
    maxAmount: maxAmount,
    payer: '',
    fee: '0',
    deadline: Math.floor(Date.now() / 1000) + 3600,
  }
}

function createPaymentHeader(requirement: any, payer: string, signature: string) {
  const payload = JSON.stringify({ ...requirement, payer, signature })
  return `x402:2:${Buffer.from(payload).toString('base64')}`
}

async function checkPayment(paymentHeader: string | undefined, requiredAmount: string): Promise<{ valid: boolean; payer?: string; error?: string }> {
  if (!paymentHeader) return { valid: false, error: 'No payment header' }
  if (!paymentHeader.startsWith('x402:')) return { valid: false, error: 'Invalid x402 format' }

  try {
    const parts = paymentHeader.slice(5).split(':')
    if (parts[0] !== '2') return { valid: false, error: 'Unsupported x402 version' }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    if (parseFloat(payload.maxAmount) < parseFloat(requiredAmount)) {
      return { valid: false, error: 'Insufficient payment amount' }
    }
    return { valid: true, payer: payload.payer }
  } catch {
    return { valid: false, error: 'Invalid payment payload' }
  }
}

// Health check - mounted as /api/health
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Pulse Payment Engine',
    protocol: 'x402',
    version: '2.0',
    chain: 'ARC-TESTNET',
    chainId: ARC_CHAIN_ID,
  })
})

// x402 inference endpoint - mounted as /api/inference
router.post('/inference', async (req: Request, res: Response) => {
  const paymentHeader = req.headers['payment-signature'] as string
  const amount = '0.009'

  const check = await checkPayment(paymentHeader, amount)

  if (!check.valid) {
    const requirement = createPaymentRequirement('10.00', '/inference')
    res.setHeader('PAYMENT-REQUIRED', JSON.stringify(requirement))
    res.setHeader('ACCEPTS', JSON.stringify([{ scheme: 'EVM', chainId: ARC_CHAIN_ID, domain: GATEWAY_DOMAIN }]))
    return res.status(402).json({
      error: check.error || 'Payment required',
      price: amount,
      currency: 'USDC',
      interval: '30s',
      requirement,
    })
  }

  const { prompt, model } = req.body
  res.setHeader('PAYMENT-RESPONSE', JSON.stringify({ payer: check.payer, amount, timestamp: Date.now() }))
  return res.json({
    result: `Inference processed for: ${prompt?.slice(0, 50)}...`,
    model: model || 'default',
    cost: amount,
    paidBy: check.payer,
  })
})

// x402 payment stream initialization - mounted as /api/x402/init
router.post('/x402/init', (req: Request, res: Response) => {
  const { worker_wallet, session_id, amount_per_interval, interval_seconds } = req.body
  
  if (!worker_wallet || !session_id) {
    return res.status(400).json({ error: 'worker_wallet and session_id required' })
  }

  const streamId = crypto.randomBytes(16).toString('hex')
  const stream = {
    stream_id: streamId,
    worker_wallet,
    session_id,
    amount_per_interval: amount_per_interval || '0.009',
    interval_seconds: interval_seconds || 30,
    started_at: new Date().toISOString(),
    status: 'active',
    total_paid: '0.000',
    intervals_completed: 0,
  }

  activeStreams.set(streamId, stream)
  res.json(stream)
})

// Get stream status - mounted as /api/x402/stream/:streamId
router.get('/x402/stream/:streamId', (req: Request, res: Response) => {
  const stream = activeStreams.get(req.params.streamId)
  if (!stream) return res.status(404).json({ error: 'Stream not found' })
  res.json(stream)
})

// Pause stream - mounted as /api/x402/stream/:streamId/pause
router.post('/x402/stream/:streamId/pause', (req: Request, res: Response) => {
  const stream = activeStreams.get(req.params.streamId)
  if (!stream) return res.status(404).json({ error: 'Stream not found' })

  stream.status = 'paused'
  stream.paused_at = new Date().toISOString()
  activeStreams.set(req.params.streamId, stream)

  res.json({ stream_id: stream.stream_id, status: 'paused', paused_at: stream.paused_at })
})

// Resume stream - mounted as /api/x402/stream/:streamId/resume
router.post('/x402/stream/:streamId/resume', (req: Request, res: Response) => {
  const stream = activeStreams.get(req.params.streamId)
  if (!stream) return res.status(404).json({ error: 'Stream not found' })

  stream.status = 'active'
  stream.resumed_at = new Date().toISOString()
  activeStreams.set(req.params.streamId, stream)

  res.json({ stream_id: stream.stream_id, status: 'active', resumed_at: stream.resumed_at })
})

// Get payment requirements - mounted as /api/x402/requirements/:path
router.get('/x402/requirements/:path', (req: Request, res: Response) => {
  const path = '/' + req.params.path
  const amounts: Record<string, string> = {
    '/inference': '0.009',
    '/compute': '0.015',
    '/data': '0.005',
    '/model': '0.025',
  }

  const amount = amounts[path] || '0.009'
  const requirement = createPaymentRequirement(amount, path)

  res.json({
    path,
    price: amount,
    currency: 'USDC',
    interval: '30s',
    requirement,
    accepts: [{ scheme: 'EVM', chainId: ARC_CHAIN_ID, domain: GATEWAY_DOMAIN }],
  })
})

// Gateway balance check - mounted as /api/gateway/balance/:address
router.get('/gateway/balance/:address', async (req: Request, res: Response) => {
  const { address } = req.params

  if (!process.env.CIRCLE_API_KEY) {
    return res.json({ address, balance: '0.00', currency: 'USDC', mode: 'stub' })
  }

  try {
    const response = await fetch(
      `https://api.circle.com/v1/gateway/balances?address=${address}&blockchain=ARC`,
      { headers: { Authorization: `Bearer ${process.env.CIRCLE_API_KEY}` } }
    )
    const data = await response.json()
    const usdcBalance = data.balances?.find((b: any) => b.token === 'USDC')
    res.json({ address, balance: usdcBalance?.amount || '0.00', currency: 'USDC', blockchain: 'ARC' })
  } catch {
    res.json({ address, balance: '0.00', currency: 'USDC', error: 'Failed to fetch balance' })
  }
})

export default router