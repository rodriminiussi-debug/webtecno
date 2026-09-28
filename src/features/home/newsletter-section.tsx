import type { HomepageSection } from '@/lib/data/types'
import { Reveal } from '@/components/reveal'
import { NewsletterForm } from './newsletter-form'

export function NewsletterSection({ section }: { section: HomepageSection<'newsletter'> }) {
  return (
    <section className="border-t border-line py-24 md:py-40" aria-labelledby="newsletter-title">
      <div className="container-mono grid gap-12 md:grid-cols-12 md:items-end">
        <Reveal className="md:col-span-6">
          <h2 id="newsletter-title" className="text-[clamp(3.5rem,9vw,8.5rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
            {section.title}
          </h2>
        </Reveal>
        <Reveal delay={120} className="md:col-span-5 md:col-start-8">
          {section.subtitle && <p className="mb-8 max-w-md text-[15px] leading-relaxed text-ink-2">{section.subtitle}</p>}
          <NewsletterForm placeholder={section.config.placeholder} ctaLabel={section.config.ctaLabel} note={section.config.note} />
        </Reveal>
      </div>
    </section>
  )
}
