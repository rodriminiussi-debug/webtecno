import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getRepository } from '@/lib/data'
import { fetchMercadoPagoPayment } from '@/lib/payments/providers'

const STATUS_MAP = { approved: 'paid', rejected: 'failed', cancelled: 'failed', refunded: 'refunded' } as const

/**
 * Mercado Pago notifications carry only an id; the payment is re-fetched from
 * Mercado Pago's API with our token, so a forged notification cannot mark an order paid.
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl
  let paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
  if (!paymentId) {
    try {
      const body = (await request.json()) as { data?: { id?: string | number }; type?: string }
      paymentId = body.data?.id ? String(body.data.id) : null
    } catch (error) {
      console.warn('mercadopago webhook: unreadable body', { error })
    }
  }
  if (!paymentId) return NextResponse.json({ ignored: true })

  const payment = await fetchMercadoPagoPayment(paymentId)
  if (!payment) return NextResponse.json({ ignored: true })
  const status = STATUS_MAP[payment.status as keyof typeof STATUS_MAP]
  if (!status) return NextResponse.json({ ok: true, status: payment.status })

  const order = await getRepository().updatePaymentStatus(payment.external_reference, status, String(payment.id))
  if (!order) console.warn('mercadopago webhook: order not found', { reference: payment.external_reference })
  revalidatePath('/admin', 'layout')
  return NextResponse.json({ ok: true })
}
