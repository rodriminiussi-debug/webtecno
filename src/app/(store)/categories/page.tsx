import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductImage } from '@/components/product-image'
import { Reveal } from '@/components/reveal'
import { getPublishedProducts, getVisibleCategories } from '@/lib/store'

export const metadata: Metadata = { title: 'Categorías', description: 'Explorá la tienda por categoría.', alternates: { canonical: '/categories' } }
export const revalidate = 300

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([getVisibleCategories(), getPublishedProducts()])
  const counts = new Map<string, number>()
  for (const product of products) if (product.categoryId) counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1)
  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <p className="label-mono text-muted">{categories.length} categorías</p>
      <h1 className="mt-4 text-headline font-semibold">Categorías</h1>
      {categories.length === 0 ? (
        <p className="mt-10 text-[15px] text-ink-2">Todavía no hay categorías publicadas.</p>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {categories.map((category, index) => (
            <Reveal as="li" key={category.id} delay={(index % 3) * 80} className={index === 0 ? 'col-span-2 md:col-span-2 md:row-span-2' : ''}>
              <Link href={`/products?category=${category.slug}`} className="group relative flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] bg-tile p-5 md:min-h-[300px] md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[20px] font-medium tracking-[-0.03em] md:text-[26px]">{category.name}</p>
                    <p className="label-mono mt-2 text-muted">{counts.get(category.id) ?? 0} productos</p>
                  </div>
                  <span className="label-mono text-muted">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="relative ml-auto mt-4 aspect-square w-1/2 transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-105 md:w-3/5">
                  <ProductImage src={category.imageUrl} alt="" sizes="30vw" />
                </div>
                {category.description && <p className="mt-3 hidden max-w-xs text-[14px] text-ink-2 md:block">{category.description}</p>}
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  )
}
