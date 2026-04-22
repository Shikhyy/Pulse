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

const app = express()
const httpServer = createServer(app)

// Initialize Socket.io
initSocket(httpServer)

// Initialize database
initDb()

// Middleware
app.use(cors({ origin: '*' }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public routes (no auth required)
app.use('/api', authRouter)
app.use('/api', demoRouter)

// Protected routes (require JWT)
app.use('/api', authMiddleware as any, pingRouter)
app.use('/api', authMiddleware as any, sessionsRouter)
app.use('/api', authMiddleware as any, workersRouter)

const PORT = Number(process.env.PORT ?? 3001)

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Pulse API Server`)
  console.log(`   URL:  http://localhost:${PORT}`)
  console.log(`   Mode: ${process.env.STUB_MODE === 'true' || !process.env.CIRCLE_API_KEY ? 'STUB (no real payments)' : 'LIVE (Circle Nanopayments)'}`)
  console.log(`   DB:   ${process.env.DATABASE_URL ?? './pulse.db'}`)
  console.log(`   Chain: ${process.env.CHAIN ?? 'ARC-TESTNET'}\n`)
})

export { app, httpServer }
