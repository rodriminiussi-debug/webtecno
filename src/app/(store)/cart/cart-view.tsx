'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { ProductImage } from '@/components/product-image'
import { syncCart } from '@/components/store/cart-drawer'
import { QuantityStepper } from '@/components/store/quantity-stepper'
import { ArrowNudge, buttonClass } from '@/components/ui/button'
import { useHydrated } from '@/hooks/use-hydrated'
import { cartSubtotal, useCart } from '@/lib/cart-store'
import { formatMoney } from '@/lib/format'

export function CartView({ currency }: { currency: string }) {
  const hydrated = useHydrated()
  const { lines, setQuantity, remove, replace } = useCart()

  useEffect(() => {
    void syncCart(useCart.getState().lines, replace)
  }, [replace])

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-4" aria-busy="true" aria-label="Cargando carrito">
        {[0, 1].map((i) => (
          <div key={i} className="skeleton h-32" />
        ))}
      </div>
    )
  }

  if (!lines.length) {
    return (
      <div className="mt-10 flex min-h-[360px] flex-col items-start justify-center gap-5 rounded-[var(--radius-lg)] bg-tile p-8 md:p-14">
        <p className="text-title font-medium">Tu carrito está vacío.</p>
        <p className="max-w-md text-[15px] text-ink-2">Todavía no agregaste productos. Empezá por la selección de la semana.</p>
        <Link href="/products" className={buttonClass({})}>
          Ver productos <ArrowNudge />
        </Link>
      </div>
    )
  }

  const subtotal = cartSubtotal(lines)
  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-12">
      <ul className="divide-y divide-line border-y border-line lg:col-span-8">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.li key={line.key} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex gap-5 py-6">
              <Link href={`/products/${line.slug}`} className="relative size-28 shrink-0 rounded-[var(--radius-md)] bg-tile p-3 md:size-36">
                <ProductImage src={line.imageUrl} alt={line.name} sizes="144px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/products/${line.slug}`} className="text-[17px] font-medium hover:underline">
                      {line.name}
                    </Link>
                    {line.variantName && <p className="mt-1 text-[14px] text-muted">{line.variantName}</p>}
                    <p className="tabular mt-1 text-[14px] text-ink-2">{formatMoney(line.unitPriceCents, currency)} c/u</p>
                  </div>
                  <p className="tabular text-[17px] font-medium">{formatMoney(line.unitPriceCents * line.quantity, currency)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityStepper value={line.quantity} max={Math.min(line.maxQuantity, 20)} onChange={(value) => setQuantity(line.key, value)} label={`Cantidad de ${line.name}`} size="sm" />
                  <button type="button" onClick={() => remove(line.key)} className="text-[14px] text-muted underline-offset-4 hover:text-ink hover:underline">
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <aside className="lg:col-span-4">
        <div className="rounded-[var(--radius-lg)] bg-surface p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <p className="label-mono text-muted">Resumen</p>
          <dl className="mt-5 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-2">Subtotal</dt>
              <dd className="tabular">{formatMoney(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-2">Envío</dt>
              <dd className="text-muted">Se calcula en el checkout</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <p className="font-medium">Total estimado</p>
            <p className="tabular text-[24px] font-medium tracking-[-0.02em]">{formatMoney(subtotal, currency)}</p>
          </div>
          <Link href="/checkout" className={buttonClass({ size: 'lg', className: 'mt-6 w-full' })}>
            Iniciar compra <ArrowNudge />
          </Link>
          <Link href="/products" className={buttonClass({ variant: 'ghost', className: 'mt-2 w-full' })}>
            Seguir comprando
          </Link>
        </div>
      </aside>
    </div>
  )
}
