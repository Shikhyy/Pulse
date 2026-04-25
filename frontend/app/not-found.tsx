import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-neutral)',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 72, fontWeight: 700, marginBottom: 8, color: 'var(--color-primary)' }}>404</h1>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Page not found</h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24 }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}