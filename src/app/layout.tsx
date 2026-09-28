import type { Metadata, Viewport } from 'next'
import './globals.css'
import { fontVariables } from '@/lib/fonts'
import { getSettings, siteUrl } from '@/lib/store'
import { themeStyle } from '@/lib/theme'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.seo.title, template: `%s — ${settings.storeName}` },
    description: settings.seo.description,
    applicationName: settings.storeName,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : { icon: '/icon.svg' },
    openGraph: {
      type: 'website',
      siteName: settings.storeName,
      title: settings.seo.title,
      description: settings.seo.description,
      locale: 'es_AR',
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: '#f4f4f1',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <html lang="es-AR" className={fontVariables} style={themeStyle(settings)}>
      <body className="min-h-svh">{children}</body>
    </html>
  )
}
