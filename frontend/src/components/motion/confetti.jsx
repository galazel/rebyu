import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { useReducedMotion } from "@/components/motion/rebyu-motion.jsx"


const COLORS = ["#2f6b4f", "#e9b949", "#c8553d", "#8a5a33", "#8b5f7d", "#4f8a78", "#f4f1e8"]

const PARTICLE_COUNT = 90
const GRAVITY = 0.32
const DRAG = 0.987
const FADE_AFTER_MS = 1100
const MAX_LIFE_MS = 2600

function createParticles(width, height) {
  const particles = []

  for (let index = 0; index < PARTICLE_COUNT; index += 1) {
    const fromLeft = index % 2 === 0
    const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9
    const speed = 13 + Math.random() * 11

    particles.push({
      x: fromLeft ? width * 0.08 : width * 0.92,
      y: height * 0.98,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.34,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })
  }

  return particles
}

export function Confetti({ fire }) {
  const canvasRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!fire || reduced) {
      return undefined
    }

    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!context) {
      return undefined
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    context.scale(ratio, ratio)

    const particles = createParticles(width, height)
    const startedAt = performance.now()
    let frame = 0

    function draw(now) {
      const elapsed = now - startedAt
      context.clearRect(0, 0, width, height)

      const fade = elapsed <= FADE_AFTER_MS
        ? 1
        : Math.max(0, 1 - (elapsed - FADE_AFTER_MS) / (MAX_LIFE_MS - FADE_AFTER_MS))

      for (const particle of particles) {
        particle.vy += GRAVITY
        particle.vx *= DRAG
        particle.vy *= DRAG
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.spin

        context.save()
        context.globalAlpha = fade
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        context.fillRect(-particle.w / 2, -particle.h / 2, particle.w, particle.h)
        context.restore()
      }

      if (elapsed < MAX_LIFE_MS) {
        frame = requestAnimationFrame(draw)
      } else {
        context.clearRect(0, 0, width, height)
      }
    }

    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
    }
  }, [fire, reduced])

  if (!fire || reduced || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] size-full"
    />,
    document.body
  )
}

export default Confetti
