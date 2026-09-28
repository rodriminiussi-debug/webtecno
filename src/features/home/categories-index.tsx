import Link from 'next/link'
import type { Category, HomepageSection } from '@/lib/data/types'
import { ProductImage } from '@/components/product-image'
import { SectionHeading } from './section-heading'
import { CategoryHoverList } from './category-hover-list'

export function CategoriesIndex({
  section,
  categories,
  counts,
}: {
  section: HomepageSection<'categories'>
  categories: Category[]
  counts: Map<string, number>
}) {
  if (!categories.length) return null
  const items = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    imageUrl: category.imageUrl,
    count: counts.get(category.id) ?? 0,
  }))
  return (
    <section className="border-t border-line py-24 md:py-36" aria-labelledby="categories-title">
      <div className="container-mono">
        <div id="categories-title">
          <SectionHeading index="Índice" title={section.title} subtitle={section.subtitle} link={{ href: '/categories', label: 'Todas las categorías' }} />
        </div>
        <div className="mt-14 hidden md:block">
          <CategoryHoverList items={items} />
        </div>
      </div>

      {/* Mobile: image-led tiles in a two-column grid */}
      <ul className="container-mono mt-10 grid grid-cols-2 gap-3 md:hidden">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`/products?category=${item.slug}`} className="block rounded-[var(--radius-md)] bg-tile p-4 active:scale-[0.99]">
              <div className="relative mx-auto aspect-square w-4/5">
                <ProductImage src={item.imageUrl} alt="" sizes="40vw" />
              </div>
              <p className="mt-3 text-[16px] font-medium tracking-[-0.02em]">{item.name}</p>
              <p className="label-mono mt-1.5 text-muted">{item.count} productos</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
