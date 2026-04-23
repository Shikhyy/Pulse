'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Webhook {
  id: string
  url: string
  events: string[]
  active: boolean
  createdAt: string
  deliveries?: number
  failures?: number
}

const EVENT_TYPES = [
  { value: 'payment.success', label: 'Payment Success', desc: 'When a nanopayment succeeds' },
  { value: 'payment.failed', label: 'Payment Failed', desc: 'When a payment fails' },
  { value: 'session.started', label: 'Session Started', desc: 'When a worker clocks in' },
  { value: 'session.ended', label: 'Session Ended', desc: 'When a worker clocks out' },
  { value: 'budget.warning', label: 'Budget Warning', desc: 'When budget reaches 80%' },
  { value: 'budget.exceeded', label: 'Budget Exceeded', desc: 'When budget is exceeded' },
  { value: 'worker.paused', label: 'Worker Paused', desc: 'When a worker is paused' },
  { value: 'worker.resumed', label: 'Worker Resumed', desc: 'When a worker is resumed' },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: ['payment.success'],
    secret: '',
  })

  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      const token = localStorage.getItem('pulse_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      console.error('Failed to load webhooks:', err)
    }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!newWebhook.url) return
    
    setSaving(true)
    try {
      const token = localStorage.getItem('pulse_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newWebhook)
      })
      const data = await res.json()
      
      if (data.secret) {
        alert(`Webhook created! Save this secret: ${data.secret}\n\nIt won't be shown again.`)
      }
      
      setShowCreate(false)
      setNewWebhook({ url: '', events: ['payment.success'], secret: '' })
      loadWebhooks()
    } catch (err) {
      console.error('Failed to create webhook:', err)
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    
    try {
      const token = localStorage.getItem('pulse_token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      loadWebhooks()
    } catch (err) {
      console.error('Failed to delete webhook:', err)
    }
  }

  const handleTest = async (id: string) => {
    try {
      const token = localStorage.getItem('pulse_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      alert(data.success ? 'Test event sent!' : `Test failed: ${data.statusCode}`)
    } catch (err) {
      console.error('Failed to test webhook:', err)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const token = localStorage.getItem('pulse_token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      })
      loadWebhooks()
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
    }
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
          <Link href="/demo" className="nav-link">Proof</Link>
          <span className="nav-link active">Webhooks</span>
        </div>
        <Link href="/orchestrator/settings" className="btn-ghost">Settings</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, marginBottom: 8 }}>Webhooks</h1>
            <p style={{ color: 'var(--text2)' }}>
              Receive real-time notifications when events occur
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + Add Webhook
          </button>
        </div>

        {webhooks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
            <h3 style={{ marginBottom: 8 }}>No webhooks configured</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24 }}>
              Create a webhook to receive notifications when payments succeed or fail
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Your First Webhook
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <code style={{ fontSize: 14, color: 'var(--text)' }}>{webhook.url}</code>
                      <span className={`badge ${webhook.active ? 'badge-active' : 'badge-inactive'}`}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      {webhook.events.map((event) => (
                        <span key={event} style={{ 
                          fontSize: 11, 
                          padding: '2px 8px', 
                          background: 'var(--bg3)', 
                          borderRadius: 4,
                          color: 'var(--text2)'
                        }}>
                          {event}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Created {new Date(webhook.createdAt).toLocaleDateString()}
                      {webhook.deliveries !== undefined && (
                        <> • {webhook.deliveries} deliveries, {webhook.failures} failures</>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleTest(webhook.id)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                      Test
                    </button>
                    <button 
                      onClick={() => handleToggle(webhook.id, !webhook.active)} 
                      className="btn-ghost" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      {webhook.active ? 'Pause' : 'Enable'}
                    </button>
                    <button onClick={() => handleDelete(webhook.id)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12, color: 'var(--red)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}>
            <div className="card" style={{ maxWidth: 500, width: '100%', margin: 20 }}>
              <h2 style={{ marginBottom: 24 }}>Create Webhook</h2>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  className="input"
                  placeholder="https://your-server.com/webhook"
                />
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                  POST requests will be sent to this URL
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                  Events
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EVENT_TYPES.map((event) => (
                    <label key={event.value} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event.value] })
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(e => e !== event.value) })
                          }
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{event.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{event.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button 
                  onClick={handleCreate} 
                  disabled={saving || !newWebhook.url}
                  className="btn-primary" 
                  style={{ flex: 1 }}
                >
                  {saving ? 'Creating...' : 'Create Webhook'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documentation */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Webhook Payloads</h2>
          <div className="card">
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Webhooks are sent as POST requests with JSON body:
            </p>
            <pre style={{ 
              background: 'var(--bg3)', 
              padding: 16, 
              borderRadius: 8, 
              fontSize: 12, 
              overflow: 'auto',
              fontFamily: 'var(--mono)'
            }}>
{`{
  "type": "payment.success",
  "timestamp": "2026-04-23T12:00:00Z",
  "data": {
    "paymentId": "...",
    "workerId": "...",
    "amount": "0.009",
    "arcTxHash": "0x..."
  }
}`}
            </pre>
            
            <h3 style={{ fontSize: 14, marginTop: 24, marginBottom: 12 }}>Headers</h3>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: 'var(--text2)' }}>Header</th>
                  <th style={{ textAlign: 'left', padding: 8, color: 'var(--text2)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 8, fontFamily: 'var(--mono)' }}>X-Pulse-Signature</td>
                  <td style={{ padding: 8, color: 'var(--text2)' }}>HMAC-SHA256 signature</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, fontFamily: 'var(--mono)' }}>X-Pulse-Event</td>
                  <td style={{ padding: 8, color: 'var(--text2)' }}>Event type</td>
                </tr>
                <tr>
                  <td style={{ padding: 8, fontFamily: 'var(--mono)' }}>X-Pulse-Timestamp</td>
                  <td style={{ padding: 8, color: 'var(--text2)' }}>Event timestamp</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}