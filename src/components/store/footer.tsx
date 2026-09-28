import Link from 'next/link'
import type { Category, SiteSettings } from '@/lib/data/types'
import { InstagramIcon, LinkedinIcon, TiktokIcon, WhatsappIcon, XIcon, YoutubeIcon } from '@/components/icons'

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'x', label: 'X', Icon: XIcon },
  { key: 'tiktok', label: 'TikTok', Icon: TiktokIcon },
  { key: 'youtube', label: 'YouTube', Icon: YoutubeIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedinIcon },
] as const

export function Footer({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  const year = new Date().getFullYear()
  const socials = SOCIAL.filter((item) => settings.socials[item.key])
  return (
    <footer className="mt-auto border-t border-line bg-paper text-ink">
      <div className="container-mono grid gap-12 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-4">
          <p className="max-w-xs text-[22px] font-medium leading-tight tracking-[-0.03em]">{settings.texts.tagline}</p>
          {socials.length > 0 && (
            <ul className="mt-8 flex gap-1" aria-label="Redes sociales">
              {socials.map(({ key, label, Icon }) => (
                <li key={key}>
                  <a
                    href={settings.socials[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-line-strong transition-colors hover:border-ink"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <FooterColumn title="Categorías" className="md:col-span-2 md:col-start-6">
          {categories.map((category) => (
            <FooterLink key={category.id} href={`/products?category=${category.slug}`}>
              {category.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Ayuda" className="md:col-span-2">
          <FooterLink href="/support">Soporte</FooterLink>
          <FooterLink href="/support#envios">Envíos</FooterLink>
          <FooterLink href="/support#garantia">Garantía y cambios</FooterLink>
          <FooterLink href="/account">Seguir mi pedido</FooterLink>
          <FooterLink href="/about">Nosotros</FooterLink>
          <FooterLink href="/support#arrepentimiento">Botón de arrepentimiento</FooterLink>
        </FooterColumn>

        <FooterColumn title="Contacto" className="md:col-span-3">
          {settings.contact.email && <FooterLink href={`mailto:${settings.contact.email}`}>{settings.contact.email}</FooterLink>}
          {settings.contact.phone && <FooterLink href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}>{settings.contact.phone}</FooterLink>}
          {settings.contact.whatsapp && (
            <li>
              <a href={`https://wa.me/${settings.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[15px] text-ink-2 transition-colors hover:text-ink">
                <WhatsappIcon size={16} /> WhatsApp
              </a>
            </li>
          )}
          {settings.contact.address && <li className="text-[15px] text-ink-2">{settings.contact.address}</li>}
          {settings.contact.hours && <li className="text-[13px] text-muted">{settings.contact.hours}</li>}
        </FooterColumn>
      </div>

      <div className="container-mono overflow-hidden" aria-hidden="true">
        <p className="select-none text-[clamp(5rem,24vw,22rem)] font-semibold leading-[0.72] tracking-[-0.07em] text-ink">
          {settings.storeName.toUpperCase()}
          <span className="text-accent">.</span>
        </p>
      </div>

      <div className="container-mono flex flex-col gap-3 border-t border-line py-6 text-[13px] text-muted md:flex-row md:items-center md:justify-between">
        <p>
          © {year} {settings.storeName}. {settings.texts.footerNote}
        </p>
        <nav aria-label="Legal" className="flex gap-6">
          <Link href="/terms" className="hover:text-ink">
            Términos y condiciones
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  )
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <p className="label-mono mb-5 text-muted">{title}</p>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-[15px] text-ink-2 transition-colors hover:text-ink">
        {children}
      </Link>
    </li>
  )
}
