'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useWorkerStore } from '@/lib/store'
import { AuthLayout } from '../signup/page'

export default function WorkerLoginPage() {
  const router = useRouter()
  const setUser = useWorkerStore((s) => s.setUser)
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data: any = await api.login(form)
      if (data.user.role !== 'worker') throw new Error('Not a worker account')
      setUser(data.user, data.token)
      router.push('/worker')
    } catch (err: any) {
      setError(err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Worker login" subtitle="Clock in to start earning">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>Email</label>
          <input className="input" id="login-email" type="email" placeholder="priya@work.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>Password</label>
          <input className="input" id="login-password" type="password" placeholder="••••••••" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>

        {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="login-submit">
          {loading ? 'Logging in…' : 'Log in →'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-muted)' }}>
        No account?{' '}
        <Link href="/worker/signup" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
          Sign up
        </Link>
      </div>
    </AuthLayout>
  )
}
