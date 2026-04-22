import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'pulse.db')
const sqlite = new Database(dbPath)

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Initialize tables
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      circle_wallet_id TEXT,
      wallet_address TEXT,
      employer_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      circle_wallet_id TEXT,
      wallet_address TEXT,
      daily_cap REAL DEFAULT 50,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      employer_id TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      employer_id TEXT NOT NULL,
      amount REAL NOT NULL,
      nanopayment_id TEXT,
      arc_tx_hash TEXT,
      ping_seq INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worker_states (
      worker_id TEXT PRIMARY KEY,
      paused INTEGER DEFAULT 0,
      daily_cap REAL DEFAULT 50,
      hourly_rate REAL DEFAULT 18
    );
  `)
  console.log('✓ Database initialized')
}

export { sqlite }
export default db
