'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkerStore } from '@/lib/store'
import { getSocket, joinRoom } from '@/lib/socket'
import { api } from '@/lib/api'
import EarningsTicker from '@/components/EarningsTicker'
import PaymentFeed from '@/components/PaymentFeed'

const PING_INTERVAL_MS = 30_000 // 30 seconds

export default function WorkerSessionPage() {
  const router = useRouter()
  const {
    user, token, sessionId, sessionEarnings, todayEarnings,
    payments, isClocked, isPaused,
    addEarning, addIdlePing, clockOut, setPaused,
  } = useWorkerStore()

  const [view, setView] = useState<'session' | 'history' | 'wallet'>('session')
  const [sessionStart] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [clockingOut, setClockingOut] = useState(false)
  const [tickKey, setTickKey] = useState(0)
  const [nextPingIn, setNextPingIn] = useState(PING_INTERVAL_MS / 1000)
  const [pingCount, setPingCount] = useState(0)
  const [pingError, setPingError] = useState<string | null>(null)

  const prevSessionEarnings = useRef(sessionEarnings)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Bump tickKey when sessionEarnings changes to retrigger CSS animation
  useEffect(() => {
    if (sessionEarnings !== prevSessionEarnings.current) {
      setTickKey(k => k + 1)
      prevSessionEarnings.current = sessionEarnings
    }
  }, [sessionEarnings])

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000))
    }, 1000)
    return () => clearInterval(t)
  }, [sessionStart])

  // ─── Auto-ping: fires /api/ping every 30 seconds ─────────────────────────
  const firePing = useCallback(async () => {
    if (!token || !sessionId || !user) return
    if (isPaused) {
      addIdlePing()
      return
    }

    // Build activity proof (stub-compatible: no real EIP-712 signing needed in stub mode)
    const proof = {
      workerId: user.id,
      sessionId,
      timestamp: Date.now().toString(),
      activityScore: '100',
    }

    // Stub signature (server accepts any string in STUB_MODE)
    const signature = '0x' + Array(130).fill('0').join('')

    try {
      const res: any = await api.sendPing(proof, signature, token)
      if (res.paid) {
        addEarning(0.009, res.sessionTotal ?? sessionEarnings + 0.009, todayEarnings + 0.009, res.txnId)
        setPingCount(c => c + 1)
        setPingError(null)
      }
    } catch (err: any) {
      const msg = err.message ?? 'Ping failed'
      if (msg.includes('worker_paused')) {
        setPaused(true)
      } else if (msg.includes('employer_daily_cap_exceeded')) {
        setPingError('Daily budget cap reached — payments paused by employer.')
      } else {
        console.warn('[Ping] error:', msg)
      }
      addIdlePing()
    }

    // Reset countdown
    setNextPingIn(PING_INTERVAL_MS / 1000)
  }, [token, sessionId, user, isPaused, sessionEarnings, todayEarnings, addEarning, addIdlePing, setPaused])

  // Set up ping interval
  useEffect(() => {
    if (!user || !sessionId || !isClocked) {
      router.push('/worker/login')
      return
    }

    // Fire first ping after a short delay (let socket connect first)
    const firstPingTimer = setTimeout(() => {
      firePing()
    }, 3000)

    // Then fire every 30 seconds
    pingIntervalRef.current = setInterval(() => {
      firePing()
    }, PING_INTERVAL_MS)

    // Countdown UI
    countdownRef.current = setInterval(() => {
      setNextPingIn(prev => {
        if (prev <= 1) return PING_INTERVAL_MS / 1000
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(firstPingTimer)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [user, sessionId, isClocked, router, firePing])

  // ─── WebSocket listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !sessionId) return

    const socket = getSocket()
    joinRoom(`worker:${user.id}`)

    socket.on('earnings:update', (data: any) => {
      // Server's authoritative total — sync it
      addEarning(data.added ?? 0.009, data.totalSession, data.totalToday ?? todayEarnings, data.txnId)
      setTickKey(k => k + 1)
    })
    socket.on('ping:idle', () => addIdlePing())
    socket.on('session:paused', () => setPaused(true))
    socket.on('session:resumed', () => setPaused(false))

    return () => {
      socket.off('earnings:update')
      socket.off('ping:idle')
      socket.off('session:paused')
      socket.off('session:resumed')
    }
  }, [user, sessionId, todayEarnings, addEarning, addIdlePing, setPaused])

  const handleClockOut = async () => {
    if (!sessionId || !token || clockingOut) return
    setClockingOut(true)

    // Stop pings
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    try {
      await api.clockOut(sessionId, token)
      clockOut()
      router.push('/worker')
    } catch (err: any) {
      alert(err.message ?? 'Clock-out failed')
      setClockingOut(false)
    }
  }

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}h ${m}m ${s.toString().padStart(2, '0')}s`
    if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`
    return `${s}s`
  }

  const paidPayments = payments.filter(p => p.status === 'paid')
  const idlePayments = payments.filter(p => p.status === 'idle')
  const expectedTotal = (Math.floor(elapsed / 30) + 1) * 0.009

  if (!user || !isClocked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
        Redirecting...
      </div>
    )
  }

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className="dash-sidebar" style={{ display: 'flex', flexDirection: 'column', paddingBottom: 0 }}>
        <Link href="/" className="nav-logo" style={{ padding: '0 24px', marginBottom: 40, fontSize: 20 }}>
          pulse <div className="nav-logo-dot" />
        </Link>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <SidebarNav label="Live Session" active={view === 'session'} onClick={() => setView('session')} />
          <SidebarNav label="Payment History" active={view === 'history'} onClick={() => setView('history')} />
          <SidebarNav label="My Wallet" active={view === 'wallet'} onClick={() => setView('wallet')} />
        </div>

        {/* User info footer */}
        <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--teal-dim)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--teal)' }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? 'W'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'var(--mono)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)' }} />
              Online
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-topbar">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0, fontSize: 22, color: 'var(--text)' }}>
            {view === 'session' ? 'Live Session' : view === 'history' ? 'Payment History' : 'My Wallet'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isPaused && (
              <span className="badge badge-paused">Session Paused</span>
            )}
            {pingError && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)' }}>{pingError}</span>
            )}
            <button
              className="btn-ghost"
              style={{ padding: '8px 16px', fontSize: 12, borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}
              onClick={handleClockOut}
              disabled={clockingOut}
              id="clock-out-btn"
            >
              {clockingOut ? 'Clocking Out...' : '⏹ Clock Out'}
            </button>
          </div>
        </header>

        <div className="dash-content page-enter">
          {view === 'session' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <EarningsTicker value={sessionEarnings} tickKey={tickKey} isActive={!isPaused} />

                {/* Next payment countdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div className="card">
                    <div className="card-title">Duration</div>
                    <div className="card-val" style={{ fontSize: 22, color: 'var(--text)' }}>{formatElapsed(elapsed)}</div>
                  </div>
                  <div className="card">
                    <div className="card-title">Next ping</div>
                    <div className="card-val" style={{ fontSize: 22 }}>{nextPingIn}s</div>
                  </div>
                  <div className="card">
                    <div className="card-title">Paid pings</div>
                    <div className="card-val" style={{ fontSize: 22, color: 'var(--text)' }}>{paidPayments.length}</div>
                  </div>
                  <div className="card">
                    <div className="card-title">Idle pings</div>
                    <div className="card-val" style={{ fontSize: 22, color: 'var(--text3)' }}>{idlePayments.length}</div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Session Activity Log</div>
                  <PaymentFeed payments={payments} maxRows={20} />
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card">
                  <div className="card-title">Earned Today</div>
                  <div className="card-val">${todayEarnings.toFixed(3)}</div>
                  <div className="card-sub">Resets midnight UTC</div>
                </div>

                <div className="card" style={{ background: 'var(--teal-dim)', borderColor: 'var(--border2)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Rate
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                    $0.009 / 30 seconds
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text2)' }}>
                    $1.08 / hour
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">Wallet</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', wordBreak: 'break-all', lineHeight: 1.6 }}>
                    {user.walletAddress ?? 'Assigned on clock-in'}
                  </div>
                  {user.walletAddress && (
                    <a
                      href={`https://explorer.arc.network/address/${user.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal)', textDecoration: 'none' }}
                    >
                      View on Arc Explorer →
                    </a>
                  )}
                </div>

                <div className="card" style={{ background: 'var(--bg3)' }}>
                  <div className="card-title">vs. Stripe</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--teal)', marginBottom: 4 }}>Arc Fee</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--text)' }}>$0.00</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)', marginBottom: 4 }}>Stripe Fee</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--text)', textDecoration: 'line-through', opacity: 0.5 }}>
                        ${Math.max(0.30, paidPayments.length * 0.30).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="card page-enter">
              <div className="card-title" style={{ marginBottom: 16 }}>All Payments This Session</div>
              <PaymentFeed payments={payments} maxRows={100} />
              {payments.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                  No payments yet — waiting for first 30-second ping...
                </div>
              )}
            </div>
          )}

          {view === 'wallet' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
              <div className="card page-enter">
                <div className="card-title">Circle Developer Wallet</div>
                <div className="card-val" style={{ fontSize: 40, marginBottom: 16 }}>${todayEarnings.toFixed(3)}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-active">ARC Testnet</span>
                  <span className="badge badge-idle">USDC</span>
                  <span className="badge badge-idle">MPC Secured</span>
                </div>
                <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', wordBreak: 'break-all' }}>
                  {user.walletAddress}
                </div>
                {user.walletAddress && (
                  <a
                    href={`https://explorer.arc.network/address/${user.walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ display: 'inline-flex', marginTop: 16, fontSize: 13, padding: '10px 20px' }}
                  >
                    View on Arc Explorer →
                  </a>
                )}
              </div>
              <div className="card page-enter">
                <div className="card-title" style={{ marginBottom: 16 }}>Payment Ledger</div>
                <PaymentFeed payments={payments} maxRows={20} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function SidebarNav({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <div
      className={`nav-link ${active ? 'active' : ''}`}
      style={{
        padding: '10px 16px', borderRadius: 8,
        background: active ? 'var(--bg3)' : 'transparent',
        border: `1px solid ${active ? 'var(--border)' : 'transparent'}`
      }}
      onClick={onClick}
    >
      {label}
    </div>
  )
}
