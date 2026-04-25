'use client'

import { Component, ReactNode } from 'react'
import NetworkBanner from '../components/NetworkBanner'
import ToastContainer from '../components/Toast'
import { ErrorBoundary as EB, GlobalError } from '../components/ErrorBoundary'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <EB>
      <NetworkBanner showNetwork showDemoMode />
      <ToastContainer />
      {children}
    </EB>
  )
}

export function ErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return <EB fallback={fallback}>{children}</EB>
}

export { GlobalError }

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
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>{title}</h1>
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