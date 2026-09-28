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

export type ProductQuery = {
  status?: 'published' | 'draft' | 'all'
}

export type NewOrder = Omit<Order, 'id' | 'number' | 'customerId' | 'createdAt' | 'updatedAt'>

export type StockLine = { productId: string; variantId: string | null; quantity: number }

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: 'out_of_stock'; productId: string; variantId: string | null }

/**
 * Persistence boundary. Two implementations exist:
 * - LocalRepository: JSON file, zero-config (dev / demo)
 * - SupabaseRepository: Postgres, used when SUPABASE_URL is set
 * Business rules (pricing, totals, validation) live in lib/, never here.
 */
export interface StoreRepository {
  readonly kind: 'local' | 'supabase'

  getSettings(): Promise<SiteSettings>
  saveSettings(settings: SiteSettings): Promise<SiteSettings>

  listCategories(): Promise<Category[]>
  saveCategory(category: Category): Promise<Category>
  deleteCategory(id: string): Promise<void>

  listProducts(query?: ProductQuery): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getProductById(id: string): Promise<Product | null>
  saveProduct(product: Product): Promise<Product>
  deleteProduct(id: string): Promise<void>

  getHomepage(): Promise<{ sections: AnyHomepageSection[]; settings: HomepageSettings }>
  saveHomepage(sections: AnyHomepageSection[], settings: HomepageSettings): Promise<void>

  /** Must be atomic: validates and decrements stock, upserts the customer, stores the order. */
  createOrder(order: NewOrder, stock: StockLine[]): Promise<CreateOrderResult>
  listOrders(): Promise<Order[]>
  getOrderById(id: string): Promise<Order | null>
  getOrderByNumber(number: string): Promise<Order | null>
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null>
  updatePaymentStatus(number: string, status: PaymentStatus, reference: string | null): Promise<Order | null>

  listCustomers(): Promise<Customer[]>

  countUsers(): Promise<number>
  getUserByEmail(email: string): Promise<AdminUser | null>
  getUserById(id: string): Promise<AdminUser | null>
  createUser(user: AdminUser): Promise<AdminUser>

  addSubscriber(email: string): Promise<{ created: boolean }>
  listSubscribers(): Promise<Subscriber[]>
}
