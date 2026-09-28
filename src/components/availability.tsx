import { AVAILABILITY_LABEL, availabilityOf } from '@/lib/pricing'
import { cn } from '@/lib/cn'

const DOT = {
  in_stock: 'bg-success',
  low_stock: 'bg-accent',
  out_of_stock: 'bg-muted',
} as const

export function Availability({ stock, className }: { stock: number; className?: string }) {
  const state = availabilityOf(stock)
  return (
    <span className={cn('label-mono inline-flex items-center gap-2 text-ink-2', className)}>
      <span className={cn('size-1.5 rounded-full', DOT[state])} aria-hidden="true" />
      {AVAILABILITY_LABEL[state]}
    </span>
  )
}
