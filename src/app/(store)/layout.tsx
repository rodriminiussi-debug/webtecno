import { CartDrawer } from '@/components/store/cart-drawer'
import { Footer } from '@/components/store/footer'
import { Header } from '@/components/store/header'
import { StoreModeProvider } from '@/components/store/store-mode'
import { WhatsAppFloating } from '@/components/store/whatsapp-button'
import { getSettings, getVisibleCategories, siteUrl } from '@/lib/store'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getVisibleCategories()])
  const freeThresholds = settings.shippingMethods
    .filter((method) => method.enabled && method.requiresAddress && method.freeOverCents !== null)
    .map((method) => method.freeOverCents as number)
  const consultative = settings.sales.mode === 'whatsapp'
  return (
    <StoreModeProvider
      value={{
        mode: settings.sales.mode,
        storeName: settings.storeName,
        siteUrl: siteUrl(),
        whatsappNumber: settings.sales.whatsappNumber,
        whatsappTemplate: settings.sales.whatsappTemplate,
      }}
    >
    <div className="flex min-h-svh flex-col" data-sales-mode={settings.sales.mode}>
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
      {consultative ? (
        <WhatsAppFloating />
      ) : (
        <CartDrawer currency={settings.currency} freeShippingOverCents={freeThresholds.length ? Math.min(...freeThresholds) : null} />
      )}
    </div>
    </StoreModeProvider>
  )
}
