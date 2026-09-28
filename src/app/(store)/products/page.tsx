import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/store/product-card'
import { buttonClass } from '@/components/ui/button'
import { filterProducts, parseCatalogFilters } from '@/lib/catalog'
import { getPublishedProducts, getSettings, getVisibleCategories } from '@/lib/store'
import { startingPrice } from '@/lib/pricing'
import { CatalogFilters } from './catalog-filters'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const filters = parseCatalogFilters(await searchParams)
  const category = filters.category ? (await getVisibleCategories()).find((item) => item.slug === filters.category) : null
  const title = category ? category.name : filters.q ? `Resultados para “${filters.q}”` : 'Productos'
  return {
    title,
    description: category?.description || 'Audio, smartphones, computación, wearables y accesorios seleccionados.',
    alternates: { canonical: category ? `/products?category=${category.slug}` : '/products' },
    // Search and filter combinations are not worth indexing; categories are
    robots: filters.q || filters.min !== null || filters.max !== null || filters.inStock ? { index: false, follow: true } : undefined,
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, products, categories, settings] = await Promise.all([searchParams, getPublishedProducts(), getVisibleCategories(), getSettings()])
  const consultative = settings.sales.mode === 'whatsapp'
  const parsed = parseCatalogFilters(params)
  // Without public prices, price filters and price sorting make no sense
  const filters = consultative
    ? { ...parsed, min: null, max: null, sort: parsed.sort.startsWith('price') ? ('featured' as const) : parsed.sort }
    : parsed
  const categoryIdBySlug = new Map(categories.map((category) => [category.slug, category.id]))
  const categoryName = new Map(categories.map((category) => [category.id, category.name]))
  const results = filterProducts(products, filters, categoryIdBySlug)
  const activeCategory = categories.find((category) => category.slug === filters.category) ?? null
  const prices = products.map((product) => startingPrice(product) / 100)
  const priceBounds = { min: Math.floor(Math.min(...prices, 0)), max: Math.ceil(Math.max(...prices, 0)) }
  const hasFilters = Boolean(filters.q || filters.category || filters.min !== null || filters.max !== null || filters.inStock)

  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <header className="grid gap-6 border-b border-line pb-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="label-mono mb-5 text-muted">
            <Link href="/" className="hover:text-ink">
              Inicio
            </Link>{' '}
            / {activeCategory ? <Link href="/products" className="hover:text-ink">Productos</Link> : 'Productos'}
            {activeCategory && ` / ${activeCategory.name}`}
          </p>
          <h1 className="text-headline font-semibold">{activeCategory?.name ?? (filters.q ? `“${filters.q}”` : 'Productos')}</h1>
          {activeCategory?.description && <p className="mt-5 max-w-lg text-lead text-ink-2">{activeCategory.description}</p>}
        </div>
        <p className="label-mono tabular text-muted md:col-span-4 md:text-right" aria-live="polite">
          {results.length} {results.length === 1 ? 'producto' : 'productos'}
        </p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-3" aria-label="Filtros">
          <CatalogFilters
            categories={categories.map(({ slug, name }) => ({ slug, name }))}
            filters={filters}
            priceBounds={priceBounds}
            resultCount={results.length}
            showPrice={!consultative}
          />
        </aside>

        <section className="lg:col-span-9" aria-label="Resultados">
          {results.length === 0 ? (
            <div className="flex min-h-[420px] flex-col items-start justify-center gap-5 rounded-[var(--radius-lg)] bg-tile p-8 md:p-14">
              <p className="text-title font-medium">No encontramos productos{hasFilters ? ' con esos filtros' : ''}.</p>
              <p className="max-w-md text-[15px] text-ink-2">
                {filters.q ? `Probá con otra palabra en lugar de “${filters.q}”, o ` : 'Probá '}
                quitando algún filtro para ver más opciones.
              </p>
              <Link href="/products" className={buttonClass({})}>
                Ver todo el catálogo
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-x-5 gap-y-12 min-[400px]:grid-cols-2 xl:grid-cols-3">
              {results.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} currency={settings.currency} categoryName={product.categoryId ? categoryName.get(product.categoryId) : undefined} priority={index < 3} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
