'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useEmployerStore } from '@/lib/store'

export default function EmployerLoginPage() {
  const router = useRouter()
  const setUser = useEmployerStore((s) => s.setUser)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data: any = await api.login(form)
      if (data.user.role !== 'employer') throw new Error('Not an employer account')
      setUser(data.user, data.token, data.employer)
      router.push('/orchestrator')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-text)', marginBottom: 8 }}>pulse</div>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Orchestrator login</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>Monitor your compute nodes in real time</p>
        </div>
        <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Email</label>
              <input className="input" id="emp-login-email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
              <input className="input" id="emp-login-password" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="emp-login-submit">
              {loading ? 'Logging in…' : 'Log in →'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--color-muted)' }}>
            No account?{' '}
            <Link href="/orchestrator/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
