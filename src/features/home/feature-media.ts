import type { FeatureItem, FeatureVisual } from '@/lib/data/types'

// Apple's own AirPods 5 imagery (apple.com/airpods-5), one per feature.
export const DEFAULT_FEATURE_MEDIA: Record<FeatureVisual, string | null> = {
  anc: '/apple/lifestyle-noise.webp',
  adaptive: '/apple/lifestyle-adaptive.webp',
  spatial: '/apple/lifestyle-spatial.webp',
  voice: '/apple/lifestyle-voice.webp',
  siri: '/apple/lifestyle-music.webp',
  translate: '/apple/live-translation.webp',
  heart: null,
  chip: '/apple/chip-end.webp',
  battery: '/apple/battery-case.webp',
  water: '/apple/ip57.webp',
  case: '/apple/case-out.webp',
}

// Start frames double as posters, so the card never flashes empty
const POSTERS: Record<string, string> = {
  '/apple/siri.mp4': '/apple/siri-start.webp',
  '/apple/chip.mp4': '/apple/chip-start.webp',
  '/apple/xray.mp4': '/apple/xray-start.webp',
  '/apple/force-sensor.mp4': '/apple/force-sensor-start.webp',
}

export const isVideo = (src: string) => /\.(mp4|webm)(\?|$)/i.test(src)
export const posterFor = (src: string) => POSTERS[src] ?? null

export function resolveFeatureMedia(item: FeatureItem) {
  return item.media === undefined ? DEFAULT_FEATURE_MEDIA[item.visual] : item.media
}
