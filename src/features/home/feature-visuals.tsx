'use client'

import Image from 'next/image'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useState } from 'react'
import type { FeatureVisual } from '@/lib/data/types'
import { cn } from '@/lib/cn'
import { INTELLIGENCE_GRADIENT, IntelligenceGlow } from '@/components/intelligence-glow'

// Each visual receives the panel's scroll progress (0 → 1 while it crosses the
// viewport) so the graphic reacts to scrolling, like Apple's feature films.

type VisualProps = { progress: MotionValue<number>; active: boolean }

const IMAGE_SIZES = '(min-width: 1024px) 45vw, 90vw'

function Photo({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn('relative size-full', className)}>
      <Image src={src} alt="" fill sizes={IMAGE_SIZES} className="object-contain" />
    </div>
  )
}

/** Noise waves flatten into silence as the panel scrolls in. */
function AncVisual({ progress }: VisualProps) {
  const amplitude = useTransform(progress, [0.15, 0.55], [1, 0.04])
  const paths = [0, 1, 2, 3].map((line) => (
    <Wave key={line} amplitude={amplitude} seed={line} className={cn(line === 0 ? 'stroke-white/70' : 'stroke-white/25')} />
  ))
  return (
    <div className="relative size-full">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
        <svg viewBox="0 0 600 200" className="h-auto w-full" fill="none" strokeWidth="1.5">
          {paths}
        </svg>
      </div>
      <Photo src="/features/feat-anc.webp" className="scale-[0.82]" />
    </div>
  )
}

function Wave({ amplitude, seed, className }: { amplitude: MotionValue<number>; seed: number; className: string }) {
  const d = useTransform(amplitude, (a) => {
    let path = 'M0 100'
    for (let x = 0; x <= 600; x += 12) {
      const y = 100 + a * (Math.sin(x / 23 + seed * 1.7) * 38 + Math.sin(x / 7 + seed) * 16) * (1 - seed * 0.18)
      path += ` L${x} ${y.toFixed(1)}`
    }
    return path
  })
  return <motion.path d={d} className={className} />
}

const MODES = ['Cancelación', 'Adaptativo', 'Ambiente']

/** The three listening modes, cycling like the control on the device. */
function AdaptiveVisual({ active }: VisualProps) {
  const [mode, setMode] = useState(1)
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setMode((current) => (current + 1) % MODES.length), 1800)
    return () => clearInterval(timer)
  }, [active])
  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-10">
      <div className="relative aspect-square w-3/5">
        <motion.div
          className="absolute inset-[-12%] rounded-full border border-white/10"
          animate={{ scale: mode === 0 ? 0.82 : mode === 1 ? 1 : 1.18, opacity: mode === 2 ? 0.9 : 0.5 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <Photo src="/products/airpods-5-2.webp" />
      </div>
      <div className="relative flex rounded-full bg-white/8 p-1 text-[13px]" role="presentation">
        {MODES.map((label, index) => (
          <span key={label} className={cn('relative z-10 px-4 py-2 transition-colors duration-500', index === mode ? 'text-black' : 'text-white/55')}>
            {index === mode && <motion.span layoutId="mode-pill" className="absolute inset-0 -z-10 rounded-full bg-white" transition={{ type: 'spring', stiffness: 260, damping: 30 }} />}
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Orbits around the earbuds: sound placed in space. */
function SpatialVisual({ progress }: VisualProps) {
  const tilt = useTransform(progress, [0, 1], [62, 76])
  return (
    <div className="relative size-full [perspective:900px]">
      {[0, 1, 2].map((ring) => (
        <motion.div key={ring} className="absolute inset-[6%] [transform-style:preserve-3d]" style={{ rotateX: tilt }}>
          <div
            className="absolute rounded-full border border-white/20"
            style={{ inset: `${ring * 11}%`, animation: `orbit ${14 + ring * 5}s linear infinite ${ring % 2 ? 'reverse' : ''}` }}
          >
            <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-white shadow-[0_0_16px_4px_rgba(255,255,255,0.45)]" />
          </div>
        </motion.div>
      ))}
      <Photo src="/products/airpods-5-2.webp" className="scale-[0.6]" />
      <style>{`@keyframes orbit { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const PHRASES = [
  ['¿Dónde queda la estación?', 'Where is the station?'],
  ['Una mesa para dos, por favor.', 'Una mesa per due, per favore.'],
  ['¿Cuánto cuesta el pasaje?', 'Combien coûte le billet ?'],
]

/** Live translation: what you hear vs. what they said. */
function TranslateVisual({ active }: VisualProps) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setIndex((current) => (current + 1) % PHRASES.length), 3200)
    return () => clearInterval(timer)
  }, [active])
  const [source, target] = PHRASES[index] ?? PHRASES[0]
  return (
    <div className="relative flex size-full flex-col justify-center gap-4 px-[8%]">
      <motion.p key={`s-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-[80%] self-start rounded-[22px] rounded-bl-md bg-white/10 px-5 py-4 text-[clamp(1.1rem,2vw,1.5rem)] text-white/80">
        {target}
      </motion.p>
      <motion.div key={`t-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="relative flex max-w-[85%] items-center gap-3 self-end rounded-[22px] rounded-br-md bg-white px-5 py-4 text-[clamp(1.1rem,2vw,1.5rem)] font-medium text-black shadow-[0_0_40px_-6px_rgba(180,92,255,0.6)]">
        <span className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((bar) => (
            <span key={bar} className="w-0.5 rounded-full bg-black/60 [animation:eq_0.9s_ease-in-out_infinite]" style={{ height: 14, animationDelay: `${bar * 0.15}s` }} />
          ))}
        </span>
        {source}
      </motion.div>
      <p className="label-mono self-end text-white/40">Lo que escuchás, en español</p>
      <style>{`@keyframes eq { 0%,100% { transform: scaleY(.4) } 50% { transform: scaleY(1) } }`}</style>
    </div>
  )
}

/** Siri with Apple Intelligence: the earbud inside the colour wave, with a listening pill. */
function SiriVisual({ active }: VisualProps) {
  return (
    <div className="relative size-full">
      <IntelligenceGlow className="absolute inset-[4%]" intensity={active ? 1 : 0.6} />
      <Photo src="/hero/bud.webp" className="scale-[0.5]" />
      <div className="absolute bottom-[8%] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-5 py-3 backdrop-blur">
        <span className="size-5 rounded-full motion-safe:animate-[intelligence-spin_3s_linear_infinite]" style={{ background: INTELLIGENCE_GRADIENT }} />
        <span className="text-[14px] text-white/85">“Leeme el último mensaje”</span>
      </div>
    </div>
  )
}

/** Voice isolation: street noise stays grey and flat while your voice comes through clean. */
function VoiceVisual({ progress }: VisualProps) {
  const noise = useTransform(progress, [0.15, 0.55], [1, 0.12])
  const voice = useTransform(progress, [0.2, 0.6], [0, 1])
  return (
    <div className="relative flex size-full items-center">
      <svg viewBox="0 0 600 200" className="h-auto w-full" fill="none" strokeWidth="1.5">
        {[1, 2, 3].map((seed) => (
          <Wave key={seed} amplitude={noise} seed={seed} className="stroke-white/20" />
        ))}
        <motion.path
          d="M0 100 C 60 100, 80 40, 120 100 S 180 160, 220 100 S 280 30, 330 100 S 400 170, 440 100 S 520 50, 600 100"
          stroke="#4fa3ff"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ pathLength: voice }}
        />
      </svg>
      <p className="label-mono absolute bottom-[10%] left-0 text-white/45">Ruido de la calle</p>
      <p className="label-mono absolute right-0 top-[10%] text-[#4fa3ff]">Tu voz</p>
    </div>
  )
}

/** Heart rate: the ECG line draws itself while the BPM counts up. */
function HeartVisual({ progress }: VisualProps) {
  const draw = useTransform(progress, [0.1, 0.6], [0, 1])
  const bpm = useTransform(progress, [0.1, 0.6], [72, 128])
  const [value, setValue] = useState(72)
  useEffect(() => bpm.on('change', (latest) => setValue(Math.round(latest))), [bpm])
  return (
    <div className="relative size-full">
      <Photo src="/features/feat-heart.webp" className="scale-[0.78]" />
      <svg viewBox="0 0 600 120" className="absolute inset-x-0 bottom-[12%] h-auto w-full" fill="none">
        <motion.path
          d="M0 70 L120 70 L150 70 L165 30 L180 105 L195 50 L210 70 L330 70 L345 30 L360 105 L375 50 L390 70 L600 70"
          stroke="#ff4d4d"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ pathLength: draw }}
        />
      </svg>
      <p className="absolute right-[6%] top-[8%] text-right">
        <span className="tabular block text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-none tracking-[-0.04em]">{value}</span>
        <span className="label-mono text-white/50">latidos por minuto</span>
      </p>
    </div>
  )
}

function ChipVisual({ progress }: VisualProps) {
  const glow = useTransform(progress, [0.1, 0.5], [0, 1])
  const rotate = useTransform(progress, [0, 1], [-8, 6])
  return (
    <div className="relative size-full">
      <motion.div className="absolute inset-[18%] rounded-[30%] bg-[radial-gradient(closest-side,rgba(255,170,90,0.35),transparent)] blur-2xl" style={{ opacity: glow }} />
      <motion.div className="size-full" style={{ rotate }}>
        <Photo src="/features/feat-chip.webp" className="scale-[0.82]" />
      </motion.div>
    </div>
  )
}

/** Hours count up with scroll: 5 h per charge, 30 h with the case. */
function BatteryVisual({ progress }: VisualProps) {
  const buds = useTransform(progress, [0.1, 0.55], [0, 5])
  const total = useTransform(progress, [0.15, 0.65], [0, 30])
  const [values, setValues] = useState({ buds: 0, total: 0 })
  useEffect(() => {
    const update = () => setValues({ buds: Math.round(buds.get()), total: Math.round(total.get()) })
    const unsubscribe = [buds.on('change', update), total.on('change', update)]
    return () => unsubscribe.forEach((stop) => stop())
  }, [buds, total])
  const fill = useTransform(progress, [0.15, 0.65], ['0%', '100%'])
  return (
    <div className="relative flex size-full flex-col justify-center gap-10 px-[8%]">
      {[
        { value: values.buds, label: 'horas de reproducción por carga', max: 5 },
        { value: values.total, label: 'horas con el estuche de carga', max: 30 },
      ].map((row) => (
        <div key={row.label}>
          <p className="tabular text-[clamp(3.5rem,8vw,7rem)] font-semibold leading-none tracking-[-0.05em]">
            {row.value}
            <span className="text-[0.45em] text-white/50"> h</span>
          </p>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-white" style={{ width: row.max === 30 ? fill : `${(row.value / row.max) * 100}%` }} />
          </div>
          <p className="label-mono mt-3 text-white/50">{row.label}</p>
        </div>
      ))}
    </div>
  )
}

function WaterVisual({ progress }: VisualProps) {
  const y = useTransform(progress, [0, 1], ['6%', '-6%'])
  return (
    <div className="relative size-full">
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[clamp(6rem,16vw,14rem)] font-semibold tracking-[-0.06em] text-white/[0.06]">IP57</p>
      <motion.div className="size-full" style={{ y }}>
        <Photo src="/features/feat-water.webp" className="scale-[0.8]" />
      </motion.div>
    </div>
  )
}

/** Find My: the case "calls out" with expanding rings. */
function CaseVisual({ active }: VisualProps) {
  return (
    <div className="relative size-full">
      {active &&
        [0, 1, 2].map((ring) => (
          <span
            key={ring}
            className="absolute left-1/2 top-[58%] size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
            style={{ animation: `ping-out 2.4s ${ring * 0.8}s cubic-bezier(0.16,1,0.3,1) infinite` }}
          />
        ))}
      <Photo src="/features/feat-case.webp" className="scale-[0.78]" />
      <style>{`@keyframes ping-out { from { transform: translate(-50%,-50%) scale(.6); opacity: .8 } to { transform: translate(-50%,-50%) scale(2.6); opacity: 0 } }`}</style>
    </div>
  )
}

export const FEATURE_VISUAL_LABEL: Record<FeatureVisual, string> = {
  anc: 'Ondas de ruido que se apagan',
  adaptive: 'Selector de modos de escucha',
  spatial: 'Órbitas de audio espacial',
  translate: 'Burbujas de traducción',
  voice: 'Voz nítida sobre el ruido',
  siri: 'Ola de color de Apple Intelligence',
  heart: 'Electrocardiograma y pulsaciones',
  chip: 'Chip con brillo',
  battery: 'Contadores de horas',
  water: 'Gotas e IP57',
  case: 'Estuche con ondas de localización',
}

export function FeatureVisualView({ visual, ...props }: VisualProps & { visual: FeatureVisual }) {
  switch (visual) {
    case 'anc':
      return <AncVisual {...props} />
    case 'adaptive':
      return <AdaptiveVisual {...props} />
    case 'spatial':
      return <SpatialVisual {...props} />
    case 'translate':
      return <TranslateVisual {...props} />
    case 'voice':
      return <VoiceVisual {...props} />
    case 'siri':
      return <SiriVisual {...props} />
    case 'heart':
      return <HeartVisual {...props} />
    case 'chip':
      return <ChipVisual {...props} />
    case 'battery':
      return <BatteryVisual {...props} />
    case 'water':
      return <WaterVisual {...props} />
    case 'case':
      return <CaseVisual {...props} />
    default:
      return null
  }
}
