'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { useEscape } from '@/hooks/use-escape'
import { useLockScroll } from '@/hooks/use-lock-scroll'
import type { NavCategory } from './header'

const EASE = [0.16, 1, 0.3, 1] as const

export function MobileMenu({
  open,
  onClose,
  nav,
  categories,
  announcement,
}: {
  open: boolean
  onClose: () => void
  nav: { href: string; label: string }[]
  categories: NavCategory[]
  announcement: string
}) {
  useLockScroll(open)
  useEscape(open, onClose)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-paper pt-[var(--header-h)] md:hidden"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <nav aria-label="Menú móvil" className="container-mono flex-1 pt-8">
            <ul>
              {nav.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.05, duration: 0.6, ease: EASE }}
                  className="border-b border-line"
                >
                  <Link href={item.href} onClick={onClose} className="flex items-baseline justify-between py-4 text-[40px] font-medium tracking-[-0.045em]">
                    {item.label}
                    <span className="label-mono text-muted">0{index + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-10">
              <p className="label-mono mb-4 text-muted">Categorías</p>
              <ul className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/products?category=${category.slug}`} onClick={onClose} className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-[14px]">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </nav>
          <div className="container-mono flex items-center justify-between gap-4 py-6">
            <Link href="/account" onClick={onClose} className="text-[15px] underline-offset-4 hover:underline">
              Seguir mi pedido
            </Link>
            {announcement && <p className="label-mono max-w-[60%] text-right leading-relaxed text-muted">{announcement}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
