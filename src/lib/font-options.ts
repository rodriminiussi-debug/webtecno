import type { FontKey } from './data/types'

// Plain data (no next/font import) so it can be used in route handlers and client components.
export const FONT_OPTIONS: Record<FontKey, { label: string; cssVar: string; note: string }> = {
  geist: { label: 'Geist', cssVar: 'var(--font-geist-sans)', note: 'Neo-grotesca técnica y precisa (por defecto)' },
  instrument: { label: 'Instrument Sans', cssVar: 'var(--font-instrument)', note: 'Más editorial, con carácter' },
  manrope: { label: 'Manrope', cssVar: 'var(--font-manrope)', note: 'Geométrica y amable' },
  plex: { label: 'IBM Plex Sans', cssVar: 'var(--font-plex)', note: 'Industrial, de ingeniería' },
}
