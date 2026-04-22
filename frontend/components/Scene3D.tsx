'use client'

import { useEffect, useRef } from 'react'

const project = (x: number, y: number, z: number, fov = 400, cx: number, cy: number) => {
  const scale = fov / (fov + z)
  return { x: cx + x * scale, y: cy + y * scale, s: scale }
}

const drawWireCube = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rotX: number, rotY: number, color: string, alpha: number) => {
  const pts = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1]
  ]

  const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX)

  const proj = pts.map(p => {
    const x1 = p[0] * cosY - p[2] * sinY
    const z1 = p[0] * sinY + p[2] * cosY
    const y2 = p[1] * cosX - z1 * sinX
    const z2 = p[1] * sinX + z1 * cosX
    return project(x1 * size, y2 * size, z2 * size + 300, 600, cx, cy)
  })

  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1
  ctx.beginPath()

  const connect = (i: number, j: number) => {
    ctx.moveTo(proj[i].x, proj[i].y)
    ctx.lineTo(proj[j].x, proj[j].y)
  }

  // Back face
  connect(0, 1); connect(1, 2); connect(2, 3); connect(3, 0)
  // Front face
  connect(4, 5); connect(5, 6); connect(6, 7); connect(7, 4)
  // Connectors
  connect(0, 4); connect(1, 5); connect(2, 6); connect(3, 7)

  ctx.stroke()
}

const drawTorus = (ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, r: number, rot: number, color: string, alpha: number) => {
  const segments = 40
  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = 1
  ctx.beginPath()

  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2 + rot
    const x1 = Math.cos(a) * R
    const z1 = Math.sin(a) * R
    const y1 = Math.sin(a * 4) * r
    const p = project(x1, y1, z1 + 300, 600, cx, cy)
    if (i === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()
}

export default function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0
    let t = 0
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1
      mouseY = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.0002 + 0.00005,
      opacity: Math.random() * 0.4 + 0.1,
    }))

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

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      t += 0.005
      
      // Smooth interpolation for mouse parallax
      targetX += (mouseX - targetX) * 0.05
      targetY += (mouseY - targetY) * 0.05

      // Wireframe cubes with parallax offset
      drawWireCube(ctx, w * 0.8 + targetX * 100, h * 0.25 + targetY * 100, 55, t, t * 1.2, '#00e5a0', 0.25)
      drawWireCube(ctx, w * 0.15 + targetX * -80, h * 0.7 + targetY * -80, 35, -t * 1.1, t * 0.9, '#3b82f6', 0.18)
      drawWireCube(ctx, w * 0.5 + targetX * 40, h * 0.85 + targetY * 40, 25, t * 1.5, -t, '#00e5a0', 0.1)

      // Torus rings with Parallax 
      drawTorus(ctx, w * 0.7 + targetX * 120, h * 0.15 + targetY * 120, 80, 28, -t * 0.8, '#00e5a0', 0.15)
      drawTorus(ctx, w * 0.2 + targetX * -60, h * 0.6 + targetY * -60, 55, 18, t * 1.1, '#3b82f6', 0.1)

      // Particles
      particles.forEach(p => {
        p.y -= p.speed
        
        // Slight interaction sway based on mouse target
        const sway = targetX * 0.001 * (p.size)
        p.x += sway

        if (p.x < 0) p.x += 1
        if (p.x > 1) p.x -= 1

        if (p.y < 0) {
          p.y = 1
          p.x = Math.random()
        }

        const px = p.x * w
        const py = p.y * h

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,229,160,${p.opacity})`
        ctx.fill()
      })

      // Connecting lines
      for (let i = 0; i < particles.length; i += 3) {
        for (let j = i + 1; j < particles.length; j += 3) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = p1.x * w - p2.x * w
          const dy = p1.y * h - p2.y * h
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p1.x * w, p1.y * h)
            ctx.lineTo(p2.x * w, p2.y * h)
            ctx.strokeStyle = `rgba(0,229,160,${0.06 * (1 - dist / 150)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

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
        zIndex: 1
      }}
    />
  )
}
