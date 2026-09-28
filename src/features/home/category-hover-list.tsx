'use client'

import Link from 'next/link'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useState } from 'react'
import { ArrowRightIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { cn } from '@/lib/cn'

type Item = { id: string; slug: string; name: string; description: string; imageUrl: string | null; count: number }

/** Typographic index. A preview of the category floats next to the cursor. */
export function CategoryHoverList({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 220, damping: 28, mass: 0.6 })
  const springY = useSpring(y, { stiffness: 220, damping: 28, mass: 0.6 })

  return (
    <div
      className="relative"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        x.set(event.clientX - rect.left)
        y.set(event.clientY - rect.top)
      }}
      onPointerLeave={() => setActive(null)}
    >
      <ul className="border-t border-line">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-line">
            <Link
              href={`/products?category=${item.slug}`}
              onPointerEnter={() => setActive(item)}
              onFocus={() => setActive(item)}
              onBlur={() => setActive(null)}
              className="group grid grid-cols-12 items-center gap-6 py-6 transition-colors duration-[var(--dur-base)] lg:py-8"
            >
              <span className="label-mono col-span-1 text-muted">{String(index + 1).padStart(2, '0')}</span>
              <span
                className={cn(
                  'col-span-6 text-[clamp(2.25rem,4.6vw,4.5rem)] font-medium leading-none tracking-[-0.05em] transition-[color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)] group-hover:translate-x-3',
                  active && active.id !== item.id ? 'text-muted' : 'text-ink',
                )}
              >
                {item.name}
              </span>
              <span className="col-span-3 text-[14px] leading-relaxed text-muted">{item.description}</span>
              <span className="col-span-2 flex items-center justify-end gap-3">
                <span className="label-mono tabular text-muted">{item.count} prod.</span>
                <ArrowRightIcon size={18} className="-translate-x-2 opacity-0 transition-[opacity,transform] duration-[var(--dur-base)] group-hover:translate-x-0 group-hover:opacity-100" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <motion.div className="pointer-events-none absolute left-0 top-0 z-10 hidden lg:block" style={{ x: springX, y: springY }} aria-hidden="true">
        <AnimatePresence>
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -translate-y-1/2 translate-x-10 rounded-[var(--radius-lg)] bg-tile-2 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]"
              style={{ width: 240, height: 280 }}
            >
              <div className="relative size-full">
                <ProductImage src={active.imageUrl} alt="" sizes="240px" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
