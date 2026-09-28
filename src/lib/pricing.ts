import type { Product, ProductVariant, ShippingMethod } from './data/types'

export const LOW_STOCK_THRESHOLD = 5

export function discountPercent(priceCents: number, compareAtCents: number | null) {
  if (!compareAtCents || compareAtCents <= priceCents) return 0
  return Math.round((1 - priceCents / compareAtCents) * 100)
}

export function priceFromDiscount(compareAtCents: number, percent: number) {
  const clamped = Math.min(Math.max(percent, 0), 95)
  // Round to whole pesos: prices with cents look careless in ARS
  return Math.round((compareAtCents * (1 - clamped / 100)) / 100) * 100
}

export function variantPrice(product: Product, variant: ProductVariant | null) {
  return variant?.priceCents ?? product.priceCents
}

/** Lowest price among variants, for "desde $" labels. */
export function startingPrice(product: Product) {
  if (!product.variants.length) return product.priceCents
  return Math.min(...product.variants.map((variant) => variant.priceCents ?? product.priceCents))
}

export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock'

export function availabilityOf(stock: number): Availability {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= LOW_STOCK_THRESHOLD) return 'low_stock'
  return 'in_stock'
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: 'En stock',
  low_stock: 'Últimas unidades',
  out_of_stock: 'Sin stock',
}

export function shippingCost(method: ShippingMethod, subtotalCents: number) {
  if (method.freeOverCents !== null && subtotalCents >= method.freeOverCents) return 0
  return method.priceCents
}
