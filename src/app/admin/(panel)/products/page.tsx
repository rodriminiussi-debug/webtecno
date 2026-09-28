import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui'
import { buttonClass } from '@/components/ui/button'
import { PlusIcon } from '@/components/icons'
import { getRepository } from '@/lib/data'
import { ProductsTable } from './products-table'

export const metadata = { title: 'Productos' }

export default async function AdminProductsPage() {
  const repository = getRepository()
  const [products, categories, settings] = await Promise.all([repository.listProducts({ status: 'all' }), repository.listCategories(), repository.getSettings()])
  return (
    <>
      <PageHeader
        title="Productos"
        description={`${products.length} productos · ${products.filter((product) => product.status === 'published').length} publicados`}
        actions={
          <Link href="/admin/products/new" className={buttonClass({ size: 'sm' })}>
            <PlusIcon size={16} /> Nuevo producto
          </Link>
        }
      />
      <ProductsTable products={products} categories={categories.map(({ id, name }) => ({ id, name }))} currency={settings.currency} />
    </>
  )
}
