import type { MetadataRoute } from 'next'
import { getPublishedProducts, getVisibleCategories, siteUrl } from '@/lib/store'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [products, categories] = await Promise.all([getPublishedProducts(), getVisibleCategories()])
  const staticPages = ['', '/products', '/categories', '/about', '/support', '/terms', '/privacy'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.6,
  }))
  return [
    ...staticPages,
    ...categories.map((category) => ({ url: `${base}/products?category=${category.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((product) => ({ url: `${base}/products/${product.slug}`, lastModified: product.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
