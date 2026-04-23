'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invite {
  id: number
  code: string
  maxUses: number
  usedCount: number
  expiresAt: string
  createdAt: string
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newInvite, setNewInvite] = useState<{ code: string; url: string } | null>(null)

  useEffect(() => {
    loadInvites()
  }, [])

  const loadInvites = async () => {
    try {
      const token = localStorage.getItem('pulse_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (err) {
      console.error('Failed to load invites:', err)
    }
    setLoading(false)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const token = localStorage.getItem('pulse_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/invites/generate`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ maxUses: 1, expiresIn: 7 })
      })
      const data = await res.json()
      setNewInvite({ code: data.code, url: data.inviteUrl })
      loadInvites()
    } catch (err) {
      console.error('Failed to generate invite:', err)
    }
    setGenerating(false)
  }

  const handleRevoke = async (code: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return
    
    try {
      const token = localStorage.getItem('pulse_token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/invites/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadInvites()
    } catch (err) {
      console.error('Failed to revoke invite:', err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav className="nav">
        <Link href="/" className="nav-logo">pulse <div className="nav-logo-dot" /></Link>
        <div className="nav-links">
          <Link href="/orchestrator" className="nav-link">Dashboard</Link>
          <Link href="/orchestrator/webhooks" className="nav-link">Webhooks</Link>
          <span className="nav-link active">Workers</span>
        </div>
        <Link href="/orchestrator/settings" className="btn-ghost">Settings</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Invite Workers</h1>
            <p style={{ color: 'var(--text2)' }}>
              Generate invite codes to add workers to your team
            </p>
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating...' : '+ Generate Invite'}
          </button>
        </div>

        {/* New Invite Banner */}
        {newInvite && (
          <div className="card" style={{ marginBottom: 24, background: 'var(--teal-dim)', borderColor: 'var(--teal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--teal)', marginBottom: 4 }}>New invite code created!</div>
                <code style={{ fontSize: 18, fontWeight: 'bold' }}>{newInvite.code}</code>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => copyToClipboard(newInvite.code)} className="btn-ghost" style={{ fontSize: 12 }}>
                  Copy Code
                </button>
                <button onClick={() => copyToClipboard(newInvite.url)} className="btn-ghost" style={{ fontSize: 12 }}>
                  Copy Link
                </button>
                <button onClick={() => setNewInvite(null)} className="btn-ghost" style={{ fontSize: 12 }}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {invites.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <h3 style={{ marginBottom: 8 }}>No invite codes yet</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
              Generate an invite code to add workers to your organization
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invites.map((invite) => (
              <div key={invite.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <code style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--teal)' }}>
                        {invite.code}
                      </code>
                      <span className={`badge ${invite.usedCount >= invite.maxUses ? 'badge-inactive' : 'badge-active'}`}>
                        {invite.usedCount}/{invite.maxUses} used
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => copyToClipboard(invite.code)} 
                      className="btn-ghost" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Copy
                    </button>
                    <button 
                      onClick={() => handleRevoke(invite.code)} 
                      className="btn-ghost" 
                      style={{ padding: '6px 12px', fontSize: 12, color: 'var(--red)' }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>How it works</h2>
          <div className="card">
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li style={{ marginBottom: 12, color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--text)' }}>Generate an invite code</strong> - Create a unique code for a worker to join
              </li>
              <li style={{ marginBottom: 12, color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--text)' }}>Share with worker</strong> - Send them the code or invite link
              </li>
              <li style={{ marginBottom: 12, color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--text)' }}>Worker signs up</strong> - They use the code when creating their account
              </li>
              <li style={{ color: 'var(--text2)' }}>
                <strong style={{ color: 'var(--text)' }}>Start paying</strong> - They're automatically assigned to your organization
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  )
}