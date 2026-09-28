// Deletes the local JSON database so the next request reseeds the demo catalogue.
// Uploaded images and the session secret are kept.
import { rmSync } from 'node:fs'
import path from 'node:path'

const dir = process.env.MONO_DATA_DIR || path.join(process.cwd(), '.data')
rmSync(path.join(dir, 'db.json'), { force: true })
console.log(`Local database reset (${dir}/db.json). Restart the dev server to reseed.`)
