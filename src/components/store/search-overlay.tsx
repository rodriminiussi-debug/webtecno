'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRightIcon, CloseIcon, SearchIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { useEscape } from '@/hooks/use-escape'
import { useLockScroll } from '@/hooks/use-lock-scroll'
import { formatMoney } from '@/lib/format'
import type { NavCategory } from './header'

type Result = { slug: string; name: string; shortDescription: string; imageUrl: string | null; priceCents: number; hasVariants: boolean }
type Status = 'idle' | 'loading' | 'done' | 'error'

const EASE = [0.16, 1, 0.3, 1] as const

export function SearchOverlay({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: NavCategory[] }) {
  useLockScroll(open)
  useEscape(open, onClose)
  const router = useRouter()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [currency, setCurrency] = useState('ARS')
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        if (!response.ok) throw new Error(`search ${response.status}`)
        const data = (await response.json()) as { results: Result[]; currency?: string }
        setResults(data.results)
        if (data.currency) setCurrency(data.currency)
        setStatus('done')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('SearchOverlay: search failed', { error, term })
        setStatus('error')
      }
    }, 180)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const term = query.trim()
  const showResults = term.length >= 2

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!term) return
    onClose()
    router.push(`/products?q=${encodeURIComponent(term)}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar productos"
            className="fixed inset-x-0 top-0 z-[61] max-h-[88svh] overflow-y-auto bg-paper text-ink"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <div className="container-mono pb-10 pt-5">
              <form onSubmit={submit} className="flex items-center gap-4 border-b border-ink pb-4">
                <SearchIcon size={24} />
                <label htmlFor={inputId} className="sr-only">
                  Buscar productos
                </label>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar AirPods, cargadores, notebooks…"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-[26px] tracking-[-0.03em] placeholder:text-muted focus:outline-none md:text-[40px]"
                />
                <button type="button" onClick={onClose} aria-label="Cerrar búsqueda" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-tile">
                  <CloseIcon />
                </button>
              </form>

              <div className="pt-6" aria-live="polite">
                {!showResults && (
                  <div>
                    <p className="label-mono mb-4 text-muted">Explorar</p>
                    <ul className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <li key={category.slug}>
                          <Link href={`/products?category=${category.slug}`} onClick={onClose} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px] transition-colors hover:border-ink">
                            {category.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showResults && status === 'loading' && results.length === 0 && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="skeleton h-24" />
                    ))}
                  </div>
                )}
                {showResults && status === 'error' && <p className="text-[15px] text-ink-2">No pudimos buscar en este momento. Probá de nuevo en unos segundos.</p>}
                {showResults && status === 'done' && results.length === 0 && (
                  <p className="text-[15px] text-ink-2">
                    No encontramos resultados para “{term}”. Probá con otra palabra o{' '}
                    <Link href="/products" onClick={onClose} className="underline underline-offset-4">
                      mirá todo el catálogo
                    </Link>
                    .
                  </p>
                )}
                {showResults && results.length > 0 && (
                  <>
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {results.map((result) => (
                        <li key={result.slug}>
                          <Link href={`/products/${result.slug}`} onClick={onClose} className="group flex items-center gap-4 rounded-[var(--radius-md)] p-2 transition-colors hover:bg-tile">
                            <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-tile p-2">
                              <ProductImage src={result.imageUrl} alt="" sizes="80px" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[15px] font-medium">{result.name}</p>
                              <p className="price-only tabular mt-1 text-[14px] text-ink-2">
                                {result.hasVariants && 'desde '}
                                {formatMoney(result.priceCents, currency)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button type="submit" onClick={submit} className="mt-6 inline-flex items-center gap-2 text-[15px] underline-offset-4 hover:underline">
                      Ver todos los resultados <ArrowRightIcon size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
