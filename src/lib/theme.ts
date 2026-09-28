import type { SiteSettings } from './data/types'
import { FONT_OPTIONS } from './font-options'

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function safeColor(value: string, fallback: string) {
  return HEX.test(value) ? value : fallback
}

/** CSS custom properties injected on <html>. Colors are validated so settings can never inject CSS. */
export function themeStyle(settings: SiteSettings) {
  return {
    '--mono-accent': safeColor(settings.colors.accent, '#ff4d00'),
    '--mono-ink': safeColor(settings.colors.ink, '#0b0b0c'),
    '--mono-paper': safeColor(settings.colors.paper, '#f4f4f1'),
    '--mono-surface': safeColor(settings.colors.surface, '#ffffff'),
    '--mono-font': (FONT_OPTIONS[settings.font] ?? FONT_OPTIONS.geist).cssVar,
  } as React.CSSProperties
}

/** Relative luminance check, used to pick readable text over admin-chosen backgrounds. */
export function isDark(hex: string) {
  const value = safeColor(hex, '#000000').slice(1)
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5
}
