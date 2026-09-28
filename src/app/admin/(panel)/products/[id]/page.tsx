import { notFound } from 'next/navigation'
import { getRepository } from '@/lib/data'
import { ProductEditor } from '../product-editor'

export const metadata = { title: 'Editar producto' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repository = getRepository()
  const [product, categories] = await Promise.all([repository.getProductById(id), repository.listCategories()])
  if (!product) notFound()
  // key: remount the editor when navigating between products (e.g. after duplicating)
  return <ProductEditor key={product.id} product={product} categories={categories} />
}
