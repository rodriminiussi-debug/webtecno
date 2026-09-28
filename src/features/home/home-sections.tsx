import type { AnyHomepageSection, Category, HomepageSettings, Product, SiteSettings } from '@/lib/data/types'
import { HeroSection, type HeroProduct } from '@/features/hero/hero-section'
import { isDark } from '@/lib/theme'
import { startingPrice } from '@/lib/pricing'
import { FeaturedProducts } from './featured-products'
import { CategoriesIndex } from './categories-index'
import { StorySection } from './story-section'
import { BenefitsSection } from './benefits-section'
import { NewsletterSection } from './newsletter-section'

type Props = {
  homepage: { sections: AnyHomepageSection[]; settings: HomepageSettings }
  settings: SiteSettings
  products: Product[]
  categories: Category[]
}

export function toHeroProduct(product: Product | undefined): HeroProduct | null {
  if (!product) return null
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: startingPrice(product),
    compareAtCents: product.variants.length ? null : product.compareAtCents,
    stock: product.stock,
    imageUrl: product.images[0]?.url ?? null,
    hasVariants: product.variants.length > 0,
  }
}

/** Renders the admin-configured sections, in the admin-configured order. */
export function HomeSections({ homepage, settings, products, categories }: Props) {
  const byId = new Map(products.map((product) => [product.id, product]))
  const sections = homepage.sections.filter((section) => section.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
  return (
    <>
      {sections.map((section) => {
        switch (section.type) {
          case 'hero': {
            const hero = homepage.settings.hero
            return (
              <HeroSection
                key={section.id}
                config={hero}
                product={toHeroProduct(hero.productId ? byId.get(hero.productId) : undefined)}
                currency={settings.currency}
                darkBackground={isDark(hero.background)}
              />
            )
          }
          case 'featured_products': {
            const picked = section.config.productIds.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
            const list = picked.length ? picked : products.filter((product) => product.isFeatured)
            return <FeaturedProducts key={section.id} section={section} products={list} categories={categories} currency={settings.currency} />
          }
          case 'categories': {
            const chosen = section.config.categoryIds.length
              ? section.config.categoryIds.map((id) => categories.find((c) => c.id === id)).filter((c): c is Category => Boolean(c))
              : categories
            const counts = new Map<string, number>()
            for (const product of products) if (product.categoryId) counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1)
            return <CategoriesIndex key={section.id} section={section} categories={chosen} counts={counts} />
          }
          case 'story': {
            const product = section.config.productId ? byId.get(section.config.productId) : undefined
            return <StorySection key={section.id} section={section} product={product ?? null} currency={settings.currency} />
          }
          case 'benefits':
            return <BenefitsSection key={section.id} section={section} />
          case 'newsletter':
            return <NewsletterSection key={section.id} section={section} />
          default:
            return null
        }
      })}
    </>
  )
}
