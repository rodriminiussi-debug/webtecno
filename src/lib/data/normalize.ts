import type { HeroConfig, Product } from './types'
import { seedHomepageSettings } from './seed'

// Data saved by earlier versions (3D hero, 'airpods-3d' animation) is upgraded on
// read, so old databases keep working without a manual migration of JSON content.

export function normalizeHero(stored: Partial<HeroConfig> & { animation?: string }): HeroConfig {
  const hero: HeroConfig = { ...seedHomepageSettings.hero, ...stored } as HeroConfig
  if ((stored.animation as string | undefined) === 'airpods-3d') hero.animation = 'airpods'
  // Frames from the first photographic version were replaced by the layered film
  if (hero.frames.some((frame) => frame.startsWith('/hero/airpods-frame-'))) {
    hero.frames = seedHomepageSettings.hero.frames
    if (hero.animation === 'sequence') hero.animation = 'airpods'
  }
  if (!Array.isArray(hero.frames)) hero.frames = seedHomepageSettings.hero.frames
  return hero
}

export function normalizeProduct(product: Product): Product {
  const animation = product.animation as string
  return animation === 'none' || animation === 'float' ? product : { ...product, animation: 'float' }
}
