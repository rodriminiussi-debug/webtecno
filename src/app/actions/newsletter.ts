'use server'

import { z } from 'zod'
import { getRepository } from '@/lib/data'

export type NewsletterState = { status: 'idle' | 'success' | 'error'; message: string }

const emailSchema = z.string().trim().toLowerCase().email().max(160)

export async function subscribe(_previous: NewsletterState, formData: FormData): Promise<NewsletterState> {
  // Honeypot: real people never fill this hidden field
  if (formData.get('company')) return { status: 'success', message: 'Listo. Te vamos a escribir pronto.' }
  const parsed = emailSchema.safeParse(formData.get('email'))
  if (!parsed.success) return { status: 'error', message: 'Revisá el email: parece que falta algo.' }
  try {
    const { created } = await getRepository().addSubscriber(parsed.data)
    return { status: 'success', message: created ? 'Listo. Te vamos a escribir pronto.' : 'Ya estabas suscripto. Gracias por seguir con nosotros.' }
  } catch (error) {
    console.error('subscribe failed', { error })
    return { status: 'error', message: 'No pudimos guardar tu suscripción. Probá de nuevo en unos minutos.' }
  }
}
