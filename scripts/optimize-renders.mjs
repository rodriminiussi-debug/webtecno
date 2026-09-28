// Converts generated PNG renders (transparent background) into WebP for the web.
// Usage: node scripts/optimize-renders.mjs <input-dir> <output-dir> [prefix]
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [input, output, prefix = ''] = process.argv.slice(2)
if (!input || !output) {
  console.error('Usage: node scripts/optimize-renders.mjs <input-dir> <output-dir> [prefix]')
  process.exit(1)
}
mkdirSync(output, { recursive: true })
const files = readdirSync(input).filter((file) => file.endsWith('.png'))
for (const file of files) {
  const target = path.join(output, `${prefix}${file.replace(/\.png$/, '.webp')}`)
  // Trim transparent margins, then re-pad evenly so every product sits centered at a similar scale
  const trimmed = await sharp(path.join(input, file)).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true })
  const side = Math.round(Math.max(trimmed.info.width, trimmed.info.height) / 0.82)
  await sharp(trimmed.data)
    .extend({
      top: Math.floor((side - trimmed.info.height) / 2),
      bottom: Math.ceil((side - trimmed.info.height) / 2),
      left: Math.floor((side - trimmed.info.width) / 2),
      right: Math.ceil((side - trimmed.info.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(target)
  console.log('→', target)
}
