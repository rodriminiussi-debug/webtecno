import 'server-only'
import { z } from 'zod'
import { getRepository } from './data'
import type { Order, OrderItem, SiteSettings } from './data/types'
import type { NewOrder, StockLine } from './data/repository'
import { shippingCost, variantPrice } from './pricing'
import { getPaymentProvider } from './payments/providers'
import type { PaymentStart } from './payments/types'
import { randomUUID } from 'node:crypto'

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `Completá ${label}.`).max(max, `${label} es demasiado largo.`)

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Tu carrito está vacío.')
    .max(50),
  customer: z.object({
    name: requiredText('tu nombre'),
    email: z.string().trim().email('Ingresá un email válido.').max(160),
    phone: z.string().trim().min(6, 'Ingresá un teléfono de contacto.').max(40),
    documentId: z.string().trim().max(20).default(''),
  }),
  shippingMethodId: z.string().min(1, 'Elegí un método de envío.'),
  address: z
    .object({
      street: z.string().trim().max(120),
      number: z.string().trim().max(20),
      apartment: z.string().trim().max(40),
      city: z.string().trim().max(80),
      province: z.string().trim().max(80),
      postalCode: z.string().trim().max(12),
    })
    .nullable(),
  paymentMethodId: z.string().min(1, 'Elegí un medio de pago.'),
  notes: z.string().trim().max(500).default(''),
})

export type CheckoutInput = z.input<typeof checkoutSchema>

export type CheckoutResult =
  | { ok: true; order: Pick<Order, 'number' | 'totalCents'>; payment: PaymentStart }
  | { ok: false; error: string; field?: string }

export function availablePaymentMethods(settings: SiteSettings) {
  return settings.paymentMethods.filter((method) => method.enabled && getPaymentProvider(method.provider).isConfigured())
}

/**
 * Prices, stock and shipping are recomputed here from the database.
 * Nothing the browser sends about money is trusted.
 */
export async function placeOrder(raw: unknown, siteUrl: string): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Revisá los datos del formulario.', field: issue?.path.join('.') }
  }
  const input = parsed.data
  const repository = getRepository()
  const settings = await repository.getSettings()

  const shipping = settings.shippingMethods.find((method) => method.id === input.shippingMethodId && method.enabled)
  if (!shipping) return { ok: false, error: 'El método de envío elegido ya no está disponible.', field: 'shippingMethodId' }

  const payment = availablePaymentMethods(settings).find((method) => method.id === input.paymentMethodId)
  if (!payment) return { ok: false, error: 'El medio de pago elegido ya no está disponible.', field: 'paymentMethodId' }
  if (payment.provider === 'cash' && shipping.requiresAddress) {
    return { ok: false, error: 'El pago en efectivo sólo está disponible para retiro en showroom.', field: 'paymentMethodId' }
  }

  let address = null
  if (shipping.requiresAddress) {
    const missing = input.address && (['street', 'number', 'city', 'province', 'postalCode'] as const).find((key) => !input.address?.[key])
    if (!input.address || missing) return { ok: false, error: 'Completá la dirección de entrega.', field: `address.${missing ?? 'street'}` }
    address = input.address
  }

  const items: OrderItem[] = []
  const stock: StockLine[] = []
  for (const line of input.items) {
    const product = await repository.getProductById(line.productId)
    if (!product || product.status !== 'published') {
      return { ok: false, error: 'Uno de los productos de tu carrito ya no está disponible.' }
    }
    const variant = line.variantId ? product.variants.find((item) => item.id === line.variantId) ?? null : null
    if (line.variantId && !variant) return { ok: false, error: `La opción elegida de ${product.name} ya no existe.` }
    if (!line.variantId && product.variants.length) return { ok: false, error: `Elegí una opción para ${product.name}.` }
    items.push({
      id: randomUUID(),
      productId: product.id,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name ?? null,
      sku: variant?.sku ?? product.sku,
      imageUrl: product.images[0]?.url ?? null,
      unitPriceCents: variantPrice(product, variant),
      quantity: line.quantity,
    })
    stock.push({ productId: product.id, variantId: variant?.id ?? null, quantity: line.quantity })
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
  const shippingCents = shippingCost(shipping, subtotalCents)

  const draft: NewOrder = {
    customerName: input.customer.name,
    customerEmail: input.customer.email.toLowerCase(),
    customerPhone: input.customer.phone,
    documentId: input.customer.documentId,
    shippingAddress: address,
    shippingMethodId: shipping.id,
    shippingMethodName: shipping.name,
    shippingCents,
    paymentMethodId: payment.id,
    paymentMethodName: payment.name,
    paymentProvider: payment.provider,
    paymentStatus: 'pending',
    paymentReference: null,
    status: 'pending',
    subtotalCents,
    totalCents: subtotalCents + shippingCents,
    notes: input.notes,
    items,
  }

  const created = await repository.createOrder(draft, stock)
  if (!created.ok) {
    const product = items.find((item) => item.productId === created.productId)
    return { ok: false, error: `No hay stock suficiente de ${product?.name ?? 'un producto'}. Ajustá la cantidad e intentá de nuevo.` }
  }

  let paymentStart: PaymentStart
  try {
    paymentStart = await getPaymentProvider(payment.provider).start(created.order, { siteUrl, instructions: payment.instructions })
  } catch (error) {
    console.error('placeOrder: payment start failed', { error, order: created.order.number, provider: payment.provider })
    // The order exists and stock is reserved; the customer can retry payment from the confirmation page
    paymentStart = { kind: 'instructions', text: 'No pudimos iniciar el pago. Tu pedido quedó reservado: escribinos y te enviamos un link de pago.' }
  }
  if (paymentStart.kind === 'approved') {
    await repository.updatePaymentStatus(created.order.number, 'paid', paymentStart.reference)
  }
  return { ok: true, order: { number: created.order.number, totalCents: created.order.totalCents }, payment: paymentStart }
}
