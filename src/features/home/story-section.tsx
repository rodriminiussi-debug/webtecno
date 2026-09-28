import type { HomepageSection, Product } from '@/lib/data/types'
import { startingPrice } from '@/lib/pricing'
import { StoryScroller } from './story-scroller'

export function StorySection({ section, product, currency }: { section: HomepageSection<'story'>; product: Product | null; currency: string }) {
  const primary = section.config.imageUrl ?? product?.images[0]?.url ?? null
  const secondary = product?.images[1]?.url ?? null
  return (
    <StoryScroller
      title={section.title}
      subtitle={section.subtitle}
      eyebrow={section.config.eyebrow}
      body={section.config.body}
      points={section.config.points}
      ctaLabel={section.config.ctaLabel}
      href={product ? `/products/${product.slug}` : '/products'}
      primaryImage={primary}
      secondaryImage={secondary}
      imageAlt={product?.name ?? section.title}
      priceCents={product ? startingPrice(product) : null}
      currency={currency}
    />
  )
}
