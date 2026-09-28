@AGENTS.md

# MONO store

Tienda premium de tecnología (cliente + panel `/admin`). Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Motion · Supabase (opcional).

## Decisiones de diseño (no se re-improvisan por pantalla)

1. **Tipografía:** Geist Sans + Geist Mono. La mono es la "voz técnica" de la marca (labels, índices, specs) y conecta con el nombre MONO. El admin puede cambiar la sans (Instrument, Manrope, IBM Plex); la mono queda fija.
2. **Color:** casi monocromático (tinta `#0b0b0c` / papel `#f4f4f1`) + **un** acento (`#ff4d00`) que sólo marca descuentos, estados y foco. Los grises se derivan con `color-mix` desde tinta/papel.
3. **Densidad:** tienda = Modo A (aire con propósito, composición asimétrica, escala tipográfica fuerte). Admin = Modo B (denso, tablas tabulares, cero animación decorativa, tema fijo que no se ve afectado por la config de la tienda).

## Arquitectura

- `src/lib/data/` — `StoreRepository` con dos implementaciones: `LocalRepository` (JSON en `.data/`, cero config) y `SupabaseRepository` (se activa con `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). Dinero siempre en centavos (enteros).
- Lógica de negocio pura en `src/lib/` (`pricing`, `catalog`, `orders`, `stats`). Los precios se recalculan en el servidor al comprar; nunca se confía en el carrito del navegador.
- Auth admin: sesión propia firmada (HMAC, cookie httpOnly). `proxy.ts` hace el chequeo rápido; `requireAdmin()` revalida contra la base en cada página y acción.
- Pagos: interfaz `PaymentProvider` (`src/lib/payments`). Transferencia, efectivo y tarjeta demo funcionan; Mercado Pago y Stripe se habilitan con sus claves.
- Hero (`animation: 'airpods'`): película estilo Apple por capas (`src/features/hero/airpods-stage.tsx`, tiempos en `FILM`): el estuche emerge del negro, se abre, los auriculares suben, el estuche cae y alternan títulos con tomas macro (ANC, Siri con el brillo de Apple Intelligence, chip H2) hasta el vuelo final. Capas: `public/hero/` (estuche abierto recortado con `CASE_FRONT_CLIP`, auricular `bud.webp`). Los desplazamientos en % van en una capa `absolute inset-0` para que se midan contra el escenario, no contra el elemento. Modo alternativo `sequence` (`hero-sequence.tsx`) con cuadros propios desde el admin. Con `prefers-reduced-motion` se muestra una imagen fija.
- Sección `features` (`src/features/home/features-section.tsx`): vista explotada del auricular (`exploded-view.tsx`, piezas en `public/parts/`, líneas azules de flujo de aire) + un panel por función con gráfico propio (`feature-visuals.tsx`). Los ítems se editan en el Home Builder.
- Modo de venta `whatsapp` (default): sin precios ni carrito; cada producto abre wa.me con un mensaje armado desde la plantilla de Ajustes → Ventas.
- Imágenes de producto y del hero: generadas con OpenAI `gpt-image-2.5-sunburst` (fondo transparente) y optimizadas a WebP con `scripts/optimize-renders.mjs`. Los cuadros del hero son ediciones de la misma foto de referencia para mantener consistencia. Límite de la cuenta: 5 imágenes por minuto.
- Se descartó el modelado 3D procedural (three.js): Rodrigo prefiere fotografía generada; el bundle también quedó más liviano.

## Excepciones a las convenciones globales

- Tipos de filas de Supabase escritos a mano en `supabase-repository.ts` porque todavía no hay proyecto vinculado. Reemplazar por `supabase gen types typescript` al vincularlo.
- Rate limit en memoria (una instancia). Pasar a Redis/Upstash si se escala horizontalmente.

## Supabase

- Proyecto `mono-store` (ref `tagdgwkiqnnphdmnpkqi`, región sa-east-1, plan free), creado el 2026-09-28 con las migraciones 0001–0003 aplicadas.
- Verificado contra la base real: seed automático, catálogo, checkout con `create_order` (stock y variantes), login admin, cambio de estado y edición de producto. Después se vació la base: el primer arranque real vuelve a sembrar el demo y crea el admin con `ADMIN_PASSWORD`.
- Falta cargar `SUPABASE_SERVICE_ROLE_KEY` (sólo se ve en el dashboard → Project Settings → API).

## Pendiente

- Emails transaccionales (confirmación / cambio de estado): no implementados.
