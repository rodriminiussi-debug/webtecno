import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckIcon } from '@/components/icons'
import { OrderDetails, OrderProgress } from '@/components/store/order-details'
import { buttonClass } from '@/components/ui/button'
import { getRepository } from '@/lib/data'
import { verifyOrderAccessToken } from '@/lib/order-access'
import { verifyStripeSession } from '@/lib/payments/providers'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; stripe_session?: string }> }

export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const [{ number }, { t, stripe_session: stripeSession }] = await Promise.all([params, searchParams])
  if (!verifyOrderAccessToken(number, t)) notFound()
  const repository = getRepository()
  let order = await repository.getOrderByNumber(number)
  if (!order) notFound()

  // Returning from Stripe: confirm with Stripe's API, never trust the URL alone
  if (stripeSession && order.paymentStatus === 'pending') {
    const session = await verifyStripeSession(stripeSession)
    if (session?.client_reference_id === order.number && session.payment_status === 'paid') {
      order = (await repository.updatePaymentStatus(order.number, 'paid', session.payment_intent)) ?? order
    }
  }

  const settings = await getSettings()
  const method = settings.paymentMethods.find((item) => item.id === order.paymentMethodId)
  const showInstructions = order.paymentStatus === 'pending' && method?.instructions

  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <div className="max-w-3xl">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-ink text-paper">
          <CheckIcon size={24} />
        </span>
        <p className="label-mono mt-8 text-muted">Pedido {order.number}</p>
        <h1 className="mt-3 text-headline font-semibold">Gracias, {order.customerName.split(' ')[0]}.</h1>
        <p className="mt-5 max-w-xl text-lead text-ink-2">
          {order.paymentStatus === 'paid'
            ? 'Recibimos tu pago y ya estamos preparando tu pedido.'
            : 'Registramos tu pedido. Lo confirmamos apenas se acredite el pago.'}{' '}
          Te enviamos el detalle a <span className="text-ink">{order.customerEmail}</span>.
        </p>
      </div>

      {showInstructions && (
        <div className="mt-10 max-w-3xl rounded-[var(--radius-lg)] border border-line-strong p-6">
          <p className="label-mono mb-3 text-muted">Cómo pagar</p>
          <p className="text-[15px] leading-relaxed">{method.instructions}</p>
        </div>
      )}

      <div className="mt-14 max-w-3xl">
        <OrderProgress status={order.status} />
      </div>

      <div className="mt-14">
        <OrderDetails order={order} currency={settings.currency} />
      </div>

      <div className="mt-14 flex flex-wrap gap-3">
        <Link href="/products" className={buttonClass({ size: 'lg' })}>
          Seguir comprando
        </Link>
        <Link href="/account" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          Seguir mi pedido
        </Link>
      </div>
    </div>
  )
}
