import { EmptyState, PageHeader, tableClass, tdClass, thClass } from '@/components/admin/ui'
import { getRepository } from '@/lib/data'
import type { CustomerSummary } from '@/lib/data/types'
import { formatDate, formatMoney } from '@/lib/format'
import { isRevenueOrder } from '@/lib/stats'
import { CustomersExport } from './customers-export'

export const metadata = { title: 'Clientes' }

export default async function AdminCustomersPage() {
  const repository = getRepository()
  const [customers, orders, settings] = await Promise.all([repository.listCustomers(), repository.listOrders(), repository.getSettings()])
  const summaries: CustomerSummary[] = customers
    .map((customer) => {
      const own = orders.filter((order) => order.customerEmail === customer.email)
      return {
        ...customer,
        ordersCount: own.length,
        totalSpentCents: own.filter(isRevenueOrder).reduce((sum, order) => sum + order.totalCents, 0),
        lastOrderAt: own[0]?.createdAt ?? null,
      }
    })
    .sort((a, b) => b.totalSpentCents - a.totalSpentCents)
  return (
    <>
      <PageHeader title="Clientes" description={`${customers.length} clientes que compraron en la tienda`} actions={<CustomersExport rows={summaries.map((c) => [c.name, c.email, c.phone, String(c.ordersCount), String(c.totalSpentCents / 100)])} />} />
      <div className="rounded-[var(--radius-md)] border border-line bg-surface">
        {summaries.length === 0 ? (
          <EmptyState title="Todavía no hay clientes" description="Se agregan automáticamente con cada compra." />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Teléfono</th>
                  <th className={`${thClass} text-right`}>Pedidos</th>
                  <th className={`${thClass} text-right`}>Total gastado</th>
                  <th className={thClass}>Último pedido</th>
                  <th className={thClass}>Cliente desde</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((customer) => (
                  <tr key={customer.id} className="hover:bg-tile">
                    <td className={tdClass}>
                      <span className="block font-medium">{customer.name}</span>
                      <a href={`mailto:${customer.email}`} className="block text-[12px] text-muted hover:underline">
                        {customer.email}
                      </a>
                    </td>
                    <td className={`${tdClass} text-ink-2`}>{customer.phone || '—'}</td>
                    <td className={`${tdClass} tabular text-right`}>{customer.ordersCount}</td>
                    <td className={`${tdClass} tabular text-right font-medium`}>{formatMoney(customer.totalSpentCents, settings.currency)}</td>
                    <td className={`${tdClass} text-ink-2`}>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}</td>
                    <td className={`${tdClass} text-ink-2`}>{formatDate(customer.createdAt)}</td>
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
