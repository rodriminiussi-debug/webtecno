import 'server-only'
import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getRepository } from '../data'
import type { AdminUser } from '../data/types'
import { hashPassword } from './password'
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from './token'

export type SessionUser = Pick<AdminUser, 'id' | 'email' | 'name' | 'role'>

export const DEMO_ADMIN_EMAIL = 'admin@mono.store'
export const DEMO_ADMIN_PASSWORD = 'mono-admin-2026'

export function isUsingDemoCredentials() {
  return !process.env.ADMIN_PASSWORD
}

/** Creates the first admin from env (or demo defaults) when the users table is empty. */
export async function ensureInitialAdmin() {
  const repository = getRepository()
  if ((await repository.countUsers()) > 0) return
  const email = (process.env.ADMIN_EMAIL || DEMO_ADMIN_EMAIL).toLowerCase()
  const password = process.env.ADMIN_PASSWORD || DEMO_ADMIN_PASSWORD
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('ensureInitialAdmin: ADMIN_PASSWORD not set, using demo credentials. Set it before going live.')
  }
  await repository.createUser({
    id: randomUUID(),
    email,
    name: 'Administrador',
    role: 'owner',
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  })
}

export async function startSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function endSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const payload = verifySessionToken(store.get(SESSION_COOKIE)?.value)
  if (!payload) return null
  const user = await getRepository().getUserById(payload.uid)
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

/**
 * Every admin page and server action calls this. The proxy only does a fast
 * signature check; this is the authoritative check against the database.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/admin/login')
  return user
}
