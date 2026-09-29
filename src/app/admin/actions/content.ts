'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'
import { FEATURE_VISUALS, type AnyHomepageSection, type HomepageSettings, type Result } from '@/lib/data/types'

const text = (max: number) => z.string().trim().max(max)
const url = z.string().trim().max(1000).nullable()
const color = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'El color de fondo debe ser un hex como #0a0a0b.')

const heroSchema = z.object({
  eyebrow: text(60),
  title: text(60).min(1, 'El Hero necesita un título.'),
  subtitle: text(160),
  ctaLabel: text(30).min(1, 'El botón principal necesita un texto.'),
  secondaryLabel: text(30),
  productId: z.string().nullable(),
  imageDesktop: url,
  imageMobile: url,
  background: color,
  productPosition: z.enum(['left', 'center', 'right']),
  animation: z.enum(['airpods', 'sequence', 'parallax', 'none']),
  frames: z.array(url.unwrap()).max(6),
  callouts: z.array(text(60)).max(4),
  showPrice: z.boolean(),
})

const base = { id: z.string().min(1).max(80), enabled: z.boolean(), sortOrder: z.number().int(), title: text(120), subtitle: text(300) }

const sectionSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('hero'), config: z.object({}).strict() }),
  z.object({
    ...base,
    type: z.literal('features'),
    config: z.object({
      eyebrow: text(60),
      productId: z.string().nullable(),
      items: z.array(z.object({ visual: z.enum(FEATURE_VISUALS), kicker: text(60), title: text(80), body: text(300), media: z.string().trim().max(300).nullable().optional() })).max(12),
    }),
  }),
  z.object({ ...base, type: z.literal('featured_products'), config: z.object({ productIds: z.array(z.string()).max(24), ctaLabel: text(40) }) }),
  z.object({ ...base, type: z.literal('categories'), config: z.object({ categoryIds: z.array(z.string()).max(24) }) }),
  z.object({
    ...base,
    type: z.literal('story'),
    config: z.object({
      eyebrow: text(60),
      productId: z.string().nullable(),
      imageUrl: url,
      body: text(600),
      ctaLabel: text(40),
      points: z.array(z.object({ title: text(30), body: text(120) })).max(3),
    }),
  }),
  z.object({
    ...base,
    type: z.literal('benefits'),
    config: z.object({ items: z.array(z.object({ icon: z.enum(['shipping', 'secure', 'warranty', 'support', 'returns', 'installments']), title: text(60), body: text(160) })).max(6) }),
  }),
  z.object({ ...base, type: z.literal('newsletter'), config: z.object({ placeholder: text(60), ctaLabel: text(30), note: text(120) }) }),
])

const payloadSchema = z.object({ sections: z.array(sectionSchema).max(20), hero: heroSchema })

export async function saveHomepage(raw: { sections: AnyHomepageSection[]; hero: HomepageSettings['hero'] }): Promise<Result<true>> {
  await requireAdmin()
  const parsed = payloadSchema.safeParse(raw)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Revisá los datos de las secciones.' }
  if (parsed.data.sections.filter((section) => section.type === 'hero').length > 1) return { data: null, error: 'Sólo puede haber un Hero.' }
  const sections = parsed.data.sections.map((section, index) => ({ ...section, sortOrder: index })) as AnyHomepageSection[]
  try {
    await getRepository().saveHomepage(sections, { hero: parsed.data.hero })
  } catch (error) {
    console.error('saveHomepage failed', { error })
    return { data: null, error: 'No se pudo guardar la página de inicio.' }
  }
  revalidatePath('/', 'layout')
  return { data: true, error: null }
}
