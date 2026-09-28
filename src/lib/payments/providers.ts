import 'server-only'
import type { PaymentProviderId } from '../data/types'
import type { PaymentProvider } from './types'
import { orderAccessToken } from '../order-access'

const offline = (id: PaymentProviderId): PaymentProvider => ({
  id,
  isConfigured: () => true,
  start: async (_order, { instructions }) => ({ kind: 'instructions', text: instructions }),
})

const mockCard: PaymentProvider = {
  id: 'mock_card',
  isConfigured: () => true,
  start: async (order) => ({ kind: 'approved', reference: `DEMO-${order.number}` }),
}

// https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
const mercadoPago: PaymentProvider = {
  id: 'mercadopago',
  isConfigured: () => Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
  async start(order, { siteUrl }) {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id,
      },
      body: JSON.stringify({
        external_reference: order.number,
        items: [
          ...order.items.map((item) => ({
            id: item.sku,
            title: item.variantName ? `${item.name} · ${item.variantName}` : item.name,
            quantity: item.quantity,
            unit_price: item.unitPriceCents / 100,
            currency_id: 'ARS',
          })),
          ...(order.shippingCents > 0
            ? [{ id: 'shipping', title: order.shippingMethodName, quantity: 1, unit_price: order.shippingCents / 100, currency_id: 'ARS' }]
            : []),
        ],
        payer: { email: order.customerEmail, name: order.customerName },
        back_urls: {
          success: `${siteUrl}/checkout/success/${order.number}?t=${orderAccessToken(order.number)}`,
          pending: `${siteUrl}/checkout/success/${order.number}?t=${orderAccessToken(order.number)}`,
          failure: `${siteUrl}/checkout/success/${order.number}?t=${orderAccessToken(order.number)}`,
        },
        auto_return: 'approved',
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      }),
    })
    if (!response.ok) {
      console.error('mercadoPago.start failed', { status: response.status, body: await response.text(), order: order.number })
      throw new Error('Mercado Pago preference failed')
    }
    const data = (await response.json()) as { init_point: string }
    return { kind: 'redirect', url: data.init_point }
  },
}

// https://docs.stripe.com/api/checkout/sessions/create
const stripe: PaymentProvider = {
  id: 'stripe',
  isConfigured: () => Boolean(process.env.STRIPE_SECRET_KEY),
  async start(order, { siteUrl }) {
    const body = new URLSearchParams({
      mode: 'payment',
      client_reference_id: order.number,
      customer_email: order.customerEmail,
      success_url: `${siteUrl}/checkout/success/${order.number}?t=${orderAccessToken(order.number)}&stripe_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/success/${order.number}?t=${orderAccessToken(order.number)}`,
    })
    const lines = [
      ...order.items.map((item) => ({ name: item.name, amount: item.unitPriceCents, quantity: item.quantity })),
      ...(order.shippingCents > 0 ? [{ name: order.shippingMethodName, amount: order.shippingCents, quantity: 1 }] : []),
    ]
    lines.forEach((line, index) => {
      body.set(`line_items[${index}][price_data][currency]`, 'ars')
      body.set(`line_items[${index}][price_data][product_data][name]`, line.name)
      body.set(`line_items[${index}][price_data][unit_amount]`, String(line.amount))
      body.set(`line_items[${index}][quantity]`, String(line.quantity))
    })
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': order.id,
      },
      body,
    })
    if (!response.ok) {
      console.error('stripe.start failed', { status: response.status, body: await response.text(), order: order.number })
      throw new Error('Stripe session failed')
    }
    const data = (await response.json()) as { url: string }
    return { kind: 'redirect', url: data.url }
  },
}

const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  transfer: offline('transfer'),
  cash: offline('cash'),
  mock_card: mockCard,
  mercadopago: mercadoPago,
  stripe,
}

export function getPaymentProvider(id: PaymentProviderId) {
  return PROVIDERS[id]
}

export async function verifyStripeSession(sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) return null
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  })
  if (!response.ok) {
    console.error('verifyStripeSession failed', { status: response.status, sessionId })
    return null
  }
  const data = (await response.json()) as { payment_status: string; client_reference_id: string; payment_intent: string | null }
  return data
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return null
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  })
  if (!response.ok) {
    console.error('fetchMercadoPagoPayment failed', { status: response.status, paymentId })
    return null
  }
  return (await response.json()) as { status: string; external_reference: string; id: number }
}
