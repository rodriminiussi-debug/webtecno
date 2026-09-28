'use client'

import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect } from 'react'
import { useMediaQuery } from '@/hooks/use-media'
import { cn } from '@/lib/cn'
import { TIMELINE, easeInOutCubic, segment } from './choreography'

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Cinematic image sequence: each frame is a photographic render of one moment
 * (closed case → open → lifting out → close-up). Scroll crossfades between them
 * while a slow camera push, pointer tilt and idle float sell the depth.
 */
export function HeroSequence({
  frames,
  alt,
  progress,
  side,
  dark,
}: {
  frames: string[]
  alt: string
  progress: MotionValue<number>
  side: number
  dark: boolean
}) {
  // Pointer tilt, smoothed with a spring so it feels physical rather than twitchy
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(useTransform(pointerX, (x) => x * 7), { stiffness: 60, damping: 18 })
  const rotateX = useSpring(useTransform(pointerY, (y) => -y * 5), { stiffness: 60, damping: 18 })

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [pointerX, pointerY])

  // The product starts to the side of the copy and glides to center as the story begins.
  // On phones the copy sits below the product, so there is no side offset.
  const wide = useMediaQuery('(min-width: 768px)')
  const offset = useMotionValue(0)
  useEffect(() => offset.set(wide ? side : 0), [offset, wide, side])
  const x = useTransform([progress, offset], ([p, o]: number[]) => `${o * 24 * (1 - easeInOutCubic(segment(p, ...TIMELINE.recenter)))}vw`)
  // Slow camera push-in across the whole story, then a gentle settle for the finale
  const scale = useTransform(progress, (p) => 1 + 0.16 * easeInOutCubic(segment(p, 0.3, 0.86)) - 0.14 * easeInOutCubic(segment(p, TIMELINE.finale[0], 1)))
  const y = useTransform(progress, (p) => `${-3 * easeInOutCubic(segment(p, 0.5, 0.86)) - 9 * easeInOutCubic(segment(p, TIMELINE.finale[0], 1))}%`)
  const glow = useTransform(progress, (p) => 0.55 + 0.45 * segment(p, 0.2, 0.7))

  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-[calc(var(--header-h)+2vh)] md:items-center md:pt-0" aria-hidden="true">
      <motion.div
        className="relative aspect-square w-[min(94vw,62svh)] md:w-[min(52vw,82svh)]"
        style={{ x, y, scale }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: EASE, delay: 0.15 }}
      >
        {/* Studio key light behind the product */}
        <motion.div
          className="absolute inset-[-12%] rounded-full"
          style={{
            opacity: glow,
            background: dark
              ? 'radial-gradient(closest-side, rgba(255,255,255,0.13), rgba(255,255,255,0.04) 55%, transparent 75%)'
              : 'radial-gradient(closest-side, rgba(255,255,255,0.9), rgba(255,255,255,0.3) 55%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0 [perspective:1400px]">
          <motion.div className="relative size-full [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
            <div className="relative size-full motion-safe:animate-[hero-float_7s_var(--ease-in-out)_infinite]">
              {frames.map((src, index) => (
                <Frame key={`${src}-${index}`} src={src} alt={index === 0 ? alt : ''} index={index} count={frames.length} progress={progress} />
              ))}
            </div>
          </motion.div>
        </div>
        {/* Contact shadow grounds the object without a visible floor */}
        <div className={cn('absolute bottom-[4%] left-1/2 h-[6%] w-[46%] -translate-x-1/2 rounded-[50%] blur-2xl', dark ? 'bg-black/60' : 'bg-black/15')} />
      </motion.div>
      <style>{`@keyframes hero-float { 0%,100% { transform: translate3d(0,0,0) } 50% { transform: translate3d(0,-1.4%,0) } }`}</style>
    </div>
  )
}

function Frame({ src, alt, index, count, progress }: { src: string; alt: string; index: number; count: number; progress: MotionValue<number> }) {
  // Frames share the 0.08 → 0.9 range evenly, overlapping so crossfades never show an empty stage
  const span = 0.82 / count
  const start = 0.08 + index * span
  const end = start + span
  // Short crossfades: long overlaps read as a double exposure instead of a cut between moments
  const fade = 0.035
  const opacity = useTransform(progress, (p) => {
    const fadeIn = index === 0 ? 1 : segment(p, start - fade, start + fade)
    const fadeOut = index === count - 1 ? 1 : 1 - segment(p, end - fade, end + fade)
    return Math.min(fadeIn, fadeOut)
  })
  // Each frame grows slightly while visible, so still images keep moving; the incoming
  // frame starts a touch smaller, which reads as the object settling into the new pose
  const scale = useTransform(progress, (p) => 0.96 + 0.06 * segment(p, start - fade, end + fade))
  return (
    <motion.div className="absolute inset-0 will-change-transform" style={{ opacity, scale }}>
      <Image src={src} alt={alt} fill sizes="(min-width: 768px) 52vw, 94vw" priority={index < 2} loading={index < 2 ? undefined : 'eager'} className="object-contain" />
    </motion.div>
  )
}
