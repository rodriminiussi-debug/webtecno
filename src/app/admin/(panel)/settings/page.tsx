import { getRepository } from '@/lib/data'
import { getPaymentProvider } from '@/lib/payments/providers'
import type { PaymentProviderId } from '@/lib/data/types'
import { SettingsForm } from './settings-form'

export const metadata = { title: 'Configuración' }

export default async function SettingsPage() {
  const repository = getRepository()
  const settings = await repository.getSettings()
  const providers: PaymentProviderId[] = ['transfer', 'cash', 'mock_card', 'mercadopago', 'stripe']
  const configured = Object.fromEntries(providers.map((id) => [id, getPaymentProvider(id).isConfigured()])) as Record<PaymentProviderId, boolean>
  return <SettingsForm settings={settings} configured={configured} storage={repository.kind} />
}
