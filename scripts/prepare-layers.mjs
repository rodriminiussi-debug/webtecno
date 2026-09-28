// Prepares the layered hero assets. Case layers keep their original framing (the
// component positions the earbuds with coordinates measured on that framing);
// the earbud is trimmed tight so its box equals its silhouette.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [input, output] = process.argv.slice(2)
mkdirSync(output, { recursive: true })
const raw = (name, target) => sharp(path.join(input, `${name}.png`)).resize(1200, 1200).webp({ quality: 88, alphaQuality: 92, effort: 6 }).toFile(path.join(output, target))
await raw('case-open-empty', 'case-open.webp')
await raw('case-closed', 'case-closed.webp')
await sharp(path.join(input, 'bud-single.png')).trim({ threshold: 1 }).resize({ height: 900, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 92, effort: 6 }).toFile(path.join(output, 'bud.webp'))
const meta = await sharp(path.join(output, 'bud.webp')).metadata()
console.log('bud aspect (w/h):', (meta.width / meta.height).toFixed(4))
