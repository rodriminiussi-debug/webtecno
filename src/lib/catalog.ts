import type { Product } from './data/types'
import { availabilityOf, startingPrice } from './pricing'

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Destacados' },
  { value: 'newest', label: 'Novedades' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'name', label: 'Nombre' },
] as const

export type SortValue = (typeof SORT_OPTIONS)[number]['value']

export type CatalogFilters = {
  q: string
  category: string | null
  sort: SortValue
  min: number | null
  max: number | null
  inStock: boolean
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toPesos(value: string | undefined) {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters {
  const sort = first(params.sort)
  return {
    q: (first(params.q) ?? '').trim().slice(0, 80),
    category: first(params.category) || null,
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortValue) : 'featured',
    min: toPesos(first(params.min)),
    max: toPesos(first(params.max)),
    inStock: first(params.stock) === '1',
  }
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function matchesQuery(product: Product, query: string) {
  if (!query) return true
  const haystack = normalize(`${product.name} ${product.brand} ${product.shortDescription} ${product.sku}`)
  return normalize(query)
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

/** Pure function so it can run on the server (SEO-friendly URLs) and be unit tested. */
export function filterProducts(products: Product[], filters: CatalogFilters, categoryIdBySlug: Map<string, string>) {
  const categoryId = filters.category ? categoryIdBySlug.get(filters.category) : null
  const result = products.filter((product) => {
    if (filters.category && product.categoryId !== categoryId) return false
    if (!matchesQuery(product, filters.q)) return false
    const price = startingPrice(product) / 100
    if (filters.min !== null && price < filters.min) return false
    if (filters.max !== null && price > filters.max) return false
    if (filters.inStock && availabilityOf(product.stock) === 'out_of_stock') return false
    return true
  })
  const byPrice = (product: Product) => startingPrice(product)
  switch (filters.sort) {
    case 'price-asc':
      return result.sort((a, b) => byPrice(a) - byPrice(b))
    case 'price-desc':
      return result.sort((a, b) => byPrice(b) - byPrice(a))
    case 'name':
      return result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    case 'newest':
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    default:
      // Featured first, then in-stock before out-of-stock
      return result.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(a.stock <= 0) - Number(b.stock <= 0) ||
          a.name.localeCompare(b.name, 'es'),
      )
  }
}
