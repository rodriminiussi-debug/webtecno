'use client'

import { motion, useMotionValue, useMotionValueEvent, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'
import { useMediaQuery } from '@/hooks/use-media'
import { IntelligenceGlow } from '@/components/intelligence-glow'
import { easeInOutCubic, segment, window01 } from './choreography'

// Rendered in Blender from Apple's AirPods model (scripts/render/film.py): closed case,
// lid opens, the earbuds rise, the case falls away, the pair turns to camera.
// Square frames on pure black, scrubbed by scroll like Apple's own product pages.
export const FILM_FRAMES = 200
export const filmFrame = (index: number) => `/film/hero/${String(index + 1).padStart(4, '0')}.webp`

export const FILM = {
  copyOut: [0.02, 0.08],
  callouts: [
    [0.14, 0.3],
    [0.34, 0.5],
    [0.54, 0.7],
    [0.72, 0.84],
  ],
  glow: [0.52, 0.74],
  finale: 0.88,
} as const

// Coarse-to-fine loading: any scroll position has a nearby frame early on
function loadOrder(count: number) {
  const order: number[] = []
  const seen = new Set<number>()
  for (let step = 16; step >= 1; step /= 2) {
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i)
        order.push(i)
      }
    }
  }
  return order
}

export function HeroFilm({ progress, side }: { progress: MotionValue<number>; side: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<(HTMLImageElement | null)[]>(Array.from({ length: FILM_FRAMES }, () => null))
  const currentRef = useRef(0)
  const rafRef = useRef(0)
  // Wheel steps become continuous motion
  const p = useSpring(progress, { stiffness: 120, damping: 30, mass: 0.3 })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const frames = framesRef.current
    const target = currentRef.current
    // Nearest frame that has arrived
    let image: HTMLImageElement | null = null
    for (let distance = 0; distance < FILM_FRAMES && !image; distance++) {
      image = frames[target - distance] ?? frames[target + distance] ?? null
    }
    if (!image) return
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }, [])

  const schedule = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(draw)
  }, [draw])

  useMotionValueEvent(p, 'change', (value) => {
    const index = Math.round(Math.min(1, Math.max(0, value)) * (FILM_FRAMES - 1))
    if (index === currentRef.current) return
    currentRef.current = index
    schedule()
  })

  // Canvas resolution follows its box and the screen density
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const size = Math.min(1080, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)))
      if (canvas.width !== size) {
        canvas.width = size
        canvas.height = size
      }
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  useEffect(() => {
    let cancelled = false
    const frames = framesRef.current
    const load = (index: number) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
          if (!cancelled) {
            frames[index] = image
            if (Math.abs(index - currentRef.current) < 3 || index === 0) schedule()
          }
          resolve()
        }
        image.onerror = () => resolve()
        image.src = filmFrame(index)
      })

    const queue = loadOrder(FILM_FRAMES)
    const worker = async () => {
      while (!cancelled && queue.length > 0) {
        const index = queue.shift()
        if (index !== undefined) await load(index)
      }
    }
    // First frame right away, the rest a moment later so the page settles first
    let timer = 0
    void load(queue.shift() ?? 0).then(() => {
      if (cancelled) return
      timer = window.setTimeout(() => {
        for (let i = 0; i < 6; i++) void worker()
      }, 300)
    })
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [schedule])

  const wide = useMediaQuery('(min-width: 768px)')
  const offset = useMotionValue(0)
  useEffect(() => offset.set(wide ? side : 0), [offset, wide, side])
  const x = useTransform([p, offset], ([v, o]: number[]) => `${o * 18 * (1 - easeInOutCubic(segment(v, 0.02, 0.12)))}vw`)
  // Makes room for the closing title
  const finale = useTransform(p, (v) => easeInOutCubic(segment(v, FILM.finale - 0.04, FILM.finale + 0.06)))
  // Phones: the product sits in the middle of the square frame, so it can be shown larger
  const scale = useTransform(finale, (t) => (wide ? 1 - 0.34 * t : 1.32 - 0.22 * t))
  const y = useTransform(finale, (t) => `${(wide ? -17 : -4) * t}%`)
  const glowOpacity = useTransform(p, (v) => window01(v, FILM.glow[0], FILM.glow[1], 0.06))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 flex items-start justify-center pt-[calc(var(--header-h)+6svh)] md:items-center md:pt-0">
        <motion.div
          className="relative aspect-square w-[min(100vw,70svh)] md:w-[min(100vw,100svh)]"
          style={{ x, y, scale }}
          // Emerges from darkness
          initial={{ opacity: 0, filter: 'brightness(0.05)' }}
          animate={{ opacity: 1, filter: 'brightness(1)' }}
          transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Apple Intelligence colours, seen through the black of the frames */}
          <motion.div className="absolute inset-[12%]" style={{ opacity: glowOpacity }}>
            <IntelligenceGlow className="size-full" />
          </motion.div>
          {/* The case dissolves as it falls instead of hitting the frame edge */}
          <canvas ref={canvasRef} className="relative size-full mix-blend-screen [mask-image:linear-gradient(to_bottom,black_78%,transparent_98%)]" />
        </motion.div>
      </div>
    </div>
  )
}
