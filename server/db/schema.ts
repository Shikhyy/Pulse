import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'worker' | 'employer'
  passwordHash: text('password_hash').notNull(),
  circleWalletId: text('circle_wallet_id'),
  walletAddress: text('wallet_address'),
  employerId: text('employer_id'), // for workers: which employer they belong to
  inviteCode: text('invite_code'), // which invite was used
  createdAt: text('created_at').default(sql`(datetime('now'))`,
})

export const employers = sqliteTable('employers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  companyName: text('company_name').notNull(),
  circleWalletId: text('circle_wallet_id'),
  walletAddress: text('wallet_address'),
  dailyCap: real('daily_cap').default(50),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  workerId: text('worker_id').notNull(),
  employerId: text('employer_id').notNull(),
  startedAt: text('started_at').default(sql`(datetime('now'))`),
  endedAt: text('ended_at'),
})

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  workerId: text('worker_id').notNull(),
  employerId: text('employer_id').notNull(),
  amount: real('amount').notNull(),
  nanopaymentId: text('nanopayment_id'),
  arcTxHash: text('arc_tx_hash'),
  pingSeq: integer('ping_seq'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})

export const workerStates = sqliteTable('worker_states', {
  workerId: text('worker_id').primaryKey(),
  paused: integer('paused', { mode: 'boolean' }).default(false),
  dailyCap: real('daily_cap').default(50),
  hourlyRate: real('hourly_rate').default(18),
})

export const invites = sqliteTable('invites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  employerId: text('employer_id').notNull(),
  maxUses: integer('max_uses').default(1),
  usedCount: integer('used_count').default(0),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
})
