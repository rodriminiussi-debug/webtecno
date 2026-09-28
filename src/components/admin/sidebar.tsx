'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/app/admin/actions/auth'
import {
  BoxIcon,
  CloseIcon,
  DashboardIcon,
  ExternalIcon,
  LayoutIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  ReceiptIcon,
  SettingsIcon,
  TagIcon,
  UsersIcon,
} from '@/components/icons'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/cn'

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: DashboardIcon, exact: true },
  { href: '/admin/products', label: 'Productos', Icon: BoxIcon },
  { href: '/admin/categories', label: 'Categorías', Icon: TagIcon },
  { href: '/admin/orders', label: 'Pedidos', Icon: ReceiptIcon },
  { href: '/admin/customers', label: 'Clientes', Icon: UsersIcon },
  { href: '/admin/content', label: 'Contenido', Icon: LayoutIcon },
  { href: '/admin/subscribers', label: 'Newsletter', Icon: MailIcon },
  { href: '/admin/settings', label: 'Configuración', Icon: SettingsIcon },
]

export function AdminSidebar({ storeName, user, pendingOrders }: { storeName: string; user: { name: string; email: string }; pendingOrders: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)
  // Close the mobile drawer on navigation
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  const nav = (
    <nav aria-label="Administración" className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[14px] transition-colors',
              active ? 'bg-tile-2 font-medium text-ink' : 'text-ink-2 hover:bg-tile hover:text-ink',
            )}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {href === '/admin/orders' && pendingOrders > 0 && (
              <span className="tabular rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] text-white" aria-label={`${pendingOrders} pendientes`}>
                {pendingOrders}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  const footer = (
    <div className="border-t border-line p-3">
      <a href="/" target="_blank" rel="noopener" className="flex h-9 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[14px] text-ink-2 hover:bg-tile hover:text-ink">
        <ExternalIcon size={18} /> Ver tienda
      </a>
      <div className="mt-2 flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-paper" aria-hidden="true">
          {(user.name || user.email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[12px] text-muted">{user.email}</p>
        </div>
        <form action={logout}>
          <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile hover:text-ink">
            <LogoutIcon size={18} />
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Link href="/admin">
          <Logo name={storeName} className="text-[16px]" />
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-tile">
          <MenuIcon />
        </button>
      </div>

      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/admin">
            <Logo name={storeName} className="text-[16px]" />
          </Link>
          <span className="label-mono ml-auto text-muted">Admin</span>
        </div>
        {nav}
        {footer}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de administración">
          <button type="button" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo name={storeName} className="text-[16px]" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="inline-flex size-10 items-center justify-center rounded-full hover:bg-tile">
                <CloseIcon />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  )
}
