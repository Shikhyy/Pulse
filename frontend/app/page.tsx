'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import DoodleBackground from '@/components/DoodleBackground'
import Icon from '@/components/Icon'
import type { IconProps } from '@/components/Icon'

export default function LandingPage() {
  const [visible, setVisible] = useState(false)
  const [simVal, setSimVal] = useState(0.018)
  const [txCount, setTxCount] = useState(0)
  const [activeNodes, setActiveNodes] = useState(5)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setSimVal(prev => prev + 0.009)
      setTxCount(prev => prev + 1)
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
          <Link href="/demo" className="nav-link">Proof</Link>
          <Link href="/docs" className="nav-link">Docs</Link>
        </div>
        <Link href="/orchestrator/signup" className="nav-cta">Start Now</Link>
      </nav>

      {/* 1. Hero Section */}
      <header className="hero">
        <div className="grid-bg" />
        <DoodleBackground />
        
        <div className="hero-content">
          <div className="page-enter eyebrow-chip" style={{ animationDelay: '0.1s' }}>
            Built on Arc Testnet • Chain ID: 5042002
          </div>
          
          <h1 className="page-enter hero-title" style={{ animationDelay: '0.2s', fontSize: 56 }}>
            Real-time pay for freelancers.<br/>
            <span className="text-gradient-flow" style={{ fontStyle: 'italic', paddingBottom: 8 }}>Get paid every 30 seconds.</span>
          </h1>
          
          <p className="page-enter hero-sub" style={{ animationDelay: '0.3s', maxWidth: 600 }}>
            Freelancers get paid in real-time with sub-cent nanopayments. 
            No more waiting 30 days for payroll. Built on Circle Nanopayments + x402 protocol.
          </p>
          
          <div className="page-enter" style={{ display: 'flex', gap: 16, animationDelay: '0.4s', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/orchestrator/signup" className="btn-primary">
              Deploy Orchestrator
            </Link>
            <Link href="/demo" className="btn-ghost">
              View Live Demo →
            </Link>
          </div>

          <div className="page-enter hero-stats" style={{ animationDelay: '0.6s', marginTop: 40 }}>
            <div className="hero-stat">
              <div className="hero-stat-val">$0.009</div>
              <div className="hero-stat-label">Min Payment</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{txCount}+</div>
              <div className="hero-stat-label">On-Chain Txns</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{activeNodes}</div>
              <div className="hero-stat-label">Active Nodes</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val" style={{ color: 'var(--teal)' }}>0%</div>
              <div className="hero-stat-label">Gas Fee</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Network Stats */}
      <section style={{ background: 'var(--teal)', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)' }}>5042002</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Arc Chain ID</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)' }}>$0.000001</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Min Nanopayment</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)' }}>&lt;1s</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Finality</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--mono)' }}>x402</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Protocol</div>
          </div>
        </div>
      </section>

      {/* 3. How it works */}
      <section className="section" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="section-label">01. How It Works</div>
        <h2 className="section-title">Four steps to real-time pay.</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginTop: 60 }} className="how-grid">
          <Step 
            iconName="shield-lock"
            title="1. Worker Registers" 
            desc="Freelancers register and connect their Circle wallet. Set your hourly rate and payment schedule."
          />
          <Step 
            iconName="zap"
            title="2. Work Tracked" 
            desc="Track your work sessions in real-time. Every 30 seconds, a verified proof is generated."
          />
          <Step 
            iconName="card"
            title="3. Payment Sent" 
            desc="Your employer defines a budget. Work gets verified and payments are instantly dispatched."
          />
          <Step 
            iconName="check"
            title="4. Instant Settlement" 
            desc="Funds arrive directly in your wallet. No middleman, no waiting 30 days."
          />
        </div>
      </section>

      {/* 4. Pricing Comparison */}
      <section className="section">
        <div className="section-label">02. Unit Economics</div>
        <h2 className="section-title">Why traditional payments fail.</h2>
        
        <div style={{ marginTop: 40, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface)' }}>
                <th style={{ padding: 20, fontSize: 14, color: 'var(--text2)' }}>Scenario</th>
                <th style={{ padding: 20, fontSize: 14, color: 'var(--teal)' }}>Pulse (Arc)</th>
                <th style={{ padding: 20, fontSize: 14, color: 'var(--red)' }}>Traditional</th>
                <th style={{ padding: 20, fontSize: 14, color: 'var(--text2)' }}>Savings</th>
              </tr>
            </thead>
            <tbody>
              <TableRow scenario="1 worker, 1 min" pulse="$0.018 + $0 gas" trad="$0.62 min" savings="97%" />
              <TableRow scenario="1 worker, 1 hour" pulse="$1.08 + $0 gas" trad="$36.03" savings="97%" />
              <TableRow scenario="5 workers, 8 hours" pulse="$43.20 + $0 gas" trad="$1,441" savings="97%" />
              <TableRow scenario="100 workers, 24 hours" pulse="$259.20 + $0 gas" trad="$10,800+" savings="97.6%" />
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg3)', borderRadius: 12, textAlign: 'center' }}>
          <strong style={{ color: 'var(--teal)' }}>Key Insight:</strong> Traditional payment rails have a $0.50 minimum. 
          Pulse makes $0.009 payments economically viable.
        </div>
      </section>

      {/* 5. Technology Stack */}
      <section className="section" style={{ background: 'var(--bg2)' }}>
        <div className="section-label">03. Built With</div>
        <h2 className="section-title">Best-in-class infrastructure.</h2>

        <div className="features-grid" style={{ marginTop: 60 }}>
          <Feature 
            icon="⛓"
            title="Arc Testnet"
            desc="USDC-native L1 with sub-second finality. Chain ID 5042002."
            link="https://docs.arc.network"
          />
          <Feature 
            icon="💰"
            title="Circle Nanopayments"
            desc="Gas-free sub-cent payments via Gateway batched settlement."
            link="https://developers.circle.com/gateway/nanopayments"
          />
          <Feature 
            icon="🔑"
            title="x402 Protocol"
            desc="Web-native payment standard for autonomous agents."
            link="https://www.x402.org"
          />
          <Feature 
            icon="👛"
            title="Developer Wallets"
            desc="MPC-backed wallets. No seed phrases. Programmable."
          />
          <Feature 
            icon="📜"
            title="ERC-8004"
            desc="Agent identity standard. Reputation & trust on-chain."
            link="https://github.com/vyperlang/erc-8004-vyper"
          />
          <Feature 
            icon="🐍"
            title="Vyper + Solidity"
            desc="Smart contracts in both Vyper and Solidity for Arc."
            link="https://github.com/vyperlang/vyper-agentic-payments"
          />
        </div>
      </section>

      {/* 6. Use Cases */}
      <section className="section">
        <div className="section-label">04. Use Cases</div>
        <h2 className="section-title">What's possible now.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 40 }}>
          <UseCase 
            title="Remote Freelancers"
            description="Pay remote workers in real-time. Every 30 seconds, they get paid for their time."
            example="$0.009 per 30s"
          />
          <UseCase 
            title="Contractor Payments"
            description="Pay contractors per task or per hour. No more invoicing delay. Instant settlement."
            example="$0.05 per task"
          />
          <UseCase 
            title="Freelance Teams"
            description="Pay multiple freelancers at once. Batch payments, individual tracking."
            example="$10/hr each"
          />
          <UseCase 
            title="Freelance Payroll"
            description="Real-time payroll. Workers get paid every 30 seconds, not net-30."
            example="$0.009 per 30s"
          />
          <UseCase 
            title="Compute Marketplace"
            description="Sell unused GPU compute. Buyers pay per millisecond of usage."
            example="$0.003 per second"
          />
          <UseCase 
            title="Content Streaming"
            description="Pay-per-second content. No subscriptions. Just pay for what you watch."
            example="$0.0001 per second"
          />
        </div>
      </section>

      {/* 7. CTA */}
      <section className="section" style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', textAlign: 'center', padding: '120px 20px' }}>
        <h2 className="section-title">Ready to pay freelancers in real-time?</h2>
        <p style={{ maxWidth: 500, margin: '16px auto', color: 'var(--text2)' }}>
          Set up real-time payments for your freelancers in minutes. 
          No more net-30 payroll. Every 30 seconds, they get paid.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
          <Link href="/orchestrator/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: 16 }}>
            Start Paying Freelancers →
          </Link>
          <Link href="/demo" className="btn-ghost" style={{ padding: '16px 32px', fontSize: 16 }}>
            View Demo Proof
          </Link>
        </div>
        <div style={{ marginTop: 40, fontSize: 12, color: 'var(--text3)' }}>
          Docs • API • GitHub • Discord
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: 40, textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text3)', fontSize: 13 }}>
        <div style={{ marginBottom: 8 }}>
          <strong style={{ color: 'var(--teal)' }}>Pulse</strong> — Real-Time Freelancer Pay
        </div>
        <div>
          Arc Testnet • Circle Nanopayments • x402 • ERC-8004
        </div>
        <div style={{ marginTop: 8, fontSize: 11 }}>
          MIT License • Built for LabLab.ai Hackathon 2026
        </div>
      </footer>
    </div>
  )
}

function Step({ iconName, title, desc }: { iconName: string, title: string, desc: string }) {
  return (
    <div className="card card-static animate-doodle-wobble" style={{ padding: 24, borderRadius: 16 }}>
      <div style={{ marginBottom: 16, color: 'var(--teal)' }}>
        <Icon name={iconName as IconProps['name']} size={32} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
}

function TableRow({ scenario, pulse, trad, savings }: { scenario: string, pulse: string, trad: string, savings: string }) {
  return (
    <tr style={{ borderTop: '1px solid var(--border)' }}>
      <td style={{ padding: 16, color: 'var(--text)' }}>{scenario}</td>
      <td style={{ padding: 16, color: 'var(--teal)', fontFamily: 'var(--mono)' }}>{pulse}</td>
      <td style={{ padding: 16, color: 'var(--red)', fontFamily: 'var(--mono)', textDecoration: 'line-through', opacity: 0.7 }}>{trad}</td>
      <td style={{ padding: 16, color: 'var(--teal)', fontWeight: 600 }}>{savings}</td>
    </tr>
  )
}

function UseCase({ title, description, example }: { title: string, description: string, example: string }) {
  return (
    <div style={{ padding: 24, background: 'var(--bg3)', borderRadius: 12, border: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>{description}</p>
      <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--teal)', borderRadius: 6, display: 'inline-block' }}>
        <code style={{ fontSize: 12, color: 'white' }}>{example}</code>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc, link }: { icon: string, title: string, desc: string, link?: string }) {
  const content = (
    <div className="feature-cell">
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--text)', margin: '0 0 8px' }}>{title}</h3>
      <p style={{ color: 'var(--text2)', margin: 0, fontSize: 13, lineHeight: 1.5 }}>{desc}</p>
    </div>
  )
  
  if (link) {
    return <a href={link} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>{content}</a>
  }
  return content
}