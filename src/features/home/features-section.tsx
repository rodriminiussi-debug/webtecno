'use client'

import Image from 'next/image'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { FeatureItem, HomepageSection } from '@/lib/data/types'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { AutoplayVideo } from '@/components/autoplay-video'
import { WhatsAppPriceButton } from '@/components/store/whatsapp-button'
import { useConsultative } from '@/components/store/store-mode'
import { InsideBento } from './inside-bento'
import { FeatureVisualView } from './feature-visuals'
import { isVideo, posterFor, resolveFeatureMedia } from './feature-media'

/**
 * Product-page style highlights, dark like the hero film: a bento of Apple's
 * "inside" animations, then one panel per feature with its own image or clip.
 */
export function FeaturesSection({ section, product }: { section: HomepageSection<'features'>; product: { name: string; slug: string } | null }) {
  const consultative = useConsultative()
  return (
    <section className="bg-black text-white" data-header-theme="dark" aria-labelledby="features-title">
      <div className="container-mono pb-14 pt-28 md:pb-20 md:pt-40">
        <p className="label-mono mb-5 text-white/50">{section.config.eyebrow}</p>
        <h2 id="features-title" className="max-w-[14ch] text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
          {section.title}
        </h2>
        {section.subtitle && <p className="mt-6 max-w-lg text-lead text-white/65">{section.subtitle}</p>}
      </div>

      <InsideBento />

      <div className="container-mono mt-10 md:mt-16">
        {section.config.items.map((item, index) => (
          <FeaturePanel key={`${item.visual}-${index}`} item={item} index={index} />
        ))}
      </div>

      {product && consultative && (
        <div className="container-mono flex flex-col items-start gap-6 border-t border-white/10 py-20 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.04em]">¿Querés los tuyos? Te pasamos precio y disponibilidad al toque.</p>
          <WhatsAppPriceButton product={product} variant="inverse" />
        </div>
      )}
    </section>
  )
}

function FeaturePanel({ item, index }: { item: FeatureItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const [active, setActive] = useState(false)
  const media = resolveFeatureMedia(item)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.25 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const textOpacity = useTransform(scrollYProgress, (p) => (reducedMotion ? 1 : Math.min(1, Math.max(0, (p - 0.12) / 0.18))))
  const textY = useTransform(textOpacity, (o) => 40 * (1 - o))
  const visualScale = useTransform(scrollYProgress, (p) => (reducedMotion ? 1 : 0.92 + 0.08 * Math.min(1, p / 0.5)))
  const imageY = useTransform(scrollYProgress, (p) => (reducedMotion ? '0%' : `${(0.5 - p) * 8}%`))
  const flipped = index % 2 === 1

  return (
    <div ref={ref} className="grid min-h-[78svh] items-center gap-10 border-t border-white/10 py-16 md:grid-cols-12 md:gap-8 md:py-24">
      <motion.div className={cn('md:col-span-5', flipped && 'md:order-2 md:col-start-8')} style={{ opacity: textOpacity, y: textY }}>
        <p className="label-mono mb-5 flex items-center gap-3 text-white/50">
          <span className="tabular">{String(index + 1).padStart(2, '0')}</span>
          <span className="h-px w-8 bg-white/25" />
          {item.kicker}
        </p>
        <h3 className="text-[clamp(2.4rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.05em]">{item.title}</h3>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/65">{item.body}</p>
      </motion.div>
      <motion.div
        className={cn('relative w-full md:col-span-6', flipped ? 'md:order-1 md:col-start-1' : 'md:col-start-7', media ? 'aspect-[4/3.4]' : 'aspect-square')}
        style={{ scale: visualScale }}
      >
        {media ? (
          <FeatureMedia src={media} label={item.title} y={imageY} />
        ) : (
          <FeatureVisualView visual={item.visual} progress={scrollYProgress} active={active && !reducedMotion} />
        )}
      </motion.div>
    </div>
  )
}

// Lifestyle shots fill the card; product shots on Apple's grey sit inside it
function FeatureMedia({ src, label, y }: { src: string; label: string; y: MotionValue<string> }) {
  const lifestyle = src.includes('/lifestyle')
  if (isVideo(src)) {
    return (
      <div className={cn('size-full overflow-hidden rounded-[28px]', src.includes('siri') ? 'bg-black ring-1 ring-white/10' : 'bg-[#f6f5f8]')}>
        <AutoplayVideo src={src} poster={posterFor(src)} label={label} className="size-full" />
      </div>
    )
  }
  return (
    <div className={cn('relative size-full overflow-hidden rounded-[28px]', lifestyle ? 'bg-neutral-900' : 'bg-[#f6f5f8]')}>
      <motion.div className="absolute inset-[-5%]" style={{ y }}>
        <Image
          src={src}
          alt={label}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className={lifestyle ? 'object-cover' : 'object-contain p-[6%] mix-blend-multiply'}
        />
      </motion.div>
    </div>
  )
}
