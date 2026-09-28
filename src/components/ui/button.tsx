import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'inverse-outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group/button relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[-0.01em] select-none ' +
  'transition-[background-color,color,border-color,transform,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] ' +
  'active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-[color-mix(in_oklab,var(--mono-ink)_82%,var(--mono-paper))]',
  secondary: 'border border-line-strong text-ink hover:border-ink bg-transparent',
  ghost: 'text-ink hover:bg-tile',
  inverse: 'bg-white text-black hover:bg-white/85',
  'inverse-outline': 'border border-white/30 text-white hover:border-white',
  danger: 'bg-danger text-white hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] rounded-full',
  md: 'h-11 px-6 text-[15px] rounded-full',
  lg: 'h-14 px-8 text-base rounded-full',
}

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode }

export function buttonClass({ variant = 'primary', size = 'md', className }: Omit<CommonProps, 'children'>) {
  return cn(base, variants[variant], sizes[size], className)
}

export function Button({ variant, size, className, ...props }: CommonProps & ComponentProps<'button'>) {
  return <button type="button" className={buttonClass({ variant, size, className })} {...props} />
}

export function ButtonLink({ variant, size, className, ...props }: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass({ variant, size, className })} {...props} />
}

/** Arrow that nudges forward on hover; used inside CTAs. */
export function ArrowNudge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"
      className="transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-expo)] group-hover/button:translate-x-0.5">
      <path d="M4 12h16m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
