import { getRepository } from '@/lib/data'
import { ProductEditor } from '../product-editor'

export const metadata = { title: 'Nuevo producto' }

export default async function NewProductPage() {
  const categories = await getRepository().listCategories()
  return <ProductEditor product={null} categories={categories} />
}
