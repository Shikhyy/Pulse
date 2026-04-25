'use client'

import { ReactNode } from 'react'

export interface IconProps {
  name: 'shield-lock' | 'zap' | 'card' | 'check' | 'arrow' | 'clock' | 'dollar'
  size?: number
  color?: string
  className?: string
}

const icons: Record<string, (size: number, color: string) => ReactNode> = {
  'shield-lock': (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  zap: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  card: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
      <path d="M5 15c0 1.1 2.24 2 5 2s5-.9 5-2" opacity="0.5" />
    </svg>
  ),
  check: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  arrow: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  clock: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 16" />
    </svg>
  ),
  dollar: (s, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
}

export default function Icon({ name, size = 32, color = 'currentColor', className }: IconProps) {
  const icon = icons[name]
  if (!icon) return null
  
  return (
    <span className={className} style={{ display: 'inline-flex', color }}>
      {icon(size, color)}
    </span>
  )
}

export function IconShieldLock(props: IconProps) {
  return <Icon {...props} name="shield-lock" />
}

export function IconZap(props: IconProps) {
  return <Icon {...props} name="zap" />
}

export function IconCard(props: IconProps) {
  return <Icon {...props} name="card" />
}

export function IconCheck(props: IconProps) {
  return <Icon {...props} name="check" />
}

export function IconArrow(props: IconProps) {
  return <Icon {...props} name="arrow" />
}

export function IconClock(props: IconProps) {
  return <Icon {...props} name="clock" />
}

export function IconDollar(props: IconProps) {
  return <Icon {...props} name="dollar" />
}