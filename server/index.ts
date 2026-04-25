import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { initSocket } from './socket'
import { initDb } from './db'

// Routes
import authRouter, { authMiddleware } from './routes/auth'
import pingRouter from './routes/ping'
import sessionsRouter from './routes/sessions'
import workersRouter from './routes/workers'
import demoRouter from './routes/demo'
import x402Router from './routes/x402'
import onboardingRouter from './routes/onboarding'
import webhooksRouter from './routes/webhooks'
import invitesRouter from './routes/invites'
import agentsRouter from './routes/agents'
import workerRouter from './routes/worker'

// Middleware
import { notFoundHandler, errorHandler } from './middleware/errorHandler'

const app = express()
const httpServer = createServer(app)

// Initialize Socket.io
initSocket(httpServer)

// Initialize database
initDb()

// Middleware
// TODO: In production, restrict CORS origins
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes (no auth required)
app.use('/api', authRouter)
app.use('/api', demoRouter)
app.use('/api', x402Router)

// Protected routes (require JWT)
app.use('/api', authMiddleware as any, pingRouter)
app.use('/api', authMiddleware as any, sessionsRouter)
app.use('/api', authMiddleware as any, workersRouter)
app.use('/api', authMiddleware as any, onboardingRouter)
app.use('/api', authMiddleware as any, webhooksRouter)
app.use('/api', authMiddleware as any, invitesRouter)
app.use('/api', authMiddleware as any, agentsRouter)
app.use('/api', authMiddleware as any, workerRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3001)

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Pulse API Server`)
  console.log(`   URL:  http://localhost:${PORT}`)
  console.log(`   Mode: ${process.env.STUB_MODE === 'true' || !process.env.CIRCLE_API_KEY ? 'STUB (no real payments)' : 'LIVE (Circle Nanopayments)'}`)
  console.log(`   DB:   ${process.env.DATABASE_URL ?? './pulse.db'}`)
  console.log(`   Chain: ${process.env.CHAIN ?? 'ARC-TESTNET'}\n`)
})

export { app, httpServer }
