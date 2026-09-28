import Link from 'next/link'
import { OrderStatusBadge, PageHeader, Panel, tableClass, tdClass, thClass } from '@/components/admin/ui'
import { getRepository } from '@/lib/data'
import { ORDER_STATUSES } from '@/lib/data/types'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { ORDER_STATUS_LABEL } from '@/lib/order-status'
import { buildDashboardStats } from '@/lib/stats'
import { RevenueChart } from './revenue-chart'

export default async function DashboardPage() {
  const repository = getRepository()
  const [orders, products, settings] = await Promise.all([repository.listOrders(), repository.listProducts({ status: 'all' }), repository.getSettings()])
  const stats = buildDashboardStats(orders, products)
  const money = (cents: number) => formatMoney(cents, settings.currency)
  const change = stats.revenueChange
  const maxTop = Math.max(...stats.topProducts.map((item) => item.revenueCents), 1)
  const maxStatus = Math.max(...Object.values(stats.byStatus), 1)

  return (
    <>
      <PageHeader title="Dashboard" description="Resumen de los últimos 30 días. Los ingresos cuentan pedidos confirmados, en preparación, enviados y entregados." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ingresos · 30 días" value={money(stats.revenue30)} detail={change === null ? 'Sin período anterior para comparar' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change * 100).toFixed(0)}% vs. 30 días previos`} tone={change === null ? 'muted' : change >= 0 ? 'good' : 'bad'} />
        <Stat label="Pedidos · 30 días" value={formatNumber(stats.orders30)} detail={`Ticket promedio ${money(stats.averageTicket)}`} />
        <Stat label="Pendientes" value={formatNumber(stats.pendingOrders)} detail={stats.pendingOrders ? 'Requieren revisión' : 'Todo al día'} href="/admin/orders?status=pending" tone={stats.pendingOrders ? 'warn' : 'muted'} />
        <Stat label="Clientes" value={formatNumber(stats.customers)} detail={`${formatNumber(stats.publishedProducts)} productos publicados · ${formatNumber(stats.stockUnits)} u. en stock`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Ingresos diarios" description="Últimos 30 días" className="lg:col-span-2">
          <RevenueChart data={stats.daily} currency={settings.currency} />
        </Panel>
        <Panel title="Pedidos por estado">
          <ul className="flex flex-col gap-3">
            {ORDER_STATUSES.map((status) => {
              const count = stats.byStatus[status] ?? 0
              return (
                <li key={status}>
                  <Link href={`/admin/orders?status=${status}`} className="group block">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-ink-2 group-hover:text-ink">{ORDER_STATUS_LABEL[status]}</span>
                      <span className="tabular font-medium">{count}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tile-2">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(count / maxStatus) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Más vendidos" description="Por ingresos, histórico" className="lg:col-span-1">
          {stats.topProducts.length === 0 ? (
            <p className="text-[13px] text-muted">Todavía no hay ventas confirmadas.</p>
          ) : (
            <ol className="flex flex-col gap-3.5">
              {stats.topProducts.map((item, index) => (
                <li key={item.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate">
                      <span className="label-mono mr-2 text-muted">{index + 1}</span>
                      {item.name}
                    </span>
                    <span className="tabular shrink-0 font-medium">{money(item.revenueCents)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-tile-2">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(item.revenueCents / maxTop) * 100}%` }} />
                    </div>
                    <span className="tabular w-12 text-right text-[12px] text-muted">{item.units} u.</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Últimos pedidos" actions={<Link href="/admin/orders" className="text-[13px] text-ink-2 hover:text-ink">Ver todos →</Link>} className="lg:col-span-2" padded={false}>
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Pedido</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Fecha</th>
                  <th className={thClass}>Estado</th>
                  <th className={`${thClass} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-tile">
                    <td className={tdClass}>
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-[12px] font-medium hover:underline">
                        {order.number}
                      </Link>
                    </td>
                    <td className={tdClass}>{order.customerName}</td>
                    <td className={`${tdClass} text-ink-2`}>{formatDate(order.createdAt)}</td>
                    <td className={tdClass}>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className={`${tdClass} tabular text-right`}>{money(order.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <Panel title="Stock bajo" description="Productos publicados con 5 unidades o menos" className="mt-3" padded={false}>
        {stats.lowStock.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-muted">No hay productos con stock bajo.</p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.lowStock.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3 text-[13px]">
                <Link href={`/admin/products/${product.id}`} className="hover:underline">
                  {product.name}
                </Link>
                <span className={`tabular font-medium ${product.stock === 0 ? 'text-danger' : 'text-warning'}`}>{product.stock === 0 ? 'Sin stock' : `${product.stock} u.`}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}

function Stat({ label, value, detail, tone = 'muted', href }: { label: string; value: string; detail: string; tone?: 'muted' | 'good' | 'bad' | 'warn'; href?: string }) {
  const toneClass = { muted: 'text-muted', good: 'text-success', bad: 'text-danger', warn: 'text-warning' }[tone]
  const body = (
    <>
      <p className="label-mono text-muted">{label}</p>
      <p className="tabular mt-3 text-[26px] font-semibold tracking-[-0.03em]">{value}</p>
      <p className={`mt-1 text-[12px] ${toneClass}`}>{detail}</p>
    </>
  )
  const className = 'block rounded-[var(--radius-md)] border border-line bg-surface p-4 md:p-5'
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-line-strong`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
