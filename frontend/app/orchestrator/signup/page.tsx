'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useEmployerStore } from '@/lib/store'

export default function EmployerSignupPage() {
  const router = useRouter()
  const setUser = useEmployerStore((s) => s.setUser)
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', dailyCap: 50 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data: any = await api.signupEmployer(form)
      setUser(data.user, data.token, data.employer)
      router.push('/orchestrator')
    } catch (err: any) {
      setError(err.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-text)', marginBottom: 8 }}>pulse</div>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Deploy Orchestrator</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>Pay your freelancers in real-time</p>
        </div>

        <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'name', label: 'Your name', type: 'text', placeholder: 'John Smith' },
              { key: 'email', label: 'Work email', type: 'email', placeholder: 'john@company.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
              { key: 'companyName', label: 'Company name', type: 'text', placeholder: 'Acme Inc.' },
            ].map((f) => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>
                  {f.label}
                </label>
                <input
                  className="input"
                  id={`emp-${f.key}`}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                />
              </div>
            ))}

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>
                Daily budget cap ($)
              </label>
              <input className="input" id="emp-dailyCap" type="number" min={1} max={1000} step={1}
                value={form.dailyCap}
                onChange={(e) => setForm({ ...form, dailyCap: Number(e.target.value) })} />
              <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
                Payments auto-pause when this limit is reached
              </p>
            </div>

            {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="emp-signup-submit">
              {loading ? 'Creating account…' : 'Deploy Orchestrator →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--color-muted)' }}>
            Already have an account?{' '}
            <Link href="/orchestrator/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
