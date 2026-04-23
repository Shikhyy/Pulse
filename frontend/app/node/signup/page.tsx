'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useWorkerStore } from '@/lib/store'

export default function WorkerSignupPage() {
  const router = useRouter()
  const setUser = useWorkerStore((s) => s.setUser)
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data: any = await api.signupWorker(form)
      setUser(data.user, data.token)
      router.push('/node')
    } catch (err: any) {
      setError(err.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Join as a Compute Node" subtitle="Start getting paid per inference">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Your name">
          <input className="input" id="signup-name" placeholder="Priya K." value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Email">
          <input className="input" id="signup-email" type="email" placeholder="priya@work.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password">
          <input className="input" id="signup-password" type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Field label="Invite code (from your orchestrator)">
          <input className="input" id="signup-invite" placeholder="Leave blank for demo" value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })} />
        </Field>

        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="signup-submit">
              {loading ? 'Creating account…' : 'Create Compute Node →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-muted)' }}>
        Already have an account?{' '}
        <Link href="/node/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Log in
        </Link>
      </div>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-neutral)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 24, color: 'var(--color-text)', marginBottom: 8 }}>pulse</div>
          </Link>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>{title}</h1>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: 0 }}>{subtitle}</p>
        </div>
        <div className="card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
