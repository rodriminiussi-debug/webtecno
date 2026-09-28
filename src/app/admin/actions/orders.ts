'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'
import { ORDER_STATUSES, PAYMENT_STATUSES, type Order, type OrderStatus, type PaymentStatus, type Result } from '@/lib/data/types'

/**
 * Cancelling returns the units to stock. "Cancelled" is terminal: reopening an
 * order would need a new stock reservation, so the team creates a new order instead.
 */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Result<Order>> {
  await requireAdmin()
  if (!ORDER_STATUSES.includes(status)) return { data: null, error: 'Estado inválido.' }
  const repository = getRepository()
  const order = await repository.getOrderById(id)
  if (!order) return { data: null, error: 'El pedido ya no existe.' }
  if (order.status === 'cancelled') return { data: null, error: 'Un pedido cancelado no puede reabrirse. Creá un pedido nuevo.' }

  if (status === 'cancelled') {
    try {
      for (const item of order.items) {
        const product = item.productId ? await repository.getProductById(item.productId) : null
        if (!product) continue // deleted product: nothing to restock
        if (item.variantId) {
          const variants = product.variants.map((variant) => (variant.id === item.variantId ? { ...variant, stock: variant.stock + item.quantity } : variant))
          await repository.saveProduct({ ...product, variants, stock: variants.reduce((sum, variant) => sum + variant.stock, 0), updatedAt: new Date().toISOString() })
        } else {
          await repository.saveProduct({ ...product, stock: product.stock + item.quantity, updatedAt: new Date().toISOString() })
        }
      }
    } catch (error) {
      console.error('updateOrderStatus: restock failed', { error, order: order.number })
      return { data: null, error: 'No se pudo devolver el stock. El pedido no se canceló; probá de nuevo.' }
    }
  }

  const updated = await repository.updateOrderStatus(id, status)
  if (!updated) return { data: null, error: 'No se pudo actualizar el pedido.' }
  revalidatePath('/', 'layout')
  return { data: updated, error: null }
}

export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<Result<Order>> {
  await requireAdmin()
  if (!PAYMENT_STATUSES.includes(status)) return { data: null, error: 'Estado de pago inválido.' }
  const repository = getRepository()
  const order = await repository.getOrderById(id)
  if (!order) return { data: null, error: 'El pedido ya no existe.' }
  const updated = await repository.updatePaymentStatus(order.number, status, order.paymentReference)
  if (!updated) return { data: null, error: 'No se pudo actualizar el pago.' }
  revalidatePath('/admin', 'layout')
  return { data: updated, error: null }
}
