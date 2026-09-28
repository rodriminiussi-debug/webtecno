import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/store/product-card'
import { Reveal } from '@/components/reveal'
import { getCategories, getProductBySlug, getPublishedProducts, getSettings, relatedProducts, siteUrl } from '@/lib/store'
import { availabilityOf, shippingCost, startingPrice } from '@/lib/pricing'
import { formatMoney } from '@/lib/format'
import { ProductGallery } from './product-gallery'
import { PurchasePanel } from './purchase-panel'

type Params = Promise<{ slug: string }>

export const revalidate = 300

export async function generateStaticParams() {
  const products = await getPublishedProducts()
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Producto no encontrado' }
  const title = product.seoTitle || product.name
  const description = product.seoDescription || product.shortDescription
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description, type: 'website', url: `/products/${product.slug}` },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const [product, settings, categories, all] = await Promise.all([getProductBySlug(slug), getSettings(), getCategories(), getPublishedProducts()])
  if (!product) notFound()

  const category = categories.find((item) => item.id === product.categoryId) ?? null
  const related = relatedProducts(product, all)
  const shipping = settings.shippingMethods.filter((method) => method.enabled)
  const price = startingPrice(product)

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || settings.storeName },
    image: product.images.map((image) => new URL(image.url, siteUrl()).toString()),
    category: category?.name,
    // WhatsApp sales mode publishes no prices, so no Offer markup either
    offers: settings.sales.mode === 'whatsapp' ? undefined : (product.variants.length ? product.variants : [null]).map((variant) => ({
      '@type': 'Offer',
      url: `${siteUrl()}/products/${product.slug}`,
      priceCurrency: settings.currency,
      price: ((variant?.priceCents ?? product.priceCents) / 100).toFixed(2),
      sku: variant?.sku ?? product.sku,
      availability: availabilityOf(variant ? variant.stock : product.stock) === 'out_of_stock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <div className="container-mono pt-[calc(var(--header-h)+1.5rem)] md:pt-[calc(var(--header-h)+2.5rem)]">
        <nav aria-label="Ruta de navegación" className="label-mono text-muted">
          <ol className="flex flex-wrap gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">
                Inicio
              </Link>{' '}
              /
            </li>
            <li>
              <Link href="/products" className="hover:text-ink">
                Productos
              </Link>{' '}
              /
            </li>
            {category && (
              <li>
                <Link href={`/products?category=${category.slug}`} className="hover:text-ink">
                  {category.name}
                </Link>{' '}
                /
              </li>
            )}
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 pb-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} name={product.name} float={product.animation === 'float'} />
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <PurchasePanel
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  brand: product.brand,
                  shortDescription: product.shortDescription,
                  priceCents: product.priceCents,
                  compareAtCents: product.compareAtCents,
                  stock: product.stock,
                  sku: product.sku,
                  imageUrl: product.images[0]?.url ?? null,
                  variantLabel: product.variantLabel,
                  variants: product.variants,
                }}
                currency={settings.currency}
                categoryName={category?.name ?? null}
              />
              <ul className="mt-8 divide-y divide-line border-y border-line">
                {shipping.map((method) => {
                  const cost = shippingCost(method, price)
                  return (
                    <li key={method.id} className="flex items-start justify-between gap-4 py-3.5 text-[14px]">
                      <span>
                        <span className="font-medium">{method.name}</span>
                        <span className="block text-muted">{method.eta}</span>
                      </span>
                      <span className="tabular shrink-0 text-ink-2">
                        {cost === 0 ? 'Gratis' : method.freeOverCents !== null ? `Gratis desde ${formatMoney(method.freeOverCents, settings.currency)}` : formatMoney(cost, settings.currency)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section className="border-t border-line py-20 md:py-28" aria-labelledby="about-product">
        <div className="container-mono grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="label-mono mb-4 text-muted">Descripción</p>
            <h2 id="about-product" className="text-title font-semibold">
              {product.name}
            </h2>
          </Reveal>
          <Reveal delay={100} className="md:col-span-7 md:col-start-6">
            <p className="text-lead text-ink-2">{product.description}</p>
          </Reveal>
        </div>
        {product.features.length > 0 && (
          <ol className="container-mono mt-16 grid gap-px overflow-hidden rounded-[var(--radius-lg)] bg-line md:grid-cols-2">
            {product.features.map((feature, index) => (
              <Reveal as="li" key={feature.title} delay={(index % 2) * 80} className="bg-paper p-8 md:p-12">
                <p className="label-mono text-muted">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-10 text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-[1.05] tracking-[-0.04em]">{feature.title}</p>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">{feature.body}</p>
              </Reveal>
            ))}
          </ol>
        )}
      </section>

      {product.specs.length > 0 && (
        <section className="border-t border-line py-20 md:py-28" aria-labelledby="specs-title">
          <div className="container-mono grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="label-mono mb-4 text-muted">Ficha técnica</p>
              <h2 id="specs-title" className="text-title font-semibold">
                Especificaciones
              </h2>
            </div>
            <dl className="md:col-span-7 md:col-start-6">
              {product.specs.map((spec) => (
                <div key={spec.label} className="grid grid-cols-5 gap-4 border-b border-line py-4 first:border-t">
                  <dt className="label-mono col-span-2 pt-1 text-muted">{spec.label}</dt>
                  <dd className="col-span-3 text-[15px]">{spec.value}</dd>
                </div>
              ))}
              <div className="grid grid-cols-5 gap-4 border-b border-line py-4">
                <dt className="label-mono col-span-2 pt-1 text-muted">SKU</dt>
                <dd className="tabular col-span-3 font-mono text-[14px]">{product.sku}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="border-t border-line py-20 md:py-28" aria-labelledby="related-title">
          <div className="container-mono">
            <div className="flex items-end justify-between gap-6">
              <h2 id="related-title" className="text-title font-semibold">
                También te puede interesar
              </h2>
              <Link href={category ? `/products?category=${category.slug}` : '/products'} className="shrink-0 text-[15px] font-medium underline-offset-4 hover:underline">
                Ver más
              </Link>
            </div>
            <ul className="mt-10 grid grid-cols-1 gap-x-5 gap-y-12 min-[400px]:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard product={item} currency={settings.currency} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
