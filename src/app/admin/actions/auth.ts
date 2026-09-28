'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { getRepository } from '@/lib/data'
import { verifyPassword } from '@/lib/auth/password'
import { clearRateLimit, isRateLimited } from '@/lib/auth/rate-limit'
import { endSession, ensureInitialAdmin, startSession } from '@/lib/auth/session'

export type LoginState = { error: string | null }

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) })

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (isRateLimited(`login:${ip}`)) return { error: 'Demasiados intentos. Esperá 10 minutos antes de volver a probar.' }

  const parsed = schema.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Ingresá un email y una contraseña válidos.' }

  await ensureInitialAdmin()
  const user = await getRepository().getUserByEmail(parsed.data.email)
  // Same message for unknown email and wrong password: do not reveal which accounts exist
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: 'Email o contraseña incorrectos.' }
  }
  clearRateLimit(`login:${ip}`)
  await startSession(user.id)
  const next = String(formData.get('next') ?? '')
  // Only same-app admin paths, never an external URL
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin')
}

export async function logout() {
  await endSession()
  redirect('/admin/login')
}
