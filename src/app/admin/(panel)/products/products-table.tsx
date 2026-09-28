'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { duplicateProduct, setProductStatus } from '@/app/admin/actions/products'
import { adminInput } from '@/components/admin/form'
import { toast } from '@/components/admin/toast'
import { Badge, EmptyState, tableClass, tdClass, thClass } from '@/components/admin/ui'
import { CopyIcon, EyeIcon, EyeOffIcon, SearchIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { matchesQuery } from '@/lib/catalog'
import type { Product } from '@/lib/data/types'
import { formatDate, formatMoney } from '@/lib/format'
import { LOW_STOCK_THRESHOLD, startingPrice } from '@/lib/pricing'

export function ProductsTable({ products, categories, currency }: { products: Product[]; categories: { id: string; name: string }[]; currency: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [category, setCategory] = useState('all')
  const [pending, startTransition] = useTransition()
  const categoryName = new Map(categories.map((item) => [item.id, item.name]))

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (status === 'all' || product.status === status) &&
          (category === 'all' || (category === 'none' ? !product.categoryId : product.categoryId === category)) &&
          matchesQuery(product, query),
      ),
    [products, status, category, query],
  )

  const run = (action: () => Promise<{ error: string | null }>, success: string) =>
    startTransition(async () => {
      const result = await action()
      if (result.error) toast.error(result.error)
      else {
        toast.success(success)
        router.refresh()
      }
    })

  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-line p-3">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className={`${adminInput} pl-9`} placeholder="Buscar por nombre, marca o SKU" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar productos" />
        </div>
        <select className={`${adminInput} w-auto`} value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          <option value="published">Publicados</option>
          <option value="draft">Borradores</option>
        </select>
        <select className={`${adminInput} w-auto`} value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría">
          <option value="all">Todas las categorías</option>
          <option value="none">Sin categoría</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={products.length ? 'Ningún producto coincide con los filtros' : 'Todavía no hay productos'}
          description={products.length ? 'Probá con otra búsqueda o quitá filtros.' : 'Creá el primero para empezar a vender.'}
          action={
            !products.length && (
              <Link href="/admin/products/new" className="text-[14px] font-medium underline underline-offset-4">
                Crear producto
              </Link>
            )
          }
        />
      ) : (
        <div className={`overflow-x-auto ${pending ? 'opacity-60' : ''}`}>
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Producto</th>
                <th className={thClass}>Categoría</th>
                <th className={thClass}>Estado</th>
                <th className={`${thClass} text-right`}>Stock</th>
                <th className={`${thClass} text-right`}>Precio</th>
                <th className={thClass}>Actualizado</th>
                <th className={thClass}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="group hover:bg-tile">
                  <td className={tdClass}>
                    <Link href={`/admin/products/${product.id}`} className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 rounded-[6px] bg-tile">
                        <ProductImage src={product.images[0]?.url} alt="" sizes="40px" className="p-1" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:underline">{product.name}</span>
                        <span className="block font-mono text-[11px] text-muted">
                          {product.sku}
                          {product.variants.length > 0 && ` · ${product.variants.length} variantes`}
                        </span>
                      </span>
                      {product.isFeatured && <Badge tone="accent">Destacado</Badge>}
                    </Link>
                  </td>
                  <td className={`${tdClass} text-ink-2`}>{product.categoryId ? categoryName.get(product.categoryId) ?? '—' : '—'}</td>
                  <td className={tdClass}>{product.status === 'published' ? <Badge tone="success">Publicado</Badge> : <Badge>Borrador</Badge>}</td>
                  <td className={`${tdClass} tabular text-right ${product.stock === 0 ? 'text-danger' : product.stock <= LOW_STOCK_THRESHOLD ? 'text-warning' : ''}`}>{product.stock}</td>
                  <td className={`${tdClass} tabular text-right`}>{formatMoney(startingPrice(product), currency)}</td>
                  <td className={`${tdClass} whitespace-nowrap text-ink-2`}>{formatDate(product.updatedAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title={product.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                        aria-label={product.status === 'published' ? `Ocultar ${product.name}` : `Publicar ${product.name}`}
                        onClick={() => run(() => setProductStatus(product.id, product.status === 'published' ? 'draft' : 'published'), product.status === 'published' ? 'Producto oculto.' : 'Producto publicado.')}
                        className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile-2 hover:text-ink"
                      >
                        {product.status === 'published' ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                      </button>
                      <button
                        type="button"
                        title="Duplicar"
                        aria-label={`Duplicar ${product.name}`}
                        onClick={() => run(() => duplicateProduct(product.id), 'Copia creada como borrador.')}
                        className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile-2 hover:text-ink"
                      >
                        <CopyIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
