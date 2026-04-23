'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AgentMetrics {
  activity: {
    totalPings: number
    successfulPings: number
    failedPings: number
    idlePeriods: number
    totalEarned: number
    averageActivityScore: number
    uptime: number
    lastActivityAt: number
  }
  payment: {
    totalDispatched: number
    totalFailed: number
    amount: number
    averageSettlementTime: number
    lastPaymentAt: number
  }
  budget: {
    dailyCap: number
    dailySpent: number
    dailyRemaining: number
    hourlyCap: number
    hourlySpent: number
    hourlyRemaining: number
    warningThreshold: number
    isExceeded: boolean
    isWarning: boolean
  }
  timestamp: string
}

interface AgentLog {
  id: string
  timestamp: string
  agent: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export default function AgentLogsPage() {
  const router = useRouter()
  const { token } = (typeof window !== 'undefined' 
    ? { token: localStorage.getItem('pulse_emp_token') }
    : { token: null })

  const [metrics, setMetrics] = useState<AgentMetrics | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [view, setView] = useState<'overview' | 'logs'>('overview')
  const [filterAgent, setFilterAgent] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      router.push('/orchestrator/login')
      return
    }
  }, [token, router])

  const fetchData = async () => {
    try {
      const logsUrl = `/api/agents/logs?limit=50${filterAgent ? `&agent=${filterAgent}` : ''}${filterLevel ? `&level=${filterLevel}` : ''}`
      const [metricsRes, logsRes] = await Promise.all([
        fetch('/api/agents/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch(logsUrl, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const metricsData = await metricsRes.json()
      const logsData = await logsRes.json()
      setMetrics(metricsData)
      setLogs(logsData.logs ?? [])
    } catch (e) {
      console.error('[Logs] fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [token, filterAgent, filterLevel])

  if (!token) return null

  const formatCurrency = (v: number) => `$${v.toFixed(2)}`
  const formatPct = (v: number) => `${(v * 100).toFixed(0)}%`
  const formatTime = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  }

  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <Link href="/" className="nav-logo" style={{ padding: '0 24px', marginBottom: 40, fontSize: 20 }}>
          pulse <div className="nav-logo-dot" />
        </Link>
        
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarNav label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
          <SidebarNav label="Live Logs" active={view === 'logs'} onClick={() => setView('logs')} />
          <Link href="/orchestrator" className="nav-link" style={{ marginTop: 24 }}>
            &larr; Dashboard
          </Link>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0, fontSize: 22, color: 'var(--text)' }}>
            {view === 'overview' ? 'Agent Metrics' : 'Live Agent Logs'}
          </h2>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>
            Real-time agent telemetry
          </span>
        </header>

        <div className="dash-content">
          {view === 'overview' && metrics && (
            <div className="page-enter">
              <div className="metric-grid">
                <div className="card">
                  <div className="card-title">Total Pings</div>
                  <div className="card-val">{metrics.activity.totalPings}</div>
                  <div className="card-sub">
                    {metrics.activity.successfulPings} successful, {metrics.activity.failedPings} failed
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Total Earned</div>
                  <div className="card-val" style={{ color: 'var(--teal)' }}>
                    ${metrics.activity.totalEarned.toFixed(4)}
                  </div>
                  <div className="card-sub">Lifetime earnings</div>
                </div>
                <div className="card">
                  <div className="card-title">Payments Dispatched</div>
                  <div className="card-val">{metrics.payment.totalDispatched}</div>
                  <div className="card-sub">
                    ${metrics.payment.amount.toFixed(4)} total
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Avg Settlement</div>
                  <div className="card-val" style={{ color: 'var(--blue)' }}>
                    {metrics.payment.averageSettlementTime.toFixed(2)}s
                  </div>
                  <div className="card-sub">via Circle API</div>
                </div>
              </div>

              <div className="metric-grid" style={{ marginTop: 24 }}>
                <div className="card">
                  <div className="card-title">Daily Budget</div>
                  <div className="card-val" style={{ color: metrics.budget.isExceeded ? 'var(--red)' : 'var(--text)' }}>
                    {formatCurrency(metrics.budget.dailySpent)}
                  </div>
                  <div className="card-sub">
                    {formatCurrency(metrics.budget.dailyRemaining)} remaining of {formatCurrency(metrics.budget.dailyCap)}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Hourly Budget</div>
                  <div className="card-val" style={{ color: metrics.budget.isWarning ? 'var(--amber)' : 'var(--text)' }}>
                    {formatCurrency(metrics.budget.hourlySpent)}
                  </div>
                  <div className="card-sub">
                    {formatCurrency(metrics.budget.hourlyRemaining)} remaining of {formatCurrency(metrics.budget.hourlyCap)}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Activity Score</div>
                  <div className="card-val">
                    {(metrics.activity.averageActivityScore * 100).toFixed(1)}%
                  </div>
                  <div className="card-sub">Moving average</div>
                </div>
                <div className="card">
                  <div className="card-title">Uptime</div>
                  <div className="card-val">
                    {formatTime(metrics.activity.lastActivityAt)}
                  </div>
                  <div className="card-sub">Last activity</div>
                </div>
              </div>
            </div>
          )}

          {view === 'logs' && (
            <div className="page-enter">
              <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Filter by agent..."
                    value={filterAgent}
                    onChange={e => setFilterAgent(e.target.value)}
                    className="input"
                    style={{ width: 200 }}
                  />
                  <select
                    value={filterLevel}
                    onChange={e => setFilterLevel(e.target.value)}
                    className="input"
                    style={{ width: 120 }}
                  >
                    <option value="">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                  {logs.length} log entries
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {logs.map(log => (
                    <LogRow key={log.id} log={log} />
                  ))}
                  {logs.length === 0 && !loading && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                      No log entries yet.
                    </div>
                  )}
                </div>
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

function LogRow({ log }: { log: AgentLog }) {
  const colors: Record<string, string> = {
    info: 'var(--text2)',
    warn: 'var(--amber)',
    error: 'var(--red)',
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: 16, 
      padding: '8px 12px', 
      background: 'var(--bg2)', 
      borderRadius: 4,
      fontFamily: 'var(--mono)',
      fontSize: 12,
    }}>
      <span style={{ color: 'var(--text3)', width: 180 }}>
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <span style={{ color: 'var(--teal)', width: 120 }}>{log.agent}</span>
      <span style={{ color: colors[log.level], width: 60 }}>{log.level}</span>
      <span style={{ color: 'var(--text2)', flex: 1 }}>{log.message}</span>
    </div>
  )
}