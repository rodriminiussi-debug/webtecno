import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/store'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/cart', '/account'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
