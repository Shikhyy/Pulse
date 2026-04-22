'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkerStore } from '@/lib/store'
import { api } from '@/lib/api'

export default function WorkerLandingPage() {
  const router = useRouter()
  const { user, token, isClocked, setSession, logout, todayEarnings } = useWorkerStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user && !token) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('pulse_token') : null
      if (!saved) router.push('/worker/login')
    }
    if (isClocked) router.push('/worker/session')
  }, [user, token, isClocked, router])

  const handleClockIn = async () => {
    if (!token) return router.push('/worker/login')
    setLoading(true)
    setError('')
    try {
      const data: any = await api.clockIn(token)
      setSession(data.sessionId)
      router.push('/worker/session')
    } catch (err: any) {
      setError(err.message ?? 'Clock-in failed. Make sure you are linked to an employer.')
    } finally {
      setLoading(false)
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="nav" style={{ position: 'relative', background: 'var(--surface)', backdropFilter: 'none' }}>
        <Link href="/" className="nav-logo">
          pulse <div className="nav-logo-dot" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)' }}>{user?.email}</span>
          <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="orb-3" style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }} />
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, color: 'var(--text)', margin: '0 0 8px', position: 'relative', zIndex: 2 }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ color: 'var(--text2)', marginBottom: 40, position: 'relative', zIndex: 2 }}>
            {todayEarnings > 0
              ? <>Today you've earned <strong style={{ color: 'var(--teal)' }}>${todayEarnings.toFixed(3)}</strong> so far</>
              : 'Ready to start earning? Clock in to begin receiving USDC.'}
          </p>

          {/* Rate preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Per Ping</div>
              <div className="card-val" style={{ fontSize: 22 }}>$0.009</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Interval</div>
              <div className="card-val" style={{ fontSize: 22, color: 'var(--text)' }}>30s</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div className="card-title">Hourly</div>
              <div className="card-val" style={{ fontSize: 22, color: 'var(--text)' }}>$1.08</div>
            </div>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '16px 32px' }}
            onClick={handleClockIn}
            disabled={loading}
            id="clock-in-btn"
          >
            {loading ? 'Starting session...' : '⏱ Clock In & Start Earning'}
          </button>

          <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 12, lineHeight: 1.5 }}>
            You'll receive $0.009 USDC every 30 seconds on Arc Testnet
          </p>

          {user?.walletAddress && (
            <div style={{ marginTop: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', wordBreak: 'break-all', textAlign: 'left' }}>
              <div style={{ color: 'var(--text2)', marginBottom: 4 }}>Your Circle Wallet:</div>
              {user.walletAddress}
              <a
                href={`https://explorer.arc.network/address/${user.walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', marginTop: 6, color: 'var(--teal)', textDecoration: 'none' }}
              >
                View on Arc Explorer →
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
