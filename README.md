# MONO — tienda de tecnología

E-commerce premium con dos experiencias: **tienda** para clientes y **panel `/admin`** para gestionarla sin tocar código.

## Correr en local

```bash
cd mono-store
npm install
npm run dev          # http://localhost:3000
```

Sin variables de entorno funciona en **modo local**: los datos se guardan en `.data/db.json` y se carga un catálogo demo (14 productos, 7 categorías, 12 pedidos).

- Admin: http://localhost:3000/admin — usuario demo `admin@mono.store` / `mono-admin-2026` (sólo si no definís `ADMIN_PASSWORD`).
- `npm run db:reset` vuelve el catálogo al estado demo.
- `npm run lint` · `npm run typecheck` · `npm run build`.

## Qué incluye

**Tienda:** hero 3D de AirPods 5 coreografiado con el scroll (se abre el estuche, salen los auriculares y la cámara se acerca), selección editorial, índice de categorías, storytelling con scroll, beneficios, newsletter, catálogo con búsqueda/filtros/orden/rango de precio/stock, página de producto con galería + zoom + variantes + visor 3D, carrito (drawer + página), checkout, confirmación protegida, seguimiento de pedido, páginas legales con botón de arrepentimiento, SEO (metadata, Open Graph, sitemap, robots, JSON-LD de productos).

**Admin:** dashboard (ingresos, pedidos, top productos, stock bajo), CRUD de productos (imágenes, variantes, specs, SEO, borrador/publicado, duplicar), categorías, pedidos con estados (cancelar devuelve stock), clientes y newsletter con export CSV, **Home Builder** con drag & drop y edición del Hero, configuración de marca, colores, tipografía, textos, contacto, envíos y pagos.

## Producción

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública (SEO y retorno de pagos) |
| `SESSION_SECRET` | 32+ caracteres aleatorios, firma la sesión del admin |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Primer administrador |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Base de datos real (ver `supabase/migrations`) |
| `MERCADOPAGO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY` | Activan esos medios de pago |

1. Supabase ya está creado y migrado: proyecto **mono-store** (`https://tagdgwkiqnnphdmnpkqi.supabase.co`). Copiá la clave `service_role` desde Project Settings → API. En el primer arranque se carga el catálogo demo. (Para otro proyecto: ejecutar `supabase/migrations/0001_init.sql`.)
2. En Vercel, crear un proyecto con **Root Directory = `mono-store`** y cargar las variables.

> El modo local en Vercel es sólo una demo efímera (escribe en `/tmp`). Para una tienda real, usar Supabase.
