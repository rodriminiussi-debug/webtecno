import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, getSessionUser, isUsingDemoCredentials } from '@/lib/auth/session'
import { getSettings } from '@/lib/store'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Acceso', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect('/admin')
  const [{ next }, settings] = await Promise.all([searchParams, getSettings()])
  // The demo hint never shows on a production build
  const showDemoHint = process.env.NODE_ENV !== 'production' && isUsingDemoCredentials()
  return (
    <main className="grid min-h-svh bg-paper md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-12 text-paper md:flex">
        <Logo name={settings.storeName} logoUrl={settings.logoUrl} />
        <p className="max-w-sm text-[40px] font-medium leading-[1] tracking-[-0.045em]">Tu tienda, sin tocar una línea de código.</p>
        <p className="label-mono text-paper/50">Panel de administración</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="md:hidden">
            <Logo name={settings.storeName} logoUrl={settings.logoUrl} />
          </div>
          <h1 className="mt-10 text-[32px] font-semibold tracking-[-0.04em] md:mt-0">Ingresar</h1>
          <p className="mt-2 text-[14px] text-ink-2">Acceso exclusivo para el equipo de la tienda.</p>
          <LoginForm next={next ?? ''} />
          {showDemoHint && (
            <p className="mt-6 rounded-[var(--radius-sm)] bg-tile px-4 py-3 font-mono text-[12px] leading-relaxed text-ink-2">
              Modo demo · {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
