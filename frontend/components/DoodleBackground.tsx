'use client'

import { useEffect, useRef } from 'react'

const COLORS = {
  teal: '#E87F24',
  blue: '#73A5CA',
  amber: '#FFC81E',
}

interface DoodleElement {
  x: number
  y: number
  size: number
  color: string
  opacity: number
  rotate: number
  wobbleSpeed: number
  floatSpeed: number
  floatAmp: number
}

export default function DoodleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const elements: DoodleElement[] = [
      { x: 0.15, y: 0.2, size: 80, color: COLORS.teal, opacity: 0.12, rotate: 0, wobbleSpeed: 0.0003, floatSpeed: 8, floatAmp: 25 },
      { x: 0.75, y: 0.3, size: 120, color: COLORS.blue, opacity: 0.1, rotate: 45, wobbleSpeed: 0.00025, floatSpeed: 12, floatAmp: 20 },
      { x: 0.5, y: 0.7, size: 60, color: COLORS.amber, opacity: 0.08, rotate: 15, wobbleSpeed: 0.00035, floatSpeed: 10, floatAmp: 15 },
      { x: 0.85, y: 0.75, size: 100, color: COLORS.teal, opacity: 0.08, rotate: -20, wobbleSpeed: 0.0002, floatSpeed: 14, floatAmp: 18 },
      { x: 0.25, y: 0.6, size: 40, color: COLORS.blue, opacity: 0.06, rotate: 30, wobbleSpeed: 0.0004, floatSpeed: 9, floatAmp: 12 },
    ]

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    const resize = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)
    }

    window.addEventListener('resize', resize)
    resize()

    const drawDoodleCircle = (
      cx: number,
      cy: number,
      radius: number,
      color: string,
      alpha: number,
      rotation: number,
      time: number
    ) => {
      ctx.strokeStyle = color
      ctx.globalAlpha = alpha
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'

      const segments = 6
      const wobble = Math.sin(time * 0.001) * 2

      ctx.beginPath()
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + (rotation * Math.PI) / 180
        const r = radius + (i % 2 === 0 ? 0 : wobble)
        const x1 = cx + Math.cos(angle) * r
        const y1 = cy + Math.sin(angle) * r
        
        if (i === 0) {
          ctx.moveTo(x1, y1)
        } else {
          const prevAngle = ((i - 1) / segments) * Math.PI * 2 + (rotation * Math.PI) / 180
          const prevR = radius + ((i - 1) % 2 === 0 ? 0 : wobble)
          const prevX = cx + Math.cos(prevAngle) * prevR
          const prevY = cy + Math.sin(prevAngle) * prevR
          
          const cpx = prevX + (x1 - prevX) * 0.5 + (Math.random() - 0.5) * 3
          const cpy = prevY + (y1 - prevY) * 0.5 + (Math.random() - 0.5) * 3
          ctx.quadraticCurveTo(cpx, cpy, x1, y1)
        }
      }
      ctx.closePath()
      ctx.stroke()
    }

    const drawConnectorLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      time: number
    ) => {
      const midX = (x1 + x2) / 2 + Math.sin(time * 0.0005) * 20
      const midY = (y1 + y2) / 2 + Math.cos(time * 0.0003) * 15

      ctx.strokeStyle = color
      ctx.globalAlpha = 0.06
      ctx.lineWidth = 1
      ctx.setLineDash([8, 4])
      ctx.lineDashOffset = -time * 0.02

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(midX, midY, x2, y2)
      ctx.stroke()

      ctx.setLineDash([])
    }

    const drawSquiggles = (count: number, time: number) => {
      for (let i = 0; i < count; i++) {
        const baseX = ((i * 137.5 + time * 0.01) % w)
        const baseY = ((i * 97.3 + time * 0.015) % h)
        const size = 8 + (i % 5) * 4

        ctx.strokeStyle = i % 2 === 0 ? COLORS.teal : COLORS.blue
        ctx.globalAlpha = 0.04 + (i % 3) * 0.02
        ctx.lineWidth = 1

        ctx.beginPath()
        ctx.moveTo(baseX, baseY)
        for (let j = 0; j < 3; j++) {
          const sx = baseX + size * (j + 1) * 0.5
          const sy = baseY + Math.sin(time * 0.002 + i) * size * 0.3
          ctx.quadraticCurveTo(sx, sy - 5, sx, sy)
        }
        ctx.stroke()
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      timeRef.current += 1
      const t = timeRef.current

      targetX += (mouseX - targetX) * 0.03
      targetY += (mouseY - targetY) * 0.03

      elements.forEach(el => {
        const floatOffset = Math.sin(t * 0.001 * el.floatSpeed) * el.floatAmp
        const cx = el.x * w + targetX * 40
        const cy = el.y * h + floatOffset + targetY * 40

        drawDoodleCircle(
          cx,
          cy,
          el.size,
          el.color,
          el.opacity,
          el.rotate + Math.sin(t * el.wobbleSpeed) * 5,
          t
        )

        const innerSize = el.size * 0.6
        drawDoodleCircle(
          cx + targetX * 10,
          cy + targetY * 10,
          innerSize,
          el.color,
          el.opacity * 0.5,
          -el.rotate * 0.5,
          t * 0.8
        )
      })

      if (elements.length >= 2) {
        drawConnectorLine(
          elements[0].x * w + targetX * 40,
          elements[0].y * h + targetY * 40,
          elements[1].x * w + targetX * 40,
          elements[1].y * h + targetY * 40,
          COLORS.teal,
          t
        )
        drawConnectorLine(
          elements[2].x * w + targetX * 40,
          elements[2].y * h + targetY * 40,
          elements[4].x * w + targetX * 40,
          elements[4].y * h + targetY * 40,
          COLORS.blue,
          t
        )
      }

      drawSquiggles(12, t)

      frameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

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
        zIndex: 0,
      }}
    />
  )
}