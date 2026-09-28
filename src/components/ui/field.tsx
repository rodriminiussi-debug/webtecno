import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export const inputClass =
  'block w-full h-12 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-4 text-[15px] text-ink placeholder:text-muted ' +
  'transition-[border-color,box-shadow] duration-[var(--dur-fast)] hover:border-[color-mix(in_oklab,var(--mono-ink)_30%,transparent)] ' +
  'focus:outline-none focus:border-ink focus:ring-4 focus:ring-[color-mix(in_oklab,var(--mono-ink)_8%,transparent)] ' +
  'aria-[invalid=true]:border-danger disabled:opacity-50'

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  error?: string | null
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(inputClass, 'h-auto min-h-28 py-3 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(inputClass, 'appearance-none pr-10', className)} {...props}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  id?: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-[var(--dur-fast)]',
        checked ? 'bg-ink' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)]',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
