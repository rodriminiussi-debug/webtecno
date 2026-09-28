import { ImageResponse } from 'next/og'
import { formatMoney } from '@/lib/format'
import { startingPrice } from '@/lib/pricing'
import { getProductBySlug, getSettings } from '@/lib/store'
import { safeColor } from '@/lib/theme'

export const alt = 'Producto'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Typographic card: SVG product renders are not accepted by social scrapers,
// so the preview leans on name + price, which is what people click on anyway.
export default async function ProductOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()])
  const accent = safeColor(settings.colors.accent, '#ff4d00')
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#f4f4f1', color: '#0b0b0c', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, letterSpacing: 8, fontWeight: 600 }}>
          <div style={{ width: 14, height: 14, background: accent }} />
          {settings.storeName.toUpperCase()}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 110, lineHeight: 0.9, letterSpacing: -5, fontWeight: 600 }}>{product?.name ?? settings.storeName}</div>
          {product && <div style={{ fontSize: 40, color: '#55555a' }}>{formatMoney(startingPrice(product), settings.currency)}</div>}
        </div>
      </div>
    ),
    size,
  )
}
