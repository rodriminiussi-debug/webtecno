import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CreateOrderResult, NewOrder, ProductQuery, StockLine, StoreRepository } from './repository'
import type {
  AdminUser,
  AnyHomepageSection,
  Category,
  Customer,
  HomepageSettings,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductFeature,
  ProductSpec,
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
import { normalizeHero } from './normalize'
import type { HeroConfig } from './types'

// Row shapes mirror supabase/migrations/0001_init.sql.
// Replace with `supabase gen types typescript` output once the project is linked.
type CategoryRow = {
  id: string
  slug: string
  name: string
  description: string
  image_url: string | null
  sort_order: number
  is_visible: boolean
  created_at: string
}
type ImageRow = { id: string; product_id: string; url: string; alt: string; sort_order: number }
type VariantRow = {
  id: string
  product_id: string
  name: string
  sku: string
  price_cents: number | null
  stock: number
  swatch: string | null
  sort_order: number
}
type ProductRow = {
  id: string
  slug: string
  name: string
  brand: string
  short_description: string
  description: string
  price_cents: number
  compare_at_cents: number | null
  sku: string
  category_id: string | null
  stock: number
  variant_label: string
  specs: ProductSpec[]
  features: ProductFeature[]
  is_featured: boolean
  status: Product['status']
  animation: Product['animation']
  seo_title: string
  seo_description: string
  created_at: string
  updated_at: string
  product_images?: ImageRow[]
  product_variants?: VariantRow[]
}
type OrderItemRow = {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  name: string
  variant_name: string | null
  sku: string
  image_url: string | null
  unit_price_cents: number
  quantity: number
}
type OrderRow = {
  id: string
  number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  document_id: string
  shipping_address: Order['shippingAddress']
  shipping_method_id: string
  shipping_method_name: string
  shipping_cents: number
  payment_method_id: string
  payment_method_name: string
  payment_provider: Order['paymentProvider']
  payment_status: PaymentStatus
  payment_reference: string | null
  status: OrderStatus
  subtotal_cents: number
  total_cents: number
  notes: string
  created_at: string
  updated_at: string
  order_items?: OrderItemRow[]
}
type UserRow = { id: string; email: string; name: string; role: AdminUser['role']; password_hash: string; created_at: string }

const PRODUCT_SELECT = '*, product_images(*), product_variants(*)'
const ORDER_SELECT = '*, order_items(*)'

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    sortOrder: row.sort_order,
    isVisible: row.is_visible,
    createdAt: row.created_at,
  }
}

function fromCategory(category: Category): CategoryRow {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    image_url: category.imageUrl,
    sort_order: category.sortOrder,
    is_visible: category.isVisible,
    created_at: category.createdAt,
  }
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    shortDescription: row.short_description,
    description: row.description,
    priceCents: Number(row.price_cents),
    compareAtCents: row.compare_at_cents === null ? null : Number(row.compare_at_cents),
    sku: row.sku,
    categoryId: row.category_id,
    stock: row.stock,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ id: image.id, url: image.url, alt: image.alt, sortOrder: image.sort_order })),
    variantLabel: row.variant_label,
    variants: [...(row.product_variants ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        priceCents: variant.price_cents === null ? null : Number(variant.price_cents),
        stock: variant.stock,
        swatch: variant.swatch,
      })),
    specs: row.specs ?? [],
    features: row.features ?? [],
    isFeatured: row.is_featured,
    status: row.status,
    animation: (row.animation as string) === 'airpods-3d' ? 'float' : row.animation,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function fromProduct(product: Product): Omit<ProductRow, 'product_images' | 'product_variants'> {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    short_description: product.shortDescription,
    description: product.description,
    price_cents: product.priceCents,
    compare_at_cents: product.compareAtCents,
    sku: product.sku,
    category_id: product.categoryId,
    stock: product.stock,
    variant_label: product.variantLabel,
    specs: product.specs,
    features: product.features,
    is_featured: product.isFeatured,
    status: product.status,
    animation: product.animation,
    seo_title: product.seoTitle,
    seo_description: product.seoDescription,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id ?? '',
    variantId: row.variant_id,
    name: row.name,
    variantName: row.variant_name,
    sku: row.sku,
    imageUrl: row.image_url,
    unitPriceCents: Number(row.unit_price_cents),
    quantity: row.quantity,
  }
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    documentId: row.document_id,
    shippingAddress: row.shipping_address,
    shippingMethodId: row.shipping_method_id,
    shippingMethodName: row.shipping_method_name,
    shippingCents: Number(row.shipping_cents),
    paymentMethodId: row.payment_method_id,
    paymentMethodName: row.payment_method_name,
    paymentProvider: row.payment_provider,
    paymentStatus: row.payment_status,
    paymentReference: row.payment_reference,
    status: row.status,
    subtotalCents: Number(row.subtotal_cents),
    totalCents: Number(row.total_cents),
    notes: row.notes,
    items: (row.order_items ?? []).map(toOrderItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toUser(row: UserRow): AdminUser {
  return { id: row.id, email: row.email, name: row.name, role: row.role, passwordHash: row.password_hash, createdAt: row.created_at }
}

function fail(operation: string, error: unknown): never {
  console.error(`SupabaseRepository.${operation} failed`, { error })
  throw new Error(`Database operation failed: ${operation}`)
}

export class SupabaseRepository implements StoreRepository {
  readonly kind = 'supabase' as const
  private readonly client: SupabaseClient
  private seeding: Promise<void> | null = null

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  }

  /** First boot on an empty database loads the demo catalogue so the store is never blank. */
  private ensureSeeded(): Promise<void> {
    this.seeding ??= (async () => {
      const { count, error, status } = await this.client.from('site_settings').select('id', { count: 'exact', head: true })
      // HEAD responses carry no body, so the status is the only clue about what went wrong
      if (status === 401 || status === 403) {
        console.error(`SupabaseRepository: Supabase rejected the key (HTTP ${status}). Check SUPABASE_SERVICE_ROLE_KEY: it must be the project's service_role / secret key, pasted without quotes or spaces.`)
      }
      if (error) fail('ensureSeeded.check', { ...error, status })
      if ((count ?? 0) > 0) return
      console.info('SupabaseRepository: empty database, loading demo data')
      await this.client.from('site_settings').upsert({ id: 1, data: seedSettings })
      await this.client.from('homepage_settings').upsert({ id: 1, hero: seedHomepageSettings.hero })
      await this.client.from('homepage_sections').upsert(
        seedSections.map((section) => ({
          id: section.id,
          type: section.type,
          enabled: section.enabled,
          sort_order: section.sortOrder,
          title: section.title,
          subtitle: section.subtitle,
          config: section.config,
        })),
      )
      await this.client.from('categories').upsert(seedCategories.map(fromCategory))
      for (const product of seedProducts) await this.writeProduct(product)
      await this.client.from('customers').upsert(
        seedCustomers.map((customer) => ({ id: customer.id, email: customer.email, name: customer.name, phone: customer.phone, created_at: customer.createdAt })),
      )
      for (const order of buildSeedOrders(seedProducts)) {
        const { items, ...rest } = order
        await this.client.from('orders').upsert(this.orderRow(rest))
        await this.client.from('order_items').upsert(items.map((item) => this.orderItemRow(order.id, item)))
      }
    })().catch((error) => {
      this.seeding = null
      throw error
    })
    return this.seeding
  }

  private orderRow(order: Omit<Order, 'items'>) {
    return {
      id: order.id,
      number: order.number,
      customer_id: order.customerId,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      document_id: order.documentId,
      shipping_address: order.shippingAddress,
      shipping_method_id: order.shippingMethodId,
      shipping_method_name: order.shippingMethodName,
      shipping_cents: order.shippingCents,
      payment_method_id: order.paymentMethodId,
      payment_method_name: order.paymentMethodName,
      payment_provider: order.paymentProvider,
      payment_status: order.paymentStatus,
      payment_reference: order.paymentReference,
      status: order.status,
      subtotal_cents: order.subtotalCents,
      total_cents: order.totalCents,
      notes: order.notes,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    }
  }

  private orderItemRow(orderId: string, item: OrderItem) {
    return {
      id: item.id,
      order_id: orderId,
      product_id: item.productId || null,
      variant_id: item.variantId,
      name: item.name,
      variant_name: item.variantName,
      sku: item.sku,
      image_url: item.imageUrl,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
    }
  }

  private async writeProduct(product: Product) {
    const { error } = await this.client.from('products').upsert(fromProduct(product))
    if (error) fail('saveProduct.product', error)

    const imageIds = product.images.map((image) => image.id)
    const variantIds = product.variants.map((variant) => variant.id)
    const removeImages = this.client.from('product_images').delete().eq('product_id', product.id)
    const removeVariants = this.client.from('product_variants').delete().eq('product_id', product.id)
    const [imagesCleanup, variantsCleanup] = await Promise.all([
      imageIds.length ? removeImages.not('id', 'in', `(${imageIds.map((id) => `"${id}"`).join(',')})`) : removeImages,
      variantIds.length ? removeVariants.not('id', 'in', `(${variantIds.map((id) => `"${id}"`).join(',')})`) : removeVariants,
    ])
    if (imagesCleanup.error) fail('saveProduct.imagesCleanup', imagesCleanup.error)
    if (variantsCleanup.error) fail('saveProduct.variantsCleanup', variantsCleanup.error)

    if (product.images.length) {
      const { error: imagesError } = await this.client.from('product_images').upsert(
        product.images.map((image, index) => ({ id: image.id, product_id: product.id, url: image.url, alt: image.alt, sort_order: index })),
      )
      if (imagesError) fail('saveProduct.images', imagesError)
    }
    if (product.variants.length) {
      const { error: variantsError } = await this.client.from('product_variants').upsert(
        product.variants.map((variant, index) => ({
          id: variant.id,
          product_id: product.id,
          name: variant.name,
          sku: variant.sku,
          price_cents: variant.priceCents,
          stock: variant.stock,
          swatch: variant.swatch,
          sort_order: index,
        })),
      )
      if (variantsError) fail('saveProduct.variants', variantsError)
    }
  }

  async getSettings() {
    await this.ensureSeeded()
    const { data, error } = await this.client.from('site_settings').select('data').eq('id', 1).single()
    if (error) fail('getSettings', error)
    // Merge over defaults so settings added in newer versions always exist
    return { ...seedSettings, ...(data.data as Partial<SiteSettings>) } as SiteSettings
  }

  async saveSettings(settings: SiteSettings) {
    const { error } = await this.client.from('site_settings').upsert({ id: 1, data: settings, updated_at: new Date().toISOString() })
    if (error) fail('saveSettings', error)
    return settings
  }

  async listCategories() {
    await this.ensureSeeded()
    const { data, error } = await this.client.from('categories').select('*').order('sort_order')
    if (error) fail('listCategories', error)
    return (data as CategoryRow[]).map(toCategory)
  }

  async saveCategory(category: Category) {
    const { error } = await this.client.from('categories').upsert(fromCategory(category))
    if (error) fail('saveCategory', error)
    return category
  }

  async deleteCategory(id: string) {
    const { error } = await this.client.from('categories').delete().eq('id', id)
    if (error) fail('deleteCategory', error)
  }

  async listProducts(query: ProductQuery = {}) {
    await this.ensureSeeded()
    let request = this.client.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false })
    const status = query.status ?? 'published'
    if (status !== 'all') request = request.eq('status', status)
    const { data, error } = await request
    if (error) fail('listProducts', error)
    return (data as ProductRow[]).map(toProduct)
  }

  async getProductBySlug(slug: string) {
    await this.ensureSeeded()
    const { data, error } = await this.client.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle()
    if (error) fail('getProductBySlug', error)
    return data ? toProduct(data as ProductRow) : null
  }

  async getProductById(id: string) {
    const { data, error } = await this.client.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle()
    if (error) fail('getProductById', error)
    return data ? toProduct(data as ProductRow) : null
  }

  async saveProduct(product: Product) {
    await this.writeProduct(product)
    return product
  }

  async deleteProduct(id: string) {
    const { error } = await this.client.from('products').delete().eq('id', id)
    if (error) fail('deleteProduct', error)
  }

  async getHomepage() {
    await this.ensureSeeded()
    const [sectionsResult, settingsResult] = await Promise.all([
      this.client.from('homepage_sections').select('*').order('sort_order'),
      this.client.from('homepage_settings').select('hero').eq('id', 1).single(),
    ])
    if (sectionsResult.error) fail('getHomepage.sections', sectionsResult.error)
    if (settingsResult.error) fail('getHomepage.settings', settingsResult.error)
    const sections = (sectionsResult.data as { id: string; type: string; enabled: boolean; sort_order: number; title: string; subtitle: string; config: unknown }[]).map(
      (row) =>
        ({
          id: row.id,
          type: row.type,
          enabled: row.enabled,
          sortOrder: row.sort_order,
          title: row.title,
          subtitle: row.subtitle,
          config: row.config,
        }) as AnyHomepageSection,
    )
    return { sections, settings: { hero: normalizeHero(settingsResult.data.hero as Partial<HeroConfig>) } }
  }

  async saveHomepage(sections: AnyHomepageSection[], settings: HomepageSettings) {
    const ids = sections.map((section) => section.id)
    const cleanup = await this.client.from('homepage_sections').delete().not('id', 'in', `(${ids.map((id) => `"${id}"`).join(',')})`)
    if (cleanup.error) fail('saveHomepage.cleanup', cleanup.error)
    const { error } = await this.client.from('homepage_sections').upsert(
      sections.map((section) => ({
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        sort_order: section.sortOrder,
        title: section.title,
        subtitle: section.subtitle,
        config: section.config,
      })),
    )
    if (error) fail('saveHomepage.sections', error)
    const hero = await this.client.from('homepage_settings').upsert({ id: 1, hero: settings.hero, updated_at: new Date().toISOString() })
    if (hero.error) fail('saveHomepage.hero', hero.error)
  }

  async createOrder(order: NewOrder, stock: StockLine[]): Promise<CreateOrderResult> {
    const { items, ...rest } = order
    const payload = {
      customer_name: rest.customerName,
      customer_email: rest.customerEmail,
      customer_phone: rest.customerPhone,
      document_id: rest.documentId,
      shipping_address: rest.shippingAddress,
      shipping_method_id: rest.shippingMethodId,
      shipping_method_name: rest.shippingMethodName,
      shipping_cents: rest.shippingCents,
      payment_method_id: rest.paymentMethodId,
      payment_method_name: rest.paymentMethodName,
      payment_provider: rest.paymentProvider,
      payment_status: rest.paymentStatus,
      payment_reference: rest.paymentReference,
      status: rest.status,
      subtotal_cents: rest.subtotalCents,
      total_cents: rest.totalCents,
      notes: rest.notes,
    }
    // Stock lines and item lines are 1:1 (built together in lib/orders.ts)
    const itemRows = items.map((item, index) => ({
      product_id: item.productId,
      variant_id: stock[index]?.variantId ?? item.variantId,
      name: item.name,
      variant_name: item.variantName,
      sku: item.sku,
      image_url: item.imageUrl,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
    }))
    const { data, error } = await this.client.rpc('create_order', { p_order: payload, p_items: itemRows })
    if (error) fail('createOrder', error)
    const result = data as { ok: boolean; order_id?: string; product_id?: string; variant_id?: string | null }
    if (!result.ok) return { ok: false, reason: 'out_of_stock', productId: result.product_id ?? '', variantId: result.variant_id ?? null }
    const created = await this.getOrderById(result.order_id ?? '')
    if (!created) fail('createOrder.reload', 'order not found after insert')
    return { ok: true, order: created }
  }

  async listOrders() {
    await this.ensureSeeded()
    const { data, error } = await this.client.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false })
    if (error) fail('listOrders', error)
    return (data as OrderRow[]).map(toOrder)
  }

  async getOrderById(id: string) {
    const { data, error } = await this.client.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle()
    if (error) fail('getOrderById', error)
    return data ? toOrder(data as OrderRow) : null
  }

  async getOrderByNumber(number: string) {
    const { data, error } = await this.client.from('orders').select(ORDER_SELECT).eq('number', number).maybeSingle()
    if (error) fail('getOrderByNumber', error)
    return data ? toOrder(data as OrderRow) : null
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const { error } = await this.client.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) fail('updateOrderStatus', error)
    return this.getOrderById(id)
  }

  async updatePaymentStatus(number: string, status: PaymentStatus, reference: string | null) {
    const current = await this.getOrderByNumber(number)
    if (!current) return null
    const { error } = await this.client
      .from('orders')
      .update({
        payment_status: status,
        payment_reference: reference ?? current.paymentReference,
        status: status === 'paid' && current.status === 'pending' ? 'confirmed' : current.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', current.id)
    if (error) fail('updatePaymentStatus', error)
    return this.getOrderById(current.id)
  }

  async listCustomers() {
    const { data, error } = await this.client.from('customers').select('*').order('created_at', { ascending: false })
    if (error) fail('listCustomers', error)
    return (data as { id: string; email: string; name: string; phone: string; created_at: string }[]).map(
      (row): Customer => ({ id: row.id, email: row.email, name: row.name, phone: row.phone, createdAt: row.created_at }),
    )
  }

  async countUsers() {
    const { count, error } = await this.client.from('users').select('id', { count: 'exact', head: true })
    if (error) fail('countUsers', error)
    return count ?? 0
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.client.from('users').select('*').eq('email', email.toLowerCase()).maybeSingle()
    if (error) fail('getUserByEmail', error)
    return data ? toUser(data as UserRow) : null
  }

  async getUserById(id: string) {
    const { data, error } = await this.client.from('users').select('*').eq('id', id).maybeSingle()
    if (error) fail('getUserById', error)
    return data ? toUser(data as UserRow) : null
  }

  async createUser(user: AdminUser) {
    const { error } = await this.client.from('users').insert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      role: user.role,
      password_hash: user.passwordHash,
      created_at: user.createdAt,
    })
    if (error) fail('createUser', error)
    return user
  }

  async addSubscriber(email: string) {
    const { error } = await this.client.from('newsletter_subscribers').insert({ email: email.toLowerCase() })
    // 23505 = unique_violation: already subscribed is not an error for the visitor
    if (error?.code === '23505') return { created: false }
    if (error) fail('addSubscriber', error)
    return { created: true }
  }

  async listSubscribers() {
    const { data, error } = await this.client.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })
    if (error) fail('listSubscribers', error)
    return (data as { id: string; email: string; created_at: string }[]).map(
      (row): Subscriber => ({ id: row.id, email: row.email, createdAt: row.created_at }),
    )
  }
}
