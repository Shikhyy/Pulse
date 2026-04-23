import { Router, Request, Response } from 'express'
import crypto from 'crypto'

const router = Router()

// In-memory webhook storage (use Redis in production)
const webhooks = new Map<string, any>()
const webhookEvents = new Map<string, any[]>()

const WEBHOOK_EVENTS = {
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  SESSION_STARTED: 'session.started',
  SESSION_ENDED: 'session.ended',
  BUDGET_WARNING: 'budget.warning',
  BUDGET_EXCEEDED: 'budget.exceeded',
  WORKER_PAUSED: 'worker.paused',
  WORKER_RESUMED: 'worker.resumed',
}

/**
 * Register a webhook endpoint
 */
router.post('/webhooks', (req: Request, res: Response) => {
  const { url, events, secret } = req.body

  if (!url || !events || !Array.isArray(events)) {
    return res.status(400).json({ 
      error: 'Missing required fields: url, events (array)' 
    })
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid webhook URL' })
  }

  const webhookId = crypto.randomBytes(16).toString('hex')
  const webhookSecret = secret || crypto.randomBytes(32).toString('hex')

  webhooks.set(webhookId, {
    id: webhookId,
    url,
    events,
    secret: webhookSecret,
    createdAt: new Date().toISOString(),
    active: true,
    deliveries: 0,
    failures: 0,
  })

  // Initialize event buffer
  webhookEvents.set(webhookId, [])

  res.json({
    id: webhookId,
    secret: webhookSecret,
    url,
    events,
    message: 'Webhook registered. Store the secret securely - it won\'t be shown again.',
  })
})

/**
 * List webhooks
 */
router.get('/webhooks', (req: Request, res: Response) => {
  const userId = (req as any).userId
  
  const userWebhooks = Array.from(webhooks.values())
    .filter(w => w.userId === userId)
    .map(w => ({
      id: w.id,
      url: w.url,
      events: w.events,
      active: w.active,
      createdAt: w.createdAt,
      deliveries: w.deliveries,
      failures: w.failures,
    }))

  res.json({ webhooks: userWebhooks })
})

/**
 * Get webhook details
 */
router.get('/webhooks/:id', (req: Request, res: Response) => {
  const webhook = webhooks.get(req.params.id)

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' })
  }

  res.json({
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    active: webhook.active,
    createdAt: webhook.createdAt,
    stats: {
      deliveries: webhook.deliveries,
      failures: webhook.failures,
    },
    recentEvents: webhookEvents.get(webhook.id)?.slice(-10) || [],
  })
})

/**
 * Delete webhook
 */
router.delete('/webhooks/:id', (req: Request, res: Response) => {
  if (!webhooks.has(req.params.id)) {
    return res.status(404).json({ error: 'Webhook not found' })
  }

  webhooks.delete(req.params.id)
  webhookEvents.delete(req.params.id)

  res.json({ success: true })
})

/**
 * Test webhook - send a ping event
 */
router.post('/webhooks/:id/test', async (req: Request, res: Response) => {
  const webhook = webhooks.get(req.params.id)

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' })
  }

  const testEvent = {
    type: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test event from Pulse',
    },
  }

  const result = await deliverWebhook(webhook, testEvent)

  res.json({
    success: result.success,
    statusCode: result.statusCode,
    responseTime: result.responseTime,
  })
})

/**
 * Deliver a webhook event to all matching subscriptions
 */
export async function emitWebhookEvent(
  eventType: string,
  data: any
): Promise<void> {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    data,
  }

  // Find all webhooks subscribed to this event
  for (const [id, webhook] of webhooks.entries()) {
    if (!webhook.active) continue
    if (!webhook.events.includes(eventType) && !webhook.events.includes('*')) {
      continue
    }

    // Queue event for delivery
    const events = webhookEvents.get(id) || []
    events.push(event)
    webhookEvents.set(id, events.slice(-100)) // Keep last 100 events

    // Deliver in background
    deliverWebhook(webhook, event).catch(err => 
      console.error('[Webhook] Delivery failed:', err)
    )
  }
}

/**
 * Deliver a single webhook
 */
async function deliverWebhook(
  webhook: any,
  event: any
): Promise<{ success: boolean; statusCode?: number; responseTime?: number }> {
  const startTime = Date.now()

  try {
    // Sign the payload
    const payload = JSON.stringify(event)
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex')

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pulse-Signature': signature,
        'X-Pulse-Event': event.type,
        'X-Pulse-Timestamp': event.timestamp,
      },
      body: payload,
    })

    const responseTime = Date.now() - startTime
    webhook.deliveries++

    return {
      success: response.ok,
      statusCode: response.status,
      responseTime,
    }
  } catch (err) {
    webhook.failures++
    return {
      success: false,
      responseTime: Date.now() - startTime,
    }
  }
}

/**
 * Get webhook event logs
 */
router.get('/webhooks/:id/events', (req: Request, res: Response) => {
  const events = webhookEvents.get(req.params.id) || []
  
  res.json({
    webhookId: req.params.id,
    events: events.slice(-50),
    total: events.length,
  })
})

/**
 * Enable/disable webhook
 */
router.patch('/webhooks/:id', (req: Request, res: Response) => {
  const webhook = webhooks.get(req.params.id)

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' })
  }

  const { active } = req.body
  
  if (typeof active === 'boolean') {
    webhook.active = active
    webhooks.set(req.params.id, webhook)
  }

  res.json({
    id: webhook.id,
    active: webhook.active,
  })
})

export default router
export { WEBHOOK_EVENTS }