'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Availability } from '@/components/availability'
import { Price } from '@/components/price'
import { QuantityStepper } from '@/components/store/quantity-stepper'
import { ArrowNudge, Button } from '@/components/ui/button'
import { useCart } from '@/lib/cart-store'
import { cn } from '@/lib/cn'
import type { ProductVariant } from '@/lib/data/types'
import { formatMoney } from '@/lib/format'
import { useConsultative } from '@/components/store/store-mode'
import { WhatsAppPriceButton } from '@/components/store/whatsapp-button'

type PanelProduct = {
  id: string
  slug: string
  name: string
  brand: string
  shortDescription: string
  priceCents: number
  compareAtCents: number | null
  stock: number
  sku: string
  imageUrl: string | null
  variantLabel: string
  variants: ProductVariant[]
}

export function PurchasePanel({ product, currency, categoryName }: { product: PanelProduct; currency: string; categoryName: string | null }) {
  const router = useRouter()
  const add = useCart((state) => state.add)
  const firstAvailable = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null
  const [variantId, setVariantId] = useState<string | null>(firstAvailable?.id ?? null)
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const [showBar, setShowBar] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const consultative = useConsultative()

  const variant = product.variants.find((item) => item.id === variantId) ?? null
  const stock = variant ? variant.stock : product.stock
  const price = variant?.priceCents ?? product.priceCents
  const compareAt = variant ? null : product.compareAtCents
  const soldOut = stock <= 0
  const maxQuantity = Math.max(1, Math.min(stock, 20))

  useEffect(() => {
    const node = buttonRef.current
    if (!node) return
    // Mobile sticky bar appears once the main button scrolls out of view
    const observer = new IntersectionObserver(([entry]) => setShowBar(Boolean(entry && !entry.isIntersecting && entry.boundingClientRect.top < 0)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const addToCart = () => {
    add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        name: product.name,
        variantName: variant?.name ?? null,
        imageUrl: product.imageUrl,
        unitPriceCents: price,
        maxQuantity: stock,
      },
      quantity,
    )
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1600)
  }

  const buyNow = () => {
    addToCart()
    useCart.getState().close()
    router.push('/checkout')
  }

  return (
    <div>
      <p className="label-mono text-muted">
        {[product.brand, categoryName].filter(Boolean).join(' · ')}
      </p>
      <h1 className="mt-4 text-[clamp(2.5rem,4.4vw,4rem)] font-semibold leading-[0.95] tracking-[-0.05em]">{product.name}</h1>
      <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink-2">{product.shortDescription}</p>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        {consultative ? (
          <p className="text-[17px] text-ink-2">Consultá precio y formas de pago por WhatsApp.</p>
        ) : (
          <Price cents={price} compareAtCents={compareAt} currency={currency} size="lg" />
        )}
        <Availability stock={stock} />
      </div>

      {product.variants.length > 0 && (
        <fieldset className="mt-8">
          <legend className="mb-3 flex w-full items-baseline justify-between text-[14px]">
            <span className="font-medium">{product.variantLabel || 'Opción'}</span>
            <span className="text-muted">{variant?.name}</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {product.variants.map((item) => {
              const selected = item.id === variantId
              const unavailable = item.stock <= 0
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setVariantId(item.id)
                    setQuantity(1)
                  }}
                  className={cn(
                    'relative inline-flex h-12 items-center gap-2.5 rounded-full border px-5 text-[14px] transition-[border-color,background-color] duration-[var(--dur-fast)]',
                    selected ? 'border-ink bg-surface' : 'border-line-strong hover:border-ink',
                    unavailable && 'text-muted',
                  )}
                >
                  {item.swatch && <span className="size-4 rounded-full ring-1 ring-line-strong" style={{ background: item.swatch }} aria-hidden="true" />}
                  {item.name}
                  {!consultative && item.priceCents !== null && item.priceCents !== product.priceCents && (
                    <span className="tabular text-muted">{formatMoney(item.priceCents, currency)}</span>
                  )}
                  {unavailable && <span className="label-mono text-muted">· Agotado</span>}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div ref={buttonRef} className="mt-8 flex flex-col gap-3">
        {consultative ? (
          <>
            <WhatsAppPriceButton product={product} option={variant?.name ?? null} className="w-full" />
            <p className="text-[13px] text-muted">Te respondemos en minutos, en horario comercial. El mensaje ya incluye el producto{variant ? ' y la opción elegida' : ''}.</p>
          </>
        ) : (
        <>
        <div className="flex gap-3">
          {!soldOut && <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} label="Cantidad" />}
          <Button size="lg" className="flex-1" onClick={addToCart} disabled={soldOut}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={justAdded ? 'added' : soldOut ? 'soldout' : 'add'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {soldOut ? 'Sin stock' : justAdded ? 'Agregado al carrito' : 'Agregar al carrito'}
              </motion.span>
            </AnimatePresence>
          </Button>
        </div>
        {!soldOut && (
          <Button size="lg" variant="secondary" onClick={buyNow}>
            Comprar ahora <ArrowNudge />
          </Button>
        )}
        {soldOut && (
          <p className="text-[14px] text-ink-2">
            Este producto está agotado. Escribinos y te avisamos cuando vuelva a ingresar.
          </p>
        )}
        </>
        )}
      </div>

      <AnimatePresence>
        {showBar && (consultative || !soldOut) && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-[var(--gutter)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{product.name}</p>
                <p className="tabular text-[13px] text-ink-2">
                  {consultative ? 'Precio por WhatsApp' : formatMoney(price, currency)}
                  {variant && ` · ${variant.name}`}
                </p>
              </div>
              {consultative ? (
                <WhatsAppPriceButton product={product} option={variant?.name ?? null} label="Consultar" size="md" />
              ) : (
                <Button onClick={addToCart}>{justAdded ? 'Agregado' : 'Agregar'}</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
