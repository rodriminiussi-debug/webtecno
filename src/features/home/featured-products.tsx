import type { Category, HomepageSection, Product } from '@/lib/data/types'
import { ProductCard } from '@/components/store/product-card'
import { Reveal } from '@/components/reveal'
import { cn } from '@/lib/cn'
import { SectionHeading } from './section-heading'

/**
 * Editorial grid: the first product gets a full-height feature slot, the rest
 * follow in a quieter rhythm. On mobile it becomes a swipeable rail.
 */
export function FeaturedProducts({
  section,
  products,
  categories,
  currency,
}: {
  section: HomepageSection<'featured_products'>
  products: Product[]
  categories: Category[]
  currency: string
}) {
  if (!products.length) return null
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  const [lead, ...rest] = products
  return (
    <section className="py-24 md:py-36" aria-labelledby="featured-title">
      <div className="container-mono">
        <div id="featured-title">
          <SectionHeading index={`${String(products.length).padStart(2, '0')} productos`} title={section.title} subtitle={section.subtitle} link={{ href: '/products', label: section.config.ctaLabel || 'Ver todo' }} />
        </div>

        {/* Desktop / tablet: editorial grid */}
        <div className="mt-16 hidden gap-x-6 gap-y-14 md:grid md:grid-cols-12">
          <Reveal className="md:col-span-6 md:row-span-2">
            <ProductCard product={lead} currency={currency} categoryName={lead.categoryId ? categoryName.get(lead.categoryId) : undefined} size="lg" priority className="h-full" />
          </Reveal>
          {rest.map((product, index) => (
            <Reveal key={product.id} delay={(index % 2) * 90} className={cn(index < 4 ? 'md:col-span-3' : 'md:col-span-4')}>
              <ProductCard product={product} currency={currency} categoryName={product.categoryId ? categoryName.get(product.categoryId) : undefined} />
            </Reveal>
          ))}
        </div>
      </div>

      {/* Mobile: snap rail, designed for the thumb rather than a shrunken grid */}
      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] md:hidden">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} currency={currency} priority={index === 0} className="w-[78vw] max-w-[340px] shrink-0 snap-start" />
        ))}
      </div>
    </section>
  )
}
