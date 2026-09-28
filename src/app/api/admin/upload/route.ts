import { NextResponse, type NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth/session'
import { MAX_UPLOAD_BYTES, sniffImage, storeImage } from '@/lib/storage'

export async function POST(request: NextRequest) {
  if (!(await getSessionUser())) return NextResponse.json({ error: 'Tu sesión expiró. Volvé a ingresar.' }, { status: 401 })
  let form: FormData
  try {
    form = await request.formData()
  } catch (error) {
    console.warn('upload: invalid form data', { error })
    return NextResponse.json({ error: 'No recibimos ningún archivo.' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No recibimos ningún archivo.' }, { status: 400 })
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'La imagen supera los 5 MB. Comprimila y probá de nuevo.' }, { status: 413 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  // Trust the bytes, not the extension or the browser-provided type
  const kind = sniffImage(bytes)
  if (!kind) return NextResponse.json({ error: 'Formato no soportado. Usá PNG, JPG, WebP, AVIF, GIF o ICO.' }, { status: 415 })
  try {
    const url = await storeImage(bytes, kind.ext, kind.type)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('upload failed', { error, size: file.size })
    return NextResponse.json({ error: 'No se pudo guardar la imagen. Probá de nuevo.' }, { status: 500 })
  }
}
