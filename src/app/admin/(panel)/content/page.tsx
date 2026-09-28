import { getRepository } from '@/lib/data'
import { HomeBuilder } from './home-builder'

export const metadata = { title: 'Contenido' }

export default async function ContentPage() {
  const repository = getRepository()
  const [homepage, products, categories] = await Promise.all([repository.getHomepage(), repository.listProducts({ status: 'all' }), repository.listCategories()])
  return (
    <HomeBuilder
      sections={homepage.sections}
      hero={homepage.settings.hero}
      products={products.map(({ id, name, status, images }) => ({ id, name, status, imageUrl: images[0]?.url ?? null }))}
      categories={categories.map(({ id, name }) => ({ id, name }))}
    />
  )
}
