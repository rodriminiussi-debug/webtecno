import { CartDrawer } from '@/components/store/cart-drawer'
import { Footer } from '@/components/store/footer'
import { Header } from '@/components/store/header'
import { getSettings, getVisibleCategories } from '@/lib/store'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getVisibleCategories()])
  const freeThresholds = settings.shippingMethods
    .filter((method) => method.enabled && method.requiresAddress && method.freeOverCents !== null)
    .map((method) => method.freeOverCents as number)
  return (
    <div className="flex min-h-svh flex-col">
      <Header
        storeName={settings.storeName}
        logoUrl={settings.logoUrl}
        categories={categories.map(({ slug, name }) => ({ slug, name }))}
        announcement={settings.texts.announcement}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer currency={settings.currency} freeShippingOverCents={freeThresholds.length ? Math.min(...freeThresholds) : null} />
    </div>
  )
}
