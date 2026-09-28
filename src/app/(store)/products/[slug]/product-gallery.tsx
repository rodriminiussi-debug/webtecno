'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, PlusIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { useEscape } from '@/hooks/use-escape'
import { useLockScroll } from '@/hooks/use-lock-scroll'
import type { ProductImage as Image } from '@/lib/data/types'
import { cn } from '@/lib/cn'

const EASE = [0.16, 1, 0.3, 1] as const

export function ProductGallery({ images, name, float }: { images: Image[]; name: string; float: boolean }) {
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const current = images[index] ?? null

  const go = useCallback((next: number) => setIndex((next + images.length) % Math.max(images.length, 1)), [images.length])

  if (!images.length) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[var(--radius-xl)] bg-tile">
        <span className="label-mono text-muted">Sin imágenes</span>
      </div>
    )
  }

  return (
    <div>
      {/* Desktop: large stage with hover zoom */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <ul className="flex w-20 shrink-0 flex-col gap-3" aria-label="Imágenes">
            {images.map((image, i) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    'relative block aspect-square w-full overflow-hidden rounded-[var(--radius-md)] bg-tile p-2 transition-[box-shadow,opacity] duration-[var(--dur-base)]',
                    i === index ? 'ring-1 ring-ink' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  <ProductImage src={image.url} alt="" sizes="80px" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="group relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-[var(--radius-xl)] bg-tile"
          onPointerMove={(event) => {
            if (event.pointerType !== 'mouse') return
            const rect = event.currentTarget.getBoundingClientRect()
            setZoom({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 })
          }}
          onPointerLeave={() => setZoom(null)}
          onClick={() => setLightbox(true)}
          aria-label={`Ampliar imagen de ${name}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current?.id}
              className={cn('absolute inset-[8%]', float && 'animate-[product-float_6s_var(--ease-in-out)_infinite]')}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div
                className="relative size-full transition-transform duration-300 ease-out"
                style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              >
                <ProductImage src={current?.url} alt={current?.alt || name} sizes="(min-width: 1024px) 55vw, 90vw" priority />
              </div>
            </motion.div>
          </AnimatePresence>
          <span className="label-mono absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-paper/90 px-3 py-2 text-ink-2 opacity-0 transition-opacity group-hover:opacity-100">
            <PlusIcon size={12} /> Ampliar
          </span>
        </button>
      </div>

      {/* Mobile: native swipe rail with position dots */}
      <div className="md:hidden">
        <div
          ref={rail}
          className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            const el = event.currentTarget
            const next = Math.round(el.scrollLeft / el.clientWidth)
            if (next !== index) setIndex(next)
          }}
        >
          {images.map((image, i) => (
            <button key={image.id} type="button" onClick={() => setLightbox(true)} className="w-full shrink-0 snap-center px-[var(--gutter)]" aria-label={`Ampliar imagen ${i + 1}`}>
              <div className="relative aspect-square rounded-[var(--radius-lg)] bg-tile p-[8%]">
                <div className="relative size-full">
                  <ProductImage src={image.url} alt={image.alt || name} sizes="100vw" priority={i === 0} />
                </div>
              </div>
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((image, i) => (
              <span key={image.id} className={cn('h-1 rounded-full transition-all duration-[var(--dur-base)]', i === index ? 'w-6 bg-ink' : 'w-1.5 bg-line-strong')} />
            ))}
          </div>
        )}
      </div>

      <Lightbox open={lightbox} onClose={() => setLightbox(false)} images={images} index={index} go={go} name={name} />
      <style>{`@keyframes product-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2.5%) } }`}</style>
    </div>
  )
}

function Lightbox({ open, onClose, images, index, go, name }: { open: boolean; onClose: () => void; images: Image[]; index: number; go: (i: number) => void; name: string }) {
  useLockScroll(open)
  useEscape(open, onClose)
  const current = images[index]
  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${name}`}
          className="fixed inset-0 z-[80] flex flex-col bg-paper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') go(index + 1)
            if (event.key === 'ArrowLeft') go(index - 1)
          }}
        >
          <div className="flex h-16 items-center justify-between px-5">
            <p className="label-mono tabular text-muted">
              {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
            </p>
            <button type="button" onClick={onClose} aria-label="Cerrar galería" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-tile" autoFocus>
              <CloseIcon />
            </button>
          </div>
          <div className="relative flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={current.id} className="absolute inset-[4%]" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                <ProductImage src={current.url} alt={current.alt || name} sizes="100vw" />
              </motion.div>
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <button type="button" onClick={() => go(index - 1)} aria-label="Imagen anterior" className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong hover:border-ink">
                <ArrowLeftIcon />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Imagen siguiente" className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong hover:border-ink">
                <ArrowRightIcon />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
