'use client'

import { AnimatePresence, motion } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { CloseIcon, SearchIcon, SettingsIcon } from '@/components/icons'
import { Switch } from '@/components/ui/field'
import { buttonClass } from '@/components/ui/button'
import { useEscape } from '@/hooks/use-escape'
import { useLockScroll } from '@/hooks/use-lock-scroll'
import { SORT_OPTIONS, type CatalogFilters as Filters } from '@/lib/catalog'
import { cn } from '@/lib/cn'

type Props = {
  categories: { slug: string; name: string }[]
  filters: Filters
  priceBounds: { min: number; max: number }
  resultCount: number
}

function toQuery(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.category) params.set('category', filters.category)
  if (filters.sort !== 'featured') params.set('sort', filters.sort)
  if (filters.min !== null) params.set('min', String(filters.min))
  if (filters.max !== null) params.set('max', String(filters.max))
  if (filters.inStock) params.set('stock', '1')
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function CatalogFilters({ categories, filters, priceBounds, resultCount }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [sheetOpen, setSheetOpen] = useState(false)
  useLockScroll(sheetOpen)
  useEscape(sheetOpen, () => setSheetOpen(false))

  const apply = (patch: Partial<Filters>) => {
    startTransition(() => router.replace(`${pathname}${toQuery({ ...filters, ...patch })}`, { scroll: false }))
  }

  const activeCount = [filters.category, filters.min !== null || filters.max !== null, filters.inStock].filter(Boolean).length

  const panel = <FilterPanel categories={categories} filters={filters} priceBounds={priceBounds} apply={apply} />

  return (
    <div className={cn('transition-opacity', pending && 'opacity-60')}>
      <SearchBox value={filters.q} onSubmit={(q) => apply({ q })} />

      <div className="mt-4 flex items-center gap-3 lg:hidden">
        <button type="button" onClick={() => setSheetOpen(true)} className={buttonClass({ variant: 'secondary', size: 'sm' })}>
          <SettingsIcon size={16} /> Filtros {activeCount > 0 && <span className="tabular">({activeCount})</span>}
        </button>
        <SortSelect value={filters.sort} onChange={(sort) => apply({ sort })} />
      </div>

      <div className="mt-8 hidden lg:block">
        <div className="mb-8">
          <p className="label-mono mb-3 text-muted">Ordenar</p>
          <SortSelect value={filters.sort} onChange={(sort) => apply({ sort })} />
        </div>
        {panel}
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-black/35 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheetOpen(false)} aria-hidden="true" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filtros"
              className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[86svh] flex-col rounded-t-[var(--radius-xl)] bg-paper lg:hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <p className="text-[17px] font-medium">Filtros</p>
                <button type="button" onClick={() => setSheetOpen(false)} aria-label="Cerrar filtros" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-tile">
                  <CloseIcon />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-6">{panel}</div>
              <div className="grid grid-cols-2 gap-2 border-t border-line px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
                <button type="button" className={buttonClass({ variant: 'secondary' })} onClick={() => apply({ category: null, min: null, max: null, inStock: false })}>
                  Limpiar
                </button>
                <button type="button" className={buttonClass({})} onClick={() => setSheetOpen(false)}>
                  Ver {resultCount} {resultCount === 1 ? 'producto' : 'productos'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SearchBox({ value, onSubmit }: { value: string; onSubmit: (q: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [synced, setSynced] = useState(value)
  // Keep the input in sync when the URL changes from elsewhere (header search, back button)
  if (synced !== value) {
    setSynced(value)
    setDraft(value)
  }
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(draft.trim())
      }}
      className="relative"
    >
      <label htmlFor="catalog-search" className="sr-only">
        Buscar en el catálogo
      </label>
      <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id="catalog-search"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Buscar productos"
        className="h-12 w-full rounded-full border border-line-strong bg-surface pl-11 pr-4 text-[15px] placeholder:text-muted focus:border-ink focus:outline-none"
      />
    </form>
  )
}

function SortSelect({ value, onChange }: { value: Filters['sort']; onChange: (value: Filters['sort']) => void }) {
  return (
    <div className="relative flex-1">
      <label htmlFor="catalog-sort" className="sr-only">
        Ordenar por
      </label>
      <select
        id="catalog-sort"
        value={value}
        onChange={(event) => onChange(event.target.value as Filters['sort'])}
        className="h-9 w-full appearance-none rounded-full border border-line-strong bg-transparent pl-4 pr-9 text-[13px] focus:border-ink focus:outline-none lg:h-11 lg:text-[14px]"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
}

function FilterPanel({
  categories,
  filters,
  priceBounds,
  apply,
}: {
  categories: { slug: string; name: string }[]
  filters: Filters
  priceBounds: { min: number; max: number }
  apply: (patch: Partial<Filters>) => void
}) {
  const urlMin = filters.min?.toString() ?? ''
  const urlMax = filters.max?.toString() ?? ''
  const [min, setMin] = useState(urlMin)
  const [max, setMax] = useState(urlMax)
  const [synced, setSynced] = useState(`${urlMin}|${urlMax}`)
  // URL is the source of truth; reflect external resets (e.g. "Limpiar") in the inputs
  if (synced !== `${urlMin}|${urlMax}`) {
    setSynced(`${urlMin}|${urlMax}`)
    setMin(urlMin)
    setMax(urlMax)
  }

  const commitPrice = () => {
    const parse = (value: string) => (value.trim() === '' || Number.isNaN(Number(value)) ? null : Math.max(0, Number(value)))
    apply({ min: parse(min), max: parse(max) })
  }

  return (
    <div className="flex flex-col gap-9">
      <fieldset>
        <legend className="label-mono mb-3 text-muted">Categoría</legend>
        <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0.5">
          {[{ slug: null, name: 'Todas' }, ...categories].map((category) => {
            const active = filters.category === category.slug
            return (
              <li key={category.slug ?? 'all'}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => apply({ category: category.slug })}
                  className={cn(
                    'rounded-full border px-4 py-2 text-[14px] transition-colors lg:w-full lg:rounded-[var(--radius-sm)] lg:border-0 lg:px-3 lg:text-left',
                    active ? 'border-ink bg-ink text-paper lg:bg-tile-2 lg:text-ink lg:font-medium' : 'border-line-strong text-ink-2 hover:text-ink lg:hover:bg-tile',
                  )}
                >
                  {category.name}
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="label-mono mb-3 text-muted">Precio (ARS)</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            commitPrice()
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min}
            onChange={(event) => setMin(event.target.value)}
            onBlur={commitPrice}
            placeholder={`${priceBounds.min}`}
            aria-label="Precio mínimo"
            className="tabular h-10 w-full min-w-0 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-[14px] focus:border-ink focus:outline-none"
          />
          <span className="text-muted" aria-hidden="true">
            —
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            onBlur={commitPrice}
            placeholder={`${priceBounds.max}`}
            aria-label="Precio máximo"
            className="tabular h-10 w-full min-w-0 rounded-[var(--radius-sm)] border border-line-strong bg-surface px-3 text-[14px] focus:border-ink focus:outline-none"
          />
          <button type="submit" className="sr-only">
            Aplicar precio
          </button>
        </form>
      </fieldset>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="in-stock" className="text-[14px]">
          Sólo con stock
        </label>
        <Switch id="in-stock" checked={filters.inStock} onChange={(inStock) => apply({ inStock })} label="Sólo con stock" />
      </div>
    </div>
  )
}
