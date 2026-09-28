'use server'

import { z } from 'zod'
import { getRepository } from '@/lib/data'
import { variantPrice } from '@/lib/pricing'

const linesSchema = z.array(z.object({ productId: z.string(), variantId: z.string().nullable() })).max(50)

export type CartSnapshot = {
  productId: string
  variantId: string | null
  available: boolean
  name: string
  variantName: string | null
  unitPriceCents: number
  maxQuantity: number
  imageUrl: string | null
  slug: string
}

/** Re-reads price and stock for the lines in a browser cart, so stale carts self-correct. */
export async function refreshCart(raw: unknown): Promise<CartSnapshot[]> {
  const parsed = linesSchema.safeParse(raw)
  if (!parsed.success) return []
  const repository = getRepository()
  const products = await repository.listProducts({ status: 'published' })
  const byId = new Map(products.map((product) => [product.id, product]))
  return parsed.data.map(({ productId, variantId }) => {
    const product = byId.get(productId)
    const variant = product && variantId ? product.variants.find((item) => item.id === variantId) ?? null : null
    if (!product || (variantId && !variant)) {
      return { productId, variantId, available: false, name: '', variantName: null, unitPriceCents: 0, maxQuantity: 0, imageUrl: null, slug: '' }
    }
    const stock = variant ? variant.stock : product.stock
    return {
      productId,
      variantId,
      available: stock > 0,
      name: product.name,
      variantName: variant?.name ?? null,
      unitPriceCents: variantPrice(product, variant),
      maxQuantity: stock,
      imageUrl: product.images[0]?.url ?? null,
      slug: product.slug,
    }
  })
}
