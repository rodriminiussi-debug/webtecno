'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckIcon, PlusIcon } from '@/components/icons'
import { useCart } from '@/lib/cart-store'
import { cn } from '@/lib/cn'

export type QuickAddProduct = {
  id: string
  slug: string
  name: string
  priceCents: number
  stock: number
  imageUrl: string | null
  hasVariants: boolean
}

/** Circular quick-add. Products with options send the user to choose one first. */
export function AddToCartQuick({ product, className }: { product: QuickAddProduct; className?: string }) {
  const add = useCart((state) => state.add)
  const [added, setAdded] = useState(false)
  const base = cn(
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-[background-color,color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:border-ink hover:bg-ink hover:text-paper active:scale-95',
    className,
  )
  if (product.stock <= 0) return null
  if (product.hasVariants) {
    return (
      <Link href={`/products/${product.slug}`} className={base} aria-label={`Elegir opciones de ${product.name}`}>
        <PlusIcon size={18} />
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={cn(base, added && 'border-ink bg-ink text-paper')}
      aria-label={`Agregar ${product.name} al carrito`}
      onClick={() => {
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
        setAdded(true)
        setTimeout(() => setAdded(false), 1400)
      }}
    >
      {added ? <CheckIcon size={18} /> : <PlusIcon size={18} />}
    </button>
  )
}
