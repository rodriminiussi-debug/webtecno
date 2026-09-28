'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Reveals content once when it enters the viewport. CSS does the animation
 * (see .reveal in globals.css) so it costs nothing after it runs.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  className,
  children,
}: {
  as?: 'div' | 'li' | 'section' | 'article' | 'p'
  delay?: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  // Narrowed to one intrinsic type for the ref; all allowed tags share HTMLElement behavior
  const Tag = as as 'div'
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.dataset.visible = 'true'
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={cn('reveal', className)} style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}>
      {children}
    </Tag>
  )
}
