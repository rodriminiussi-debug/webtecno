import type { Metadata } from 'next'
import Link from 'next/link'
import { Reveal } from '@/components/reveal'
import { ArrowNudge, buttonClass } from '@/components/ui/button'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Nosotros', alternates: { canonical: '/about' } }
export const revalidate = 300

const PRINCIPLES = [
  ['Curaduría', 'Pocos productos, elegidos después de usarlos. Si no lo recomendaríamos a un amigo, no lo vendemos.'],
  ['Transparencia', 'Precios finales, stock real y plazos de entrega que se cumplen.'],
  ['Acompañamiento', 'Antes y después de la compra, te responde alguien que conoce el producto.'],
]

export default async function AboutPage() {
  const settings = await getSettings()
  return (
    <div className="pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <div className="container-mono">
        <p className="label-mono text-muted">Nosotros</p>
        <Reveal>
          <h1 className="mt-4 max-w-[14ch] text-[clamp(3.5rem,10vw,9rem)] font-semibold leading-[0.88] tracking-[-0.06em]">{settings.texts.aboutTitle}</h1>
        </Reveal>
        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <Reveal delay={100} className="md:col-span-6 md:col-start-7">
            <p className="text-lead text-ink-2">{settings.texts.aboutBody}</p>
          </Reveal>
        </div>
      </div>
      <ol className="container-mono mt-24 grid gap-px overflow-hidden rounded-[var(--radius-lg)] bg-line md:grid-cols-3">
        {PRINCIPLES.map(([title, body], index) => (
          <Reveal as="li" key={title} delay={index * 80} className="bg-paper p-8 md:p-10">
            <p className="label-mono text-muted">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-12 text-[28px] font-medium tracking-[-0.04em]">{title}</p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{body}</p>
          </Reveal>
        ))}
      </ol>
      <div className="container-mono mt-24 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
        <p className="max-w-md text-[22px] font-medium tracking-[-0.03em]">{settings.contact.address ? `Visitá el showroom en ${settings.contact.address}.` : 'Escribinos cuando quieras.'}</p>
        <Link href="/products" className={buttonClass({ size: 'lg' })}>
          Ver productos <ArrowNudge />
        </Link>
      </div>
    </div>
  )
}
