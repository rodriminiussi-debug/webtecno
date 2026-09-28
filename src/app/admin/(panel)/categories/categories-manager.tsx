'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCategory, reorderCategories, saveCategory, type CategoryInput } from '@/app/admin/actions/categories'
import { ImageInput, TextArea, TextInput } from '@/components/admin/form'
import { toast } from '@/components/admin/toast'
import { Badge, EmptyState, Panel } from '@/components/admin/ui'
import { ArrowLeftIcon, ArrowRightIcon, EditIcon, PlusIcon, TrashIcon } from '@/components/icons'
import { ProductImage } from '@/components/product-image'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/field'
import type { Category } from '@/lib/data/types'
import { slugify } from '@/lib/format'

const EMPTY: CategoryInput = { id: null, name: '', slug: '', description: '', imageUrl: null, isVisible: true }

export function CategoriesManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter()
  const [editing, setEditing] = useState<CategoryInput | null>(null)
  const [pending, startTransition] = useTransition()
  const [order, setOrder] = useState(categories.map((category) => category.id))
  const [source, setSource] = useState(categories)
  if (source !== categories) {
    setSource(categories)
    setOrder(categories.map((category) => category.id))
  }
  const byId = new Map(categories.map((category) => [category.id, category]))
  const ordered = order.map((id) => byId.get(id)).filter((category): category is Category => Boolean(category))

  const move = (index: number, delta: number) => {
    const next = [...order]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    setOrder(next)
    startTransition(async () => {
      const result = await reorderCategories(next)
      if (result.error !== null) toast.error(result.error)
      else router.refresh()
    })
  }

  const submit = () => {
    if (!editing) return
    startTransition(async () => {
      const result = await saveCategory(editing)
      if (result.error !== null) return toast.error(result.error)
      toast.success(editing.id ? 'Categoría actualizada.' : 'Categoría creada.')
      setEditing(null)
      router.refresh()
    })
  }

  const remove = (category: Category) => {
    const count = counts[category.id] ?? 0
    const message = count
      ? `“${category.name}” tiene ${count} productos. Van a quedar sin categoría (no se borran). ¿Eliminar igual?`
      : `¿Eliminar la categoría “${category.name}”?`
    if (!window.confirm(message)) return
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result.error !== null) return toast.error(result.error)
      toast.success('Categoría eliminada.')
      router.refresh()
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel
        title={`${categories.length} categorías`}
        padded={false}
        className="lg:col-span-2"
        actions={
          <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
            <PlusIcon size={16} /> Nueva categoría
          </Button>
        }
      >
        {ordered.length === 0 ? (
          <EmptyState title="Sin categorías" description="Creá categorías para organizar el catálogo y los filtros de la tienda." />
        ) : (
          <ul className={`divide-y divide-line ${pending ? 'opacity-60' : ''}`}>
            {ordered.map((category, index) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Subir ${category.name}`} className="inline-flex size-6 items-center justify-center rounded text-muted hover:text-ink disabled:opacity-20">
                    <ArrowLeftIcon size={12} className="rotate-90" />
                  </button>
                  <button type="button" disabled={index === ordered.length - 1} onClick={() => move(index, 1)} aria-label={`Bajar ${category.name}`} className="inline-flex size-6 items-center justify-center rounded text-muted hover:text-ink disabled:opacity-20">
                    <ArrowRightIcon size={12} className="rotate-90" />
                  </button>
                </div>
                <span className="relative size-11 shrink-0 rounded-[6px] bg-tile">
                  <ProductImage src={category.imageUrl} alt="" sizes="44px" className="p-1" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[14px] font-medium">
                    {category.name} {!category.isVisible && <Badge>Oculta</Badge>}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    /{category.slug} · {counts[category.id] ?? 0} productos
                  </p>
                </div>
                <button type="button" onClick={() => setEditing({ id: category.id, name: category.name, slug: category.slug, description: category.description, imageUrl: category.imageUrl, isVisible: category.isVisible })} aria-label={`Editar ${category.name}`} className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile hover:text-ink">
                  <EditIcon size={16} />
                </button>
                <button type="button" onClick={() => remove(category)} aria-label={`Eliminar ${category.name}`} className="inline-flex size-8 items-center justify-center rounded-full text-ink-2 hover:bg-tile hover:text-danger">
                  <TrashIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={editing ? (editing.id ? 'Editar categoría' : 'Nueva categoría') : 'Detalle'}>
        {!editing ? (
          <p className="text-[13px] text-muted">Elegí una categoría para editarla o creá una nueva.</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <TextInput
              label="Nombre"
              value={editing.name}
              required
              autoFocus
              onChange={(event) => setEditing({ ...editing, name: event.target.value, slug: editing.id ? editing.slug : slugify(event.target.value) })}
            />
            <TextInput label="Slug" value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} hint={`/products?category=${slugify(editing.slug || editing.name) || '…'}`} />
            <TextArea label="Descripción" value={editing.description} rows={3} maxLength={200} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            <ImageInput label="Imagen" value={editing.imageUrl ?? null} onChange={(imageUrl) => setEditing({ ...editing, imageUrl })} />
            <div className="flex items-center justify-between">
              <label htmlFor="category-visible" className="text-[14px]">
                Visible en la tienda
              </label>
              <Switch id="category-visible" checked={editing.isVisible} onChange={(isVisible) => setEditing({ ...editing, isVisible })} label="Visible en la tienda" />
            </div>
            <div className="flex gap-2 border-t border-line pt-4">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  )
}
