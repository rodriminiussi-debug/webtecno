'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useMemo, useState, useTransition } from 'react'
import { submitCheckout } from '@/app/actions/checkout'
import { CardIcon, ChevronDownIcon, ShieldIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { ArrowNudge, Button, buttonClass } from '@/components/ui/button'
import { Field, Input, Textarea, inputClass } from '@/components/ui/field'
import { useHydrated } from '@/hooks/use-hydrated'
import { cartSubtotal, useCart } from '@/lib/cart-store'
import { cn } from '@/lib/cn'
import type { PaymentProviderId, ShippingMethod } from '@/lib/data/types'
import { formatMoney } from '@/lib/format'
import { shippingCost } from '@/lib/pricing'

type PaymentOption = { id: string; name: string; description: string; provider: PaymentProviderId }

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
]

type FormState = {
  name: string
  email: string
  phone: string
  documentId: string
  street: string
  number: string
  apartment: string
  city: string
  province: string
  postalCode: string
  notes: string
}

const EMPTY: FormState = { name: '', email: '', phone: '', documentId: '', street: '', number: '', apartment: '', city: '', province: '', postalCode: '', notes: '' }

export function CheckoutForm({ currency, shippingMethods, paymentMethods }: { currency: string; shippingMethods: ShippingMethod[]; paymentMethods: PaymentOption[] }) {
  const router = useRouter()
  const hydrated = useHydrated()
  const lines = useCart((state) => state.lines)
  const clear = useCart((state) => state.clear)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [shippingId, setShippingId] = useState(shippingMethods[0]?.id ?? '')
  const [paymentId, setPaymentId] = useState(paymentMethods[0]?.id ?? '')
  const [error, setError] = useState<{ message: string; field?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [summaryOpen, setSummaryOpen] = useState(false)

  const shipping = shippingMethods.find((method) => method.id === shippingId) ?? null
  const subtotal = cartSubtotal(lines)
  const shippingCents = shipping ? shippingCost(shipping, subtotal) : 0
  const total = subtotal + shippingCents
  const visiblePayments = useMemo(
    () => paymentMethods.filter((method) => !(method.provider === 'cash' && shipping?.requiresAddress)),
    [paymentMethods, shipping],
  )
  const payment = visiblePayments.find((method) => method.id === paymentId) ?? visiblePayments[0] ?? null

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    if (error?.field?.endsWith(key)) setError(null)
  }
  const fieldError = (key: string) => (error?.field && error.field.split('.').pop() === key ? error.message : null)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await submitCheckout({
        items: lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
        customer: { name: form.name, email: form.email, phone: form.phone, documentId: form.documentId },
        shippingMethodId: shippingId,
        address: shipping?.requiresAddress
          ? { street: form.street, number: form.number, apartment: form.apartment, city: form.city, province: form.province, postalCode: form.postalCode }
          : null,
        paymentMethodId: payment?.id ?? '',
        notes: form.notes,
      })
      if (!result.ok) {
        setError({ message: result.error, field: result.field })
        requestAnimationFrame(() => document.getElementById('checkout-error')?.focus())
        return
      }
      clear()
      if (result.external) window.location.assign(result.redirectTo)
      else router.push(result.redirectTo)
    })
  }

  if (!hydrated) return <div className="skeleton mt-10 h-[520px]" aria-busy="true" />

  if (!lines.length) {
    return (
      <div className="mt-10 flex min-h-[360px] flex-col items-start justify-center gap-5 rounded-[var(--radius-lg)] bg-tile p-8 md:p-14">
        <p className="text-title font-medium">No hay productos para comprar.</p>
        <p className="max-w-md text-[15px] text-ink-2">Tu carrito está vacío. Agregá productos y volvé cuando quieras.</p>
        <Link href="/products" className={buttonClass({})}>
          Ver productos <ArrowNudge />
        </Link>
      </div>
    )
  }

  const summary = <OrderSummary lines={lines} currency={currency} subtotal={subtotal} shippingCents={shippingCents} total={total} shippingName={shipping?.name ?? ''} />

  return (
    <form onSubmit={submit} noValidate className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
      {/* Mobile summary toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          aria-expanded={summaryOpen}
          className="flex w-full items-center justify-between rounded-[var(--radius-md)] bg-surface px-5 py-4 text-[15px]"
        >
          <span className="flex items-center gap-2">
            Resumen del pedido <ChevronDownIcon size={16} className={cn('transition-transform', summaryOpen && 'rotate-180')} />
          </span>
          <span className="tabular font-medium">{formatMoney(total, currency)}</span>
        </button>
        <AnimatePresence initial={false}>
          {summaryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4">{summary}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-12 lg:col-span-7">
        <Step index="01" title="Datos personales">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nombre y apellido" value={form.name} onChange={set('name')} error={fieldError('name')} autoComplete="name" className="sm:col-span-2" required />
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={fieldError('email')} autoComplete="email" inputMode="email" hint="Te enviamos la confirmación y el seguimiento." required />
            <TextField label="Teléfono" type="tel" value={form.phone} onChange={set('phone')} error={fieldError('phone')} autoComplete="tel" inputMode="tel" required />
            <TextField label="DNI / CUIT (opcional)" value={form.documentId} onChange={set('documentId')} inputMode="numeric" hint="Para la factura." />
          </div>
        </Step>

        <Step index="02" title="Entrega">
          <div className="grid gap-2" role="radiogroup" aria-label="Método de envío">
            {shippingMethods.map((method) => {
              const cost = shippingCost(method, subtotal)
              return (
                <Choice key={method.id} selected={method.id === shippingId} onSelect={() => setShippingId(method.id)} title={method.name} description={`${method.description} · ${method.eta}`} aside={cost === 0 ? 'Gratis' : formatMoney(cost, currency)} />
              )
            })}
          </div>
          <AnimatePresence initial={false}>
            {shipping?.requiresAddress && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="grid gap-5 pt-6 sm:grid-cols-6">
                  <TextField label="Calle" value={form.street} onChange={set('street')} error={fieldError('street')} autoComplete="address-line1" className="sm:col-span-4" required />
                  <TextField label="Número" value={form.number} onChange={set('number')} error={fieldError('number')} inputMode="numeric" className="sm:col-span-2" required />
                  <TextField label="Piso / depto (opcional)" value={form.apartment} onChange={set('apartment')} autoComplete="address-line2" className="sm:col-span-2" />
                  <TextField label="Ciudad" value={form.city} onChange={set('city')} error={fieldError('city')} autoComplete="address-level2" className="sm:col-span-4" required />
                  <div className="sm:col-span-4">
                    <Field label="Provincia" htmlFor="province" error={fieldError('province')}>
                      <div className="relative">
                        <select id="province" value={form.province} onChange={set('province')} autoComplete="address-level1" aria-invalid={Boolean(fieldError('province'))} className={cn(inputClass, 'appearance-none pr-10')} required>
                          <option value="">Elegí una provincia</option>
                          {PROVINCES.map((province) => (
                            <option key={province}>{province}</option>
                          ))}
                        </select>
                        <ChevronDownIcon size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
                      </div>
                    </Field>
                  </div>
                  <TextField label="Código postal" value={form.postalCode} onChange={set('postalCode')} error={fieldError('postalCode')} autoComplete="postal-code" className="sm:col-span-2" required />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Step>

        <Step index="03" title="Pago">
          {visiblePayments.length === 0 ? (
            <p className="text-[15px] text-ink-2">No hay medios de pago disponibles para este envío. Elegí otro método de entrega o escribinos.</p>
          ) : (
            <div className="grid gap-2" role="radiogroup" aria-label="Medio de pago">
              {visiblePayments.map((method) => (
                <Choice key={method.id} selected={method.id === payment?.id} onSelect={() => setPaymentId(method.id)} title={method.name} description={method.description} icon={<CardIcon size={18} />} />
              ))}
            </div>
          )}
          <div className="mt-6">
            <Field label="Notas para el pedido (opcional)" htmlFor="notes">
              <Textarea id="notes" value={form.notes} onChange={set('notes')} maxLength={500} placeholder="Horario de entrega, referencias, regalo…" />
            </Field>
          </div>
        </Step>

        <div>
          {error && (
            <p id="checkout-error" tabIndex={-1} role="alert" className="mb-5 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-5 py-4 text-[14px] text-danger focus:outline-none">
              {error.message}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending || !payment}>
            {pending ? 'Procesando…' : `Confirmar pedido · ${formatMoney(total, currency)}`}
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted">
            <ShieldIcon size={16} /> Tus datos viajan cifrados. Al confirmar aceptás los{' '}
            <Link href="/terms" className="underline underline-offset-2">
              términos
            </Link>
            .
          </p>
        </div>
      </div>

      <aside className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)]">{summary}</div>
      </aside>
    </form>
  )
}

function Step({ index, title, children }: { index: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-6 flex w-full items-baseline gap-4 border-b border-line pb-4">
        <span className="label-mono text-muted">{index}</span>
        <span className="text-[22px] font-medium tracking-[-0.03em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  )
}

function TextField({ label, error, hint, className, ...props }: { label: string; error?: string | null; hint?: string; className?: string } & React.ComponentProps<'input'>) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint} className={className}>
      <Input id={id} aria-invalid={Boolean(error)} {...props} />
    </Field>
  )
}

function Choice({ selected, onSelect, title, description, aside, icon }: { selected: boolean; onSelect: () => void; title: string; description: string; aside?: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-[var(--radius-md)] border px-5 py-4 text-left transition-[border-color,background-color] duration-[var(--dur-fast)]',
        selected ? 'border-ink bg-surface' : 'border-line-strong hover:border-[color-mix(in_oklab,var(--mono-ink)_35%,transparent)]',
      )}
    >
      <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-ink' : 'border-line-strong')} aria-hidden="true">
        {selected && <span className="size-2.5 rounded-full bg-ink" />}
      </span>
      {icon && <span className="text-ink-2">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{title}</span>
        <span className="block text-[13px] text-muted">{description}</span>
      </span>
      {aside && <span className="tabular shrink-0 text-[14px]">{aside}</span>}
    </button>
  )
}

function OrderSummary({
  lines,
  currency,
  subtotal,
  shippingCents,
  total,
  shippingName,
}: {
  lines: ReturnType<typeof useCart.getState>['lines']
  currency: string
  subtotal: number
  shippingCents: number
  total: number
  shippingName: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-surface p-6">
      <p className="label-mono text-muted">Tu pedido</p>
      <ul className="mt-5 divide-y divide-line">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center gap-4 py-3">
            <div className="relative size-16 shrink-0 rounded-[var(--radius-sm)] bg-tile p-1.5">
              <ProductImage src={line.imageUrl} alt="" sizes="64px" />
              <span className="tabular absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-paper">{line.quantity}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{line.name}</p>
              {line.variantName && <p className="text-[13px] text-muted">{line.variantName}</p>}
            </div>
            <p className="tabular text-[14px]">{formatMoney(line.unitPriceCents * line.quantity, currency)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-ink-2">Subtotal</dt>
          <dd className="tabular">{formatMoney(subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-2">{shippingName || 'Envío'}</dt>
          <dd className="tabular">{shippingCents === 0 ? 'Gratis' : formatMoney(shippingCents, currency)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <p className="font-medium">Total</p>
        <p className="tabular text-[26px] font-medium tracking-[-0.03em]">{formatMoney(total, currency)}</p>
      </div>
      <p className="mt-2 text-[12px] text-muted">IVA incluido. Precios confirmados al procesar el pedido.</p>
    </div>
  )
}
