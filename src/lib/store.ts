import 'server-only'
import { cache } from 'react'
import { getRepository } from './data'
import type { Category, Product } from './data/types'

// Request-scoped memoization: several components can ask for the same data
// during one render without hitting the database twice.

export const getSettings = cache(() => getRepository().getSettings())
export const getCategories = cache(() => getRepository().listCategories())
export const getPublishedProducts = cache(() => getRepository().listProducts({ status: 'published' }))
export const getHomepage = cache(() => getRepository().getHomepage())

export const getProductBySlug = cache(async (slug: string) => {
  const product = await getRepository().getProductBySlug(slug)
  return product && product.status === 'published' ? product : null
})

export async function getVisibleCategories() {
  return (await getCategories()).filter((category) => category.isVisible)
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export function categoryMap(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category]))
}

export function relatedProducts(product: Product, all: Product[], limit = 4) {
  const sameCategory = all.filter((item) => item.id !== product.id && item.categoryId === product.categoryId)
  const others = all.filter((item) => item.id !== product.id && item.categoryId !== product.categoryId && item.isFeatured)
  return [...sameCategory, ...others].slice(0, limit)
}
