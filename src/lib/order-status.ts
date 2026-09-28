import type { OrderStatus, PaymentStatus } from './data/types'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  paid: 'Pagado',
  failed: 'Pago rechazado',
  refunded: 'Reembolsado',
}

/** Customer-facing progress; cancelled orders show no progress. */
export const ORDER_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']
