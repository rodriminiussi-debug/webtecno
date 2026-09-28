'use client'

import { WhatsappIcon } from '@/components/icons'
import { buttonClass } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useWhatsAppLink } from './store-mode'

type Variant = 'primary' | 'secondary' | 'inverse' | 'inverse-outline'

/** Opens WhatsApp with a pre-written message about this product (and the chosen option). */
export function WhatsAppPriceButton({
  product,
  option,
  label = 'Consultar precio por WhatsApp',
  variant = 'primary',
  size = 'lg',
  className,
}: {
  product: { name: string; slug: string }
  option?: string | null
  label?: string
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const links = useWhatsAppLink()
  return (
    <a
      href={links.forProduct(product, option)}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass({ variant, size, className })}
      aria-label={`${label}: ${product.name}${option ? ` (${option})` : ''}`}
    >
      <WhatsappIcon size={size === 'sm' ? 16 : 18} />
      {label}
    </a>
  )
}

/** Compact circular version for product cards. */
export function WhatsAppIconLink({ product, className }: { product: { name: string; slug: string }; className?: string }) {
  const links = useWhatsAppLink()
  return (
    <a
      href={links.forProduct(product)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Consultar precio de ${product.name} por WhatsApp`}
      title="Consultar precio por WhatsApp"
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink transition-[background-color,color,border-color,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:border-ink hover:bg-ink hover:text-paper active:scale-95',
        className,
      )}
    >
      <WhatsappIcon size={18} />
    </a>
  )
}

/** Floating general-enquiry button, bottom right. */
export function WhatsAppFloating() {
  const links = useWhatsAppLink()
  return (
    <a
      href={links.general()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-ink pl-3.5 pr-3.5 text-paper shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)] transition-[padding,transform] duration-[var(--dur-base)] ease-[var(--ease-out-expo)] hover:pr-5 active:scale-95"
    >
      <WhatsappIcon size={20} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[14px] font-medium transition-[max-width] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:max-w-40">
        Consultanos
      </span>
    </a>
  )
}
