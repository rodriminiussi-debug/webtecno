import { promises as fs } from 'node:fs'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { MEDIA_TYPES, localMediaDir } from '@/lib/storage'

const SAFE_NAME = /^[0-9a-f-]{36}\.(png|jpg|gif|webp|avif|ico)$/

/** Serves locally stored uploads (local mode only; Supabase serves its own public URLs). */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  // Strict allowlist prevents path traversal
  if (!SAFE_NAME.test(name)) return new NextResponse('Not found', { status: 404 })
  try {
    const bytes = await fs.readFile(path.join(localMediaDir(), name))
    const ext = name.split('.').pop() ?? ''
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': MEDIA_TYPES[ext] ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') console.error('media read failed', { error, name })
    return new NextResponse('Not found', { status: 404 })
  }
}
