'use client'

import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import { ProductImage } from '@/components/product-image'
import { ArrowNudge, buttonClass } from '@/components/ui/button'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { useCart } from '@/lib/cart-store'
import { cn } from '@/lib/cn'
import type { HeroConfig } from '@/lib/data/types'
import { formatMoney } from '@/lib/format'
import { discountPercent } from '@/lib/pricing'
import { TIMELINE, segment, window01 } from './choreography'
import { HeroSequence } from './hero-sequence'

export type HeroProduct = {
  id: string
  slug: string
  name: string
  priceCents: number
  compareAtCents: number | null
  stock: number
  imageUrl: string | null
  hasVariants: boolean
}

type Props = {
  config: HeroConfig
  product: HeroProduct | null
  currency: string
  darkBackground: boolean
}

const EASE = [0.16, 1, 0.3, 1] as const
const CALLOUT_SLOTS = [
  'md:left-[7%] md:top-[26%]',
  'md:right-[7%] md:top-[30%] md:items-end md:text-right',
  'md:left-[7%] md:bottom-[24%]',
  'md:right-[7%] md:bottom-[20%] md:items-end md:text-right',
]

export function HeroSection({ config, product, currency, darkBackground }: Props) {
  const track = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const frames = config.frames.filter(Boolean)
  // The scroll-driven story needs motion and at least two moments to tell it
  const storytelling = config.animation === 'sequence' && frames.length >= 2 && !reducedMotion
  const { scrollYProgress } = useScroll({ target: track, offset: ['start start', 'end end'] })

  const discover = () => {
    const node = track.current
    if (!node) return
    const target = storytelling ? node.offsetTop + node.offsetHeight * 0.42 : node.offsetTop + node.offsetHeight
    window.scrollTo({ top: target, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const side = config.productPosition === 'left' ? -1 : config.productPosition === 'center' ? 0 : 1
  // Static fallback: the "open case" moment tells the most about the product
  const posterDesktop = config.imageDesktop ?? frames[1] ?? frames[0] ?? product?.imageUrl ?? null
  const posterMobile = config.imageMobile ?? posterDesktop

  // Function-form transforms on purpose: Motion's native ScrollTimeline acceleration
  // mis-maps target offsets for tall sticky tracks, so these stay on the JS path.
  const copyOpacity = useTransform(scrollYProgress, (p) => 1 - segment(p, ...TIMELINE.copyOut))
  const copyY = useTransform(scrollYProgress, (p) => -60 * segment(p, 0, TIMELINE.copyOut[1]))
  const hintOpacity = useTransform(scrollYProgress, (p) => 1 - segment(p, 0, 0.03))
  const finaleOpacity = useTransform(scrollYProgress, (p) => segment(p, TIMELINE.finale[0], TIMELINE.finale[0] + 0.06))
  const finaleY = useTransform(scrollYProgress, (p) => 30 * (1 - segment(p, TIMELINE.finale[0], TIMELINE.finale[0] + 0.08)))
  const progressScale = useTransform(scrollYProgress, (p) => segment(p, 0.2, 0.9))

  // Invisible layers must not catch clicks or keyboard focus
  const [stage, setStage] = useState({ copy: true, finale: false })
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const copy = p < TIMELINE.copyOut[1] - 0.02
    const finale = p > TIMELINE.finale[0] + 0.03
    setStage((current) => (current.copy === copy && current.finale === finale ? current : { copy, finale }))
  })
  const copyHidden = storytelling && !stage.copy

  return (
    <section
      ref={track}
      data-header-theme={darkBackground ? 'dark' : 'light'}
      aria-label={config.title}
      className={cn('relative', darkBackground ? 'text-white' : 'text-ink')}
      style={{ background: config.background, height: storytelling ? '380svh' : '100svh' }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Product layer ---------------------------------------------------- */}
        <div className="absolute inset-0">
          {storytelling ? (
            <HeroSequence frames={frames} alt={product?.name ?? config.title} progress={scrollYProgress} side={side} dark={darkBackground} />
          ) : (
            <PosterImage
              desktop={posterDesktop}
              mobile={posterMobile}
              alt={product?.name ?? config.title}
              position={config.productPosition}
              parallax={config.animation === 'parallax' && !reducedMotion}
              progress={scrollYProgress}
            />
          )}
        </div>

        {/* Copy -------------------------------------------------------------- */}
        <motion.div
          style={storytelling ? { opacity: copyOpacity, y: copyY } : undefined}
          className={cn(
            'container-mono pointer-events-none relative z-10 flex h-full flex-col justify-end pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[calc(var(--header-h)+1.5rem)] md:justify-center md:pb-16',
            config.productPosition === 'left' && 'md:items-end md:text-right',
          )}
        >
          <div inert={copyHidden} className={cn('max-w-[44rem]', !copyHidden && 'pointer-events-auto', config.productPosition === 'center' && 'md:max-w-[34rem]')}>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.25 }}
              className={cn('label-mono mb-5 flex items-center gap-3', darkBackground ? 'text-white/60' : 'text-muted', config.productPosition === 'left' && 'md:justify-end')}
            >
              <span className="inline-block size-1.5 bg-accent" aria-hidden="true" />
              {config.eyebrow}
            </motion.p>
            <h1 className="overflow-hidden text-[clamp(3.25rem,10vw,9.5rem)] font-semibold leading-[0.86] tracking-[-0.06em]">
              <motion.span
                className="block"
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1.3, ease: EASE, delay: 0.35 }}
              >
                {config.title}
              </motion.span>
            </h1>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.7 }}>
              {config.subtitle && (
                <p className={cn('mt-6 max-w-md text-lead', darkBackground ? 'text-white/75' : 'text-ink-2', config.productPosition === 'left' && 'md:ml-auto')}>
                  {config.subtitle}
                </p>
              )}
              {config.showPrice && product && <HeroPrice product={product} currency={currency} dark={darkBackground} />}
              <div className={cn('mt-8 flex flex-wrap gap-3', config.productPosition === 'left' && 'md:justify-end')}>
                <BuyButton product={product} label={config.ctaLabel} dark={darkBackground} />
                {config.secondaryLabel && (
                  <button type="button" onClick={discover} className={buttonClass({ variant: darkBackground ? 'inverse-outline' : 'secondary', size: 'lg' })}>
                    {config.secondaryLabel}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll-driven overlays -------------------------------------------- */}
        {storytelling && (
          <>
            {config.callouts.slice(0, 4).map((text, index) => (
              <Callout key={index} index={index} text={text} progress={scrollYProgress} dark={darkBackground} />
            ))}

            <div className="pointer-events-none absolute right-[var(--gutter)] top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex" aria-hidden="true">
              <span className={cn('label-mono', darkBackground ? 'text-white/50' : 'text-muted')}>01</span>
              <div className={cn('relative h-32 w-px', darkBackground ? 'bg-white/15' : 'bg-line-strong')}>
                <motion.div className={cn('absolute inset-0 origin-top', darkBackground ? 'bg-white' : 'bg-ink')} style={{ scaleY: progressScale }} />
              </div>
              <span className={cn('label-mono', darkBackground ? 'text-white/50' : 'text-muted')}>{String(Math.max(config.callouts.length, 1)).padStart(2, '0')}</span>
            </div>

            <motion.div style={{ opacity: hintOpacity }} className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center md:flex" aria-hidden="true">
              <span className={cn('label-mono flex flex-col items-center gap-3', darkBackground ? 'text-white/55' : 'text-muted')}>
                Deslizá para descubrir
                <span className="relative block h-10 w-px overflow-hidden bg-current/20">
                  <span className="absolute inset-x-0 top-0 h-1/2 bg-current [animation:hero-scroll-hint_2.2s_var(--ease-in-out)_infinite]" />
                </span>
              </span>
            </motion.div>

            {product && (
              <motion.div
                style={{ opacity: finaleOpacity, y: finaleY }}
                className="container-mono pointer-events-none absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end"
              >
                <div>
                  <p className={cn('label-mono mb-3', darkBackground ? 'text-white/55' : 'text-muted')}>{product.name}</p>
                  <p className="max-w-lg text-[clamp(1.75rem,3.4vw,3rem)] font-medium leading-[1] tracking-[-0.045em]">{config.subtitle}</p>
                </div>
                <div inert={!stage.finale} className={cn('flex items-center gap-3', stage.finale && 'pointer-events-auto')}>
                  <Link href={`/products/${product.slug}`} className={buttonClass({ variant: darkBackground ? 'inverse-outline' : 'secondary', size: 'lg', className: 'max-sm:hidden' })}>
                    Ver detalles
                  </Link>
                  <BuyButton product={product} label={config.ctaLabel} dark={darkBackground} withPrice currency={currency} />
                </div>
              </motion.div>
            )}
          </>
        )}

        {!storytelling && config.callouts.length > 0 && (
          <ul className="container-mono pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+1.5rem)] z-10 hidden flex-wrap gap-x-8 gap-y-2 md:flex">
            {config.callouts.map((text, index) => (
              <li key={index} className={cn('label-mono', darkBackground ? 'text-white/60' : 'text-muted')}>
                {String(index + 1).padStart(2, '0')} — {text}
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`@keyframes hero-scroll-hint { 0% { transform: translateY(-100%) } 60%, 100% { transform: translateY(200%) } }`}</style>
    </section>
  )
}

function HeroPrice({ product, currency, dark }: { product: HeroProduct; currency: string; dark: boolean }) {
  const discount = discountPercent(product.priceCents, product.compareAtCents)
  return (
    <p className="tabular mt-5 flex items-baseline gap-3 text-[17px]">
      <span className="font-medium">
        {product.hasVariants && <span className={cn('mr-1 text-[14px]', dark ? 'text-white/55' : 'text-muted')}>desde</span>}
        {formatMoney(product.priceCents, currency)}
      </span>
      {discount > 0 && product.compareAtCents && (
        <>
          <s className={cn('text-[14px]', dark ? 'text-white/45' : 'text-muted')}>{formatMoney(product.compareAtCents, currency)}</s>
          <span className="label-mono text-accent">−{discount}%</span>
        </>
      )}
    </p>
  )
}

function BuyButton({
  product,
  label,
  dark,
  withPrice = false,
  currency = 'ARS',
}: {
  product: HeroProduct | null
  label: string
  dark: boolean
  withPrice?: boolean
  currency?: string
}) {
  const add = useCart((state) => state.add)
  const className = buttonClass({ variant: dark ? 'inverse' : 'primary', size: 'lg' })
  const content = (
    <>
      {label}
      {withPrice && product && <span className="tabular opacity-60">· {formatMoney(product.priceCents, currency)}</span>}
      <ArrowNudge />
    </>
  )
  if (!product) {
    return (
      <Link href="/products" className={className}>
        {content}
      </Link>
    )
  }
  // Products with options need a choice first, so they go to their page
  if (product.hasVariants || product.stock <= 0) {
    return (
      <Link href={`/products/${product.slug}`} className={className}>
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        add({
          productId: product.id,
          variantId: null,
          slug: product.slug,
          name: product.name,
          variantName: null,
          imageUrl: product.imageUrl,
          unitPriceCents: product.priceCents,
          maxQuantity: product.stock,
        })
      }
    >
      {content}
    </button>
  )
}

function Callout({ index, text, progress, dark }: { index: number; text: string; progress: MotionValue<number>; dark: boolean }) {
  const [start, end] = TIMELINE.callouts[index] ?? [0, 0]
  const opacity = useTransform(progress, (p) => window01(p, start, end, 0.04))
  const y = useTransform(opacity, (value) => 18 * (1 - value))
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(opacity, 'change', (value) => setVisible(value > 0.5))
  return (
    <motion.div
      style={{ opacity, y }}
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none absolute inset-x-[var(--gutter)] bottom-[max(2.5rem,env(safe-area-inset-bottom))] z-10 flex flex-col gap-3 md:inset-x-auto md:max-w-[19rem]',
        CALLOUT_SLOTS[index],
      )}
    >
      <span className={cn('label-mono flex items-center gap-3', dark ? 'text-white/55' : 'text-muted')}>
        {String(index + 1).padStart(2, '0')}
        <span className={cn('h-px w-10', dark ? 'bg-white/30' : 'bg-line-strong')} />
      </span>
      <p className="text-[clamp(1.75rem,3vw,2.75rem)] font-medium leading-[1] tracking-[-0.045em]">{text}</p>
    </motion.div>
  )
}

function PosterImage({
  desktop,
  mobile,
  alt,
  position,
  parallax,
  progress,
}: {
  desktop: string | null
  mobile: string | null
  alt: string
  position: HeroConfig['productPosition']
  parallax: boolean
  progress: MotionValue<number>
}) {
  const scale = useTransform(progress, (p) => 1 + 0.12 * p)
  const y = useTransform(progress, (p) => `${-8 * p}%`)
  const box = cn(
    'absolute inset-x-0 top-[calc(var(--header-h))] bottom-[46%] md:bottom-[8%] md:top-[12%]',
    position === 'right' && 'md:left-[46%] md:right-[4%]',
    position === 'left' && 'md:left-[4%] md:right-[46%]',
    position === 'center' && 'md:left-[25%] md:right-[25%]',
  )
  return (
    <motion.div
      className={box}
      style={parallax ? { scale, y } : undefined}
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
    >
      <div className="relative hidden size-full md:block">
        <ProductImage src={desktop} alt={alt} sizes="50vw" priority />
      </div>
      <div className="relative size-full md:hidden">
        <ProductImage src={mobile} alt={alt} sizes="100vw" priority />
      </div>
    </motion.div>
  )
}
