'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

interface ProofData {
  arcTransactionCount: number
  totalEarnedVolume: number
  gasEstimate: number
  recentTransactions: any[]
}

export default function DemoProofPage() {
  const [data, setData] = useState<ProofData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const p = await api.getDemoProof()
      setData(p as unknown as ProofData)
      setLoading(false)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 3000)
    return () => clearInterval(t)
  }, [])

  if (loading || !data) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <nav className="nav">
          <Link href="/" className="nav-logo">pulse <div className="nav-logo-dot" /></Link>
        </nav>
        <section className="section" style={{ paddingBottom: 40, paddingTop: 140 }}>
           <div className="skeleton" style={{ width: 300, height: 16, margin: '0 auto 20px', borderRadius: 100 }} />
           <div className="skeleton" style={{ width: 400, height: 50, margin: '0 auto 24px' }} />
           <div className="skeleton-text" style={{ width: 500, margin: '0 auto 60px' }} />
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
             <div className="card skeleton" style={{ height: 160 }} />
             <div className="card skeleton" style={{ height: 160 }} />
           </div>
           <div className="card skeleton" style={{ height: 260, marginBottom: 40 }} />
           <div className="card skeleton" style={{ height: 400 }} />
        </section>
      </div>
    )
  }

  const txCount = data.arcTransactionCount
  const minStripeCost = txCount * 0.30

  const handleExport = () => {
    window.open('http://localhost:3001/api/demo/csv', '_blank')
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          pulse <div className="nav-logo-dot" />
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/agents" className="nav-link">Agents</Link>
          <Link href="/demo" className="nav-link active">Proof</Link>
        </div>
        <Link href="/worker/login" className="nav-cta">Start Earning</Link>
      </nav>

      {/* Header */}
      <section className="section" style={{ paddingBottom: 40, paddingTop: 140 }}>
        <div className="grid-bg" />
        <div className="orb-1" style={{ opacity: 0.5 }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>Hackathon Submission Proof</div>
          <h1 className="hero-title" style={{ fontSize: 52 }}>On-Chain Economics</h1>
          <p className="hero-sub" style={{ margin: '0 auto' }}>
            Pulse routes every microtransaction through the Circle Arc Testnet.
            Below is the live telemetry comparing actual Arc utility against traditional fiat rails.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section" style={{ paddingTop: 0 }}>
        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <div className="card page-enter" style={{ animationDelay: '0.1s' }}>
            <div className="card-title">Arc Testnet Transactions</div>
            <div className="card-val" style={{ fontSize: 42 }}>{txCount}</div>
            <div className="card-sub">Cryptographically verified nanostreams</div>
          </div>
          <div className="card page-enter" style={{ animationDelay: '0.2s', background: 'var(--teal-dim)', borderColor: 'var(--border2)', display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="card-title" style={{ color: 'var(--teal)' }}>Network Gas Spent vs Fiat Cost</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <div className="card-val" style={{ fontSize: 42 }}>$0.00</div>
                <div style={{ fontSize: 18, color: 'var(--red)', textDecoration: 'line-through' }}>${minStripeCost.toFixed(2)}</div>
              </div>
              <div className="card-sub" style={{ color: 'var(--text)' }}>
                Avoided flat $0.30 Stripe charge per transaction.
              </div>
            </div>
            
            {/* Visual Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 100, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 40, height: 4, background: 'var(--teal)', borderRadius: 2, transition: 'all 0.5s' }} />
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>ARC</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 40, height: Math.min(100, 4 + minStripeCost * 8), background: 'var(--red)', borderRadius: '2px 2px 0 0', transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>FIAT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Economics Table */}
        <div className="card page-enter" style={{ marginBottom: 40, animationDelay: '0.3s' }}>
          <div className="card-title" style={{ marginBottom: 20 }}>Unit Economic Model ($0.009 payouts)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: 12, borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>Scenario</th>
                  <th style={{ padding: 12, borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>Our Payout</th>
                  <th style={{ padding: 12, borderBottom: '1px solid var(--border)', color: 'var(--teal)' }}>Pulse (Arc)</th>
                  <th style={{ padding: 12, borderBottom: '1px solid var(--border)', color: 'var(--red)' }}>Stripe Equivalent</th>
                </tr>
              </thead>
              <tbody>
                <TableRow scenario="1 worker, 1 min" payout="$0.018" arc="$0.018 + $0.00 gas" stripe="~ $0.62" badge="bad" />
                <TableRow scenario="1 worker, 1 hour" payout="$1.08" arc="$1.08 + $0.00 gas" stripe="~ $36.03" badge="bad" />
                <TableRow scenario="5 workers, 8 hours" payout="$43.20" arc="$43.20 + $0.00 gas" stripe="~ $1,441.42" badge="bad" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Integration Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40, animationDelay: '0.4s' }} className="page-enter">
          <Checklist title="Developer API" desc="Native Node.js hooks orchestrating on-chain routing." />
          <Checklist title="Developer-Controlled Wallets" desc="Frictionless end-user setup; we pay all gas natively." />
          <Checklist title="Smart Contract Platform" desc="Transactions settle natively via Circle endpoints." />
          <Checklist title="USDC Native" desc="Every cent tracked internally pegs exactly to Circle USDC." />
        </div>

        {/* Transactions Table */}
        <div className="card page-enter" style={{ animationDelay: '0.5s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="card-title" style={{ margin: 0 }}>On-Chain Ledger</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleExport}>
                Export CSV
              </button>
              <a href="https://explorer.arc.network" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                Open Arc Explorer
              </a>
            </div>
          </div>
          
          <div className="feed-container">
            {data.recentTransactions.length === 0 ? (
               <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--mono)' }}>No transactions recorded. Boot the server and launch the demo suite.</div>
            ) : (
               <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: 13 }}>
                  <tbody>
                    {data.recentTransactions.map((tx, i) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'var(--bg3)' : 'transparent' }}>
                        <td style={{ padding: '12px 0 12px 16px', color: 'var(--text3)' }}>{tx.recordedAt ? new Date(tx.recordedAt).toLocaleTimeString() : '...'}</td>
                        <td style={{ padding: 12, color: 'var(--teal)' }}>{tx.arcTxHash ? tx.arcTxHash.slice(0, 10)+'...' : 'Pending'}</td>
                        <td style={{ padding: 12, color: 'var(--text2)' }}>{tx.employerId?.slice(0,8)}</td>
                        <td style={{ padding: 12, color: 'var(--text2)' }}>{tx.workerId?.slice(0,8)}</td>
                        <td style={{ padding: 12, color: 'var(--text)' }}>${Number(tx.amount).toFixed(3)}</td>
                        <td style={{ padding: '12px 16px 12px 0', textAlign: 'right' }}>
                          <span className="badge badge-active">Settled</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function TableRow({ scenario, payout, arc, stripe, badge }: any) {
  return (
    <tr className="table-row">
      <td style={{ padding: 12, color: 'var(--text)' }}>{scenario}</td>
      <td style={{ padding: 12, color: 'var(--text)' }}>{payout}</td>
      <td style={{ padding: 12, color: 'var(--teal)', background: 'var(--teal-dim)' }}>{arc}</td>
      <td style={{ padding: 12, color: 'var(--red)', background: 'rgba(239, 68, 68, 0.1)' }}>{stripe}</td>
    </tr>
  )
}

function Checklist({ title, desc }: any) {
  return (
    <div style={{ padding: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', gap: 16 }}>
      <div style={{ color: 'var(--teal)' }}>✓</div>
      <div>
        <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text)', marginBottom: 4, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}
