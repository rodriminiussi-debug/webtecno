import type { BenefitIcon, HomepageSection } from '@/lib/data/types'
import { CardIcon, ChatIcon, ReturnIcon, ShieldIcon, ShippingIcon, WarrantyIcon } from '@/components/icons'
import { Reveal } from '@/components/reveal'

export const BENEFIT_ICONS: Record<BenefitIcon, typeof ShippingIcon> = {
  shipping: ShippingIcon,
  secure: ShieldIcon,
  warranty: WarrantyIcon,
  support: ChatIcon,
  returns: ReturnIcon,
  installments: CardIcon,
}

export function BenefitsSection({ section }: { section: HomepageSection<'benefits'> }) {
  const items = section.config.items
  if (!items.length) return null
  return (
    <section className="border-t border-line bg-paper py-20 md:py-28" aria-label={section.title || 'Beneficios'}>
      <div className="container-mono">
        {section.title && <p className="label-mono mb-10 text-muted md:mb-14">{section.title}</p>}
        <ul className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {items.map((item, index) => {
            const Icon = BENEFIT_ICONS[item.icon] ?? ShieldIcon
            return (
              <Reveal as="li" key={`${item.title}-${index}`} delay={index * 80} className="lg:px-8 lg:first:pl-0 lg:last:pr-0">
                <Icon size={28} className="text-ink" />
                <p className="mt-6 text-[19px] font-medium tracking-[-0.02em]">{item.title}</p>
                <p className="mt-2 max-w-[30ch] text-[14px] leading-relaxed text-ink-2">{item.body}</p>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
