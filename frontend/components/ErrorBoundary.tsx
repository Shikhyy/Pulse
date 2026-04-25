'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
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
          background: 'var(--bg)',
          padding: 24,
        }}>
          <div style={{
            maxWidth: 400,
            textAlign: 'center',
          }}>
            <div style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              borderRadius: 32,
              background: 'var(--red-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
            }}>
              ⚠
            </div>
            <h2 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 8,
              color: 'var(--text)',
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--text2)',
              marginBottom: 24,
            }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'var(--teal)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
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

export function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Critical Error</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{error.message}</p>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            background: 'var(--teal)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export function NotFound({
  title = 'Page not found',
  message = "This page doesn't exist.",
  showHome = true,
}: {
  title?: string
  message?: string
  showHome?: boolean
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 72,
          fontWeight: 700,
          color: 'var(--border)',
          marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{title}</h1>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>{message}</p>
        {showHome && (
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--teal)',
              color: '#000',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Go Home
          </a>
        )}
      </div>
    </div>
  )
}