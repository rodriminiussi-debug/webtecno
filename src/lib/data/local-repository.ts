import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { CreateOrderResult, NewOrder, ProductQuery, StockLine, StoreRepository } from './repository'
import type {
  AdminUser,
  AnyHomepageSection,
  Category,
  Customer,
  HomepageSettings,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SiteSettings,
  Subscriber,
} from './types'
import {
  buildSeedOrders,
  seedCategories,
  seedCustomers,
  seedHomepageSettings,
  seedProducts,
  seedSections,
  seedSettings,
} from './seed'
import { getDataDir } from '../server/data-dir'
import { normalizeHero, normalizeProduct } from './normalize'

type Database = {
  version: 1
  settings: SiteSettings
  categories: Category[]
  products: Product[]
  sections: AnyHomepageSection[]
  homepage: HomepageSettings
  orders: Order[]
  customers: Customer[]
  users: AdminUser[]
  subscribers: Subscriber[]
  orderSequence: number
}

function createSeedDatabase(): Database {
  const orders = buildSeedOrders(seedProducts)
  return {
    version: 1,
    settings: structuredClone(seedSettings),
    categories: structuredClone(seedCategories),
    products: structuredClone(seedProducts),
    sections: structuredClone(seedSections),
    homepage: structuredClone(seedHomepageSettings),
    orders,
    customers: structuredClone(seedCustomers),
    users: [],
    subscribers: [],
    orderSequence: 10001 + orders.length,
  }
}

/**
 * JSON-file persistence for development and demos. Writes are serialized through
 * a promise queue and committed with write-then-rename so a crash never leaves
 * a half-written file. Not meant for multi-instance production: use Supabase.
 */
export class LocalRepository implements StoreRepository {
  readonly kind = 'local' as const
  private cache: Database | null = null
  private loading: Promise<Database> | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private readonly file = path.join(getDataDir(), 'db.json')

  private load(): Promise<Database> {
    if (this.cache) return Promise.resolve(this.cache)
    // Concurrent first requests share one load/seed instead of racing on the file
    this.loading ??= this.loadFromDisk().finally(() => {
      this.loading = null
    })
    return this.loading
  }

  private async loadFromDisk(): Promise<Database> {
    try {
      const raw = await fs.readFile(this.file, 'utf8')
      this.cache = JSON.parse(raw) as Database
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('LocalRepository: could not read db.json, reseeding', { error, file: this.file })
      }
      this.cache = createSeedDatabase()
      await this.persist(this.cache)
    }
    return this.cache
  }

  private async persist(db: Database) {
    await fs.mkdir(path.dirname(this.file), { recursive: true })
    const tmp = `${this.file}.${randomUUID()}.tmp`
    await fs.writeFile(tmp, JSON.stringify(db, null, 2))
    await fs.rename(tmp, this.file)
  }

  private mutate<T>(fn: (db: Database) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.load()
      const result = fn(db)
      await this.persist(db)
      return result
    })
    // Keep the queue alive even if one mutation fails
    this.queue = run.catch(() => undefined)
    return run
  }

  private async read<T>(fn: (db: Database) => T): Promise<T> {
    const db = await this.load()
    return structuredClone(fn(db))
  }

  getSettings() {
    return this.read((db) => db.settings)
  }

  saveSettings(settings: SiteSettings) {
    return this.mutate((db) => {
      db.settings = settings
      return structuredClone(settings)
    })
  }

  listCategories() {
    return this.read((db) => [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder))
  }

  saveCategory(category: Category) {
    return this.mutate((db) => {
      const index = db.categories.findIndex((item) => item.id === category.id)
      if (index >= 0) db.categories[index] = category
      else db.categories.push(category)
      return structuredClone(category)
    })
  }

  deleteCategory(id: string) {
    return this.mutate((db) => {
      db.categories = db.categories.filter((item) => item.id !== id)
      // Products keep existing but become uncategorized
      for (const product of db.products) if (product.categoryId === id) product.categoryId = null
    })
  }

  listProducts(query: ProductQuery = {}) {
    const status = query.status ?? 'published'
    return this.read((db) =>
      db.products
        .filter((product) => status === 'all' || product.status === status)
        .map(normalizeProduct)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  }

  getProductBySlug(slug: string) {
    return this.read((db) => {
      const product = db.products.find((item) => item.slug === slug)
      return product ? normalizeProduct(product) : null
    })
  }

  getProductById(id: string) {
    return this.read((db) => {
      const product = db.products.find((item) => item.id === id)
      return product ? normalizeProduct(product) : null
    })
  }

  saveProduct(product: Product) {
    return this.mutate((db) => {
      const index = db.products.findIndex((item) => item.id === product.id)
      if (index >= 0) db.products[index] = product
      else db.products.push(product)
      return structuredClone(product)
    })
  }

  deleteProduct(id: string) {
    return this.mutate((db) => {
      db.products = db.products.filter((item) => item.id !== id)
    })
  }

  getHomepage() {
    return this.read((db) => ({
      sections: [...db.sections].sort((a, b) => a.sortOrder - b.sortOrder),
      settings: { hero: normalizeHero(db.homepage.hero) },
    }))
  }

  saveHomepage(sections: AnyHomepageSection[], settings: HomepageSettings) {
    return this.mutate((db) => {
      db.sections = sections
      db.homepage = settings
    })
  }

  createOrder(order: NewOrder, stock: StockLine[]): Promise<CreateOrderResult> {
    return this.mutate((db): CreateOrderResult => {
      // Validate every line before touching anything, so a failure leaves no partial decrement
      for (const line of stock) {
        const product = db.products.find((item) => item.id === line.productId)
        const available = line.variantId
          ? product?.variants.find((variant) => variant.id === line.variantId)?.stock
          : product?.stock
        if (!product || available === undefined || available < line.quantity) {
          return { ok: false, reason: 'out_of_stock', productId: line.productId, variantId: line.variantId }
        }
      }
      for (const line of stock) {
        const product = db.products.find((item) => item.id === line.productId)
        if (!product) continue
        if (line.variantId) {
          const variant = product.variants.find((item) => item.id === line.variantId)
          if (variant) variant.stock -= line.quantity
          product.stock = product.variants.reduce((sum, item) => sum + item.stock, 0)
        } else {
          product.stock -= line.quantity
        }
      }

      const email = order.customerEmail.toLowerCase()
      let customer = db.customers.find((item) => item.email === email)
      if (!customer) {
        customer = { id: randomUUID(), email, name: order.customerName, phone: order.customerPhone, createdAt: new Date().toISOString() }
        db.customers.push(customer)
      } else {
        customer.name = order.customerName
        customer.phone = order.customerPhone
      }

      const now = new Date().toISOString()
      const created: Order = {
        ...order,
        id: randomUUID(),
        number: `MONO-${db.orderSequence}`,
        customerId: customer.id,
        customerEmail: email,
        createdAt: now,
        updatedAt: now,
      }
      db.orderSequence += 1
      db.orders.push(created)
      return { ok: true, order: structuredClone(created) }
    })
  }

  listOrders() {
    return this.read((db) => [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  getOrderById(id: string) {
    return this.read((db) => db.orders.find((order) => order.id === id) ?? null)
  }

  getOrderByNumber(number: string) {
    return this.read((db) => db.orders.find((order) => order.number === number) ?? null)
  }

  updateOrderStatus(id: string, status: OrderStatus) {
    return this.mutate((db) => {
      const order = db.orders.find((item) => item.id === id)
      if (!order) return null
      order.status = status
      order.updatedAt = new Date().toISOString()
      return structuredClone(order)
    })
  }

  updatePaymentStatus(number: string, status: PaymentStatus, reference: string | null) {
    return this.mutate((db) => {
      const order = db.orders.find((item) => item.number === number)
      if (!order) return null
      order.paymentStatus = status
      order.paymentReference = reference ?? order.paymentReference
      if (status === 'paid' && order.status === 'pending') order.status = 'confirmed'
      order.updatedAt = new Date().toISOString()
      return structuredClone(order)
    })
  }

  listCustomers() {
    return this.read((db) => db.customers)
  }

  countUsers() {
    return this.read((db) => db.users.length)
  }

  getUserByEmail(email: string) {
    return this.read((db) => db.users.find((user) => user.email === email.toLowerCase()) ?? null)
  }

  getUserById(id: string) {
    return this.read((db) => db.users.find((user) => user.id === id) ?? null)
  }

  createUser(user: AdminUser) {
    return this.mutate((db) => {
      db.users.push(user)
      return structuredClone(user)
    })
  }

  addSubscriber(email: string) {
    return this.mutate((db) => {
      const normalized = email.toLowerCase()
      if (db.subscribers.some((item) => item.email === normalized)) return { created: false }
      db.subscribers.push({ id: randomUUID(), email: normalized, createdAt: new Date().toISOString() })
      return { created: true }
    })
  }

  listSubscribers() {
    return this.read((db) => [...db.subscribers].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }
}
