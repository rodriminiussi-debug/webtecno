import { HomeSections } from '@/features/home/home-sections'
import { getCategories, getHomepage, getPublishedProducts, getSettings, siteUrl } from '@/lib/store'

export const revalidate = 300

export default async function HomePage() {
  const [homepage, settings, products, categories] = await Promise.all([getHomepage(), getSettings(), getPublishedProducts(), getCategories()])
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName,
    url: siteUrl(),
    email: settings.contact.email || undefined,
    telephone: settings.contact.phone || undefined,
    sameAs: Object.values(settings.socials).filter(Boolean),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <HomeSections homepage={homepage} settings={settings} products={products} categories={categories.filter((c) => c.isVisible)} />
    </>
  )
}
