import type { Order, PaymentProviderId } from '../data/types'

export type PaymentStart =
  // Customer must be redirected to an external checkout
  | { kind: 'redirect'; url: string }
  // Offline method: show instructions, payment stays pending
  | { kind: 'instructions'; text: string }
  // Settled immediately (demo card)
  | { kind: 'approved'; reference: string }

export interface PaymentProvider {
  id: PaymentProviderId
  /** False when credentials are missing; the method is then hidden from checkout. */
  isConfigured(): boolean
  start(order: Order, context: { siteUrl: string; instructions: string }): Promise<PaymentStart>
}
