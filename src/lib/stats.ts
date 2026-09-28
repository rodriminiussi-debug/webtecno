import type { Order, Product } from './data/types'

const COUNTED: Order['status'][] = ['confirmed', 'preparing', 'shipped', 'delivered']

/** Revenue only counts orders that moved past "pending" and were not cancelled. */
export function isRevenueOrder(order: Order) {
  return COUNTED.includes(order.status)
}

export function buildDashboardStats(orders: Order[], products: Product[], now = new Date()) {
  const DAY = 86400000
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const since = (days: number) => startToday - (days - 1) * DAY

  const revenueOrders = orders.filter(isRevenueOrder)
  const sum = (list: Order[]) => list.reduce((total, order) => total + order.totalCents, 0)
  const inRange = (list: Order[], from: number, to = Infinity) =>
    list.filter((order) => {
      const time = new Date(order.createdAt).getTime()
      return time >= from && time < to
    })

  const last30 = inRange(revenueOrders, since(30))
  const previous30 = inRange(revenueOrders, since(60), since(30))

  const daily = Array.from({ length: 30 }, (_, index) => {
    const from = since(30) + index * DAY
    const dayOrders = inRange(revenueOrders, from, from + DAY)
    return { date: new Date(from).toISOString(), revenueCents: sum(dayOrders), orders: dayOrders.length }
  })

  const sold = new Map<string, { productId: string; name: string; units: number; revenueCents: number }>()
  for (const order of revenueOrders) {
    for (const item of order.items) {
      const entry = sold.get(item.productId) ?? { productId: item.productId, name: item.name, units: 0, revenueCents: 0 }
      entry.units += item.quantity
      entry.revenueCents += item.unitPriceCents * item.quantity
      sold.set(item.productId, entry)
    }
  }

  const byStatus = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1
    return acc
  }, {})

  const revenue30 = sum(last30)
  const revenuePrev = sum(previous30)
  return {
    revenue30,
    revenueChange: revenuePrev > 0 ? (revenue30 - revenuePrev) / revenuePrev : null,
    orders30: last30.length,
    averageTicket: last30.length ? Math.round(revenue30 / last30.length) : 0,
    pendingOrders: orders.filter((order) => order.status === 'pending').length,
    totalRevenue: sum(revenueOrders),
    customers: new Set(orders.map((order) => order.customerEmail)).size,
    publishedProducts: products.filter((product) => product.status === 'published').length,
    stockUnits: products.reduce((total, product) => total + product.stock, 0),
    lowStock: products.filter((product) => product.status === 'published' && product.stock <= 5).sort((a, b) => a.stock - b.stock),
    topProducts: [...sold.values()].sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 5),
    byStatus,
    daily,
  }
}
