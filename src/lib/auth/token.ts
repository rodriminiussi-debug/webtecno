import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// Shared by proxy.ts and server code, so it must not import 'server-only' or the repository.

export const SESSION_COOKIE = 'mono_admin'
export const SESSION_TTL_SECONDS = 60 * 60 * 12

export type SessionPayload = { uid: string; exp: number }

let cachedSecret: string | null = null

function dataDir() {
  if (process.env.MONO_DATA_DIR) return process.env.MONO_DATA_DIR
  if (process.env.VERCEL) return '/tmp/mono-data'
  return path.join(process.cwd(), '.data')
}

/**
 * SESSION_SECRET is required in production. Locally we generate one and keep it
 * in .data so sessions survive restarts without any setup.
 */
export function getSessionSecret() {
  if (cachedSecret) return cachedSecret
  const fromEnv = process.env.SESSION_SECRET
  if (fromEnv && fromEnv.length >= 32) {
    cachedSecret = fromEnv
    return cachedSecret
  }
  if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_URL) {
    throw new Error('SESSION_SECRET (32+ chars) is required in production')
  }
  const file = path.join(dataDir(), 'session-secret')
  if (existsSync(file)) {
    cachedSecret = readFileSync(file, 'utf8').trim()
  } else {
    cachedSecret = randomBytes(48).toString('base64url')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, cachedSecret, { mode: 0o600 })
  }
  return cachedSecret
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

export function createSessionToken(uid: string) {
  const payload: SessionPayload = { uid, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = Buffer.from(sign(body))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload
    if (typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch (error) {
    console.warn('verifySessionToken: malformed payload', { error })
    return null
  }
}
