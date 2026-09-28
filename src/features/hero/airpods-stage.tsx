'use client'

import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect } from 'react'
import { useMediaQuery } from '@/hooks/use-media'
import { easeInOutCubic, lerp, segment } from './choreography'
import { IntelligenceGlow } from '@/components/intelligence-glow'

// Apple-style launch film, scrubbed by scroll. Structure follows Apple's AirPods
// reveal: the case emerges from black, opens, the earbuds lift out and the case
// falls away; then title cards alternate with macro shots, and the earbuds fly
// past the camera before the final title.

export const FILM = {
  open: [0.04, 0.1],
  rise: [0.1, 0.2],
  caseAway: [0.15, 0.26],
  // Title card → shot, four times
  scenes: [
    { card: [0.27, 0.34], shot: [0.33, 0.45] },
    { card: [0.45, 0.51], shot: [0.5, 0.62] },
    { card: [0.62, 0.68], shot: [0.67, 0.78] },
    { card: [0.78, 0.84], shot: [0.83, 0.91] },
  ],
  flyOut: [0.9, 0.95],
  finale: 0.94,
} as const

const EASE = [0.16, 1, 0.3, 1] as const
const SIZES = '(min-width: 768px) 54vw, 94vw'

// Measured on /hero/case-open.webp: everything below the cavity lips
const CASE_FRONT_CLIP =
  'polygon(9% 44%, 18% 46.5%, 26% 49.8%, 36% 51.2%, 46% 50.6%, 49.2% 49%, 50% 53%, 57% 56.8%, 66% 58.3%, 76% 58.2%, 81.5% 55.6%, 86.5% 51.8%, 88% 100%, 8% 100%)'
const BUD_ASPECT = 0.7257
const BUD_WIDTH = 25
const BUD_HEIGHT = BUD_WIDTH / BUD_ASPECT
const SEATED = {
  right: { x: 50, y: 32, rotate: -6, scale: 1 },
  left: { x: 20.5, y: 26.5, rotate: 7, scale: 0.94 },
} as const

const window01 = (v: number, [a, b]: readonly [number, number], fade = 0.02) => Math.min(segment(v, a, a + fade), 1 - segment(v, b - fade, b))

export function AirpodsStage({ progress, side, cards }: { progress: MotionValue<number>; side: number; cards: string[] }) {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const rotateY = useSpring(useTransform(pointerX, (x) => x * 5), { stiffness: 50, damping: 18 })
  const rotateX = useSpring(useTransform(pointerY, (y) => -y * 3.5), { stiffness: 50, damping: 18 })
  // Wheel steps become continuous motion
  const p = useSpring(progress, { stiffness: 110, damping: 28, mass: 0.35 })

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1)
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [pointerX, pointerY])

  const wide = useMediaQuery('(min-width: 768px)')
  const offset = useMotionValue(0)
  useEffect(() => offset.set(wide ? side : 0), [offset, wide, side])
  const stageX = useTransform([p, offset], ([v, o]: number[]) => `${o * 22 * (1 - easeInOutCubic(segment(v, 0.02, 0.12)))}vw`)

  // Case -------------------------------------------------------------------------
  const closedOpacity = useTransform(p, (v) => 1 - segment(v, FILM.open[0], FILM.open[1]))
  // The case drops out of the bottom of the frame, as in Apple's film
  const caseY = useTransform(p, (v) => `${2 * (1 - segment(v, ...FILM.open)) + 150 * easeInOutCubic(segment(v, ...FILM.caseAway))}%`)
  // Gone for good once it has left the frame, so no sliver shows under later scenes
  const caseOpacity = useTransform(p, (v) => segment(v, ...FILM.open) * (1 - segment(v, FILM.caseAway[1] - 0.02, FILM.caseAway[1])))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Product stage ----------------------------------------------------------- */}
      <div className="absolute inset-0 flex items-start justify-center pt-[calc(var(--header-h)+2vh)] md:items-center md:pt-0">
        <motion.div
          className="relative aspect-square w-[min(94vw,62svh)] md:w-[min(54vw,84svh)]"
          style={{ x: stageX }}
          // Emerges from darkness: low-key light rising on the product
          initial={{ opacity: 0, filter: 'brightness(0.05)', scale: 0.94 }}
          animate={{ opacity: 1, filter: 'brightness(1)', scale: 1 }}
          transition={{ duration: 2.6, ease: EASE }}
        >
          <div className="absolute inset-0 [perspective:1600px]">
            <motion.div className="relative size-full [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
              <motion.div className="absolute inset-0" style={{ opacity: closedOpacity, scale: 1.02, y: '3%' }}>
                <Image src="/hero/case-closed.webp" alt="" fill sizes={SIZES} priority className="object-contain" />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ opacity: caseOpacity, y: caseY }}>
                <Image src="/hero/case-open.webp" alt="" fill sizes={SIZES} priority className="object-contain" />
              </motion.div>
              <Bud progress={p} side="left" />
              <Bud progress={p} side="right" />
              <motion.div className="absolute inset-0" style={{ opacity: caseOpacity, y: caseY, clipPath: CASE_FRONT_CLIP }}>
                <Image src="/hero/case-open.webp" alt="" fill sizes={SIZES} priority className="object-contain" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Scenes: title card, then a shot ----------------------------------------- */}
      {FILM.scenes.map((scene, index) => (
        <Scene key={index} progress={p} index={index} card={cards[index] ?? ''} scene={scene} />
      ))}
    </div>
  )
}

const SHOTS = [
  // Macro of the ear tip: noise cancellation
  { src: '/features/feat-anc.webp', from: { scale: 1.55, rotate: -8, x: 12 }, to: { scale: 1.2, rotate: 4, x: -6 } },
  // The pair, slowly turning in space
  { src: '/products/airpods-5-2.webp', from: { scale: 0.8, rotate: -10, x: -8 }, to: { scale: 1, rotate: 6, x: 6 } },
  // Siri with Apple Intelligence: the earbud inside the colour wave
  { src: '/hero/bud.webp', from: { scale: 0.62, rotate: 8, x: -4 }, to: { scale: 0.72, rotate: -6, x: 4 }, glow: true },
  // Chip
  { src: '/features/feat-chip.webp', from: { scale: 0.9, rotate: -14, x: 0 }, to: { scale: 1.1, rotate: 8, x: 0 } },
] as const

function Scene({
  progress,
  index,
  card,
  scene,
}: {
  progress: MotionValue<number>
  index: number
  card: string
  scene: { card: readonly [number, number]; shot: readonly [number, number] }
}) {
  const shot = SHOTS[index] ?? SHOTS[0]
  const cardOpacity = useTransform(progress, (v) => window01(v, scene.card, 0.018))
  const cardY = useTransform(progress, (v) => `${10 - 20 * segment(v, ...scene.card)}px`)
  const shotOpacity = useTransform(progress, (v) => window01(v, scene.shot, 0.022))
  const local = useTransform(progress, (v) => easeInOutCubic(segment(v, ...scene.shot)))
  const scale = useTransform(local, (t) => lerp(shot.from.scale, shot.to.scale, t))
  const rotate = useTransform(local, (t) => lerp(shot.from.rotate, shot.to.rotate, t))
  const x = useTransform(local, (t) => `${lerp(shot.from.x, shot.to.x, t)}%`)
  // Motion blur while the shot is entering or leaving quickly
  const filter = useTransform(shotOpacity, (o) => `blur(${((1 - o) * 14).toFixed(1)}px)`)
  return (
    <>
      <motion.p
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-[clamp(1.6rem,3.4vw,3rem)] font-medium tracking-[-0.03em] text-white"
        style={{ opacity: cardOpacity, y: cardY }}
      >
        {card}
      </motion.p>
      <motion.div className="absolute inset-0 flex items-center justify-center" style={{ opacity: shotOpacity }}>
        {'glow' in shot && <IntelligenceGlow className="absolute left-1/2 top-1/2 aspect-square w-[min(80vw,70svh)] -translate-x-1/2 -translate-y-1/2" />}
        <motion.div className="relative aspect-square w-[min(110vw,90svh)] md:w-[min(70vw,100svh)]" style={{ scale, rotate, x, filter }}>
          <Image src={shot.src} alt="" fill sizes="(min-width: 768px) 70vw, 110vw" className="object-contain" />
        </motion.div>
      </motion.div>
    </>
  )
}

function Bud({ progress, side }: { progress: MotionValue<number>; side: 'left' | 'right' }) {
  const seat = SEATED[side]
  const dir = side === 'right' ? 1 : -1
  const center = 50 - BUD_WIDTH / 2
  const [flyA, flyB] = FILM.flyOut
  const lastShot = FILM.scenes[3].shot

  // Present with the open case; hidden during title cards and shots; back for the fly-out
  const opacity = useTransform(progress, (v) => {
    const first = segment(v, ...FILM.open) * (1 - segment(v, FILM.scenes[0].card[0], FILM.scenes[0].card[0] + 0.02))
    const last = segment(v, lastShot[1] - 0.03, lastShot[1]) * (1 - segment(v, flyB - 0.01, flyB))
    return Math.max(first, last)
  })
  const x = useTransform(progress, (v) => {
    const rise = easeInOutCubic(segment(v, ...FILM.rise))
    const gather = easeInOutCubic(segment(v, ...FILM.caseAway))
    const fly = easeInOutCubic(segment(v, flyA, flyB))
    const base = lerp(seat.x, center + dir * 12, gather)
    return `${base + dir * 3 * rise + dir * 70 * fly}%`
  })
  const y = useTransform(progress, (v) => {
    const rise = easeInOutCubic(segment(v, ...FILM.rise))
    const gather = easeInOutCubic(segment(v, ...FILM.caseAway))
    const fly = easeInOutCubic(segment(v, flyA, flyB))
    return `${seat.y - 32 * rise + 30 * gather + (dir === 1 ? -30 : 40) * fly}%`
  })
  const rotate = useTransform(progress, (v) => {
    const rise = easeInOutCubic(segment(v, ...FILM.rise))
    const fly = easeInOutCubic(segment(v, flyA, flyB))
    return seat.rotate * (1 - rise) - dir * 8 * rise + dir * 25 * fly
  })
  const scale = useTransform(progress, (v) => {
    const fly = easeInOutCubic(segment(v, flyA, flyB))
    return seat.scale * (1 + 0.06 * segment(v, ...FILM.rise)) * (1 + 3.2 * fly)
  })
  const filter = useTransform(progress, (v) => `blur(${(10 * easeInOutCubic(segment(v, flyA + 0.015, flyB))).toFixed(1)}px)`)

  return (
    <motion.div className="absolute inset-0" style={{ x, y, opacity }}>
      <motion.div
        className="absolute left-0 top-0"
        style={{ width: `${BUD_WIDTH}%`, height: `${BUD_HEIGHT}%`, rotate, scale, filter, transformOrigin: '50% 30%' }}
      >
        <Image src="/hero/bud.webp" alt="" fill sizes="(min-width: 768px) 30vw, 50vw" priority className={side === 'left' ? 'object-contain -scale-x-100' : 'object-contain'} />
      </motion.div>
    </motion.div>
  )
}
