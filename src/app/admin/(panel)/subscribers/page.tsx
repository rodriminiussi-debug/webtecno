import { EmptyState, PageHeader, tableClass, tdClass, thClass } from '@/components/admin/ui'
import { getRepository } from '@/lib/data'
import { formatDateTime } from '@/lib/format'
import { CustomersExport } from '../customers/customers-export'

export const metadata = { title: 'Newsletter' }

export default async function SubscribersPage() {
  const subscribers = await getRepository().listSubscribers()
  return (
    <>
      <PageHeader
        title="Newsletter"
        description={`${subscribers.length} suscriptores desde la sección “Stay ahead.” de la home`}
        actions={<CustomersExport rows={subscribers.map((s) => [s.email, s.createdAt])} headers={['Email', 'Fecha']} filename="suscriptores.csv" />}
      />
      <div className="rounded-[var(--radius-md)] border border-line bg-surface">
        {subscribers.length === 0 ? (
          <EmptyState title="Sin suscriptores todavía" description="Cuando alguien se suscriba desde la home, aparece acá. Exportalo en CSV para tu herramienta de email." />
        ) : (
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Email</th>
                <th className={thClass}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className={tdClass}>{subscriber.email}</td>
                  <td className={`${tdClass} text-ink-2`}>{formatDateTime(subscriber.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
