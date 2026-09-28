'use client'

import { MinusIcon, PlusIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = 'md',
}: {
  value: number
  max: number
  onChange: (value: number) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const button = cn(
    'inline-flex items-center justify-center rounded-full text-ink transition-colors hover:bg-tile-2 disabled:opacity-30 disabled:hover:bg-transparent',
    size === 'sm' ? 'size-8' : 'size-10',
  )
  return (
    <div className={cn('inline-flex items-center rounded-full border border-line-strong', size === 'sm' ? 'h-9 px-0.5' : 'h-12 px-1')} role="group" aria-label={label}>
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Restar una unidad">
        <MinusIcon size={size === 'sm' ? 14 : 16} />
      </button>
      <output className={cn('tabular text-center font-medium', size === 'sm' ? 'w-7 text-[14px]' : 'w-9 text-[15px]')} aria-live="polite">
        {value}
      </output>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Sumar una unidad">
        <PlusIcon size={size === 'sm' ? 14 : 16} />
      </button>
    </div>
  )
}
