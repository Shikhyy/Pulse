'use client'
import Link from 'next/link'
import { AgentAvatars } from '@/components/AgentAvatars'

const AGENTS_CONFIG = [
  {
    avatar: <AgentAvatars.activity />,
    color: '#00e5a0',
    name: 'Compute Agent',
    role: 'Proof of Compute',
    status: 'Active',
    desc: 'Listens to frontend WebSocket connections to ascertain inference activity. Cryptographically signs payload snapshots.',
    skills: ['EIP-712 Signing', 'Input Sampling'],
    metric: { label: 'Avg cycles/hr', val: '120.0' }
  },
  {
    avatar: <AgentAvatars.payment />,
    color: '#3b82f6',
    name: 'Payment Engine',
    role: 'Dispatcher',
    status: 'Active',
    desc: 'Verifies the Activity Agent proofs. Triggers backend Circle Node.js API to orchestrate nanopayments.',
    skills: ['Contract Validation', 'Circle API Routing'],
    metric: { label: 'Settlement', val: '0.42s' }
  },
  {
    avatar: <AgentAvatars.budget />,
    color: '#f59e0b',
    name: 'Budget Guard',
    role: 'Enforcer',
    status: 'Active',
    desc: 'Sits asynchronously on the inference stream, killing payments or pausing loops if the Orchestrator hits their specified daily cap.',
    skills: ['Threshold Alerting', 'Session Locking'],
    metric: { label: 'Limits Mapped', val: '2/15' }
  }
]

export default function AgentsPage() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <nav className="nav">
        <Link href="/" className="nav-logo">
          pulse <div className="nav-logo-dot" />
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/agents" className="nav-link active">Agents</Link>
          <Link href="/demo" className="nav-link">Proof</Link>
        </div>
        <Link href="/node/login" className="nav-cta">Connect Compute</Link>
      </nav>

      <section className="section" style={{ minHeight: '100vh', paddingTop: 140 }}>
        <div className="grid-bg" />
        <div className="orb-1" style={{ opacity: 0.5 }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', marginBottom: 80 }}>
          <div className="section-label" style={{ justifyContent: 'center' }}>03. Automation Layer</div>
          <h1 className="hero-title">The Three-Agent Pipeline</h1>
          <p className="hero-sub" style={{ margin: '0 auto' }}>
            Pulse uses a deterministic 3-agent pipeline to govern compute node payment flows. 
            No human intervention required.
          </p>
        </div>

        {/* Diagram */}
        <div className="page-enter" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 80, overflowX: 'auto', paddingBottom: 20, animationDelay: '0.1s' }}>
          <Tag>Compute Node</Tag> <Arrow />
          <Tag>Compute Agent</Tag> <Arrow />
          <Tag>Budget Guard</Tag> <Arrow />
          <Tag>Payment Engine</Tag> <Arrow />
          <Tag color="var(--teal)">Arc Testnet</Tag>
        </div>

        {/* Agent Cards */}
        <div className="agents-grid">
          {AGENTS_CONFIG.map((ag, i) => (
            <div 
              key={ag.name} 
              className="agent-card page-enter" 
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <div className="agent-card-glow" />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="agent-avatar-wrap" style={{ background: `${ag.color}11` }}>
                  {ag.avatar}
                  <div className="agent-avatar-ring" style={{ WebkitMaskImage: `linear-gradient(135deg, black, transparent)`, backgroundImage: `linear-gradient(135deg, ${ag.color}55, transparent)` }} />
                </div>
                
                <h3 className="agent-name">{ag.name}</h3>
                <div className="agent-role" style={{ color: ag.color }}>{ag.role}</div>
                
                <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, marginBottom: 24, minHeight: 66 }}>
                  {ag.desc}
                </p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                  {ag.skills.map(s => (
                    <span key={s} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text3)' }}>
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase' }}>{ag.metric.label}</div>
                    <div style={{ fontSize: 24, fontFamily: 'var(--mono)', color: 'var(--text)', marginTop: 4 }}>{ag.metric.val}</div>
                  </div>
                  <div>
                    <span className="badge badge-active">{ag.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Arrow() {
  return <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)' }}>&rarr;</div>
}

function Tag({ children, color = 'var(--text2)' }: { children: React.ReactNode, color?: string }) {
  return (
    <div style={{ 
      fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', 
      border: '1px solid var(--border)', borderRadius: 100, background: 'var(--surface)', color 
    }}>
      {children}
    </div>
  )
}
