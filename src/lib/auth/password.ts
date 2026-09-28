import 'server-only'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>
const KEY_LENGTH = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, hashB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const derived = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length)
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
