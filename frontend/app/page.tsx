'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Scene3D from '@/components/Scene3D'

export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  const [simVal, setSimVal] = useState(0.018)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setSimVal(prev => prev + 0.009)
    }, 2500)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Navigation */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          pulse <div className="nav-logo-dot" />
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link active">Home</Link>
          <Link href="/agents" className="nav-link">Agents</Link>
          <Link href="/demo" className="nav-link">Proof</Link>
        </div>
        <Link href="/worker/login" className="nav-cta">Start Earning</Link>
      </nav>

      {/* 1. Hero Section */}
      <header className="hero">
        <div className="grid-bg" />
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />
        <Scene3D />
        
        <div className="hero-content">
          <div className="page-enter eyebrow-chip" style={{ animationDelay: '0.1s' }}>
            Powered by Circle Arc Testnet
          </div>
          
          <h1 className="page-enter hero-title" style={{ animationDelay: '0.2s' }}>
            Stop paying by the hour.<br/>
            <span className="text-gradient-flow" style={{ fontStyle: 'italic', paddingBottom: 8 }}>Pay by the second.</span>
          </h1>
          
          <p className="page-enter hero-sub" style={{ animationDelay: '0.3s' }}>
            Pulse is an autonomous payroll engine utilizing Circle Nanopayments. Watch microseconds of work converted instantly into immutable USDC streams directly to employee wallets.
          </p>
          
          <div className="page-enter" style={{ display: 'flex', gap: 16, animationDelay: '0.4s' }}>
            <Link href="/employer/signup" className="btn-primary">
              Create Employer Fleet
            </Link>
            <Link href="/demo" className="btn-ghost">
              View Simulation Proof &rarr;
            </Link>
          </div>

          <div className="page-enter hero-stats" style={{ animationDelay: '0.6s' }}>
            <div className="hero-stat">
              <div className="hero-stat-val">$0.009</div>
              <div className="hero-stat-label">Min Transaction</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">30 sec</div>
              <div className="hero-stat-label">Settlement Time</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val" style={{ color: 'var(--teal)' }}>&lt; 0.0001&cent;</div>
              <div className="hero-stat-label">Network Fee</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. How it works */}
      <section className="section" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="section-label">01. Autonomous Mechanics</div>
        <h2 className="section-title">A self-driving payroll layer.</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 60, marginTop: 60 }} className="how-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <Step number="01" title="Workers Clock In" desc="The Activity Agent initializes an EIP-712 session constraint locally." />
            <Step number="02" title="Activity Verified" desc="Microsignatures are logged every 30 seconds to prove active connection." />
            <Step number="03" title="Budget Guarded" desc="The Budget Guard engine ensures daily limits are respected before execution." />
            <Step number="04" title="Payment Dispatched" desc="Circle APIs fire a $0.009 payment into a developer-controlled wallet instantly." />
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 40, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="ticker-hero" style={{ width: '100%' }}>
              <div className="scan-line" />
              <div className="ticker-label">Live Simulation</div>
              <div className="ticker-value" style={{ fontSize: 52 }}>
                ${simVal.toFixed(3)}
              </div>
              <div className="ticker-rate" style={{ color: 'var(--teal)' }}>Firing ~30s</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features */}
      <section className="section">
        <div className="section-label">02. Infrastructure</div>
        <h2 className="section-title">Built for scale.</h2>

        <div className="features-grid" style={{ marginTop: 60 }}>
          <Feature 
            title="Circle Developer Wallets"
            desc="Employees receive frictionless, seedless sub-wallets created purely via background API calls."
          />
          <Feature 
            title="Arc Testnet Routing"
            desc="Executing thousands of transactions on traditional rails is financially impossible. Arc makes it free."
          />
          <Feature 
            title="AI Constraint Checking"
            desc="Employer caps, maximum shift durations, and idle detection are all completely autonomous."
          />
          <Feature 
            title="EIP-712 Verification"
            desc="Micro-sessions are proven cryptographically by frontend signatures passed down WebSockets."
          />
          <Feature 
            title="No Monthly Invoicing"
            desc="Bypass Stripe delays and rigid payment structures completely. Settle business debts directly."
          />
          <Feature 
            title="100% On-Chain Finality"
            desc="Every micro-payment sits immutably on the Arc Network explorer."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center', padding: '120px 20px' }}>
        <h2 className="section-title">Ready to flip the switch?</h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40 }}>
          <Link href="/worker/login" className="btn-primary">Enter as Worker</Link>
          <Link href="/employer/signup" className="btn-ghost">Enter as Employer</Link>
        </div>
      </section>
    </div>
  )
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--teal)' }}>{number}</div>
      <div>
        <h3 style={{ fontFamily: 'var(--sans)', fontSize: 18, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ color: 'var(--text2)', margin: 0, fontSize: 15, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  )
}

function Feature({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="feature-cell">
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', margin: '0 0 16px' }}>{title}</h3>
      <p style={{ color: 'var(--text2)', margin: 0, fontSize: 15, lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}
