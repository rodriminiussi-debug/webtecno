import { formatMoney } from '@/lib/format'
import { discountPercent } from '@/lib/pricing'
import { cn } from '@/lib/cn'

export function Price({
  cents,
  compareAtCents,
  currency,
  from = false,
  size = 'md',
  className,
}: {
  cents: number
  compareAtCents?: number | null
  currency: string
  from?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const discount = discountPercent(cents, compareAtCents ?? null)
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular', className)}>
      <span
        className={cn(
          'font-medium tracking-[-0.02em] text-ink',
          size === 'sm' && 'text-[15px]',
          size === 'md' && 'text-[17px]',
          size === 'lg' && 'text-[28px] md:text-[32px]',
        )}
      >
        {from && <span className="mr-1 text-[0.7em] font-normal text-muted">desde</span>}
        {formatMoney(cents, currency)}
      </span>
      {discount > 0 && compareAtCents ? (
        <>
          <s className={cn('text-muted', size === 'lg' ? 'text-[17px]' : 'text-[13px]')}>{formatMoney(compareAtCents, currency)}</s>
          <span className="label-mono text-accent">−{discount}%</span>
        </>
      ) : null}
    </div>
  )
}
