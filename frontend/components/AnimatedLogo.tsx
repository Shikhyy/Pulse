'use client'
import { useEffect, useState } from 'react'

interface AnimatedLogoProps {
  size?: number
  animated?: boolean
  showDot?: boolean
}

export default function AnimatedLogo({ size = 40, animated = true, showDot = true }: AnimatedLogoProps) {
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    if (!animated) return
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 2)
    }, 1500)
    return () => clearInterval(interval)
  }, [animated])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{
        width: size,
        height: size * 0.6,
        background: 'linear-gradient(135deg, #E87F24 0%, #FFC81E 50%, #E87F24 100%)',
        borderRadius: size * 0.15,
        position: 'relative',
        overflow: 'hidden',
        transform: animated ? `scaleY(${1 + pulse * 0.05})` : undefined,
        transition: 'transform 0.3s ease',
        boxShadow: pulse ? `0 0 ${size * 0.3}px rgba(232, 127, 36, 0.4)` : `0 2px 8px rgba(232, 127, 36, 0.2)`,
      }}>
        {/* Pulse wave effect */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '80%',
          height: '60%',
          borderRadius: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          animation: animated ? 'shimmer 2s ease-in-out infinite' : 'none',
        }} />
      </div>
      {showDot && (
        <div style={{
          width: size * 0.15,
          height: size * 0.15,
          background: '#E87F24',
          borderRadius: '50%',
          boxShadow: animated ? `0 0 ${size * 0.2}px rgba(232, 127, 36, ${0.5 + pulse * 0.5})` : `0 0 ${size * 0.2}px rgba(232, 127, 36, 0.5)`,
          animation: animated ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
        }} />
      )}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}