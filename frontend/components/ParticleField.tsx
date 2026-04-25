'use client'
import { useEffect, useRef, useState } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface ParticleFieldProps {
  count?: number
  color?: string
}

export default function ParticleField({ count = 50, color = '#E87F24' }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const particles = useRef<Particle[]>([])
  const frameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return
    
    const init = () => {
      particles.current = Array.from({ length: count }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
      }))
    }
    init()
  }, [dimensions, count])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !dimensions.width) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      particles.current.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = dimensions.width
        if (p.x > dimensions.width) p.x = 0
        if (p.y < 0) p.y = dimensions.height
        if (p.y > dimensions.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = p.opacity
        ctx.fill()

        // Connect nearby particles
        particles.current.slice(i + 1).forEach((p2) => {
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = color
            ctx.globalAlpha = (1 - dist / 100) * 0.1
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      frameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [dimensions, color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}