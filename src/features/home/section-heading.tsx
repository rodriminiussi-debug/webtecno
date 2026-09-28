import Link from 'next/link'
import { ArrowUpRightIcon } from '@/components/icons'
import { Reveal } from '@/components/reveal'

export function SectionHeading({ index, title, subtitle, link }: { index?: string; title: string; subtitle?: string; link?: { href: string; label: string } }) {
  return (
    <div className="grid gap-6 md:grid-cols-12 md:items-end">
      <Reveal className="md:col-span-7">
        {index && <p className="label-mono mb-5 text-muted">{index}</p>}
        <h2 className="text-headline font-semibold">{title}</h2>
      </Reveal>
      <Reveal delay={120} className="flex flex-col gap-5 md:col-span-4 md:col-start-9 md:items-end md:text-right">
        {subtitle && <p className="max-w-sm text-[15px] leading-relaxed text-ink-2">{subtitle}</p>}
        {link && (
          <Link href={link.href} className="group inline-flex items-center gap-2 text-[15px] font-medium">
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:bg-[length:100%_1px]">
              {link.label}
            </span>
            <ArrowUpRightIcon size={16} className="transition-transform duration-[var(--dur-base)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>
    </div>
  )
}
