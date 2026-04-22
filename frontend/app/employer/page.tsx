'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEmployerStore } from '@/lib/store'
import BudgetBar from '@/components/BudgetBar'
import WorkerRow from '@/components/WorkerRow'
import PaymentFeed from '@/components/PaymentFeed'

export default function EmployerDashboardPage() {
  const router = useRouter()
  const { 
    user, token, companyName, workers, recentPayments, 
    dailyCap, todaySpend, 
    updateDashboard, toggleWorkerPause, logout 
  } = useEmployerStore()

  // Animated counters
  const totalArc = recentPayments.filter(p => p.txnId).length
  const totalPayments = recentPayments.filter(p => !p.txnId).length
  const activeWorkers = workers.filter(w => w.isActive && !w.isPaused).length

  const animSpend = useCountUp(todaySpend, 1200)
  const animPayments = useCountUp(totalPayments, 1200)
  const animActiveWorkers = useCountUp(activeWorkers, 1200)
  const animTotalPaymentsLength = useCountUp(recentPayments.length, 1200)
  const animCap = useCountUp(Math.max(0, dailyCap - todaySpend), 1200)
  const animTotalArc = useCountUp(totalArc, 1200)

  const [view, setView] = useState<'overview'|'team'|'feed'|'budget'>('overview')
  const [loading, setLoading] = useState(false)
  const [actioningId, setActioningId] = useState<string|null>(null)

  useEffect(() => {
    if (!user || !token) {
      router.push('/employer/login')
      return
    }

    const fetchDash = async () => {
      try {
        const res = await import('@/lib/api').then(m => m.api.getDashboard(token))
        updateDashboard(res)
      } catch (e) {
        console.error(e)
      }
    }

    fetchDash()
    const interval = setInterval(fetchDash, 3000)
    return () => clearInterval(interval)
  }, [user, token, router, updateDashboard])

  const handlePauseToggle = async (workerId: string, pause: boolean) => {
    if (actioningId) return
    setActioningId(workerId)
    await toggleWorkerPause(workerId, pause)
    setActioningId(null)
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const formatTokens = (val: number) => val.toFixed(2)

  const formatTokens = (val: number) => val.toFixed(2)

  // Empty state skeleton wrapper
  if (!companyName && loading) {
     return (
       <div className="dash-shell">
         <aside className="dash-sidebar skeleton" style={{ border: 'none' }} />
         <main className="dash-main" style={{ padding: 40 }}>
           <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 40 }} />
           <div className="metric-grid">
             <div className="card skeleton" style={{ height: 160 }} />
             <div className="card skeleton" style={{ height: 160 }} />
             <div className="card skeleton" style={{ height: 160 }} />
             <div className="card skeleton" style={{ height: 160 }} />
           </div>
           <div className="card skeleton" style={{ height: 400 }} />
         </main>
       </div>
     )
  }

  return (
    <div className="dash-shell">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <Link href="/" className="nav-logo" style={{ padding: '0 24px', marginBottom: 40, fontSize: 20 }}>
          pulse <div className="nav-logo-dot" />
        </Link>
        
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SidebarNav label="Overview" active={view === 'overview'} onClick={() => setView('overview')} />
          <SidebarNav label="Team" active={view === 'team'} onClick={() => setView('team')} />
          <SidebarNav label="Payment Feed" active={view === 'feed'} onClick={() => setView('feed')} />
          <SidebarNav label="Budget limits" active={view === 'budget'} onClick={() => setView('budget')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-topbar">
          <h2 style={{ fontFamily: 'var(--serif)', margin: 0, fontSize: 22, color: 'var(--text)' }}>
            {view === 'overview' ? 'Command Center' : 
             view === 'team' ? 'Fleet Operations' : 
             view === 'feed' ? 'Arc Payment Feed' : 'Budget Guard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>{companyName}</span>
            <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 12, minHeight: 0 }} onClick={handleLogout}>Log Out</button>
          </div>
        </header>

        <div className="dash-content">
          {view === 'overview' && (
            <div className="page-enter">
              <div className="metric-grid">
                <div className="card">
                  <div className="card-title">Today's Spend</div>
                  <div className="card-val">${formatTokens(animSpend)}</div>
                  <div className="card-sub">{Math.floor(animPayments)} total nanostreams</div>
                </div>
                <div className="card">
                  <div className="card-title">Active Workers</div>
                  <div className="card-val">{Math.floor(animActiveWorkers)} <span style={{ color: 'var(--text3)' }}>/ {workers.length}</span></div>
                  <div className="card-sub">Currently earning on-chain</div>
                </div>
                <div className="card">
                  <div className="card-title">Total Payments</div>
                  <div className="card-val" style={{ color: 'var(--text)' }}>{Math.floor(animTotalPaymentsLength)}</div>
                  <div className="card-sub">Idle + Confirmed</div>
                </div>
                <div className="card">
                  <div className="card-title">Budget Remaining</div>
                  <div className="card-val" style={{ color: 'var(--amber)' }}>${formatTokens(animCap)}</div>
                  <div className="card-sub">Resets at midnight UTC</div>
                </div>
              </div>

              <div className="card" style={{ marginBottom: 24 }}>
                <BudgetBar cap={dailyCap} spent={todaySpend} />
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recent Payment Log</span>
                  <span style={{ cursor: 'pointer', color: 'var(--teal)' }} onClick={() => setView('feed')}>View all &rarr;</span>
                </div>
                <PaymentFeed payments={recentPayments} maxRows={5} showWorkerName />
              </div>
            </div>
          )}

          {view === 'team' && (
            <div className="card page-enter">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div className="card-title" style={{ margin: 0 }}>Registered Workers ({workers.length})</div>
                <span className="badge badge-idle">Invite code: EMP-2026</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {workers.map(w => (
                  <WorkerRow 
                    key={w.id} 
                    worker={w} 
                    onPause={(id) => handlePauseToggle(id, true)} 
                    onResume={(id) => handlePauseToggle(id, false)}
                    loading={actioningId === w.id}
                  />
                ))}
                {workers.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                    No workers registered to your company.
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'feed' && (
            <div className="page-enter">
              <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="card">
                  <div className="card-title">Confirmed on Arc</div>
                  <div className="card-val" style={{ color: 'var(--text)' }}>{Math.floor(animTotalArc)}</div>
                </div>
                <div className="card">
                  <div className="card-title">Average Gas</div>
                  <div className="card-val" style={{ color: 'var(--teal)' }}>0.00000000</div>
                  <div className="card-sub">USDC matching</div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <a href="https://explorer.arc.network" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ width: '100%' }}>
                    Open Block Explorer &rarr;
                  </a>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: 16 }}>Streaming Feed</div>
                <PaymentFeed payments={recentPayments} maxRows={100} showWorkerName />
              </div>
            </div>
          )}

          {view === 'budget' && (
            <div className="page-enter" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} >
              <div className="card">
                <div className="card-title">Active Constraint</div>
                <div style={{ fontSize: 48, fontFamily: 'var(--mono)', color: 'var(--text)', marginBottom: 24, marginTop: 10 }}>
                  ${formatTokens(dailyCap)} <span style={{ fontSize: 16, color: 'var(--text3)' }}>/ day</span>
                </div>
                <BudgetBar cap={dailyCap} spent={todaySpend} />
              </div>
              <div className="card">
                <div className="section-label">03. Budget Guard Logic</div>
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Rule title="Daily Hard Cap" val={`$${dailyCap}`} desc="Payments stop immediately when hit." color="var(--red)" />
                  <Rule title="80% Warning" val={`$${formatTokens(dailyCap * 0.8)}`} desc="Email alert triggered." color="var(--amber)" />
                  <Rule title="Idle Pause" val="3 pings" desc="Worker streams halt if no UI engagement." color="var(--blue)" />
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

function Rule({ title, val, desc, color }: { title: string, val: string, desc: string, color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color, width: 90 }}>{val}</div>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)' }}>{desc}</div>
      </div>
    </div>
  )
}

function useCountUp(end: number, duration: number = 1000) {
  const [val, setVal] = useState(0)
  
  useEffect(() => {
    let startTime: number
    let frameId: number
    const startVal = val

    const doAnimate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = timestamp - startTime
      const pct = Math.min(progress / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - pct, 4)
      
      setVal(startVal + (end - startVal) * easeOutQuart)
      
      if (pct < 1) {
        frameId = requestAnimationFrame(doAnimate)
      }
    }
    
    frameId = requestAnimationFrame(doAnimate)
    return () => cancelAnimationFrame(frameId)
  }, [end, duration])

  return val
}
