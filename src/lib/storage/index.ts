import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { getDataDir } from '../server/data-dir'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

// SVG is intentionally excluded: user-uploaded SVG served from our origin is an XSS vector.
const SIGNATURES: { type: string; ext: string; test: (bytes: Uint8Array) => boolean }[] = [
  { type: 'image/png', ext: 'png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/gif', ext: 'gif', test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 },
  {
    type: 'image/webp',
    ext: 'webp',
    test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  { type: 'image/avif', ext: 'avif', test: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 },
  // .ico (favicons)
  { type: 'image/x-icon', ext: 'ico', test: (b) => b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00 },
]

export function sniffImage(bytes: Uint8Array) {
  return SIGNATURES.find((signature) => signature.test(bytes)) ?? null
}

export const MEDIA_TYPES: Record<string, string> = Object.fromEntries(SIGNATURES.map((s) => [s.ext, s.type]))

export function localMediaDir() {
  return path.join(getDataDir(), 'uploads')
}

/** Stores an already-validated image and returns its public URL. */
export async function storeImage(bytes: Uint8Array, ext: string, contentType: string): Promise<string> {
  const name = `${randomUUID()}.${ext}`
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media'
    const client = createClient(url, key, { auth: { persistSession: false } })
    const { error } = await client.storage.from(bucket).upload(name, bytes, { contentType, cacheControl: '31536000' })
    if (error) {
      console.error('storeImage: supabase upload failed', { error, name })
      throw new Error('Upload failed')
    }
    return client.storage.from(bucket).getPublicUrl(name).data.publicUrl
  }
  await fs.mkdir(localMediaDir(), { recursive: true })
  await fs.writeFile(path.join(localMediaDir(), name), bytes)
  return `/api/media/${name}`
}
