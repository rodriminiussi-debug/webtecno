// Domain model. Money is always stored in minor units (cents) as integers
// to avoid floating point drift when summing totals.

export type ProductStatus = 'published' | 'draft'
export type ProductAnimation = 'none' | 'float'

export type ProductImage = {
  id: string
  url: string
  alt: string
  sortOrder: number
}

export type ProductVariant = {
  id: string
  name: string
  sku: string
  // null = inherits the product price
  priceCents: number | null
  stock: number
  // Optional swatch color for color variants
  swatch: string | null
}

export type ProductSpec = { label: string; value: string }
export type ProductFeature = { title: string; body: string }

export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  shortDescription: string
  description: string
  priceCents: number
  compareAtCents: number | null
  sku: string
  categoryId: string | null
  stock: number
  images: ProductImage[]
  variantLabel: string
  variants: ProductVariant[]
  specs: ProductSpec[]
  features: ProductFeature[]
  isFeatured: boolean
  status: ProductStatus
  animation: ProductAnimation
  seoTitle: string
  seoDescription: string
  createdAt: string
  updatedAt: string
}

export type Category = {
  id: string
  slug: string
  name: string
  description: string
  imageUrl: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: string
}

export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export type Address = {
  street: string
  number: string
  apartment: string
  city: string
  province: string
  postalCode: string
}

export type OrderItem = {
  id: string
  productId: string
  variantId: string | null
  name: string
  variantName: string | null
  sku: string
  imageUrl: string | null
  unitPriceCents: number
  quantity: number
}

export type Order = {
  id: string
  number: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  documentId: string
  shippingAddress: Address | null
  shippingMethodId: string
  shippingMethodName: string
  shippingCents: number
  paymentMethodId: string
  paymentMethodName: string
  paymentProvider: PaymentProviderId
  paymentStatus: PaymentStatus
  paymentReference: string | null
  status: OrderStatus
  subtotalCents: number
  totalCents: number
  notes: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type Customer = {
  id: string
  email: string
  name: string
  phone: string
  createdAt: string
}

export type CustomerSummary = Customer & {
  ordersCount: number
  totalSpentCents: number
  lastOrderAt: string | null
}

export type AdminRole = 'owner' | 'admin' | 'editor'

export type AdminUser = {
  id: string
  email: string
  name: string
  role: AdminRole
  passwordHash: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Store settings
// ---------------------------------------------------------------------------

export const FONT_KEYS = ['geist', 'instrument', 'manrope', 'plex'] as const
export type FontKey = (typeof FONT_KEYS)[number]

export type PaymentProviderId = 'transfer' | 'cash' | 'mock_card' | 'mercadopago' | 'stripe'

export type ShippingMethod = {
  id: string
  name: string
  description: string
  priceCents: number
  // Free shipping threshold on the subtotal; null = never free
  freeOverCents: number | null
  eta: string
  requiresAddress: boolean
  enabled: boolean
}

export type PaymentMethod = {
  id: string
  provider: PaymentProviderId
  name: string
  description: string
  instructions: string
  enabled: boolean
}

export type SiteSettings = {
  storeName: string
  logoUrl: string | null
  faviconUrl: string | null
  colors: {
    accent: string
    ink: string
    paper: string
    surface: string
  }
  font: FontKey
  texts: {
    tagline: string
    announcement: string
    aboutTitle: string
    aboutBody: string
    footerNote: string
  }
  socials: {
    instagram: string
    x: string
    tiktok: string
    youtube: string
    linkedin: string
  }
  contact: {
    email: string
    phone: string
    whatsapp: string
    address: string
    hours: string
  }
  seo: {
    title: string
    description: string
  }
  currency: string
  locale: string
  shippingMethods: ShippingMethod[]
  paymentMethods: PaymentMethod[]
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export const SECTION_TYPES = ['hero', 'featured_products', 'categories', 'story', 'benefits', 'newsletter'] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export type HeroAnimation = 'sequence' | 'parallax' | 'none'
export type HeroPosition = 'left' | 'center' | 'right'

export type HeroConfig = {
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel: string
  secondaryLabel: string
  productId: string | null
  imageDesktop: string | null
  imageMobile: string | null
  background: string
  productPosition: HeroPosition
  animation: HeroAnimation
  // Moments of the scroll story, in order (e.g. closed → open → lifting → close-up)
  frames: string[]
  callouts: string[]
  showPrice: boolean
}

export type BenefitIcon = 'shipping' | 'secure' | 'warranty' | 'support' | 'returns' | 'installments'

export type SectionConfigMap = {
  hero: Record<string, never>
  featured_products: { productIds: string[]; ctaLabel: string }
  categories: { categoryIds: string[] }
  story: {
    eyebrow: string
    productId: string | null
    imageUrl: string | null
    body: string
    ctaLabel: string
    points: { title: string; body: string }[]
  }
  benefits: { items: { icon: BenefitIcon; title: string; body: string }[] }
  newsletter: { placeholder: string; ctaLabel: string; note: string }
}

export type HomepageSection<T extends SectionType = SectionType> = {
  id: string
  type: T
  enabled: boolean
  sortOrder: number
  title: string
  subtitle: string
  config: SectionConfigMap[T]
}

export type AnyHomepageSection = {
  [K in SectionType]: HomepageSection<K>
}[SectionType]

export type HomepageSettings = {
  hero: HeroConfig
}

export type Subscriber = { id: string; email: string; createdAt: string }

// Standard result shape, mirrors supabase-js
export type Result<T> = { data: T; error: null } | { data: null; error: string }
