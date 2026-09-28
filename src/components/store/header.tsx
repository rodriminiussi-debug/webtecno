'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Logo } from '@/components/logo'
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/icons'
import { cartCount, useCart } from '@/lib/cart-store'
import { cn } from '@/lib/cn'
import { useHydrated } from '@/hooks/use-hydrated'
import { MobileMenu } from './mobile-menu'
import { SearchOverlay } from './search-overlay'

export type NavCategory = { slug: string; name: string }

const NAV = [
  { href: '/products', label: 'Productos' },
  { href: '/categories', label: 'Categorías' },
  { href: '/about', label: 'Nosotros' },
  { href: '/support', label: 'Soporte' },
]

export function Header({
  storeName,
  logoUrl,
  categories,
  announcement,
}: {
  storeName: string
  logoUrl: string | null
  categories: NavCategory[]
  announcement: string
}) {
  const pathname = usePathname()
  const [hidden, setHidden] = useState(false)
  const [overDark, setOverDark] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const lastY = useRef(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const delta = y - lastY.current
      // Hide while reading downwards, reveal as soon as the user scrolls back up
      if (Math.abs(delta) > 6) setHidden(delta > 0 && y > 240)
      lastY.current = y
      setScrolled(y > 8)
      const probe = 32
      const darkZones = document.querySelectorAll<HTMLElement>('[data-header-theme="dark"]')
      let dark = false
      darkZones.forEach((zone) => {
        const rect = zone.getBoundingClientRect()
        if (rect.top <= probe && rect.bottom >= probe) dark = true
      })
      setOverDark(dark)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const typing = target.closest('input, textarea, select, [contenteditable="true"]')
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const transparent = overDark && !menuOpen
  const solid = !transparent && scrolled

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
        Saltar al contenido
      </a>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,border-color] duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]',
          hidden && !menuOpen && !searchOpen ? '-translate-y-full' : 'translate-y-0',
          transparent ? 'text-white' : 'text-ink',
          solid ? 'border-b border-line bg-paper/95 supports-[backdrop-filter]:bg-paper/85 supports-[backdrop-filter]:backdrop-blur-md' : 'border-b border-transparent',
        )}
      >
        <div className="container-mono flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" aria-label={`${storeName} — inicio`} className="shrink-0">
            <Logo name={storeName} logoUrl={logoUrl} />
          </Link>

          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative rounded-full px-3.5 py-2 text-[14px] tracking-[-0.01em] transition-opacity duration-[var(--dur-fast)]',
                        active ? 'opacity-100' : 'opacity-65 hover:opacity-100',
                      )}
                    >
                      {item.label}
                      {active && <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-current" aria-hidden="true" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-0.5">
            <HeaderIconButton label="Buscar (atajo: /)" onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </HeaderIconButton>
            <Link href="/account" aria-label="Mi cuenta y pedidos" className="hidden size-10 items-center justify-center rounded-full transition-opacity hover:opacity-60 sm:inline-flex">
              <UserIcon />
            </Link>
            <CartButton />
            <HeaderIconButton label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)} className="md:hidden" expanded={menuOpen}>
              <MenuIcon />
            </HeaderIconButton>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={NAV} categories={categories} announcement={announcement} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />
    </>
  )
}

function HeaderIconButton({
  label,
  onClick,
  children,
  className,
  expanded,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn('inline-flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-60', className)}
    >
      {children}
    </button>
  )
}

function CartButton() {
  const lines = useCart((state) => state.lines)
  const pulse = useCart((state) => state.pulse)
  const open = useCart((state) => state.open)
  // Cart lives in localStorage: render the count only after hydration to avoid a mismatch
  const hydrated = useHydrated()
  const count = hydrated ? cartCount(lines) : 0
  return (
    <button
      type="button"
      onClick={open}
      aria-label={count ? `Carrito, ${count} productos` : 'Carrito vacío'}
      className="relative inline-flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-60"
    >
      <BagIcon />
      {count > 0 && (
        <span
          key={pulse}
          className="tabular absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-white [animation:mono-bump_480ms_var(--ease-out-expo)]"
        >
          {count}
        </span>
      )}
    </button>
  )
}
