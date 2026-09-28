'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { ProductImage } from '@/components/product-image'
import { Reveal } from '@/components/reveal'
import { ArrowNudge, buttonClass } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { formatMoney } from '@/lib/format'
import { segment } from '@/features/hero/choreography'

type Props = {
  title: string
  subtitle: string
  eyebrow: string
  body: string
  points: { title: string; body: string }[]
  ctaLabel: string
  href: string
  primaryImage: string | null
  secondaryImage: string | null
  imageAlt: string
  priceCents: number | null
  currency: string
}

/** Scroll-told product story: the product travels across the frame while the argument builds up. */
export function StoryScroller(props: Props) {
  const reducedMotion = usePrefersReducedMotion()
  return (
    <>
      <div className="hidden md:block">{reducedMotion ? <StaticStory {...props} /> : <PinnedStory {...props} />}</div>
      <div className="md:hidden">
        <StaticStory {...props} />
      </div>
    </>
  )
}

function useRange(progress: MotionValue<number>, start: number, end: number) {
  return useTransform(progress, (p) => segment(p, start, end))
}

function PinnedStory({ title, subtitle, eyebrow, body, points, ctaLabel, href, primaryImage, secondaryImage, imageAlt, priceCents, currency }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const words = title.split(' ')

  const imageScale = useTransform(scrollYProgress, (p) => 0.72 + 0.36 * segment(p, 0, 0.6))
  const imageX = useTransform(scrollYProgress, (p) => `${22 - 30 * segment(p, 0.05, 0.75)}%`)
  const imageRotate = useTransform(scrollYProgress, (p) => -6 + 8 * segment(p, 0, 0.8))
  const secondaryY = useTransform(scrollYProgress, (p) => `${60 - 90 * segment(p, 0.3, 0.9)}%`)
  const secondaryOpacity = useRange(scrollYProgress, 0.35, 0.5)
  const bodyOpacity = useRange(scrollYProgress, 0.28, 0.4)
  const bodyY = useTransform(bodyOpacity, (v) => 30 * (1 - v))
  const ctaOpacity = useRange(scrollYProgress, 0.78, 0.88)

  return (
    <section ref={ref} className="relative bg-paper" style={{ height: '300svh' }} aria-label={title}>
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <div className="container-mono relative flex h-full flex-col justify-between pb-12 pt-[calc(var(--header-h)+2.5rem)]">
          <div className="relative z-10 flex items-start justify-between gap-8">
            <h2 className="max-w-[12ch] text-[clamp(3rem,7.4vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
              {words.map((word, index) => (
                <Word key={`${word}-${index}`} progress={scrollYProgress} start={0.02 + index * 0.045} word={word} />
              ))}
            </h2>
            <motion.div style={{ opacity: bodyOpacity, y: bodyY }} className="max-w-sm pt-3">
              <p className="label-mono mb-4 text-muted">{eyebrow}</p>
              <p className="text-[26px] font-medium leading-tight tracking-[-0.03em]">{subtitle}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{body}</p>
            </motion.div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-8 border-t border-line pt-6">
            {points.map((point, index) => (
              <Point key={point.title} progress={scrollYProgress} start={0.44 + index * 0.1} index={index} point={point} />
            ))}
          </div>

          <motion.div style={{ opacity: ctaOpacity }} className="absolute bottom-40 right-[var(--gutter)] z-10 flex items-center gap-4">
            {priceCents !== null && <span className="tabular text-[17px] font-medium">{formatMoney(priceCents, currency)}</span>}
            <Link href={href} className={buttonClass({ size: 'lg' })}>
              {ctaLabel} <ArrowNudge />
            </Link>
          </motion.div>
        </div>

        <motion.div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[min(52vw,760px)] -translate-x-1/2 -translate-y-1/2" style={{ scale: imageScale, x: imageX, rotate: imageRotate }}>
          <ProductImage src={primaryImage} alt={imageAlt} sizes="52vw" />
        </motion.div>
        {secondaryImage && (
          <motion.div className="pointer-events-none absolute bottom-[14%] left-[6%] aspect-[4/5] w-[min(16vw,240px)] rounded-[var(--radius-lg)] bg-tile p-4" style={{ y: secondaryY, opacity: secondaryOpacity }}>
            <ProductImage src={secondaryImage} alt="" sizes="16vw" />
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Word({ progress, start, word }: { progress: MotionValue<number>; start: number; word: string }) {
  const opacity = useTransform(progress, (p) => 0.12 + 0.88 * segment(p, start, start + 0.08))
  return (
    <motion.span style={{ opacity }} className="mr-[0.22em] inline-block">
      {word}
    </motion.span>
  )
}

function Point({ progress, start, index, point }: { progress: MotionValue<number>; start: number; index: number; point: { title: string; body: string } }) {
  const opacity = useTransform(progress, (p) => segment(p, start, start + 0.08))
  const y = useTransform(opacity, (v) => 24 * (1 - v))
  return (
    <motion.div style={{ opacity, y }}>
      <p className="label-mono mb-3 text-muted">{String(index + 1).padStart(2, '0')}</p>
      <p className="tabular text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-none tracking-[-0.05em]">{point.title}</p>
      <p className="mt-2 max-w-[22ch] text-[14px] text-ink-2">{point.body}</p>
    </motion.div>
  )
}

function StaticStory({ title, subtitle, eyebrow, body, points, ctaLabel, href, primaryImage, imageAlt, priceCents, currency }: Props) {
  return (
    <section className="py-20" aria-label={title}>
      <div className="container-mono">
        <Reveal>
          <p className="label-mono mb-5 text-muted">{eyebrow}</p>
          <h2 className="text-headline font-semibold">{title}</h2>
        </Reveal>
        <Reveal delay={100} className="relative mx-auto my-10 aspect-square w-full max-w-md">
          <ProductImage src={primaryImage} alt={imageAlt} sizes="90vw" />
        </Reveal>
        <Reveal>
          <p className="text-[24px] font-medium leading-tight tracking-[-0.03em]">{subtitle}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{body}</p>
        </Reveal>
        <dl className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          {points.map((point, index) => (
            <Reveal key={point.title} delay={index * 80}>
              <dt className="tabular text-[40px] font-medium leading-none tracking-[-0.05em]">{point.title}</dt>
              <dd className="mt-2 text-[14px] text-ink-2">{point.body}</dd>
            </Reveal>
          ))}
        </dl>
        <div className="mt-10 flex items-center gap-4">
          <Link href={href} className={buttonClass({ size: 'lg' })}>
            {ctaLabel} <ArrowNudge />
          </Link>
          {priceCents !== null && <span className="tabular text-[15px]">{formatMoney(priceCents, currency)}</span>}
        </div>
      </div>
    </section>
  )
}
