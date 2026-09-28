import type { Metadata } from 'next'
import { ChatIcon, MailIcon, WhatsappIcon } from '@/components/icons'
import { formatMoney } from '@/lib/format'
import { getSettings } from '@/lib/store'

export const metadata: Metadata = { title: 'Soporte', description: 'Envíos, pagos, garantía y cambios.', alternates: { canonical: '/support' } }
export const revalidate = 300

export default async function SupportPage() {
  const settings = await getSettings()
  const shipping = settings.shippingMethods.filter((method) => method.enabled)
  const payments = settings.paymentMethods.filter((method) => method.enabled)
  const faqs: { id?: string; q: string; a: string }[] = [
    {
      id: 'envios',
      q: '¿Cuánto tarda el envío?',
      a: shipping.map((method) => `${method.name}: ${method.eta}${method.priceCents ? ` (${formatMoney(method.priceCents, settings.currency)}${method.freeOverCents ? `, gratis desde ${formatMoney(method.freeOverCents, settings.currency)}` : ''})` : ' (sin cargo)'}.`).join(' '),
    },
    { q: '¿Qué medios de pago aceptan?', a: `${payments.map((method) => method.name).join(', ')}.` },
    { id: 'garantia', q: '¿Los productos tienen garantía?', a: 'Sí. Todos los productos son nuevos, originales y tienen 12 meses de garantía oficial. Si algo falla, lo gestionamos nosotros.' },
    { q: '¿Puedo cambiar o devolver un producto?', a: 'Tenés 10 días corridos desde que lo recibís para arrepentirte de la compra, con el producto sin uso y en su caja original. El cambio por falla está cubierto por la garantía.' },
    { id: 'arrepentimiento', q: 'Botón de arrepentimiento', a: `Para revocar una compra dentro de los 10 días, escribinos a ${settings.contact.email} con el asunto “Arrepentimiento” y tu número de pedido. Te respondemos en 24 horas con el código de gestión.` },
    { q: '¿Cómo sigo mi pedido?', a: 'Desde “Mi cuenta”, con el número de pedido y tu email. También te avisamos por email cada vez que cambia de estado.' },
    { q: '¿Emiten factura?', a: 'Sí, emitimos factura A o B. Indicá tu DNI o CUIT en el checkout.' },
  ]
  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="label-mono text-muted">Soporte</p>
          <h1 className="mt-4 text-headline font-semibold">¿En qué te ayudamos?</h1>
          <ul className="mt-10 grid gap-2">
            {settings.contact.whatsapp && (
              <ContactLink href={`https://wa.me/${settings.contact.whatsapp}`} icon={<WhatsappIcon />} title="WhatsApp" detail="Respuesta en minutos" external />
            )}
            {settings.contact.email && <ContactLink href={`mailto:${settings.contact.email}`} icon={<MailIcon />} title={settings.contact.email} detail="Respuesta en el día" />}
            {settings.contact.phone && <ContactLink href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} icon={<ChatIcon />} title={settings.contact.phone} detail={settings.contact.hours} />}
          </ul>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="label-mono mb-4 text-muted">Preguntas frecuentes</p>
          <div className="border-t border-line">
            {faqs.map((faq) => (
              <details key={faq.q} id={faq.id} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[18px] font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="relative size-4 shrink-0" aria-hidden="true">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-[var(--dur-base)] group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-prose pb-6 text-[15px] leading-relaxed text-ink-2">{faq.a}</p>
                {faq.id === 'arrepentimiento' && settings.contact.email && (
                  <a href={`mailto:${settings.contact.email}?subject=${encodeURIComponent('Arrepentimiento de compra')}`} className="mb-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-[14px] font-medium text-paper">
                    Solicitar arrepentimiento
                  </a>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactLink({ href, icon, title, detail, external }: { href: string; icon: React.ReactNode; title: string; detail: string; external?: boolean }) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="flex items-center gap-4 rounded-[var(--radius-md)] border border-line-strong px-5 py-4 transition-colors hover:border-ink"
      >
        <span className="text-ink-2">{icon}</span>
        <span>
          <span className="block text-[15px] font-medium">{title}</span>
          <span className="block text-[13px] text-muted">{detail}</span>
        </span>
      </a>
    </li>
  )
}
