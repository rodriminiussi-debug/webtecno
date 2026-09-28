'use client'

import { useId, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { UploadIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { cn } from '@/lib/cn'

export const adminInput =
  'block h-10 w-full rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--mono-ink)_10%,transparent)] disabled:opacity-50'

export function AdminField({ label, hint, children, className, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

export function TextInput({ label, hint, className, ...props }: { label: string; hint?: ReactNode; className?: string } & ComponentProps<'input'>) {
  const id = useId()
  return (
    <AdminField label={label} hint={hint} className={className} htmlFor={id}>
      <input id={id} className={adminInput} {...props} />
    </AdminField>
  )
}

export function TextArea({ label, hint, className, ...props }: { label: string; hint?: ReactNode; className?: string } & ComponentProps<'textarea'>) {
  const id = useId()
  return (
    <AdminField label={label} hint={hint} className={className} htmlFor={id}>
      <textarea id={id} className={cn(adminInput, 'h-auto min-h-24 py-2.5 leading-relaxed')} {...props} />
    </AdminField>
  )
}

export function SelectInput({ label, hint, className, children, ...props }: { label: string; hint?: ReactNode; className?: string } & ComponentProps<'select'>) {
  const id = useId()
  return (
    <AdminField label={label} hint={hint} className={className} htmlFor={id}>
      <select id={id} className={cn(adminInput, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23888%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8')} {...props}>
        {children}
      </select>
    </AdminField>
  )
}

/** Money input in pesos; state is kept in cents to match the domain model. */
export function MoneyInput({ label, hint, cents, onChange, allowEmpty = false, className }: { label: string; hint?: ReactNode; cents: number | null; onChange: (cents: number | null) => void; allowEmpty?: boolean; className?: string }) {
  const id = useId()
  return (
    <AdminField label={label} hint={hint} className={className} htmlFor={id}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted">$</span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="1"
          className={cn(adminInput, 'tabular pl-7')}
          value={cents === null ? '' : cents / 100}
          placeholder={allowEmpty ? '—' : '0'}
          onChange={(event) => {
            const value = event.target.value
            if (value === '') onChange(allowEmpty ? null : 0)
            else onChange(Math.max(0, Math.round(Number(value) * 100)))
          }}
        />
      </div>
    </AdminField>
  )
}

export function ColorInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  const id = useId()
  return (
    <AdminField label={label} hint={hint} htmlFor={id}>
      <div className="flex gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value)} aria-label={`${label} (selector)`} className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-line-strong bg-surface p-1" />
        <input id={id} className={cn(adminInput, 'font-mono uppercase')} value={value} onChange={(event) => onChange(event.target.value)} maxLength={7} spellCheck={false} />
      </div>
    </AdminField>
  )
}

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const body = new FormData()
  body.append('file', file)
  try {
    const response = await fetch('/api/admin/upload', { method: 'POST', body })
    const data = (await response.json()) as { url?: string; error?: string }
    if (!response.ok || !data.url) return { error: data.error ?? 'No se pudo subir la imagen.' }
    return { url: data.url }
  } catch (error) {
    console.error('uploadImage failed', { error })
    return { error: 'No se pudo subir la imagen. Revisá tu conexión.' }
  }
}

/** Single image: upload a file or paste a URL, with preview. */
export function ImageInput({ label, value, onChange, hint, aspect = 'square' }: { label: string; value: string | null; onChange: (url: string | null) => void; hint?: string; aspect?: 'square' | 'wide' }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()
  return (
    <AdminField label={label} hint={error ? <span className="text-danger">{error}</span> : hint} htmlFor={id}>
      <div className="flex gap-3">
        <div className={cn('relative shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-line bg-tile', aspect === 'wide' ? 'h-16 w-28' : 'size-16')}>
          {value ? <ProductImage src={value} alt="" sizes="112px" className="p-1" /> : <span className="flex size-full items-center justify-center text-[11px] text-muted">Sin imagen</span>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <input id={id} className={adminInput} value={value ?? ''} placeholder="/ruta/imagen.png o https://…" onChange={(event) => onChange(event.target.value.trim() || null)} />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[12px] hover:border-ink disabled:opacity-50">
              <UploadIcon size={14} /> {busy ? 'Subiendo…' : 'Subir archivo'}
            </button>
            {value && (
              <button type="button" onClick={() => onChange(null)} className="inline-flex h-8 items-center rounded-full px-3 text-[12px] text-muted hover:text-danger">
                Quitar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/x-icon"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              setBusy(true)
              setError(null)
              const result = await uploadImage(file)
              setBusy(false)
              if ('error' in result) setError(result.error)
              else onChange(result.url)
            }}
          />
        </div>
      </div>
    </AdminField>
  )
}

export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-[var(--radius-sm)] bg-tile-2 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn('h-8 flex-1 rounded-[6px] px-3 text-[13px] transition-colors', option.value === value ? 'bg-surface font-medium shadow-sm' : 'text-ink-2 hover:text-ink')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
