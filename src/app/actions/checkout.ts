'use server'

import { revalidatePath } from 'next/cache'
import { placeOrder } from '@/lib/orders'
import { orderAccessToken } from '@/lib/order-access'
import { siteUrl } from '@/lib/store'

export type CheckoutActionResult =
  | { ok: true; redirectTo: string; external: boolean }
  | { ok: false; error: string; field?: string }

export async function submitCheckout(input: unknown): Promise<CheckoutActionResult> {
  try {
    const result = await placeOrder(input, siteUrl())
    if (!result.ok) return result
    // Stock changed: product pages and listings must not show stale availability
    revalidatePath('/', 'layout')
    const confirmation = `/checkout/success/${result.order.number}?t=${orderAccessToken(result.order.number)}`
    if (result.payment.kind === 'redirect') return { ok: true, redirectTo: result.payment.url, external: true }
    return { ok: true, redirectTo: confirmation, external: false }
  } catch (error) {
    console.error('submitCheckout failed', { error })
    return { ok: false, error: 'No pudimos procesar tu pedido. No se realizó ningún cobro: probá de nuevo en unos minutos.' }
  }
}
