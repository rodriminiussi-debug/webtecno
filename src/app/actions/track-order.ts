'use server'

import { z } from 'zod'
import { getRepository } from '@/lib/data'
import { orderAccessToken } from '@/lib/order-access'
import { isRateLimited } from '@/lib/auth/rate-limit'
import { headers } from 'next/headers'

export type TrackState = { status: 'idle' | 'error'; message: string }

const schema = z.object({
  number: z.string().trim().toUpperCase().regex(/^(MONO-)?\d{4,8}$/, 'Revisá el número: tiene el formato MONO-10023.'),
  email: z.string().trim().toLowerCase().email('Ingresá el email que usaste en la compra.'),
})

/** Returns a link to the protected confirmation page when number and email match. */
export async function trackOrder(_previous: TrackState, formData: FormData): Promise<TrackState & { redirectTo?: string }> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (isRateLimited(`track:${ip}`)) return { status: 'error', message: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' }
  const parsed = schema.safeParse({ number: formData.get('number'), email: formData.get('email') })
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }
  const number = parsed.data.number.startsWith('MONO-') ? parsed.data.number : `MONO-${parsed.data.number}`
  const order = await getRepository().getOrderByNumber(number)
  // Same message for "not found" and "email mismatch": do not reveal which orders exist
  if (!order || order.customerEmail !== parsed.data.email) {
    return { status: 'error', message: 'No encontramos un pedido con esos datos. Revisá el número y el email.' }
  }
  return { status: 'idle', message: '', redirectTo: `/checkout/success/${order.number}?t=${orderAccessToken(order.number)}` }
}
