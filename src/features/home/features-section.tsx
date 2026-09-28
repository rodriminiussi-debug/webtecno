'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { FeatureItem, HomepageSection } from '@/lib/data/types'
import { cn } from '@/lib/cn'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { WhatsAppPriceButton } from '@/components/store/whatsapp-button'
import { useConsultative } from '@/components/store/store-mode'
import { ExplodedView } from './exploded-view'
import { FeatureVisualView } from './feature-visuals'

/**
 * Product-page style highlights: an exploded view of the earbud, then one panel
 * per feature, each with its own scroll-reactive graphic. Dark, like the hero film.
 */
export function FeaturesSection({ section, product }: { section: HomepageSection<'features'>; product: { name: string; slug: string } | null }) {
  const consultative = useConsultative()
  return (
    <section className="bg-black text-white" data-header-theme="dark" aria-labelledby="features-title">
      <div className="container-mono pb-10 pt-28 md:pt-40">
        <p className="label-mono mb-5 text-white/50">{section.config.eyebrow}</p>
        <h2 id="features-title" className="max-w-[14ch] text-[clamp(3rem,8vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
          {section.title}
        </h2>
        {section.subtitle && <p className="mt-6 max-w-lg text-lead text-white/65">{section.subtitle}</p>}
      </div>

      <ExplodedView />

      <div className="container-mono">
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

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.25 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const textOpacity = useTransform(scrollYProgress, (p) => (reducedMotion ? 1 : Math.min(1, Math.max(0, (p - 0.12) / 0.18))))
  const textY = useTransform(textOpacity, (o) => 40 * (1 - o))
  const visualScale = useTransform(scrollYProgress, (p) => (reducedMotion ? 1 : 0.9 + 0.12 * Math.min(1, p / 0.5)))
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
        className={cn('relative aspect-square w-full md:col-span-6', flipped ? 'md:order-1 md:col-start-1' : 'md:col-start-7')}
        style={{ scale: visualScale }}
      >
        <FeatureVisualView visual={item.visual} progress={scrollYProgress} active={active && !reducedMotion} />
      </motion.div>
    </div>
  )
}
