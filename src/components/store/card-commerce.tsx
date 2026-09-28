'use client'

import { Availability } from '@/components/availability'
import { Price } from '@/components/price'
import { AddToCartQuick, type QuickAddProduct } from './add-to-cart-quick'
import { useConsultative } from './store-mode'
import { WhatsAppIconLink } from './whatsapp-button'

export function CardAction({ product }: { product: QuickAddProduct }) {
  const consultative = useConsultative()
  return consultative ? <WhatsAppIconLink product={product} /> : <AddToCartQuick product={product} />
}

export function CardPrice({
  cents,
  compareAtCents,
  currency,
  from,
  stock,
}: {
  cents: number
  compareAtCents: number | null
  currency: string
  from: boolean
  stock: number
}) {
  const consultative = useConsultative()
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      {consultative ? (
        <span className="text-[14px] text-ink-2">Precio por WhatsApp</span>
      ) : (
        <Price cents={cents} compareAtCents={compareAtCents} currency={currency} from={from} size="sm" />
      )}
      <Availability stock={stock} />
    </div>
  )
}
