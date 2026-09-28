'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'
import { FONT_KEYS, type Result, type SiteSettings } from '@/lib/data/types'

const hex = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Los colores deben ser hex, por ejemplo #ff4d00.')
const text = (max: number) => z.string().trim().max(max)
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((value) => value === '' || /^https?:\/\//.test(value), 'Las redes sociales deben ser URLs completas (https://…).')
const assetUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith('/') || value.startsWith('https://'), 'El logo y el favicon deben ser una ruta del sitio o una URL https.')
  .nullable()

const schema = z.object({
  storeName: text(40).min(1, 'La tienda necesita un nombre.'),
  sales: z.object({
    mode: z.enum(['whatsapp', 'cart']),
    whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, 'WhatsApp de ventas: sólo números con código de país (ej. 5493412623603).'),
    whatsappTemplate: text(400).min(10, 'Escribí el mensaje que se envía por WhatsApp.'),
  }),
  logoUrl: assetUrl,
  faviconUrl: assetUrl,
  colors: z.object({ accent: hex, ink: hex, paper: hex, surface: hex }),
  font: z.enum(FONT_KEYS),
  texts: z.object({ tagline: text(120), announcement: text(160), aboutTitle: text(80), aboutBody: text(1200), footerNote: text(160) }),
  socials: z.object({ instagram: optionalUrl, x: optionalUrl, tiktok: optionalUrl, youtube: optionalUrl, linkedin: optionalUrl }),
  contact: z.object({
    email: z.union([z.literal(''), z.string().trim().email('El email de contacto no es válido.')]),
    phone: text(40),
    whatsapp: z.string().trim().regex(/^\d{0,15}$/, 'WhatsApp: sólo números con código de país, sin + ni espacios (ej. 5491140000000).'),
    address: text(160),
    hours: text(120),
  }),
  seo: z.object({ title: text(70), description: text(170) }),
  currency: z.string().regex(/^[A-Z]{3}$/),
  locale: z.string().max(10),
  shippingMethods: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        name: text(60).min(1, 'Cada método de envío necesita un nombre.'),
        description: text(160),
        priceCents: z.number().int().min(0),
        freeOverCents: z.number().int().min(0).nullable(),
        eta: text(80),
        requiresAddress: z.boolean(),
        enabled: z.boolean(),
      }),
    )
    .max(10),
  paymentMethods: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        provider: z.enum(['transfer', 'cash', 'mock_card', 'mercadopago', 'stripe']),
        name: text(60).min(1, 'Cada medio de pago necesita un nombre.'),
        description: text(160),
        instructions: text(600),
        enabled: z.boolean(),
      }),
    )
    .max(10),
})

export async function saveSettings(raw: SiteSettings): Promise<Result<true>> {
  await requireAdmin()
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Revisá la configuración.' }
  if (!parsed.data.shippingMethods.some((method) => method.enabled)) return { data: null, error: 'Dejá al menos un método de envío activo: sin envío no se puede comprar.' }
  if (!parsed.data.paymentMethods.some((method) => method.enabled)) return { data: null, error: 'Dejá al menos un medio de pago activo: sin pagos no se puede comprar.' }
  try {
    await getRepository().saveSettings(parsed.data)
  } catch (error) {
    console.error('saveSettings failed', { error })
    return { data: null, error: 'No se pudo guardar la configuración.' }
  }
  revalidatePath('/', 'layout')
  return { data: true, error: null }
}
