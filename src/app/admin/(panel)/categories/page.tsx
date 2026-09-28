import { PageHeader } from '@/components/admin/ui'
import { getRepository } from '@/lib/data'
import { CategoriesManager } from './categories-manager'

export const metadata = { title: 'Categorías' }

export default async function AdminCategoriesPage() {
  const repository = getRepository()
  const [categories, products] = await Promise.all([repository.listCategories(), repository.listProducts({ status: 'all' })])
  const counts: Record<string, number> = {}
  for (const product of products) if (product.categoryId) counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1
  return (
    <>
      <PageHeader title="Categorías" description="Ordenalas como querés que aparezcan en la tienda. Las ocultas no se muestran a los clientes." />
      <CategoriesManager categories={categories} counts={counts} />
    </>
  )
}
