import type { Order } from '@/lib/data/types'
import { ProductImage } from '@/components/product-image'
import { formatDateTime, formatMoney } from '@/lib/format'
import { ORDER_FLOW, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/order-status'
import { cn } from '@/lib/cn'

export function OrderProgress({ status }: { status: Order['status'] }) {
  if (status === 'cancelled') {
    return <p className="rounded-[var(--radius-md)] bg-tile px-5 py-4 text-[15px]">Este pedido fue cancelado. Si tenés dudas, escribinos.</p>
  }
  const current = ORDER_FLOW.indexOf(status)
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Estado del pedido">
      {ORDER_FLOW.map((step, index) => (
        <li key={step} aria-current={index === current ? 'step' : undefined}>
          <span className={cn('block h-[3px] rounded-full', index <= current ? 'bg-ink' : 'bg-line-strong')} />
          <span className={cn('label-mono mt-3 block', index <= current ? 'text-ink' : 'text-muted')}>{ORDER_STATUS_LABEL[step]}</span>
        </li>
      ))}
    </ol>
  )
}

export function OrderDetails({ order, currency }: { order: Order; currency: string }) {
  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-7">
        <ul className="divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="relative size-16 shrink-0 rounded-[var(--radius-sm)] bg-tile p-1.5">
                <ProductImage src={item.imageUrl} alt="" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium">{item.name}</p>
                <p className="text-[13px] text-muted">
                  {item.variantName ? `${item.variantName} · ` : ''}
                  {item.quantity} × {formatMoney(item.unitPriceCents, currency)}
                </p>
              </div>
              <p className="tabular text-[15px]">{formatMoney(item.unitPriceCents * item.quantity, currency)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-ink-2">Subtotal</dt>
            <dd className="tabular">{formatMoney(order.subtotalCents, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-2">{order.shippingMethodName}</dt>
            <dd className="tabular">{order.shippingCents === 0 ? 'Gratis' : formatMoney(order.shippingCents, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-[18px] font-medium">
            <dt>Total</dt>
            <dd className="tabular">{formatMoney(order.totalCents, currency)}</dd>
          </div>
        </dl>
      </div>
      <dl className="grid content-start gap-6 text-[15px] md:col-span-4 md:col-start-9">
        <div>
          <dt className="label-mono mb-2 text-muted">Fecha</dt>
          <dd>{formatDateTime(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="label-mono mb-2 text-muted">Pago</dt>
          <dd>
            {order.paymentMethodName} · <span className="text-ink-2">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</span>
          </dd>
        </div>
        <div>
          <dt className="label-mono mb-2 text-muted">Entrega</dt>
          <dd>
            {order.shippingMethodName}
            {order.shippingAddress && (
              <span className="block text-ink-2">
                {order.shippingAddress.street} {order.shippingAddress.number}
                {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`} — {order.shippingAddress.city}, {order.shippingAddress.province} ({order.shippingAddress.postalCode})
              </span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}
