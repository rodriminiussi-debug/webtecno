'use client'

import Image from 'next/image'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useMediaQuery, usePrefersReducedMotion } from '@/hooks/use-media'
import { easeInOutCubic, segment } from '@/features/hero/choreography'

// Exploded view: the earbud comes apart into its components along a diagonal axis,
// each part labelled, then reassembles. Offsets are % of the stage.
const PARTS = [
  { src: '/parts/part-tip.webp', label: 'Almohadilla de silicona', detail: '4 tamaños incluidos', x: -34, y: -8, size: 30, rotate: -12 },
  { src: '/parts/part-mesh.webp', label: 'Micrófonos con malla acústica', detail: 'Captan tu voz, filtran el viento', x: -18, y: -30, size: 22, rotate: 8 },
  { src: '/parts/part-driver.webp', label: 'Driver de alta excursión', detail: 'Graves más profundos, sin distorsión', x: -8, y: 6, size: 28, rotate: 0 },
  { src: '/parts/part-chip.webp', label: 'Chip H2', detail: 'Audio computacional en tiempo real', x: 12, y: -20, size: 26, rotate: 6 },
  { src: '/parts/part-battery.webp', label: 'Batería', detail: 'Hasta 5 h por carga', x: 22, y: 24, size: 26, rotate: -8 },
  { src: '/parts/part-shell.webp', label: 'Carcasa y control táctil', detail: 'Resistente al agua IP57', x: 36, y: -4, size: 36, rotate: 4 },
] as const

export function ExplodedView() {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, mass: 0.35 })
  // Apart between 0.15–0.45, hold for reading, back together 0.8–0.95
  const spread = useTransform(p, (v) => (reducedMotion ? 1 : easeInOutCubic(segment(v, 0.12, 0.45)) * (1 - easeInOutCubic(segment(v, 0.8, 0.96)))))
  const budOpacity = useTransform(spread, (s) => 1 - Math.min(1, s * 2.2))
  const titleOpacity = useTransform(p, (v) => 1 - segment(v, 0.08, 0.16))
  // Portrait stage on phones: parts spread along the taller axis
  const wide = useMediaQuery('(min-width: 768px)')

  return (
    <div ref={ref} className="relative" style={{ height: reducedMotion ? 'auto' : '320svh' }}>
      <div className={reducedMotion ? 'relative py-20' : 'sticky top-0 flex h-svh items-center justify-center overflow-hidden'}>
        <motion.div className="pointer-events-none absolute inset-x-0 top-[14%] text-center" style={{ opacity: titleOpacity }}>
          <p className="label-mono text-white/50">Por dentro</p>
          <p className="mt-3 text-[clamp(1.6rem,3.4vw,3rem)] font-medium tracking-[-0.03em]">Ingeniería que no se ve. Se escucha.</p>
        </motion.div>

        <div className="relative aspect-[3/4] w-[min(96vw,70svh)] md:aspect-[16/9] md:w-[min(96vw,150svh)]">
          <AirFlow spread={spread} />
          <motion.div className="absolute inset-[22%]" style={{ opacity: budOpacity }}>
            <Image src="/hero/bud.webp" alt="AirPods 5" fill sizes="50vw" className="object-contain" />
          </motion.div>
          {PARTS.map((part, index) => (
            <Part key={part.src} part={part} index={index} spread={spread} wide={wide} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Part({ part, index, spread, wide }: { part: (typeof PARTS)[number]; index: number; spread: MotionValue<number>; wide: boolean }) {
  // Staggered: outer parts leave first, like layers peeling off
  const local = useTransform(spread, (s) => Math.min(1, Math.max(0, s * 1.25 - index * 0.04)))
  const spreadX = wide ? part.x : part.x * 0.9
  const spreadY = wide ? part.y : part.y * 1.25
  const size = wide ? part.size : part.size * 0.95
  const x = useTransform(local, (t) => `${spreadX * t}%`)
  const y = useTransform(local, (t) => `${spreadY * t}%`)
  const rotate = useTransform(local, (t) => part.rotate * t)
  const scale = useTransform(local, (t) => 0.55 + 0.45 * t)
  const opacity = useTransform(local, (t) => Math.min(1, t * 3))
  const labelOpacity = useTransform(local, (t) => Math.max(0, (t - 0.75) * 4))
  const labelBelow = part.y > 0
  // Outer layer spans the stage so the % offsets are measured against the stage
  return (
    <motion.div className="pointer-events-none absolute inset-0" style={{ x, y, opacity }}>
      <div className="absolute" style={{ width: `${size}%`, height: `${size * (wide ? 1 : 0.75)}%`, left: `${50 - size / 2}%`, top: `${50 - (size * (wide ? 1 : 0.75)) / 2}%` }}>
        <motion.div className="relative size-full" style={{ rotate, scale }}>
          <Image src={part.src} alt="" fill sizes="30vw" className="object-contain" />
        </motion.div>
        <motion.div
          className={`absolute left-1/2 w-max max-w-[26vw] -translate-x-1/2 text-center md:max-w-[40vw] ${labelBelow ? 'top-full mt-1' : 'bottom-full mb-1'}`}
          style={{ opacity: labelOpacity }}
        >
          <p className="text-[clamp(0.7rem,1.1vw,1rem)] font-medium leading-tight tracking-[-0.01em]">{part.label}</p>
          <p className="label-mono mt-1 hidden text-white/45 md:block">{part.detail}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

/** Blue lines: air and sound moving through the acoustic architecture (Apple's visual cue). */
function AirFlow({ spread }: { spread: MotionValue<number> }) {
  const opacity = useTransform(spread, (s) => Math.max(0, (s - 0.55) * 2.2))
  const length = useTransform(spread, (s) => Math.max(0, Math.min(1, (s - 0.5) * 2)))
  const paths = [
    'M10 55 C 30 40, 45 70, 60 50 S 85 35, 95 48',
    'M8 62 C 28 52, 40 80, 58 60 S 82 50, 96 58',
    'M12 48 C 32 30, 50 58, 64 40 S 86 26, 94 38',
  ]
  return (
    <motion.svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" style={{ opacity }} fill="none" aria-hidden="true">
      {paths.map((d, index) => (
        <motion.path key={index} d={d} stroke="#4fa3ff" strokeWidth={0.35} strokeLinecap="round" strokeDasharray="1.2 1.6" style={{ pathLength: length }} className="motion-safe:animate-[airflow_2.4s_linear_infinite]" />
      ))}
      <style>{`@keyframes airflow { to { stroke-dashoffset: -14 } }`}</style>
    </motion.svg>
  )
}
