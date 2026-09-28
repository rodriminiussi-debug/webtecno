import { notFound } from 'next/navigation'
import { OrderStatusBadge, PageHeader, Panel, PaymentStatusBadge } from '@/components/admin/ui'
import { ProductImage } from '@/components/product-image'
import { getRepository } from '@/lib/data'
import { formatDateTime, formatMoney } from '@/lib/format'
import { OrderControls } from './order-controls'

export const metadata = { title: 'Pedido' }

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repository = getRepository()
  const [order, settings] = await Promise.all([repository.getOrderById(id), repository.getSettings()])
  if (!order) notFound()
  const money = (cents: number) => formatMoney(cents, settings.currency)
  const address = order.shippingAddress
  return (
    <>
      <PageHeader
        back={{ href: '/admin/orders', label: 'Pedidos' }}
        title={`Pedido ${order.number}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatDateTime(order.createdAt)} <OrderStatusBadge status={order.status} /> <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title={`Productos (${order.items.reduce((sum, item) => sum + item.quantity, 0)})`} padded={false}>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3 text-[13px]">
                  <span className="relative size-12 shrink-0 rounded-[6px] bg-tile">
                    <ProductImage src={item.imageUrl} alt="" sizes="48px" className="p-1" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="font-mono text-[11px] text-muted">
                      {item.sku}
                      {item.variantName && ` · ${item.variantName}`}
                    </p>
                  </div>
                  <p className="tabular text-ink-2">
                    {item.quantity} × {money(item.unitPriceCents)}
                  </p>
                  <p className="tabular w-28 text-right font-medium">{money(item.unitPriceCents * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line px-5 py-4 text-[13px]">
              <div className="flex justify-between py-1">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="tabular">{money(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-ink-2">{order.shippingMethodName}</dt>
                <dd className="tabular">{order.shippingCents ? money(order.shippingCents) : 'Gratis'}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
                <dt>Total</dt>
                <dd className="tabular">{money(order.totalCents)}</dd>
              </div>
            </dl>
          </Panel>
          {order.notes && (
            <Panel title="Notas del cliente">
              <p className="whitespace-pre-line text-[14px]">{order.notes}</p>
            </Panel>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <OrderControls orderId={order.id} status={order.status} paymentStatus={order.paymentStatus} />
          <Panel title="Cliente">
            <dl className="grid gap-3 text-[13px]">
              <Info label="Nombre" value={order.customerName} />
              <Info label="Email" value={<a href={`mailto:${order.customerEmail}`} className="underline underline-offset-2">{order.customerEmail}</a>} />
              <Info label="Teléfono" value={<a href={`tel:${order.customerPhone}`} className="underline underline-offset-2">{order.customerPhone}</a>} />
              {order.documentId && <Info label="DNI / CUIT" value={order.documentId} />}
            </dl>
          </Panel>
          <Panel title="Entrega y pago">
            <dl className="grid gap-3 text-[13px]">
              <Info label="Envío" value={order.shippingMethodName} />
              {address && (
                <Info
                  label="Dirección"
                  value={
                    <>
                      {address.street} {address.number}
                      {address.apartment && `, ${address.apartment}`}
                      <br />
                      {address.city}, {address.province} · CP {address.postalCode}
                    </>
                  }
                />
              )}
              <Info label="Medio de pago" value={order.paymentMethodName} />
              {order.paymentReference && <Info label="Referencia" value={<span className="font-mono">{order.paymentReference}</span>} />}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="label-mono mb-1 text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
