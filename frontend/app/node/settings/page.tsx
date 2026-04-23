'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'worker' | 'employer'
  walletAddress?: string
  createdAt: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [name, setName] = useState('')
  const [notifications, setNotifications] = useState({
    email: true,
    payments: true,
    budget: true,
  })

  useEffect(() => {
    const storedToken = localStorage.getItem('pulse_token')
    const storedUser = localStorage.getItem('pulse_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setName(parsedUser.name || '')
    } else {
      router.push('/node/login')
    }
    setLoading(false)
  }, [router])

  const handleSave = async () => {
    if (!token) return
    
    setSaving(true)
    setSuccess(false)
    
    try {
      // In a real app, this would call an API to update the user
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedUser = { ...user!, name }
      localStorage.setItem('pulse_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to save:', err)
    }
    
    setSaving(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('pulse_token')
    localStorage.removeItem('pulse_user')
    router.push('/')
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
          <Link href="/node/session" className="nav-link">Dashboard</Link>
          <Link href="/demo" className="nav-link">Proof</Link>
          <span className="nav-link active">Settings</span>
        </div>
        <button onClick={handleLogout} className="btn-ghost" style={{ padding: '8px 16px' }}>
          Logout
        </button>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Settings</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 40 }}>
          Manage your account and preferences
        </p>

        {/* Profile Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👤</span> Profile
          </h2>
          
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter your name"
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input"
                style={{ opacity: 0.6 }}
              />
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                Email cannot be changed
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Account Type
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${user?.role === 'employer' ? 'badge-warning' : 'badge-active'}`}>
                  {user?.role === 'employer' ? 'Employer' : 'Worker'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Wallet Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>👛</span> Wallet
          </h2>
          
          <div className="card">
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Connected Wallet Address
              </label>
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--bg3)', 
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 13,
                wordBreak: 'break-all',
                color: user?.walletAddress ? 'var(--teal)' : 'var(--text3)'
              }}>
                {user?.walletAddress || 'No wallet connected'}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🔔</span> Notifications
          </h2>
          
          <div className="card">
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'payments', label: 'Payment Alerts', desc: 'Get notified for each payment' },
              { key: 'budget', label: 'Budget Warnings', desc: 'Alert when budget reaches 80%' },
            ].map((item) => (
              <div key={item.key} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: notifications[item.key as keyof typeof notifications] ? 'var(--teal)' : 'var(--bg3)',
                    borderRadius: 24,
                    transition: '0.3s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: 18,
                      width: 18,
                      left: notifications[item.key as keyof typeof notifications] ? 22 : 3,
                      bottom: 3,
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Network Info */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⛓</span> Network
          </h2>
          
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Network</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>Arc Testnet</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Chain ID</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4, fontFamily: 'var(--mono)' }}>5042002</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>USDC Address</div>
                <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4, fontFamily: 'var(--mono)', wordBreak: 'break-all' }}>
                  0x3600...0000
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Protocol</div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>x402 v2</div>
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary"
            style={{ minWidth: 120 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          {success && (
            <span style={{ color: 'var(--teal)', fontSize: 14 }}>✓ Saved successfully!</span>
          )}
        </div>

        {/* Danger Zone */}
        <section style={{ marginTop: 60, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, color: 'var(--red)' }}>Danger Zone</h2>
          
          <div className="card" style={{ borderColor: 'var(--red)', opacity: 0.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>Delete Account</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Permanently delete your account and all data</div>
              </div>
              <button className="btn-ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}