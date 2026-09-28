'use client'

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { saveHomepage } from '@/app/admin/actions/content'
import { ColorInput, ImageInput, SegmentedControl, SelectInput, TextArea, TextInput, adminInput } from '@/components/admin/form'
import { toast } from '@/components/admin/toast'
import { Badge, PageHeader, Panel } from '@/components/admin/ui'
import { ExternalIcon, GripIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/field'
import { FEATURE_VISUALS, type AnyHomepageSection, type BenefitIcon, type FeatureVisual, type HeroConfig, type HomepageSection, type SectionType } from '@/lib/data/types'
import { FEATURE_VISUAL_LABEL } from '@/features/home/feature-visuals'
import { cn } from '@/lib/cn'

type ProductOption = { id: string; name: string; status: string; imageUrl: string | null }
type CategoryOption = { id: string; name: string }

const TYPE_LABEL: Record<SectionType, string> = {
  hero: 'Hero',
  features: 'Funciones del producto',
  featured_products: 'Productos destacados',
  categories: 'Categorías',
  story: 'Storytelling',
  benefits: 'Beneficios',
  newsletter: 'Newsletter',
}

const BENEFIT_ICONS: { value: BenefitIcon; label: string }[] = [
  { value: 'shipping', label: 'Envío' },
  { value: 'secure', label: 'Compra segura' },
  { value: 'warranty', label: 'Garantía' },
  { value: 'support', label: 'Atención' },
  { value: 'returns', label: 'Devoluciones' },
  { value: 'installments', label: 'Cuotas' },
]

function newSection(type: Exclude<SectionType, 'hero'>): AnyHomepageSection {
  const id = `sec-${type}-${Date.now()}`
  const common = { id, enabled: true, sortOrder: 99 }
  switch (type) {
    case 'features':
      return { ...common, type, title: 'Lo nuevo.', subtitle: '', config: { eyebrow: 'Novedades', productId: null, items: [] } }
    case 'featured_products':
      return { ...common, type, title: 'Novedades', subtitle: '', config: { productIds: [], ctaLabel: 'Ver todo' } }
    case 'categories':
      return { ...common, type, title: 'Categorías', subtitle: '', config: { categoryIds: [] } }
    case 'story':
      return { ...common, type, title: 'Nuevo producto destacado.', subtitle: '', config: { eyebrow: 'Destacado', productId: null, imageUrl: null, body: '', ctaLabel: 'Conocer más', points: [] } }
    case 'benefits':
      return { ...common, type, title: 'Beneficios', subtitle: '', config: { items: [{ icon: 'shipping', title: 'Envíos a todo el país', body: '' }] } }
    case 'newsletter':
      return { ...common, type, title: 'Stay ahead.', subtitle: '', config: { placeholder: 'tu@email.com', ctaLabel: 'Suscribirme', note: '' } }
  }
}

export function HomeBuilder({ sections: initialSections, hero: initialHero, products, categories }: { sections: AnyHomepageSection[]; hero: HeroConfig; products: ProductOption[]; categories: CategoryOption[] }) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [hero, setHero] = useState(initialHero)
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null)
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    const onUnload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  const selected = sections.find((section) => section.id === selectedId) ?? null
  const patchSection = (id: string, patch: Partial<AnyHomepageSection>) => {
    setSections((current) => current.map((section) => (section.id === id ? ({ ...section, ...patch } as AnyHomepageSection) : section)))
    setDirty(true)
  }
  const patchHero = (patch: Partial<HeroConfig>) => {
    setHero((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setSections((current) => {
      const from = current.findIndex((section) => section.id === active.id)
      const to = current.findIndex((section) => section.id === over.id)
      return arrayMove(current, from, to)
    })
    setDirty(true)
  }

  const save = () =>
    startTransition(async () => {
      const result = await saveHomepage({ sections: sections.map((section, index) => ({ ...section, sortOrder: index })), hero })
      if (result.error !== null) return toast.error(result.error)
      setDirty(false)
      toast.success('Página de inicio publicada.')
      router.refresh()
    })

  return (
    <>
      <PageHeader
        title="Contenido · Página de inicio"
        description="Arrastrá para reordenar, activá o desactivá secciones y editá sus textos. Los cambios se publican al guardar."
        actions={
          <>
            {dirty && <span className="label-mono text-warning">Cambios sin publicar</span>}
            <a href="/" target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-4 text-[13px] hover:border-ink">
              <ExternalIcon size={14} /> Ver home
            </a>
            <Button size="sm" onClick={save} disabled={pending || !dirty}>
              {pending ? 'Publicando…' : 'Guardar y publicar'}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel title="Secciones" description="El orden de arriba hacia abajo es el de la página." className="lg:col-span-2" padded={false}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-1.5 p-3">
                {sections.map((section, index) => (
                  <SortableRow
                    key={section.id}
                    section={section}
                    index={index}
                    selected={section.id === selectedId}
                    onSelect={() => setSelectedId(section.id)}
                    onToggle={(enabled) => patchSection(section.id, { enabled })}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <AddSection
            onAdd={(type) => {
              const section = newSection(type)
              setSections((current) => [...current, section])
              setSelectedId(section.id)
              setDirty(true)
            }}
          />
        </Panel>

        <div className="lg:col-span-3">
          {selected ? (
            <Panel
              title={TYPE_LABEL[selected.type]}
              description={selected.enabled ? 'Visible en la home' : 'Oculta: no se muestra en la home'}
              actions={
                selected.type !== 'hero' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`¿Quitar la sección “${selected.title || TYPE_LABEL[selected.type]}”?`)) return
                      setSections((current) => current.filter((section) => section.id !== selected.id))
                      setSelectedId(null)
                      setDirty(true)
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] text-muted hover:text-danger"
                  >
                    <TrashIcon size={14} /> Quitar sección
                  </button>
                )
              }
            >
              {selected.type === 'hero' ? (
                <HeroEditor hero={hero} onChange={patchHero} products={products} />
              ) : (
                <SectionEditor section={selected} onChange={(patch) => patchSection(selected.id, patch)} products={products} categories={categories} />
              )}
            </Panel>
          ) : (
            <Panel>
              <p className="py-10 text-center text-[14px] text-muted">Elegí una sección para editarla.</p>
            </Panel>
          )}
        </div>
      </div>
    </>
  )
}

function SortableRow({ section, index, selected, onSelect, onToggle }: { section: AnyHomepageSection; index: number; selected: boolean; onSelect: () => void; onToggle: (enabled: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-[var(--radius-sm)] border bg-surface px-2 py-2',
        selected ? 'border-ink' : 'border-line hover:border-line-strong',
        isDragging && 'relative z-10 shadow-lg',
      )}
    >
      <button type="button" className="inline-flex size-8 cursor-grab touch-none items-center justify-center rounded text-muted hover:text-ink active:cursor-grabbing" aria-label={`Reordenar ${TYPE_LABEL[section.type]}`} {...attributes} {...listeners}>
        <GripIcon size={18} />
      </button>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="label-mono mr-2 text-muted">{String(index + 1).padStart(2, '0')}</span>
        <span className="text-[14px] font-medium">{TYPE_LABEL[section.type]}</span>
        {section.title && section.type !== 'hero' && <span className="block truncate text-[12px] text-muted">{section.title}</span>}
      </button>
      {!section.enabled && <Badge>Oculta</Badge>}
      <Switch checked={section.enabled} onChange={onToggle} label={`Mostrar ${TYPE_LABEL[section.type]}`} />
    </li>
  )
}

function AddSection({ onAdd }: { onAdd: (type: Exclude<SectionType, 'hero'>) => void }) {
  const [type, setType] = useState<Exclude<SectionType, 'hero'>>('featured_products')
  return (
    <div className="flex gap-2 border-t border-line p-3">
      <select className={adminInput} value={type} onChange={(event) => setType(event.target.value as typeof type)} aria-label="Tipo de sección">
        {(Object.keys(TYPE_LABEL) as SectionType[])
          .filter((item): item is Exclude<SectionType, 'hero'> => item !== 'hero')
          .map((item) => (
            <option key={item} value={item}>
              {TYPE_LABEL[item]}
            </option>
          ))}
      </select>
      <Button size="sm" variant="secondary" onClick={() => onAdd(type)}>
        <PlusIcon size={14} /> Agregar
      </Button>
    </div>
  )
}

function HeroEditor({ hero, onChange, products }: { hero: HeroConfig; onChange: (patch: Partial<HeroConfig>) => void; products: ProductOption[] }) {
  const callouts = [...hero.callouts, '', '', '', ''].slice(0, 4)
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SelectInput label="Producto destacado" value={hero.productId ?? ''} onChange={(event) => onChange({ productId: event.target.value || null })} hint="Define precio, botón “Comprar” e imagen por defecto." className="sm:col-span-2">
        <option value="">Ninguno</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
            {product.status !== 'published' ? ' (borrador)' : ''}
          </option>
        ))}
      </SelectInput>
      <TextInput label="Etiqueta superior" value={hero.eyebrow} onChange={(event) => onChange({ eyebrow: event.target.value })} />
      <TextInput label="Título" value={hero.title} onChange={(event) => onChange({ title: event.target.value })} required />
      <TextArea label="Subtítulo" value={hero.subtitle} rows={2} onChange={(event) => onChange({ subtitle: event.target.value })} className="sm:col-span-2" />
      <TextInput label="Texto del botón principal" value={hero.ctaLabel} onChange={(event) => onChange({ ctaLabel: event.target.value })} />
      <TextInput label="Texto del botón secundario" value={hero.secondaryLabel} onChange={(event) => onChange({ secondaryLabel: event.target.value })} hint="Vacío = sin botón secundario." />
      <SelectInput label="Animación" value={hero.animation} onChange={(event) => onChange({ animation: event.target.value as HeroConfig['animation'] })} hint="La secuencia recorre los cuadros de abajo al hacer scroll.">
        <option value="airpods">Película de AirPods (capas, estilo Apple)</option>
        <option value="sequence">Secuencia de cuadros propios con scroll</option>
        <option value="parallax">Imagen con parallax</option>
        <option value="none">Imagen estática</option>
      </SelectInput>
      <ColorInput label="Color de fondo" value={hero.background} onChange={(background) => onChange({ background })} hint="El texto se adapta automáticamente al fondo." />
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-[13px] font-medium text-ink-2">Posición del producto</p>
        <SegmentedControl
          label="Posición del producto"
          value={hero.productPosition}
          onChange={(productPosition) => onChange({ productPosition })}
          options={[
            { value: 'left', label: 'Izquierda' },
            { value: 'center', label: 'Centro' },
            { value: 'right', label: 'Derecha' },
          ]}
        />
      </div>
      {hero.animation === 'sequence' && (
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-[13px] font-medium text-ink-2">Cuadros de la secuencia (en orden)</p>
          <p className="mb-3 text-[12px] text-muted">Ideal: PNG/WebP con fondo transparente, mismo encuadre. Ej.: cerrado → abierto → saliendo → primer plano.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <ImageInput
                key={index}
                label={`Cuadro ${index + 1}`}
                value={hero.frames[index] ?? null}
                onChange={(url) => {
                  const next = [...hero.frames]
                  next[index] = url ?? ''
                  onChange({ frames: next.filter(Boolean) })
                }}
              />
            ))}
          </div>
        </div>
      )}
      <ImageInput label="Imagen desktop" value={hero.imageDesktop} onChange={(imageDesktop) => onChange({ imageDesktop })} hint="Opcional. Por defecto, la imagen del producto." />
      <ImageInput label="Imagen mobile" value={hero.imageMobile} onChange={(imageMobile) => onChange({ imageMobile })} hint="Opcional. Por defecto, la de desktop." />
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-[13px] font-medium text-ink-2">Características que aparecen al hacer scroll</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {callouts.map((value, index) => (
            <input
              key={index}
              className={adminInput}
              value={value}
              placeholder={`Característica ${index + 1}`}
              aria-label={`Característica ${index + 1}`}
              onChange={(event) => {
                const next = [...callouts]
                next[index] = event.target.value
                onChange({ callouts: next.filter((item) => item.trim()) })
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between sm:col-span-2">
        <label htmlFor="hero-price" className="text-[14px]">
          Mostrar precio
        </label>
        <Switch id="hero-price" checked={hero.showPrice} onChange={(showPrice) => onChange({ showPrice })} label="Mostrar precio" />
      </div>
    </div>
  )
}

function SectionEditor({ section, onChange, products, categories }: { section: AnyHomepageSection; onChange: (patch: Partial<AnyHomepageSection>) => void; products: ProductOption[]; categories: CategoryOption[] }) {
  const header = (
    <>
      <TextInput label="Título" value={section.title} onChange={(event) => onChange({ title: event.target.value })} />
      <TextArea label="Subtítulo" value={section.subtitle} rows={2} onChange={(event) => onChange({ subtitle: event.target.value })} />
    </>
  )
  switch (section.type) {
    case 'features': {
      const config = section.config
      const set = (patch: Partial<typeof config>) => onChange({ config: { ...config, ...patch } } as Partial<HomepageSection<'features'>>)
      const items = config.items
      const move = (index: number, delta: number) => {
        const next = [...items]
        const [item] = next.splice(index, 1)
        next.splice(index + delta, 0, item)
        set({ items: next })
      }
      return (
        <div className="grid gap-4">
          <TextInput label="Etiqueta" value={config.eyebrow} onChange={(event) => set({ eyebrow: event.target.value })} />
          {header}
          <SelectInput label="Producto (botón de consulta al final)" value={config.productId ?? ''} onChange={(event) => set({ productId: event.target.value || null })}>
            <option value="">Ninguno</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </SelectInput>
          <p className="text-[12px] text-muted">La sección empieza con la vista explotada del auricular y sigue con un panel por función.</p>
          <ul className="grid gap-3">
            {items.map((item, index) => (
              <li key={index} className="grid gap-2 rounded-[var(--radius-sm)] border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className="label-mono text-muted">{String(index + 1).padStart(2, '0')}</span>
                  <select className={adminInput} value={item.visual} aria-label="Animación" onChange={(event) => set({ items: items.map((it, i) => (i === index ? { ...it, visual: event.target.value as FeatureVisual } : it)) })}>
                    {FEATURE_VISUALS.map((visual) => (
                      <option key={visual} value={visual}>
                        {FEATURE_VISUAL_LABEL[visual]}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label="Subir">↑</button>
                  <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label="Bajar">↓</button>
                  <button type="button" onClick={() => set({ items: items.filter((_, i) => i !== index) })} className="px-1 text-muted hover:text-danger" aria-label="Quitar">✕</button>
                </div>
                <input className={adminInput} value={item.kicker} placeholder="Nombre de la función" aria-label="Nombre de la función" onChange={(event) => set({ items: items.map((it, i) => (i === index ? { ...it, kicker: event.target.value } : it)) })} />
                <input className={adminInput} value={item.title} placeholder="Titular" aria-label="Titular" onChange={(event) => set({ items: items.map((it, i) => (i === index ? { ...it, title: event.target.value } : it)) })} />
                <textarea className={`${adminInput} h-auto py-2`} rows={2} value={item.body} placeholder="Descripción" aria-label="Descripción" onChange={(event) => set({ items: items.map((it, i) => (i === index ? { ...it, body: event.target.value } : it)) })} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => set({ items: [...items, { visual: 'anc', kicker: '', title: '', body: '' }] })} className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[12px] hover:border-ink">
            <PlusIcon size={14} /> Agregar función
          </button>
        </div>
      )
    }
    case 'featured_products': {
      const config = section.config
      const set = (patch: Partial<typeof config>) => onChange({ config: { ...config, ...patch } } as Partial<HomepageSection<'featured_products'>>)
      return (
        <div className="grid gap-4">
          {header}
          <TextInput label="Texto del enlace" value={config.ctaLabel} onChange={(event) => set({ ctaLabel: event.target.value })} />
          <PickList
            label="Productos (el primero ocupa el lugar grande)"
            emptyHint="Sin selección: se muestran los productos marcados como destacados."
            options={products.map((product) => ({ id: product.id, name: product.name + (product.status !== 'published' ? ' (borrador, no se muestra)' : '') }))}
            value={config.productIds}
            onChange={(productIds) => set({ productIds })}
          />
        </div>
      )
    }
    case 'categories': {
      const config = section.config
      return (
        <div className="grid gap-4">
          {header}
          <PickList
            label="Categorías"
            emptyHint="Sin selección: se muestran todas las categorías visibles."
            options={categories}
            value={config.categoryIds}
            onChange={(categoryIds) => onChange({ config: { categoryIds } } as Partial<HomepageSection<'categories'>>)}
          />
        </div>
      )
    }
    case 'story': {
      const config = section.config
      const set = (patch: Partial<typeof config>) => onChange({ config: { ...config, ...patch } } as Partial<HomepageSection<'story'>>)
      const points = [...config.points, { title: '', body: '' }, { title: '', body: '' }, { title: '', body: '' }].slice(0, 3)
      return (
        <div className="grid gap-4">
          <TextInput label="Etiqueta" value={config.eyebrow} onChange={(event) => set({ eyebrow: event.target.value })} />
          <TextInput label="Titular" value={section.title} onChange={(event) => onChange({ title: event.target.value })} />
          <TextInput label="Nombre / bajada" value={section.subtitle} onChange={(event) => onChange({ subtitle: event.target.value })} />
          <TextArea label="Texto" value={config.body} rows={3} onChange={(event) => set({ body: event.target.value })} />
          <SelectInput label="Producto" value={config.productId ?? ''} onChange={(event) => set({ productId: event.target.value || null })}>
            <option value="">Ninguno</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </SelectInput>
          <ImageInput label="Imagen principal" value={config.imageUrl} onChange={(imageUrl) => set({ imageUrl })} hint="Opcional. Por defecto, la imagen del producto." />
          <TextInput label="Texto del botón" value={config.ctaLabel} onChange={(event) => set({ ctaLabel: event.target.value })} />
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-ink-2">Datos clave (hasta 3)</p>
            <div className="grid gap-2">
              {points.map((point, index) => (
                <div key={index} className="grid grid-cols-[1fr_2fr] gap-2">
                  <input className={adminInput} value={point.title} placeholder="60 h" aria-label={`Dato ${index + 1}`} onChange={(event) => set({ points: points.map((p, i) => (i === index ? { ...p, title: event.target.value } : p)).filter((p) => p.title || p.body) })} />
                  <input className={adminInput} value={point.body} placeholder="De batería con una sola carga" aria-label={`Descripción del dato ${index + 1}`} onChange={(event) => set({ points: points.map((p, i) => (i === index ? { ...p, body: event.target.value } : p)).filter((p) => p.title || p.body) })} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }
    case 'benefits': {
      const items = section.config.items
      const setItems = (next: typeof items) => onChange({ config: { items: next } } as Partial<HomepageSection<'benefits'>>)
      return (
        <div className="grid gap-4">
          <TextInput label="Etiqueta de la sección" value={section.title} onChange={(event) => onChange({ title: event.target.value })} />
          <ul className="grid gap-3">
            {items.map((item, index) => (
              <li key={index} className="grid gap-2 rounded-[var(--radius-sm)] border border-line p-3 sm:grid-cols-[140px_1fr_auto]">
                <select className={adminInput} value={item.icon} aria-label="Ícono" onChange={(event) => setItems(items.map((it, i) => (i === index ? { ...it, icon: event.target.value as BenefitIcon } : it)))}>
                  {BENEFIT_ICONS.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
                <div className="grid gap-2">
                  <input className={adminInput} value={item.title} placeholder="Título" aria-label="Título del beneficio" onChange={(event) => setItems(items.map((it, i) => (i === index ? { ...it, title: event.target.value } : it)))} />
                  <input className={adminInput} value={item.body} placeholder="Descripción" aria-label="Descripción del beneficio" onChange={(event) => setItems(items.map((it, i) => (i === index ? { ...it, body: event.target.value } : it)))} />
                </div>
                <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} aria-label="Quitar beneficio" className="inline-flex size-8 items-center justify-center self-start rounded-full text-ink-2 hover:bg-tile hover:text-danger">
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
          {items.length < 6 && (
            <button type="button" onClick={() => setItems([...items, { icon: 'secure', title: '', body: '' }])} className="inline-flex h-8 w-fit items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3 text-[12px] hover:border-ink">
              <PlusIcon size={14} /> Agregar beneficio
            </button>
          )}
        </div>
      )
    }
    case 'newsletter': {
      const config = section.config
      const set = (patch: Partial<typeof config>) => onChange({ config: { ...config, ...patch } } as Partial<HomepageSection<'newsletter'>>)
      return (
        <div className="grid gap-4">
          {header}
          <TextInput label="Placeholder del email" value={config.placeholder} onChange={(event) => set({ placeholder: event.target.value })} />
          <TextInput label="Texto del botón" value={config.ctaLabel} onChange={(event) => set({ ctaLabel: event.target.value })} />
          <TextInput label="Nota al pie" value={config.note} onChange={(event) => set({ note: event.target.value })} />
        </div>
      )
    }
    default:
      return null
  }
}

function PickList({ label, options, value, onChange, emptyHint }: { label: string; options: { id: string; name: string }[]; value: string[]; onChange: (value: string[]) => void; emptyHint: string }) {
  const byId = new Map(options.map((option) => [option.id, option]))
  const available = options.filter((option) => !value.includes(option.id))
  const move = (index: number, delta: number) => {
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-ink-2">{label}</p>
      {value.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] bg-tile px-3 py-2.5 text-[12px] text-muted">{emptyHint}</p>
      ) : (
        <ol className="grid gap-1">
          {value.map((id, index) => (
            <li key={id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-[13px]">
              <span className="label-mono text-muted">{String(index + 1).padStart(2, '0')}</span>
              <span className="flex-1 truncate">{byId.get(id)?.name ?? 'Elemento eliminado'}</span>
              <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label="Subir">
                ↑
              </button>
              <button type="button" disabled={index === value.length - 1} onClick={() => move(index, 1)} className="px-1 text-muted hover:text-ink disabled:opacity-20" aria-label="Bajar">
                ↓
              </button>
              <button type="button" onClick={() => onChange(value.filter((item) => item !== id))} className="px-1 text-muted hover:text-danger" aria-label="Quitar">
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
      {available.length > 0 && (
        <select
          className={`${adminInput} mt-2`}
          value=""
          aria-label="Agregar a la lista"
          onChange={(event) => {
            if (event.target.value) onChange([...value, event.target.value])
          }}
        >
          <option value="">+ Agregar…</option>
          {available.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
