'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'
import type { Product, Result } from '@/lib/data/types'
import { slugify } from '@/lib/format'

const money = z.number().int().min(0).max(100_000_000_00)
const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((value) => value.startsWith('/') || /^https:\/\//.test(value), 'La imagen debe ser una ruta del sitio o una URL https.')

const productSchema = z.object({
  id: z.string().max(80).nullable(),
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(120),
  slug: z.string().trim().max(90),
  brand: z.string().trim().max(60),
  shortDescription: z.string().trim().max(240),
  description: z.string().trim().max(5000),
  priceCents: money,
  compareAtCents: money.nullable(),
  sku: z.string().trim().min(1, 'El SKU es obligatorio.').max(60),
  categoryId: z.string().nullable(),
  stock: z.number().int().min(0).max(1_000_000),
  images: z.array(z.object({ id: z.string().max(80), url: imageUrl, alt: z.string().trim().max(160) })).max(12),
  variantLabel: z.string().trim().max(40),
  variants: z
    .array(
      z.object({
        id: z.string().max(80),
        name: z.string().trim().min(1, 'Cada variante necesita un nombre.').max(60),
        sku: z.string().trim().max(60),
        priceCents: money.nullable(),
        stock: z.number().int().min(0).max(1_000_000),
        swatch: z.string().regex(/^#[0-9a-f]{6}$/i).nullable(),
      }),
    )
    .max(40),
  specs: z.array(z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) })).max(40),
  features: z.array(z.object({ title: z.string().trim().min(1).max(80), body: z.string().trim().max(300) })).max(12),
  isFeatured: z.boolean(),
  status: z.enum(['published', 'draft']),
  animation: z.enum(['none', 'float', 'airpods-3d']),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
})

export type ProductInput = z.input<typeof productSchema>

function refreshStore() {
  revalidatePath('/', 'layout')
}

export async function saveProduct(raw: ProductInput): Promise<Result<{ id: string; slug: string }>> {
  await requireAdmin()
  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Revisá los datos del producto.' }
  const input = parsed.data
  const repository = getRepository()
  const all = await repository.listProducts({ status: 'all' })
  const existing = input.id ? all.find((product) => product.id === input.id) : undefined
  if (input.id && !existing) return { data: null, error: 'El producto ya no existe. Recargá la página.' }

  const slug = slugify(input.slug || input.name)
  if (!slug) return { data: null, error: 'El slug no puede quedar vacío.' }
  if (all.some((product) => product.slug === slug && product.id !== existing?.id)) {
    return { data: null, error: `Ya existe otro producto con el slug “${slug}”. Elegí uno distinto.` }
  }
  if (all.some((product) => product.sku.toLowerCase() === input.sku.toLowerCase() && product.id !== existing?.id)) {
    return { data: null, error: `El SKU ${input.sku} ya está en uso en otro producto.` }
  }
  if (input.compareAtCents !== null && input.compareAtCents > 0 && input.compareAtCents <= input.priceCents) {
    return { data: null, error: 'El precio anterior tiene que ser mayor al precio actual (o quedar vacío).' }
  }

  const now = new Date().toISOString()
  const id = existing?.id ?? randomUUID()
  const variants = input.variants.map((variant, index) => ({ ...variant, sku: variant.sku || `${input.sku}-${index + 1}` }))
  const product: Product = {
    ...input,
    id,
    slug,
    compareAtCents: input.compareAtCents || null,
    // With variants, product stock is always the sum: one source of truth for availability
    stock: variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : input.stock,
    images: input.images.map((image, index) => ({ ...image, id: image.id || randomUUID(), sortOrder: index })),
    variants,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  try {
    await repository.saveProduct(product)
  } catch (error) {
    console.error('saveProduct failed', { error, id })
    return { data: null, error: 'No se pudo guardar el producto. Probá de nuevo.' }
  }
  refreshStore()
  return { data: { id, slug }, error: null }
}

export async function deleteProduct(id: string): Promise<Result<true>> {
  await requireAdmin()
  try {
    await getRepository().deleteProduct(id)
  } catch (error) {
    console.error('deleteProduct failed', { error, id })
    return { data: null, error: 'No se pudo eliminar el producto.' }
  }
  refreshStore()
  return { data: true, error: null }
}

export async function duplicateProduct(id: string): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const repository = getRepository()
  const [source, all] = await Promise.all([repository.getProductById(id), repository.listProducts({ status: 'all' })])
  if (!source) return { data: null, error: 'El producto original ya no existe.' }
  const taken = new Set(all.map((product) => product.slug))
  let slug = `${source.slug}-copia`
  for (let n = 2; taken.has(slug); n += 1) slug = `${source.slug}-copia-${n}`
  const skus = new Set(all.map((product) => product.sku))
  let sku = `${source.sku}-C`
  for (let n = 2; skus.has(sku); n += 1) sku = `${source.sku}-C${n}`
  const now = new Date().toISOString()
  const copy: Product = {
    ...structuredClone(source),
    id: randomUUID(),
    slug,
    sku,
    name: `${source.name} (copia)`,
    // Copies start hidden so a half-edited duplicate never appears in the store
    status: 'draft',
    isFeatured: false,
    images: source.images.map((image) => ({ ...image, id: randomUUID() })),
    variants: source.variants.map((variant, index) => ({ ...variant, id: randomUUID(), sku: `${sku}-${index + 1}` })),
    createdAt: now,
    updatedAt: now,
  }
  try {
    await repository.saveProduct(copy)
  } catch (error) {
    console.error('duplicateProduct failed', { error, id })
    return { data: null, error: 'No se pudo duplicar el producto.' }
  }
  refreshStore()
  return { data: { id: copy.id }, error: null }
}

export async function setProductStatus(id: string, status: 'published' | 'draft'): Promise<Result<true>> {
  await requireAdmin()
  const repository = getRepository()
  const product = await repository.getProductById(id)
  if (!product) return { data: null, error: 'El producto ya no existe.' }
  await repository.saveProduct({ ...product, status, updatedAt: new Date().toISOString() })
  refreshStore()
  return { data: true, error: null }
}
