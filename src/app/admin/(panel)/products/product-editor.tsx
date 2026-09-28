'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { deleteProduct, duplicateProduct, saveProduct, type ProductInput } from '@/app/admin/actions/products'
import { toast } from '@/components/admin/toast'
import { Panel } from '@/components/admin/ui'
import { ImageInput, MoneyInput, SegmentedControl, SelectInput, TextArea, TextInput, adminInput, uploadImage } from '@/components/admin/form'
import { ArrowLeftIcon, ArrowRightIcon, CopyIcon, ExternalIcon, PlusIcon, TrashIcon, UploadIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/field'
import type { Category, Product } from '@/lib/data/types'
import { slugify } from '@/lib/format'
import { discountPercent, priceFromDiscount } from '@/lib/pricing'

type Draft = ProductInput & { images: { id: string; url: string; alt: string }[] }

function toDraft(product: Product | null): Draft {
  if (!product) {
    return {
      id: null,
      name: '',
      slug: '',
      brand: '',
      shortDescription: '',
      description: '',
      priceCents: 0,
      compareAtCents: null,
      sku: '',
      categoryId: null,
      stock: 0,
      images: [],
      variantLabel: '',
      variants: [],
      specs: [],
      features: [],
      isFeatured: false,
      status: 'draft',
      animation: 'none',
      seoTitle: '',
      seoDescription: '',
    }
  }
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    shortDescription: product.shortDescription,
    description: product.description,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    sku: product.sku,
    categoryId: product.categoryId,
    stock: product.stock,
    images: product.images.map(({ id, url, alt }) => ({ id, url, alt })),
    variantLabel: product.variantLabel,
    variants: product.variants,
    specs: product.specs,
    features: product.features,
    isFeatured: product.isFeatured,
    status: product.status,
    animation: product.animation,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  }
}

let tempId = 0
const newId = () => `new-${Date.now()}-${tempId++}`

export function ProductEditor({ product, categories }: { product: Product | null; categories: Category[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(() => toDraft(product))
  const [slugTouched, setSlugTouched] = useState(Boolean(product))
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }, [])

  const save = useCallback(() => {
    startTransition(async () => {
      const result = await saveProduct(draft)
      if (result.error !== null) {
        toast.error(result.error)
        return
      }
      setDirty(false)
      toast.success(product ? 'Cambios guardados.' : 'Producto creado.')
      if (!product) router.replace(`/admin/products/${result.data.id}`)
      else router.refresh()
    })
  }, [draft, product, router])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        save()
      }
    }
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [save, dirty])

  const discount = discountPercent(draft.priceCents, draft.compareAtCents ?? null)
  const totalVariantStock = draft.variants.reduce((sum, variant) => sum + variant.stock, 0)

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8 lg:top-0">
        <div className="min-w-0">
          <Link href="/admin/products" className="text-[13px] text-muted hover:text-ink">
            ← Productos
          </Link>
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.03em]">{draft.name || 'Nuevo producto'}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="label-mono text-warning">Cambios sin guardar</span>}
          {product && product.status === 'published' && (
            <a href={`/products/${product.slug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[13px] hover:border-ink">
              <ExternalIcon size={14} /> Ver en tienda
            </a>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'} <kbd className="hidden font-mono text-[10px] opacity-50 md:inline">⌘S</kbd>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Información">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Nombre"
                value={draft.name}
                required
                onChange={(event) => {
                  update('name', event.target.value)
                  if (!slugTouched) update('slug', slugify(event.target.value))
                }}
                className="sm:col-span-2"
              />
              <TextInput
                label="Slug (URL)"
                value={draft.slug}
                onChange={(event) => {
                  setSlugTouched(true)
                  update('slug', event.target.value)
                }}
                onBlur={() => update('slug', slugify(draft.slug))}
                hint={`/products/${draft.slug || '…'}`}
              />
              <TextInput label="Marca" value={draft.brand} onChange={(event) => update('brand', event.target.value)} />
              <TextArea label="Descripción corta" value={draft.shortDescription} onChange={(event) => update('shortDescription', event.target.value)} rows={2} maxLength={240} hint={`${draft.shortDescription.length}/240 · Se muestra en tarjetas y buscador.`} className="sm:col-span-2" />
              <TextArea label="Descripción" value={draft.description} onChange={(event) => update('description', event.target.value)} rows={6} className="sm:col-span-2" />
            </div>
          </Panel>

          <ImagesPanel images={draft.images} onChange={(images) => update('images', images)} productName={draft.name} />

          <Panel title="Precio">
            <div className="grid gap-4 sm:grid-cols-3">
              <MoneyInput label="Precio" cents={draft.priceCents} onChange={(value) => update('priceCents', value ?? 0)} />
              <MoneyInput label="Precio anterior" cents={draft.compareAtCents ?? null} allowEmpty onChange={(value) => update('compareAtCents', value)} hint="Opcional. Se muestra tachado." />
              <TextInput
                label="Descuento (%)"
                type="number"
                min={0}
                max={95}
                value={discount || ''}
                placeholder="—"
                disabled={!draft.compareAtCents}
                hint={draft.compareAtCents ? 'Recalcula el precio.' : 'Cargá un precio anterior.'}
                onChange={(event) => {
                  if (!draft.compareAtCents) return
                  update('priceCents', priceFromDiscount(draft.compareAtCents, Number(event.target.value) || 0))
                }}
              />
            </div>
          </Panel>

          <Panel title="Inventario y variantes" description="Con variantes, el stock total es la suma de cada una.">
            <div className="grid gap-4 sm:grid-cols-3">
              <TextInput label="SKU" value={draft.sku} onChange={(event) => update('sku', event.target.value.toUpperCase())} required className="font-mono" />
              <TextInput
                label="Stock"
                type="number"
                min={0}
                value={draft.variants.length ? totalVariantStock : draft.stock}
                disabled={draft.variants.length > 0}
                onChange={(event) => update('stock', Math.max(0, Math.floor(Number(event.target.value) || 0)))}
                hint={draft.variants.length ? 'Calculado desde variantes.' : undefined}
              />
              <TextInput label="Nombre de la opción" value={draft.variantLabel} onChange={(event) => update('variantLabel', event.target.value)} placeholder="Color, Capacidad…" />
            </div>
            <VariantsTable variants={draft.variants} basePrice={draft.priceCents} onChange={(variants) => update('variants', variants)} />
          </Panel>

          <Panel title="Características" description="Beneficios destacados en la página del producto.">
            <PairList
              items={draft.features.map((feature) => [feature.title, feature.body] as [string, string])}
              labels={['Título', 'Descripción']}
              onChange={(items) => update('features', items.map(([title, body]) => ({ title, body })))}
              addLabel="Agregar característica"
            />
          </Panel>

          <Panel title="Especificaciones técnicas">
            <PairList
              items={draft.specs.map((spec) => [spec.label, spec.value] as [string, string])}
              labels={['Atributo', 'Valor']}
              onChange={(items) => update('specs', items.map(([label, value]) => ({ label, value })))}
              addLabel="Agregar especificación"
            />
          </Panel>

          <Panel title="SEO" description="Si quedan vacíos se usan el nombre y la descripción corta.">
            <div className="grid gap-4">
              <TextInput label="Título SEO" value={draft.seoTitle} maxLength={70} onChange={(event) => update('seoTitle', event.target.value)} hint={`${draft.seoTitle.length}/70`} />
              <TextArea label="Descripción SEO" value={draft.seoDescription} maxLength={170} rows={2} onChange={(event) => update('seoDescription', event.target.value)} hint={`${draft.seoDescription.length}/170`} />
              <div className="rounded-[var(--radius-sm)] border border-line p-4">
                <p className="label-mono mb-2 text-muted">Vista previa en Google</p>
                <p className="truncate text-[17px] text-[#1a0dab]">{draft.seoTitle || draft.name || 'Nombre del producto'}</p>
                <p className="truncate text-[12px] text-success">/products/{draft.slug}</p>
                <p className="line-clamp-2 text-[13px] text-ink-2">{draft.seoDescription || draft.shortDescription || 'Descripción del producto.'}</p>
              </div>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Estado">
            <SegmentedControl
              label="Estado de publicación"
              value={draft.status}
              onChange={(status) => update('status', status)}
              options={[
                { value: 'published', label: 'Publicado' },
                { value: 'draft', label: 'Borrador' },
              ]}
            />
            <p className="mt-2 text-[12px] text-muted">{draft.status === 'published' ? 'Visible en la tienda.' : 'Oculto para los clientes.'}</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <label htmlFor="featured" className="text-[14px]">
                Producto destacado
              </label>
              <Switch id="featured" checked={draft.isFeatured} onChange={(value) => update('isFeatured', value)} label="Producto destacado" />
            </div>
          </Panel>

          <Panel title="Organización">
            <div className="flex flex-col gap-4">
              <SelectInput label="Categoría" value={draft.categoryId ?? ''} onChange={(event) => update('categoryId', event.target.value || null)}>
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
              <SelectInput label="Animación en su página" value={draft.animation} onChange={(event) => update('animation', event.target.value as Draft['animation'])}>
                <option value="none">Ninguna</option>
                <option value="float">Flotación suave de la imagen</option>
              </SelectInput>
            </div>
          </Panel>

          {product && <DangerZone product={product} dirty={dirty} />}
        </div>
      </div>
    </form>
  )
}

function ImagesPanel({ images, onChange, productName }: { images: Draft['images']; onChange: (images: Draft['images']) => void; productName: string }) {
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const move = (index: number, delta: number) => {
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }
  return (
    <Panel
      title="Imágenes"
      description="La primera es la principal; la segunda aparece al pasar el mouse."
      actions={
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[12px] hover:border-ink disabled:opacity-50">
          <UploadIcon size={14} /> {busy ? 'Subiendo…' : 'Subir imágenes'}
        </button>
      }
    >
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={async (event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (!files.length) return
          setBusy(true)
          const added: Draft['images'] = []
          for (const file of files) {
            const result = await uploadImage(file)
            if ('error' in result) toast.error(`${file.name}: ${result.error}`)
            else added.push({ id: newId(), url: result.url, alt: productName })
          }
          setBusy(false)
          if (added.length) onChange([...images, ...added])
        }}
      />
      {images.length === 0 ? (
        <p className="text-[13px] text-muted">Sin imágenes. Subí archivos o agregá una URL.</p>
      ) : (
        <ul className="grid gap-3">
          {images.map((image, index) => (
            <li key={image.id} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line p-2">
              <div className="relative size-16 shrink-0 rounded-[6px] bg-tile">
                <ProductImage src={image.url} alt="" sizes="64px" className="p-1" />
              </div>
              <div className="grid min-w-0 flex-1 gap-1.5">
                <input className={`${adminInput} h-8 text-[12px]`} value={image.url} aria-label={`URL de la imagen ${index + 1}`} onChange={(event) => onChange(images.map((item) => (item.id === image.id ? { ...item, url: event.target.value } : item)))} />
                <input className={`${adminInput} h-8 text-[12px]`} value={image.alt} placeholder="Texto alternativo (accesibilidad)" aria-label={`Texto alternativo de la imagen ${index + 1}`} onChange={(event) => onChange(images.map((item) => (item.id === image.id ? { ...item, alt: event.target.value } : item)))} />
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <IconButton label="Mover antes" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowLeftIcon size={14} className="rotate-90" />
                </IconButton>
                <IconButton label="Mover después" disabled={index === images.length - 1} onClick={() => move(index, 1)}>
                  <ArrowRightIcon size={14} className="rotate-90" />
                </IconButton>
              </div>
              <IconButton label="Quitar imagen" onClick={() => onChange(images.filter((item) => item.id !== image.id))} danger>
                <TrashIcon size={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <AddImageByUrl onAdd={(url) => onChange([...images, { id: newId(), url, alt: productName }])} />
    </Panel>
  )
}

function AddImageByUrl({ onAdd }: { onAdd: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  return (
    <div className="mt-4 flex items-end gap-2 border-t border-line pt-4">
      <div className="flex-1">
        <ImageInput label="Agregar por URL o archivo" value={url} onChange={setUrl} />
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={!url}
        onClick={() => {
          if (!url) return
          onAdd(url)
          setUrl(null)
        }}
      >
        Agregar
      </Button>
    </div>
  )
}

function VariantsTable({ variants, basePrice, onChange }: { variants: Draft['variants']; basePrice: number; onChange: (variants: Draft['variants']) => void }) {
  const patch = (id: string, value: Partial<Draft['variants'][number]>) => onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...value } : variant)))
  return (
    <div className="mt-5">
      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="text-left">
                {['Variante', 'SKU', 'Precio', 'Stock', 'Color', ''].map((head) => (
                  <th key={head} className="label-mono pb-2 pr-2 font-normal text-muted">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id}>
                  <td className="py-1 pr-2">
                    <input className={`${adminInput} h-9`} value={variant.name} aria-label="Nombre de la variante" onChange={(event) => patch(variant.id, { name: event.target.value })} />
                  </td>
                  <td className="py-1 pr-2">
                    <input className={`${adminInput} h-9 font-mono text-[12px]`} value={variant.sku} placeholder="auto" aria-label="SKU de la variante" onChange={(event) => patch(variant.id, { sku: event.target.value.toUpperCase() })} />
                  </td>
                  <td className="w-36 py-1 pr-2">
                    <input
                      className={`${adminInput} tabular h-9`}
                      type="number"
                      min={0}
                      aria-label="Precio de la variante"
                      placeholder={String(basePrice / 100)}
                      value={variant.priceCents === null ? '' : (variant.priceCents ?? 0) / 100}
                      onChange={(event) => patch(variant.id, { priceCents: event.target.value === '' ? null : Math.round(Number(event.target.value) * 100) })}
                    />
                  </td>
                  <td className="w-24 py-1 pr-2">
                    <input className={`${adminInput} tabular h-9`} type="number" min={0} aria-label="Stock de la variante" value={variant.stock} onChange={(event) => patch(variant.id, { stock: Math.max(0, Math.floor(Number(event.target.value) || 0)) })} />
                  </td>
                  <td className="w-24 py-1 pr-2">
                    <div className="flex items-center gap-1">
                      <input type="color" aria-label="Color de la variante" value={variant.swatch ?? '#000000'} onChange={(event) => patch(variant.id, { swatch: event.target.value })} className="h-9 w-10 cursor-pointer rounded-[6px] border border-line-strong p-0.5" />
                      {variant.swatch && (
                        <button type="button" className="text-[11px] text-muted hover:text-ink" onClick={() => patch(variant.id, { swatch: null })}>
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-1">
                    <IconButton label="Quitar variante" danger onClick={() => onChange(variants.filter((item) => item.id !== variant.id))}>
                      <TrashIcon size={16} />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-muted">Precio vacío = usa el precio del producto.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...variants, { id: newId(), name: '', sku: '', priceCents: null, stock: 0, swatch: null }])}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[12px] hover:border-ink"
      >
        <PlusIcon size={14} /> Agregar variante
      </button>
    </div>
  )
}

function PairList({ items, labels, onChange, addLabel }: { items: [string, string][]; labels: [string, string]; onChange: (items: [string, string][]) => void; addLabel: string }) {
  return (
    <div>
      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map(([a, b], index) => (
            <li key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input className={`${adminInput} h-9`} value={a} placeholder={labels[0]} aria-label={`${labels[0]} ${index + 1}`} onChange={(event) => onChange(items.map((item, i) => (i === index ? [event.target.value, item[1]] : item)))} />
              <input className={`${adminInput} h-9`} value={b} placeholder={labels[1]} aria-label={`${labels[1]} ${index + 1}`} onChange={(event) => onChange(items.map((item, i) => (i === index ? [item[0], event.target.value] : item)))} />
              <IconButton label="Quitar" danger onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <TrashIcon size={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => onChange([...items, ['', '']])} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[12px] hover:border-ink">
        <PlusIcon size={14} /> {addLabel}
      </button>
    </div>
  )
}

function IconButton({ label, onClick, children, disabled, danger }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-tile disabled:opacity-30 ${danger ? 'hover:text-danger' : 'hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

function DangerZone({ product, dirty }: { product: Product; dirty: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  return (
    <Panel title="Acciones">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Duplicar la versión guardada igual?')) return
              const result = await duplicateProduct(product.id)
              if (result.error !== null) return toast.error(result.error)
              toast.success('Copia creada como borrador.')
              router.push(`/admin/products/${result.data.id}`)
            })
          }
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-[13px] hover:bg-tile"
        >
          <CopyIcon size={16} /> Duplicar producto
        </button>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-[13px] text-danger hover:bg-danger/5">
            <TrashIcon size={16} /> Eliminar producto
          </button>
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 p-3">
            <p className="text-[13px]">¿Eliminar “{product.name}”? No se puede deshacer. Los pedidos existentes conservan sus datos.</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteProduct(product.id)
                    if (result.error !== null) return toast.error(result.error)
                    toast.success('Producto eliminado.')
                    router.push('/admin/products')
                  })
                }
              >
                Sí, eliminar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
