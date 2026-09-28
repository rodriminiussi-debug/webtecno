'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { refreshCart } from '@/app/actions/cart'
import { CloseIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { ArrowNudge, buttonClass } from '@/components/ui/button'
import { useEscape } from '@/hooks/use-escape'
import { useLockScroll } from '@/hooks/use-lock-scroll'
import { cartCount, cartSubtotal, useCart, type CartLine } from '@/lib/cart-store'
import { formatMoney } from '@/lib/format'
import { QuantityStepper } from './quantity-stepper'

const EASE = [0.16, 1, 0.3, 1] as const

/** Syncs a browser cart with current prices/stock. Unavailable lines are dropped. */
export async function syncCart(lines: CartLine[], replace: (lines: CartLine[]) => void) {
  if (!lines.length) return
  try {
    const snapshot = await refreshCart(lines.map(({ productId, variantId }) => ({ productId, variantId })))
    const next = lines.flatMap((line) => {
      const fresh = snapshot.find((item) => item.productId === line.productId && item.variantId === line.variantId)
      if (!fresh || !fresh.available) return []
      return [
        {
          ...line,
          name: fresh.name,
          variantName: fresh.variantName,
          unitPriceCents: fresh.unitPriceCents,
          maxQuantity: fresh.maxQuantity,
          imageUrl: fresh.imageUrl,
          slug: fresh.slug,
          quantity: Math.min(line.quantity, fresh.maxQuantity),
        },
      ]
    })
    const changed = JSON.stringify(next) !== JSON.stringify(lines)
    if (changed) replace(next)
  } catch (error) {
    console.error('syncCart failed', { error })
  }
}

export function CartDrawer({ currency, freeShippingOverCents }: { currency: string; freeShippingOverCents: number | null }) {
  const { lines, isOpen, close, remove, setQuantity, replace } = useCart()
  useLockScroll(isOpen)
  useEscape(isOpen, close)

  useEffect(() => {
    if (isOpen) void syncCart(useCart.getState().lines, replace)
  }, [isOpen, replace])

  const subtotal = cartSubtotal(lines)
  const count = cartCount(lines)
  const remaining = freeShippingOverCents !== null ? Math.max(freeShippingOverCents - subtotal, 0) : null
  const progress = freeShippingOverCents ? Math.min(subtotal / freeShippingOverCents, 1) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrito"
            className="fixed inset-y-0 right-0 z-[71] flex w-full max-w-[460px] flex-col bg-paper text-ink shadow-[0_0_80px_rgba(0,0,0,0.12)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-6">
              <p className="text-[15px] font-medium">
                Carrito <span className="tabular text-muted">({count})</span>
              </p>
              <button type="button" onClick={close} aria-label="Cerrar carrito" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-tile" autoFocus>
                <CloseIcon />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-6 px-6">
                <p className="text-[32px] font-medium leading-none tracking-[-0.04em]">Tu carrito está vacío.</p>
                <p className="max-w-xs text-[15px] text-ink-2">Explorá la selección y agregá lo que te guste. Lo guardamos acá mientras navegás.</p>
                <Link href="/products" onClick={close} className={buttonClass({})}>
                  Ver productos <ArrowNudge />
                </Link>
              </div>
            ) : (
              <>
                {remaining !== null && (
                  <div className="border-b border-line px-6 py-4">
                    <p className="text-[13px] text-ink-2">
                      {remaining > 0 ? (
                        <>
                          Te faltan <span className="tabular font-medium text-ink">{formatMoney(remaining, currency)}</span> para el envío gratis.
                        </>
                      ) : (
                        <span className="font-medium text-ink">Tenés envío gratis.</span>
                      )}
                    </p>
                    <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div className="h-full origin-left bg-ink transition-transform duration-700 ease-[var(--ease-out-expo)]" style={{ transform: `scaleX(${progress})` }} />
                    </div>
                  </div>
                )}
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.li
                        key={line.key}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="flex gap-4 py-5"
                      >
                        <Link href={`/products/${line.slug}`} onClick={close} className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-tile p-2">
                          <ProductImage src={line.imageUrl} alt={line.name} sizes="96px" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/products/${line.slug}`} onClick={close} className="block truncate text-[15px] font-medium hover:underline">
                                {line.name}
                              </Link>
                              {line.variantName && <p className="mt-0.5 text-[13px] text-muted">{line.variantName}</p>}
                            </div>
                            <p className="tabular shrink-0 text-[15px]">{formatMoney(line.unitPriceCents * line.quantity, currency)}</p>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QuantityStepper
                              size="sm"
                              value={line.quantity}
                              max={Math.min(line.maxQuantity, 20)}
                              onChange={(value) => setQuantity(line.key, value)}
                              label={`Cantidad de ${line.name}`}
                            />
                            <button type="button" onClick={() => remove(line.key)} className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">
                              Quitar
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-line px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[15px] text-ink-2">Subtotal</p>
                    <p className="tabular text-[22px] font-medium tracking-[-0.02em]">{formatMoney(subtotal, currency)}</p>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">Envío calculado en el checkout.</p>
                  <div className="mt-5 grid gap-2">
                    <Link href="/checkout" onClick={close} className={buttonClass({ size: 'lg', className: 'w-full' })}>
                      Iniciar compra <ArrowNudge />
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={close} className={buttonClass({ variant: 'secondary', className: 'w-full' })}>
                        Seguir comprando
                      </button>
                      <Link href="/cart" onClick={close} className={buttonClass({ variant: 'secondary', className: 'w-full' })}>
                        Ver carrito
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
