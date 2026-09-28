import { cn } from '@/lib/cn'

/**
 * Typographic wordmark by default. If the admin uploads a logo, it replaces the text.
 * The square dot is the only graphic element of the identity.
 */
export function Logo({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className={cn('h-6 w-auto', className)} />
  }
  return (
    <span className={cn('inline-flex items-center gap-[0.35em] text-[19px] font-semibold tracking-[0.2em]', className)}>
      <span className="inline-block size-[0.42em] translate-y-[-0.02em] bg-accent" aria-hidden="true" />
      {name.toUpperCase()}
    </span>
  )
}
