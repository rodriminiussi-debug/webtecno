import type { Metadata } from 'next'
import { availablePaymentMethods } from '@/lib/orders'
import { getSettings } from '@/lib/store'
import { CheckoutForm } from './checkout-form'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const settings = await getSettings()
  const shipping = settings.shippingMethods.filter((method) => method.enabled)
  const payments = availablePaymentMethods(settings).map(({ id, name, description, provider }) => ({ id, name, description, provider }))
  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+4rem)]">
      <p className="label-mono text-muted">Compra segura</p>
      <h1 className="mt-4 text-headline font-semibold">Checkout</h1>
      <CheckoutForm currency={settings.currency} shippingMethods={shipping} paymentMethods={payments} />
    </div>
  )
}
