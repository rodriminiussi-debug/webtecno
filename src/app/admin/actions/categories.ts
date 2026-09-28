'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/session'
import { getRepository } from '@/lib/data'
import type { Category, Result } from '@/lib/data/types'
import { slugify } from '@/lib/format'

const schema = z.object({
  id: z.string().nullable(),
  name: z.string().trim().min(2, 'El nombre es obligatorio.').max(60),
  slug: z.string().trim().max(70),
  description: z.string().trim().max(200),
  imageUrl: z.string().trim().max(1000).nullable(),
  isVisible: z.boolean(),
})

export type CategoryInput = z.input<typeof schema>

export async function saveCategory(raw: CategoryInput): Promise<Result<Category>> {
  await requireAdmin()
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }
  const input = parsed.data
  const repository = getRepository()
  const all = await repository.listCategories()
  const existing = input.id ? all.find((category) => category.id === input.id) : undefined
  const slug = slugify(input.slug || input.name)
  if (all.some((category) => category.slug === slug && category.id !== existing?.id)) {
    return { data: null, error: `Ya existe una categoría con el slug “${slug}”.` }
  }
  const category: Category = {
    id: existing?.id ?? randomUUID(),
    slug,
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl || null,
    isVisible: input.isVisible,
    sortOrder: existing?.sortOrder ?? all.length,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  }
  try {
    await repository.saveCategory(category)
  } catch (error) {
    console.error('saveCategory failed', { error, id: category.id })
    return { data: null, error: 'No se pudo guardar la categoría.' }
  }
  revalidatePath('/', 'layout')
  return { data: category, error: null }
}

export async function deleteCategory(id: string): Promise<Result<true>> {
  await requireAdmin()
  try {
    await getRepository().deleteCategory(id)
  } catch (error) {
    console.error('deleteCategory failed', { error, id })
    return { data: null, error: 'No se pudo eliminar la categoría.' }
  }
  revalidatePath('/', 'layout')
  return { data: true, error: null }
}

export async function reorderCategories(ids: string[]): Promise<Result<true>> {
  await requireAdmin()
  const repository = getRepository()
  const all = await repository.listCategories()
  try {
    for (const category of all) {
      const sortOrder = ids.indexOf(category.id)
      if (sortOrder >= 0 && sortOrder !== category.sortOrder) await repository.saveCategory({ ...category, sortOrder })
    }
  } catch (error) {
    console.error('reorderCategories failed', { error })
    return { data: null, error: 'No se pudo guardar el orden.' }
  }
  revalidatePath('/', 'layout')
  return { data: true, error: null }
}
