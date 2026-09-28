import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/sidebar'
import { Toaster } from '@/components/admin/toast'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin' }, robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

// The admin keeps a fixed look: store theme settings must never make the panel unreadable
const ADMIN_THEME = {
  '--mono-accent': '#ff4d00',
  '--mono-ink': '#0b0b0c',
  '--mono-paper': '#f6f6f4',
  '--mono-surface': '#ffffff',
  '--mono-font': 'var(--font-geist-sans)',
  fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui',
} as React.CSSProperties

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const repository = getRepository()
  const [settings, orders] = await Promise.all([repository.getSettings(), repository.listOrders()])
  const pending = orders.filter((order) => order.status === 'pending').length
  return (
    <div style={ADMIN_THEME} className="min-h-svh bg-paper text-ink lg:flex">
      <AdminSidebar storeName={settings.storeName} user={{ name: user.name, email: user.email }} pendingOrders={pending} />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
      <Toaster />
    </div>
  )
}
