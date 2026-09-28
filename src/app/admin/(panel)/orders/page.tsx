import Link from 'next/link'
import { EmptyState, OrderStatusBadge, PageHeader, PaymentStatusBadge, tableClass, tdClass, thClass } from '@/components/admin/ui'
import { getRepository } from '@/lib/data'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/data/types'
import { formatDateTime, formatMoney } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/order-status'
import { cn } from '@/lib/cn'
import { OrdersSearch } from './orders-search'

export const metadata = { title: 'Pedidos' }

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status: rawStatus, q = '' } = await searchParams
  const status = ORDER_STATUSES.includes(rawStatus as OrderStatus) ? (rawStatus as OrderStatus) : null
  const repository = getRepository()
  const [orders, settings] = await Promise.all([repository.listOrders(), repository.getSettings()])
  const term = q.trim().toLowerCase()
  const filtered = orders.filter(
    (order) =>
      (!status || order.status === status) &&
      (!term || order.number.toLowerCase().includes(term) || order.customerName.toLowerCase().includes(term) || order.customerEmail.includes(term)),
  )
  const counts = orders.reduce<Record<string, number>>((acc, order) => ({ ...acc, [order.status]: (acc[order.status] ?? 0) + 1 }), {})
  const href = (next: OrderStatus | null) => {
    const params = new URLSearchParams()
    if (next) params.set('status', next)
    if (q) params.set('q', q)
    const query = params.toString()
    return `/admin/orders${query ? `?${query}` : ''}`
  }

  return (
    <>
      <PageHeader title="Pedidos" description={`${orders.length} pedidos en total`} />
      <div className="rounded-[var(--radius-md)] border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-3">
          <nav aria-label="Filtrar por estado" className="no-scrollbar flex gap-1 overflow-x-auto">
            {[null, ...ORDER_STATUSES].map((item) => (
              <Link
                key={item ?? 'all'}
                href={href(item)}
                aria-current={status === item ? 'page' : undefined}
                className={cn('whitespace-nowrap rounded-full px-3 py-1.5 text-[13px]', status === item ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-tile')}
              >
                {item ? ORDER_STATUS_LABEL[item] : 'Todos'} <span className="tabular opacity-60">{item ? counts[item] ?? 0 : orders.length}</span>
              </Link>
            ))}
          </nav>
          <OrdersSearch defaultValue={q} />
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="No hay pedidos" description={status || term ? 'Ningún pedido coincide con el filtro.' : 'Cuando entren ventas, aparecen acá.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Pedido</th>
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Productos</th>
                  <th className={thClass}>Pago</th>
                  <th className={thClass}>Estado</th>
                  <th className={`${thClass} text-right`}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="group hover:bg-tile">
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-[12px] font-medium group-hover:underline">
                        {order.number}
                      </Link>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-ink-2`}>{formatDateTime(order.createdAt)}</td>
                    <td className={tdClass}>
                      <span className="block">{order.customerName}</span>
                      <span className="block text-[12px] text-muted">{order.customerEmail}</span>
                    </td>
                    <td className={`${tdClass} max-w-[260px] text-ink-2`}>
                      <span className="line-clamp-2">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')}</span>
                    </td>
                    <td className={tdClass}>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </td>
                    <td className={tdClass}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className={`${tdClass} tabular text-right font-medium`}>{formatMoney(order.totalCents, settings.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
