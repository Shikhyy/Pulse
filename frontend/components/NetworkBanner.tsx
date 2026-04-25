'use client'
import { ReactNode } from 'react'

interface NetworkBannerProps {
  showNetwork?: boolean
  showDemoMode?: boolean
}

export default function NetworkBanner({ showNetwork = true, showDemoMode = true }: NetworkBannerProps) {
  const isDemo = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('demo') === 'true'
  
  const show = showNetwork || showDemoMode || isDemo
  
  if (!show) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      display: 'flex',
      gap: 1,
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
    }}>
      {showNetwork && (
        <div style={{
          flex: 1,
          padding: '6px 12px',
          background: 'var(--color-primary)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ opacity: 0.7 }}>Network:</span>
          <span>Arc Testnet</span>
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: '#00e5a0',
            boxShadow: '0 0 8px #00e5a0'
          }} />
        </div>
      )}
      {(showDemoMode || isDemo) && (
        <div style={{
          flex: 1,
          padding: '6px 12px',
          background: 'var(--color-warning)',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span style={{ opacity: 0.7 }}>Mode:</span>
          <span style={{ fontWeight: 600 }}>{isDemo ? 'DEMO' : 'STUB'}</span>
          <span style={{ opacity: 0.7 }}>| Nanopayments simulated</span>
        </div>
      )}
    </div>
  )
}

export function NetworkStatus() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 6,
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#00e5a0',
        boxShadow: '0 0 8px #00e5a0',
      }} />
      <span style={{ color: 'var(--color-text)' }}>Arc Testnet</span>
      <span style={{ color: 'var(--color-muted)' }}>●</span>
      <span style={{ color: 'var(--color-muted)' }}>Chain 5042002</span>
    </div>
  )
}

interface StatusBadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info'
}

export function StatusBadge({ children, variant = 'info' }: StatusBadgeProps) {
  const colors = {
    success: { bg: '#00e5a0', color: '#000' },
    warning: { bg: 'var(--color-warning)', color: '#000' },
    error: { bg: 'var(--color-danger)', color: '#fff' },
    info: { bg: 'var(--color-primary)', color: '#fff' },
  }
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      background: colors[variant].bg,
      color: colors[variant].color,
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase',
    }}>
      {variant === 'success' && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      )}
      {children}
    </span>
  )
}