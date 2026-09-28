import type { Metadata } from 'next'
import { getSettings } from '@/lib/store'
import { TrackOrderForm } from './track-order-form'

export const metadata: Metadata = { title: 'Mi cuenta', description: 'Seguí el estado de tu pedido.', robots: { index: false } }

export default async function AccountPage() {
  const settings = await getSettings()
  return (
    <div className="container-mono grid gap-14 pb-24 pt-[calc(var(--header-h)+3rem)] md:grid-cols-12 md:pt-[calc(var(--header-h)+5rem)]">
      <div className="md:col-span-6">
        <p className="label-mono text-muted">Mi cuenta</p>
        <h1 className="mt-4 text-headline font-semibold">Seguí tu pedido.</h1>
        <p className="mt-6 max-w-md text-lead text-ink-2">
          No necesitás crear una cuenta para comprar. Con el número de pedido y tu email ves el estado en tiempo real.
        </p>
      </div>
      <div className="md:col-span-5 md:col-start-8">
        <TrackOrderForm />
        <p className="mt-8 text-[14px] text-ink-2">
          ¿No encontrás el número? Está en el email de confirmación. También podés escribirnos a{' '}
          <a href={`mailto:${settings.contact.email}`} className="underline underline-offset-4">
            {settings.contact.email}
          </a>
          .
        </p>
      </div>
    </div>
  )
}
