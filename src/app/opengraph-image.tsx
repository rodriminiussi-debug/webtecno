import { ImageResponse } from 'next/og'
import { getSettings } from '@/lib/store'
import { safeColor } from '@/lib/theme'

export const alt = 'Tienda de tecnología'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const settings = await getSettings()
  const accent = safeColor(settings.colors.accent, '#ff4d00')
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0a0b', color: '#fff', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, letterSpacing: 10, fontWeight: 600 }}>
          <div style={{ width: 16, height: 16, background: accent }} />
          {settings.storeName.toUpperCase()}
        </div>
        <div style={{ display: 'flex', fontSize: 92, lineHeight: 0.95, letterSpacing: -4, fontWeight: 600, maxWidth: 900 }}>{settings.texts.tagline}</div>
      </div>
    ),
    size,
  )
}
