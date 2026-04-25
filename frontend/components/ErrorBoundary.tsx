'use client'
import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-neutral)',
          padding: 24,
        }}>
          <div style={{
            maxWidth: 400,
            textAlign: 'center',
            padding: 32,
            background: 'var(--color-surface)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              borderRadius: 24,
              background: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 16 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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