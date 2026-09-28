'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveSettings } from '@/app/admin/actions/settings'
import { ColorInput, ImageInput, MoneyInput, TextArea, TextInput } from '@/components/admin/form'
import { toast } from '@/components/admin/toast'
import { Badge, PageHeader, Panel } from '@/components/admin/ui'
import { PlusIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/field'
import { FONT_KEYS, type PaymentProviderId, type SiteSettings } from '@/lib/data/types'
import { FONT_OPTIONS } from '@/lib/font-options'
import { cn } from '@/lib/cn'

const TABS = [
  { id: 'brand', label: 'Marca' },
  { id: 'look', label: 'Apariencia' },
  { id: 'texts', label: 'Textos y SEO' },
  { id: 'contact', label: 'Contacto y redes' },
  { id: 'shipping', label: 'Envíos' },
  { id: 'payments', label: 'Pagos' },
] as const

type Tab = (typeof TABS)[number]['id']

const PROVIDER_LABEL: Record<PaymentProviderId, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  mock_card: 'Tarjeta (demo)',
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
}

const PROVIDER_ENV: Partial<Record<PaymentProviderId, string>> = { mercadopago: 'MERCADOPAGO_ACCESS_TOKEN', stripe: 'STRIPE_SECRET_KEY' }

export function SettingsForm({ settings: initial, configured, storage }: { settings: SiteSettings; configured: Record<PaymentProviderId, boolean>; storage: 'local' | 'supabase' }) {
  const router = useRouter()
  const [settings, setSettings] = useState(initial)
  const [tab, setTab] = useState<Tab>('brand')
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }
  const setIn = <K extends 'colors' | 'texts' | 'socials' | 'contact' | 'seo'>(key: K, patch: Partial<SiteSettings[K]>) => set(key, { ...settings[key], ...patch })

  const save = () =>
    startTransition(async () => {
      const result = await saveSettings(settings)
      if (result.error !== null) return toast.error(result.error)
      setDirty(false)
      toast.success('Configuración guardada. La tienda ya muestra los cambios.')
      router.refresh()
    })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <PageHeader
        title="Configuración"
        description={
          <>
            Datos de la tienda, identidad visual, envíos y pagos. Base de datos: <Badge tone={storage === 'supabase' ? 'success' : 'warning'}>{storage === 'supabase' ? 'Supabase' : 'Local (demo)'}</Badge>
          </>
        }
        actions={
          <>
            {dirty && <span className="label-mono text-warning">Cambios sin guardar</span>}
            <Button type="submit" size="sm" disabled={pending || !dirty}>
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Secciones de configuración" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
              className={cn('whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-2 text-left text-[14px]', tab === item.id ? 'bg-tile-2 font-medium' : 'text-ink-2 hover:bg-tile')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'brand' && (
            <Panel title="Identidad">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput label="Nombre de la tienda" value={settings.storeName} onChange={(event) => set('storeName', event.target.value)} hint="Se usa en el logo tipográfico, títulos y emails." className="sm:col-span-2" />
                <ImageInput label="Logo" value={settings.logoUrl} onChange={(logoUrl) => set('logoUrl', logoUrl)} aspect="wide" hint="Opcional. Sin logo se usa el nombre en tipografía." />
                <ImageInput label="Favicon" value={settings.faviconUrl} onChange={(faviconUrl) => set('faviconUrl', faviconUrl)} hint="PNG o ICO cuadrado, 512×512 ideal." />
              </div>
            </Panel>
          )}

          {tab === 'look' && (
            <div className="grid gap-4">
              <Panel title="Colores" description="Tinta y papel definen toda la paleta; los grises se derivan automáticamente.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ColorInput label="Acento" value={settings.colors.accent} onChange={(accent) => setIn('colors', { accent })} hint="Descuentos, indicadores y foco. Usalo con moderación." />
                  <ColorInput label="Tinta (texto)" value={settings.colors.ink} onChange={(ink) => setIn('colors', { ink })} />
                  <ColorInput label="Papel (fondo)" value={settings.colors.paper} onChange={(paper) => setIn('colors', { paper })} />
                  <ColorInput label="Superficie (paneles)" value={settings.colors.surface} onChange={(surface) => setIn('colors', { surface })} />
                </div>
                <div className="mt-5 flex items-center gap-4 rounded-[var(--radius-md)] p-5" style={{ background: settings.colors.paper, color: settings.colors.ink }}>
                  <span className="text-[28px] font-semibold tracking-[-0.04em]">Aa</span>
                  <span className="flex-1 text-[14px]">Vista previa de tinta sobre papel.</span>
                  <span className="rounded-full px-3 py-1 font-mono text-[11px] text-white" style={{ background: settings.colors.accent }}>
                    −15%
                  </span>
                  <span className="rounded-full px-4 py-2 text-[13px]" style={{ background: settings.colors.ink, color: settings.colors.paper }}>
                    Comprar
                  </span>
                </div>
              </Panel>
              <Panel title="Tipografía">
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipografía">
                  {FONT_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={settings.font === key}
                      onClick={() => set('font', key)}
                      className={cn('rounded-[var(--radius-sm)] border p-4 text-left', settings.font === key ? 'border-ink' : 'border-line hover:border-line-strong')}
                    >
                      <span className="block text-[24px] font-semibold tracking-[-0.03em]" style={{ fontFamily: FONT_OPTIONS[key].cssVar }}>
                        {FONT_OPTIONS[key].label}
                      </span>
                      <span className="mt-1 block text-[12px] text-muted">{FONT_OPTIONS[key].note}</span>
                    </button>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === 'texts' && (
            <div className="grid gap-4">
              <Panel title="Textos principales">
                <div className="grid gap-4">
                  <TextInput label="Frase de la marca" value={settings.texts.tagline} onChange={(event) => setIn('texts', { tagline: event.target.value })} hint="Aparece en el footer y en la imagen para redes." />
                  <TextInput label="Anuncio" value={settings.texts.announcement} onChange={(event) => setIn('texts', { announcement: event.target.value })} hint="Se muestra en el menú mobile." />
                  <TextInput label="Título de “Nosotros”" value={settings.texts.aboutTitle} onChange={(event) => setIn('texts', { aboutTitle: event.target.value })} />
                  <TextArea label="Texto de “Nosotros”" value={settings.texts.aboutBody} rows={4} onChange={(event) => setIn('texts', { aboutBody: event.target.value })} />
                  <TextInput label="Nota del footer" value={settings.texts.footerNote} onChange={(event) => setIn('texts', { footerNote: event.target.value })} />
                </div>
              </Panel>
              <Panel title="SEO de la tienda">
                <div className="grid gap-4">
                  <TextInput label="Título" value={settings.seo.title} maxLength={70} onChange={(event) => setIn('seo', { title: event.target.value })} hint={`${settings.seo.title.length}/70`} />
                  <TextArea label="Descripción" value={settings.seo.description} maxLength={170} rows={2} onChange={(event) => setIn('seo', { description: event.target.value })} hint={`${settings.seo.description.length}/170`} />
                </div>
              </Panel>
            </div>
          )}

          {tab === 'contact' && (
            <div className="grid gap-4">
              <Panel title="Contacto">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="Email" type="email" value={settings.contact.email} onChange={(event) => setIn('contact', { email: event.target.value })} />
                  <TextInput label="Teléfono" value={settings.contact.phone} onChange={(event) => setIn('contact', { phone: event.target.value })} />
                  <TextInput label="WhatsApp" value={settings.contact.whatsapp} inputMode="numeric" onChange={(event) => setIn('contact', { whatsapp: event.target.value.replace(/\D/g, '') })} hint="Con código de país, sin + ni espacios." />
                  <TextInput label="Horario" value={settings.contact.hours} onChange={(event) => setIn('contact', { hours: event.target.value })} />
                  <TextInput label="Dirección" value={settings.contact.address} onChange={(event) => setIn('contact', { address: event.target.value })} className="sm:col-span-2" />
                </div>
              </Panel>
              <Panel title="Redes sociales" description="Dejá vacías las que no uses: no se muestran.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {(['instagram', 'x', 'tiktok', 'youtube', 'linkedin'] as const).map((key) => (
                    <TextInput key={key} label={{ instagram: 'Instagram', x: 'X', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn' }[key]} value={settings.socials[key]} placeholder="https://…" onChange={(event) => setIn('socials', { [key]: event.target.value })} />
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {tab === 'shipping' && (
            <Panel
              title="Métodos de envío"
              actions={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    set('shippingMethods', [
                      ...settings.shippingMethods,
                      { id: `ship-${Date.now()}`, name: 'Nuevo envío', description: '', priceCents: 0, freeOverCents: null, eta: '', requiresAddress: true, enabled: false },
                    ])
                  }
                >
                  <PlusIcon size={14} /> Agregar
                </Button>
              }
            >
              <ul className="grid gap-4">
                {settings.shippingMethods.map((method, index) => {
                  const patch = (value: Partial<typeof method>) => set('shippingMethods', settings.shippingMethods.map((item, i) => (i === index ? { ...item, ...value } : item)))
                  return (
                    <li key={method.id} className="rounded-[var(--radius-sm)] border border-line p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Switch checked={method.enabled} onChange={(enabled) => patch({ enabled })} label={`Activar ${method.name}`} />
                          <span className="text-[14px] font-medium">{method.name || 'Sin nombre'}</span>
                        </div>
                        <button type="button" onClick={() => set('shippingMethods', settings.shippingMethods.filter((_, i) => i !== index))} aria-label={`Quitar ${method.name}`} className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile hover:text-danger">
                          <TrashIcon size={16} />
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <TextInput label="Nombre" value={method.name} onChange={(event) => patch({ name: event.target.value })} />
                        <TextInput label="Descripción" value={method.description} onChange={(event) => patch({ description: event.target.value })} />
                        <TextInput label="Plazo" value={method.eta} onChange={(event) => patch({ eta: event.target.value })} />
                        <MoneyInput label="Costo" cents={method.priceCents} onChange={(value) => patch({ priceCents: value ?? 0 })} />
                        <MoneyInput label="Gratis desde" cents={method.freeOverCents} allowEmpty onChange={(value) => patch({ freeOverCents: value })} hint="Vacío = nunca gratis." />
                        <div className="flex items-center justify-between gap-3 pt-6">
                          <span className="text-[13px] text-ink-2">Pide dirección</span>
                          <Switch checked={method.requiresAddress} onChange={(requiresAddress) => patch({ requiresAddress })} label="Pide dirección" />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}

          {tab === 'payments' && (
            <Panel title="Medios de pago" description="Mercado Pago y Stripe se activan cuando su clave está configurada en las variables de entorno del servidor.">
              <ul className="grid gap-4">
                {settings.paymentMethods.map((method, index) => {
                  const patch = (value: Partial<typeof method>) => set('paymentMethods', settings.paymentMethods.map((item, i) => (i === index ? { ...item, ...value } : item)))
                  const ready = configured[method.provider]
                  return (
                    <li key={method.id} className="rounded-[var(--radius-sm)] border border-line p-4">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Switch checked={method.enabled} onChange={(enabled) => patch({ enabled })} label={`Activar ${method.name}`} />
                        <span className="text-[14px] font-medium">{method.name}</span>
                        <Badge>{PROVIDER_LABEL[method.provider]}</Badge>
                        {!ready && <Badge tone="warning">Falta {PROVIDER_ENV[method.provider]}</Badge>}
                        {method.enabled && !ready && <span className="text-[12px] text-muted">Activo pero oculto en el checkout hasta configurar la clave.</span>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextInput label="Nombre visible" value={method.name} onChange={(event) => patch({ name: event.target.value })} />
                        <TextInput label="Descripción" value={method.description} onChange={(event) => patch({ description: event.target.value })} />
                        {(method.provider === 'transfer' || method.provider === 'cash') && (
                          <TextArea label="Instrucciones para el cliente" value={method.instructions} rows={3} onChange={(event) => patch({ instructions: event.target.value })} hint="Se muestran en la confirmación del pedido (ej. alias y CBU)." className="sm:col-span-2" />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </form>
  )
}
