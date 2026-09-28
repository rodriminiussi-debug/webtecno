import type {
  AnyHomepageSection,
  Category,
  HomepageSettings,
  Order,
  Product,
  ProductVariant,
  SiteSettings,
} from './types'

// Demo catalogue. Images are original SVG renders shipped in /public/products,
// so the store never depends on third-party copyrighted photography.

const NOW = '2026-09-01T12:00:00.000Z'

export const seedCategories: Category[] = [
  ['cat-audio', 'audio', 'Audio', 'Sonido preciso, sin cables y sin ruido.', '/products/airpods-5-1.svg'],
  ['cat-smartphones', 'smartphones', 'Smartphones', 'El dispositivo que más usás, en su mejor versión.', '/products/iphone-17-pro-1.svg'],
  ['cat-computacion', 'computacion', 'Computación', 'Notebooks y tablets para crear y trabajar.', '/products/macbook-air-15-1.svg'],
  ['cat-wearables', 'wearables', 'Wearables', 'Salud, actividad y notificaciones en tu muñeca.', '/products/apple-watch-series-11-1.svg'],
  ['cat-accesorios', 'accesorios', 'Accesorios', 'Carga, cables y protección, sin concesiones.', '/products/mono-charge-35w-1.svg'],
  ['cat-gaming', 'gaming', 'Gaming', 'Control total, latencia mínima.', '/products/mono-pad-controller-1.svg'],
  ['cat-hogar', 'hogar-inteligente', 'Hogar inteligente', 'Tu casa, conectada y en silencio.', '/products/mono-home-hub-1.svg'],
].map(([id, slug, name, description, imageUrl], index) => ({
  id,
  slug,
  name,
  description,
  imageUrl,
  sortOrder: index,
  isVisible: true,
  createdAt: NOW,
}))

type SeedInput = {
  slug: string
  name: string
  brand: string
  categoryId: string
  price: number
  compareAt?: number
  stock: number
  shortDescription: string
  description: string
  specs: [string, string][]
  features: [string, string][]
  variantLabel?: string
  variants?: [name: string, priceDelta: number | null, stock: number, swatch?: string][]
  isFeatured?: boolean
  status?: 'published' | 'draft'
  animation?: Product['animation']
}

function buildProduct(input: SeedInput, index: number): Product {
  const id = `prd-${input.slug}`
  const sku = `MONO-${String(1001 + index)}`
  const variants: ProductVariant[] = (input.variants ?? []).map(([name, delta, stock, swatch], variantIndex) => ({
    id: `${id}-v${variantIndex + 1}`,
    name,
    sku: `${sku}-${variantIndex + 1}`,
    priceCents: delta === null ? null : (input.price + delta) * 100,
    stock,
    swatch: swatch ?? null,
  }))
  return {
    id,
    slug: input.slug,
    name: input.name,
    brand: input.brand,
    shortDescription: input.shortDescription,
    description: input.description,
    priceCents: input.price * 100,
    compareAtCents: input.compareAt ? input.compareAt * 100 : null,
    sku,
    categoryId: input.categoryId,
    stock: variants.length ? variants.reduce((sum, variant) => sum + variant.stock, 0) : input.stock,
    images: [1, 2].map((n) => ({
      id: `${id}-img${n}`,
      url: `/products/${input.slug}-${n}.svg`,
      alt: `${input.name}${n === 2 ? ' — vista alternativa' : ''}`,
      sortOrder: n - 1,
    })),
    variantLabel: input.variantLabel ?? '',
    variants,
    specs: input.specs.map(([label, value]) => ({ label, value })),
    features: input.features.map(([title, body]) => ({ title, body })),
    isFeatured: input.isFeatured ?? false,
    status: input.status ?? 'published',
    animation: input.animation ?? 'none',
    seoTitle: '',
    seoDescription: '',
    createdAt: NOW,
    updatedAt: NOW,
  }
}

const productInputs: SeedInput[] = [
  {
    slug: 'airpods-5',
    name: 'AirPods 5',
    brand: 'Apple',
    categoryId: 'cat-audio',
    price: 459999,
    compareAt: 529999,
    stock: 24,
    isFeatured: true,
    animation: 'airpods-3d',
    shortDescription: 'Cancelación activa de ruido, audio espacial y un estuche más chico que nunca.',
    description:
      'AirPods 5 redefine lo que esperás de unos auriculares inalámbricos. El nuevo chip H3 procesa el sonido 48.000 veces por segundo para adaptar la cancelación de ruido a tu entorno y a la forma de tu oído. El estuche de carga, más compacto y liviano, entrega hasta 30 horas de reproducción y se carga con USB-C o de forma inalámbrica.',
    specs: [
      ['Chip', 'H3'],
      ['Cancelación de ruido', 'Activa adaptativa'],
      ['Autonomía', 'Hasta 6 h (30 h con estuche)'],
      ['Carga', 'USB-C · Qi2 · MagSafe'],
      ['Resistencia', 'IP54 (auriculares y estuche)'],
      ['Conectividad', 'Bluetooth 5.4'],
      ['Peso', '4,3 g por auricular'],
      ['Garantía', '12 meses oficial'],
    ],
    features: [
      ['Cancelación activa de ruido', 'Micrófonos externos e internos que escuchan el mundo para que vos no tengas que hacerlo.'],
      ['Audio espacial', 'Seguimiento dinámico de la cabeza para un escenario sonoro que te rodea.'],
      ['30 horas de batería', 'Cinco minutos en el estuche equivalen a una hora de escucha.'],
      ['Chip H3', 'Latencia menor y conexión instantánea con todos tus dispositivos.'],
    ],
  },
  {
    slug: 'iphone-17-pro',
    name: 'iPhone 17 Pro',
    brand: 'Apple',
    categoryId: 'cat-smartphones',
    price: 2399999,
    stock: 0,
    isFeatured: true,
    variantLabel: 'Capacidad',
    variants: [
      ['256 GB', null, 6],
      ['512 GB', 380000, 4],
      ['1 TB', 760000, 2],
    ],
    shortDescription: 'Titanio, cámara de 48 MP con zoom 5x y el chip más rápido en un teléfono.',
    description:
      'Estructura de titanio de grado aeroespacial, pantalla ProMotion de 6,3" siempre activa y un sistema de cámaras que captura video ProRes en 4K a 120 cuadros por segundo. Todo impulsado por un chip de 3 nm diseñado para durar años.',
    specs: [
      ['Pantalla', '6,3" OLED ProMotion 120 Hz'],
      ['Chip', 'A19 Pro'],
      ['Cámara principal', '48 MP · f/1.78'],
      ['Teleobjetivo', '48 MP · zoom óptico 5x'],
      ['Batería', 'Hasta 30 h de video'],
      ['Material', 'Titanio grado 5'],
      ['Conector', 'USB-C (USB 3)'],
    ],
    features: [
      ['Titanio', 'Más liviano y más resistente.'],
      ['Cámara Pro', 'Tres lentes de 48 MP para cualquier distancia.'],
      ['Botón de cámara', 'Control táctil para encuadrar sin mirar.'],
    ],
  },
  {
    slug: 'apple-watch-series-11',
    name: 'Apple Watch Series 11',
    brand: 'Apple',
    categoryId: 'cat-wearables',
    price: 899999,
    compareAt: 979999,
    stock: 0,
    isFeatured: true,
    variantLabel: 'Tamaño',
    variants: [
      ['42 mm', null, 7],
      ['46 mm', 60000, 5],
    ],
    shortDescription: 'La pantalla más grande, carga más rápida y funciones de salud avanzadas.',
    description:
      'Series 11 combina una pantalla OLED de gran angular con un diseño más delgado que nunca. Detecta patrones de sueño, mide la variabilidad cardíaca y te avisa de irregularidades. La carga rápida lleva la batería al 80 % en 30 minutos.',
    specs: [
      ['Pantalla', 'OLED LTPO3 gran angular'],
      ['Autonomía', 'Hasta 24 h (36 h en bajo consumo)'],
      ['Resistencia', 'WR50 · IP6X'],
      ['Sensores', 'ECG · Oxígeno en sangre · Temperatura'],
      ['Material', 'Aluminio 100 % reciclado'],
    ],
    features: [
      ['Salud', 'ECG, oxígeno en sangre y alertas de sueño.'],
      ['Carga rápida', '80 % en 30 minutos.'],
    ],
  },
  {
    slug: 'macbook-air-15',
    name: 'MacBook Air 15"',
    brand: 'Apple',
    categoryId: 'cat-computacion',
    price: 2899999,
    stock: 0,
    isFeatured: true,
    variantLabel: 'Configuración',
    variants: [
      ['16 GB · 512 GB', null, 5],
      ['24 GB · 1 TB', 700000, 3],
    ],
    shortDescription: 'Delgadísima, silenciosa y con batería para todo el día.',
    description:
      'Una pantalla Liquid Retina de 15,3" en un chasis de 11,5 mm. Sin ventilador, así que trabaja en silencio absoluto. Hasta 18 horas de batería y dos puertos Thunderbolt para conectar todo lo que necesitás.',
    specs: [
      ['Pantalla', '15,3" Liquid Retina'],
      ['Chip', 'M4 · CPU de 10 núcleos'],
      ['Batería', 'Hasta 18 h'],
      ['Peso', '1,51 kg'],
      ['Puertos', '2 × Thunderbolt 4 · MagSafe 3 · 3,5 mm'],
    ],
    features: [
      ['Sin ventilador', 'Silencio total, incluso a plena carga.'],
      ['18 horas', 'Un día completo de trabajo, y más.'],
    ],
  },
  {
    slug: 'ipad-air-13',
    name: 'iPad Air 13"',
    brand: 'Apple',
    categoryId: 'cat-computacion',
    price: 1499999,
    stock: 11,
    shortDescription: 'Pantalla de 13" y chip M3 para dibujar, estudiar y crear.',
    description:
      'El iPad Air de 13" suma una pantalla más grande y luminosa con compatibilidad con Apple Pencil Pro y Magic Keyboard. El chip M3 le da potencia de notebook en un cuerpo de 6,1 mm.',
    specs: [
      ['Pantalla', '13" Liquid Retina'],
      ['Chip', 'M3'],
      ['Almacenamiento', '128 GB'],
      ['Conectividad', 'Wi-Fi 6E'],
      ['Peso', '617 g'],
    ],
    features: [['Apple Pencil Pro', 'Precisión de trazo con respuesta háptica.']],
  },
  {
    slug: 'mono-charge-35w',
    name: 'Cargador MONO Charge 35W',
    brand: 'MONO',
    categoryId: 'cat-accesorios',
    price: 49999,
    compareAt: 59999,
    stock: 64,
    isFeatured: true,
    shortDescription: 'Dos puertos USB-C con tecnología GaN en el tamaño de un cubo de azúcar.',
    description:
      'Cargá tu teléfono y tus auriculares al mismo tiempo. MONO Charge distribuye 35W de forma inteligente entre sus dos puertos gracias a su electrónica de nitruro de galio, que genera menos calor y ocupa la mitad de espacio.',
    specs: [
      ['Potencia', '35 W máx.'],
      ['Puertos', '2 × USB-C'],
      ['Tecnología', 'GaN III'],
      ['Entrada', '100–240 V'],
      ['Dimensiones', '38 × 38 × 30 mm'],
    ],
    features: [['GaN', 'Menos calor, menos tamaño.']],
  },
  {
    slug: 'mono-studio-headphones',
    name: 'MONO Studio',
    brand: 'MONO',
    categoryId: 'cat-audio',
    price: 389999,
    stock: 0,
    isFeatured: true,
    variantLabel: 'Color',
    variants: [
      ['Grafito', null, 8, '#2a2a2c'],
      ['Arena', null, 5, '#d9d2c5'],
    ],
    shortDescription: 'Auriculares over-ear con cancelación de ruido y 60 horas de batería.',
    description:
      'Almohadillas de espuma viscoelástica, drivers de 40 mm afinados en estudio y cancelación de ruido híbrida. MONO Studio se pliega en un estuche rígido y te acompaña 60 horas sin cargar.',
    specs: [
      ['Drivers', '40 mm dinámicos'],
      ['Autonomía', '60 h (ANC apagado) · 40 h (ANC)'],
      ['Códecs', 'AAC · LDAC'],
      ['Carga', 'USB-C · 10 min = 5 h'],
      ['Peso', '254 g'],
    ],
    features: [
      ['ANC híbrido', 'Seis micrófonos para un silencio real.'],
      ['60 horas', 'Una semana de uso sin cargador.'],
    ],
  },
  {
    slug: 'mono-cell-20k',
    name: 'Power bank MONO Cell 20.000',
    brand: 'MONO',
    categoryId: 'cat-accesorios',
    price: 79999,
    stock: 3,
    shortDescription: '20.000 mAh, carga rápida de 45W y un cuerpo de aluminio.',
    description:
      'Suficiente energía para cargar un teléfono cuatro veces o darle media batería a una notebook. Pantalla de estado discreta, carga rápida bidireccional y aluminio anodizado.',
    specs: [
      ['Capacidad', '20.000 mAh'],
      ['Salida', '45 W USB-C PD'],
      ['Puertos', '2 × USB-C · 1 × USB-A'],
      ['Peso', '340 g'],
    ],
    features: [['45W', 'Carga incluso notebooks.']],
  },
  {
    slug: 'mono-cable-braided',
    name: 'Cable USB-C trenzado 2 m',
    brand: 'MONO',
    categoryId: 'cat-accesorios',
    price: 19999,
    stock: 120,
    shortDescription: 'Trenzado de nylon, 100W y conectores reforzados.',
    description: 'Probado para más de 30.000 dobleces. Soporta carga de 100W y transferencia de datos a 480 Mbps.',
    specs: [
      ['Largo', '2 m'],
      ['Potencia', '100 W'],
      ['Datos', 'USB 2.0 · 480 Mbps'],
    ],
    features: [['30.000 dobleces', 'Construido para durar.']],
  },
  {
    slug: 'mono-sleeve-15',
    name: 'Funda MONO Sleeve 15"',
    brand: 'MONO',
    categoryId: 'cat-accesorios',
    price: 69999,
    stock: 18,
    shortDescription: 'Fieltro de lana y cuero vegetal para notebooks de hasta 15".',
    description: 'Fieltro de lana merino prensado que absorbe impactos, con cierre magnético invisible y bolsillo para cargador.',
    specs: [
      ['Compatibilidad', 'Notebooks de hasta 15,3"'],
      ['Material', 'Fieltro de lana · cuero vegetal'],
    ],
    features: [['Cierre magnético', 'Se abre con una mano.']],
  },
  {
    slug: 'mono-pad-controller',
    name: 'Control MONO Pad',
    brand: 'MONO',
    categoryId: 'cat-gaming',
    price: 119999,
    compareAt: 139999,
    stock: 22,
    shortDescription: 'Control inalámbrico con sticks de efecto Hall y 1 ms de latencia.',
    description:
      'Sticks magnéticos que nunca sufren drift, gatillos con recorrido ajustable y conexión de 2,4 GHz o Bluetooth. Compatible con PC, Mac, iPhone y Android.',
    specs: [
      ['Sticks', 'Efecto Hall'],
      ['Latencia', '1 ms (2,4 GHz)'],
      ['Batería', 'Hasta 40 h'],
      ['Compatibilidad', 'PC · Mac · iOS · Android'],
    ],
    features: [['Sin drift', 'Sensores magnéticos sin contacto.']],
  },
  {
    slug: 'mono-home-hub',
    name: 'Parlante MONO Home',
    brand: 'MONO',
    categoryId: 'cat-hogar',
    price: 249999,
    stock: 9,
    isFeatured: true,
    shortDescription: 'Sonido 360°, asistente de voz y centro de control para tu casa.',
    description:
      'Un woofer de 4" y tres tweeters que llenan cualquier ambiente. Controla luces, enchufes y sensores Matter, y se calibra solo según la acústica de la habitación.',
    specs: [
      ['Audio', 'Woofer 4" · 3 tweeters'],
      ['Estándares', 'Matter · Thread · Wi-Fi 6'],
      ['Micrófonos', '6 de campo lejano'],
    ],
    features: [['Matter', 'Compatible con todo tu hogar.']],
  },
  {
    slug: 'mono-buds-lite',
    name: 'MONO Buds',
    brand: 'MONO',
    categoryId: 'cat-audio',
    price: 129999,
    stock: 0,
    shortDescription: 'In-ear livianos, resistentes al agua y con 28 horas de batería.',
    description: 'Diseño compacto con almohadillas de silicona en tres tamaños, certificación IPX5 y modo transparencia.',
    specs: [
      ['Autonomía', '7 h (28 h con estuche)'],
      ['Resistencia', 'IPX5'],
      ['Bluetooth', '5.3'],
    ],
    features: [['IPX5', 'Para entrenar sin miedo.']],
  },
  {
    slug: 'mono-dock-3in1',
    name: 'Base de carga MONO Dock 3 en 1',
    brand: 'MONO',
    categoryId: 'cat-accesorios',
    price: 139999,
    stock: 15,
    status: 'draft',
    shortDescription: 'Teléfono, reloj y auriculares cargando en una sola base de aluminio.',
    description: 'Base de aluminio macizo con carga magnética Qi2 de 15W, cargador de reloj y superficie para auriculares.',
    specs: [
      ['Potencia', '15 W Qi2'],
      ['Material', 'Aluminio macizo'],
    ],
    features: [['Qi2', 'Alineación magnética perfecta.']],
  },
]

export const seedProducts: Product[] = productInputs.map(buildProduct)

export const seedSettings: SiteSettings = {
  storeName: 'MONO',
  logoUrl: null,
  faviconUrl: null,
  colors: {
    accent: '#ff4d00',
    ink: '#0b0b0c',
    paper: '#f4f4f1',
    surface: '#ffffff',
  },
  font: 'geist',
  texts: {
    tagline: 'Tecnología esencial, elegida con criterio.',
    announcement: 'Envío gratis en compras desde $ 300.000 · 6 cuotas sin interés',
    aboutTitle: 'Menos, pero mejor.',
    aboutBody:
      'MONO nació con una idea simple: elegir pocos productos, los mejores de cada categoría, y ofrecerlos con una experiencia de compra a la altura. Probamos todo lo que vendemos. Si no lo usaríamos nosotros, no está en la tienda.',
    footerNote: 'Precios en pesos argentinos. IVA incluido.',
  },
  socials: {
    instagram: 'https://instagram.com/',
    x: 'https://x.com/',
    tiktok: '',
    youtube: 'https://youtube.com/',
    linkedin: '',
  },
  contact: {
    email: 'hola@mono.store',
    phone: '+54 11 4000 0000',
    whatsapp: '5491140000000',
    address: 'Av. Corrientes 1234, CABA',
    hours: 'Lunes a viernes de 9 a 18 h',
  },
  seo: {
    title: 'MONO — Tecnología esencial',
    description: 'Audio, smartphones, computación y accesorios seleccionados. Envíos a todo el país y garantía oficial.',
  },
  currency: 'ARS',
  locale: 'es-AR',
  shippingMethods: [
    {
      id: 'ship-standard',
      name: 'Envío estándar',
      description: 'A domicilio en todo el país',
      priceCents: 690000,
      freeOverCents: 30000000,
      eta: '3 a 5 días hábiles',
      requiresAddress: true,
      enabled: true,
    },
    {
      id: 'ship-express',
      name: 'Envío express',
      description: 'CABA y GBA, en el día',
      priceCents: 1290000,
      freeOverCents: null,
      eta: 'Hoy, si comprás antes de las 13 h',
      requiresAddress: true,
      enabled: true,
    },
    {
      id: 'ship-pickup',
      name: 'Retiro en showroom',
      description: 'Av. Corrientes 1234, CABA',
      priceCents: 0,
      freeOverCents: null,
      eta: 'Listo en 2 horas',
      requiresAddress: false,
      enabled: true,
    },
  ],
  paymentMethods: [
    {
      id: 'pay-card-demo',
      provider: 'mock_card',
      name: 'Tarjeta de crédito o débito',
      description: 'Modo demostración: el pago se aprueba sin cobrar.',
      instructions: '',
      enabled: true,
    },
    {
      id: 'pay-transfer',
      provider: 'transfer',
      name: 'Transferencia bancaria',
      description: 'Acreditación en 24 h hábiles.',
      instructions: 'Alias: MONO.STORE.PAGOS · CBU 0000003100000000000001 · Titular: MONO SRL. Enviá el comprobante a hola@mono.store indicando tu número de pedido.',
      enabled: true,
    },
    {
      id: 'pay-cash',
      provider: 'cash',
      name: 'Efectivo al retirar',
      description: 'Sólo para retiro en showroom.',
      instructions: 'Aboná en efectivo al retirar tu pedido en el showroom.',
      enabled: true,
    },
    {
      id: 'pay-mercadopago',
      provider: 'mercadopago',
      name: 'Mercado Pago',
      description: 'Tarjetas, dinero en cuenta y cuotas.',
      instructions: '',
      enabled: false,
    },
    {
      id: 'pay-stripe',
      provider: 'stripe',
      name: 'Tarjeta internacional (Stripe)',
      description: 'Visa, Mastercard y Amex emitidas en el exterior.',
      instructions: '',
      enabled: false,
    },
  ],
}

export const seedHomepageSettings: HomepageSettings = {
  hero: {
    eyebrow: 'Nuevo · Audio',
    title: 'AirPods 5',
    subtitle: 'Silencio a medida. Sonido que te rodea.',
    ctaLabel: 'Comprar',
    secondaryLabel: 'Descubrir',
    productId: 'prd-airpods-5',
    imageDesktop: null,
    imageMobile: null,
    background: '#0a0a0b',
    productPosition: 'right',
    animation: 'airpods-3d',
    callouts: ['Cancelación activa de ruido', 'Audio espacial', '30 h de batería', 'Chip H3'],
    showPrice: true,
  },
}

export const seedSections: AnyHomepageSection[] = [
  { id: 'sec-hero', type: 'hero', enabled: true, sortOrder: 0, title: '', subtitle: '', config: {} },
  {
    id: 'sec-featured',
    type: 'featured_products',
    enabled: true,
    sortOrder: 1,
    title: 'Selección',
    subtitle: 'Lo que usamos todos los días. Elegido y probado por el equipo.',
    config: {
      productIds: [
        'prd-airpods-5',
        'prd-iphone-17-pro',
        'prd-apple-watch-series-11',
        'prd-macbook-air-15',
        'prd-mono-studio-headphones',
        'prd-mono-charge-35w',
        'prd-mono-home-hub',
      ],
      ctaLabel: 'Ver todos los productos',
    },
  },
  {
    id: 'sec-categories',
    type: 'categories',
    enabled: true,
    sortOrder: 2,
    title: 'Categorías',
    subtitle: 'Todo lo que necesitás, nada que sobre.',
    config: { categoryIds: [] },
  },
  {
    id: 'sec-story',
    type: 'story',
    enabled: true,
    sortOrder: 3,
    title: 'Designed for your everyday.',
    subtitle: 'MONO Studio',
    config: {
      eyebrow: 'Producto destacado',
      productId: 'prd-mono-studio-headphones',
      imageUrl: null,
      body: 'Sesenta horas de batería, cancelación de ruido híbrida y almohadillas que olvidás que tenés puestas. Diseñados para acompañarte desde el primer café hasta el último mail.',
      ctaLabel: 'Conocer MONO Studio',
      points: [
        { title: '60 h', body: 'De batería con una sola carga.' },
        { title: '6 micrófonos', body: 'Cancelación de ruido híbrida y llamadas nítidas.' },
        { title: '254 g', body: 'Livianos para usar todo el día.' },
      ],
    },
  },
  {
    id: 'sec-benefits',
    type: 'benefits',
    enabled: true,
    sortOrder: 4,
    title: 'Comprar en MONO',
    subtitle: '',
    config: {
      items: [
        { icon: 'shipping', title: 'Envíos a todo el país', body: 'Gratis desde $ 300.000. Express en el día en CABA.' },
        { icon: 'secure', title: 'Compra segura', body: 'Pagos cifrados y protegidos de punta a punta.' },
        { icon: 'warranty', title: 'Garantía oficial', body: '12 meses en todos los productos. Sin letra chica.' },
        { icon: 'support', title: 'Atención personalizada', body: 'Personas reales que conocen cada producto.' },
      ],
    },
  },
  {
    id: 'sec-newsletter',
    type: 'newsletter',
    enabled: true,
    sortOrder: 5,
    title: 'Stay ahead.',
    subtitle: 'Lanzamientos, reposiciones y precios especiales. Un mail por mes, como mucho.',
    config: { placeholder: 'tu@email.com', ctaLabel: 'Suscribirme', note: 'Podés darte de baja cuando quieras.' },
  },
]

// A few historical orders so the admin dashboard is not empty on first run.
export function buildSeedOrders(products: Product[]): Order[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]))
  const customers = [
    ['cus-1', 'Lucía Fernández', 'lucia.fernandez@example.com'],
    ['cus-2', 'Martín Gómez', 'martin.gomez@example.com'],
    ['cus-3', 'Sofía Ramírez', 'sofia.ramirez@example.com'],
    ['cus-4', 'Tomás Álvarez', 'tomas.alvarez@example.com'],
    ['cus-5', 'Valentina Díaz', 'valentina.diaz@example.com'],
  ] as const
  const plan: [daysAgo: number, customer: number, lines: [string, number][], status: Order['status']][] = [
    [27, 0, [['airpods-5', 1], ['mono-cable-braided', 2]], 'delivered'],
    [24, 1, [['mono-charge-35w', 2]], 'delivered'],
    [21, 2, [['ipad-air-13', 1]], 'delivered'],
    [18, 3, [['airpods-5', 1]], 'delivered'],
    [15, 4, [['mono-pad-controller', 1], ['mono-cable-braided', 1]], 'delivered'],
    [12, 0, [['mono-home-hub', 1]], 'shipped'],
    [9, 1, [['airpods-5', 2]], 'shipped'],
    [6, 2, [['mono-cell-20k', 1], ['mono-charge-35w', 1]], 'preparing'],
    [4, 3, [['mono-sleeve-15', 1]], 'confirmed'],
    [2, 4, [['airpods-5', 1], ['mono-charge-35w', 1]], 'confirmed'],
    [1, 0, [['mono-pad-controller', 1]], 'pending'],
    [0, 2, [['mono-cable-braided', 3]], 'pending'],
  ]
  const base = new Date('2026-09-28T15:00:00.000Z').getTime()
  return plan.map(([daysAgo, customerIndex, lines, status], index) => {
    const [customerId, customerName, customerEmail] = customers[customerIndex]
    const items = lines.map(([slug, quantity], lineIndex) => {
      const product = bySlug.get(slug)
      if (!product) throw new Error(`Seed product ${slug} not found`)
      return {
        id: `oi-${index}-${lineIndex}`,
        productId: product.id,
        variantId: null,
        name: product.name,
        variantName: null,
        sku: product.sku,
        imageUrl: product.images[0]?.url ?? null,
        unitPriceCents: product.priceCents,
        quantity,
      }
    })
    const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0)
    const shippingCents = subtotalCents >= 30000000 ? 0 : 690000
    const createdAt = new Date(base - daysAgo * 86400000 - index * 3600000).toISOString()
    return {
      id: `ord-seed-${index + 1}`,
      number: `MONO-${10001 + index}`,
      customerId,
      customerName,
      customerEmail,
      customerPhone: '+54 11 5555 0000',
      documentId: '',
      shippingAddress: {
        street: 'Av. Santa Fe',
        number: String(1000 + index * 17),
        apartment: '',
        city: 'CABA',
        province: 'Buenos Aires',
        postalCode: '1425',
      },
      shippingMethodId: 'ship-standard',
      shippingMethodName: 'Envío estándar',
      shippingCents,
      paymentMethodId: 'pay-card-demo',
      paymentMethodName: 'Tarjeta de crédito o débito',
      paymentProvider: 'mock_card',
      paymentStatus: status === 'pending' ? 'pending' : 'paid',
      paymentReference: null,
      status,
      subtotalCents,
      totalCents: subtotalCents + shippingCents,
      notes: '',
      items,
      createdAt,
      updatedAt: createdAt,
    }
  })
}

export const seedCustomers = [
  ['cus-1', 'Lucía Fernández', 'lucia.fernandez@example.com'],
  ['cus-2', 'Martín Gómez', 'martin.gomez@example.com'],
  ['cus-3', 'Sofía Ramírez', 'sofia.ramirez@example.com'],
  ['cus-4', 'Tomás Álvarez', 'tomas.alvarez@example.com'],
  ['cus-5', 'Valentina Díaz', 'valentina.diaz@example.com'],
].map(([id, name, email]) => ({ id, name, email, phone: '+54 11 5555 0000', createdAt: '2026-08-15T12:00:00.000Z' }))
