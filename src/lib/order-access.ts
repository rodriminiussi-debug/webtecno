import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSessionSecret } from './auth/token'

// Order numbers are sequential, so they are not secret. The confirmation page
// requires this HMAC so nobody can browse other customers' orders by number.
export function orderAccessToken(number: string) {
  return createHmac('sha256', getSessionSecret()).update(`order:${number}`).digest('base64url').slice(0, 24)
}

export function verifyOrderAccessToken(number: string, token: string | undefined) {
  if (!token) return false
  const expected = Buffer.from(orderAccessToken(number))
  const received = Buffer.from(token)
  return expected.length === received.length && timingSafeEqual(expected, received)
}
