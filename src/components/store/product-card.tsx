import Link from 'next/link'
import type { Product } from '@/lib/data/types'
import { ProductImage } from '@/components/product-image'
import { cn } from '@/lib/cn'
import { discountPercent, startingPrice } from '@/lib/pricing'
import { CardAction, CardPrice } from './card-commerce'

export function ProductCard({
  product,
  currency,
  categoryName,
  size = 'md',
  priority = false,
  className,
}: {
  product: Product
  currency: string
  categoryName?: string
  size?: 'md' | 'lg'
  priority?: boolean
  className?: string
}) {
  const [primary, secondary] = product.images
  const price = startingPrice(product)
  const compareAt = product.variants.length ? null : product.compareAtCents
  const discount = discountPercent(price, compareAt)
  const soldOut = product.stock <= 0
  return (
    <article className={cn('group/card relative flex flex-col', className)}>
      <div
        className="relative block overflow-hidden rounded-[var(--radius-lg)] bg-tile transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover/card:-translate-y-1"
      >
        <div className={cn('relative', size === 'lg' ? 'aspect-[4/5] md:aspect-auto md:h-full md:min-h-[640px]' : 'aspect-[4/5]')}>
          <div className={cn('absolute inset-[9%] transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.035]', secondary && 'group-hover/card:opacity-0')}>
            <ProductImage src={primary?.url} alt={primary?.alt ?? product.name} sizes={size === 'lg' ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'} priority={priority} className={cn(soldOut && 'opacity-60')} />
          </div>
          {secondary && (
            <div className="absolute inset-[9%] scale-[0.98] opacity-0 transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-expo)] group-hover/card:scale-[1.035] group-hover/card:opacity-100">
              <ProductImage src={secondary.url} alt="" sizes="(min-width: 1024px) 25vw, 50vw" />
            </div>
          )}
        </div>
        <div className="absolute left-4 top-4 flex gap-1.5">
          {discount > 0 && <span className="price-only label-mono rounded-full bg-accent px-2.5 py-1.5 text-white">−{discount}%</span>}
          {soldOut && <span className="label-mono rounded-full bg-paper px-2.5 py-1.5 text-ink-2">Sin stock</span>}
        </div>
        {categoryName && <span className="label-mono absolute right-4 top-4 hidden text-muted md:block">{categoryName}</span>}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className={cn('font-medium tracking-[-0.02em]', size === 'lg' ? 'text-[22px] md:text-[26px]' : 'text-[16px]')}>
            {/* Stretched link: the whole card is clickable with a single tab stop */}
            <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:z-[1] after:content-['']">
              {product.name}
            </Link>
          </h3>
          <p className={cn('mt-1 line-clamp-2 text-muted', size === 'lg' ? 'max-w-md text-[15px]' : 'text-[13px] leading-snug')}>{product.shortDescription}</p>
        </div>
        <div className="relative z-10">
          <CardAction
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: price,
              stock: product.stock,
              imageUrl: primary?.url ?? null,
              hasVariants: product.variants.length > 0,
            }}
          />
        </div>
      </div>
      <CardPrice cents={price} compareAtCents={compareAt} currency={currency} from={product.variants.length > 1} stock={product.stock} />
    </article>
  )
}
