'use client'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FEFDDF',
          padding: 24,
        }}>
          <div style={{
            maxWidth: 400,
            textAlign: 'center',
            padding: 32,
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #E5E5E5',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Application Error
            </h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              {error.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 20px',
                background: '#E87F24',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}