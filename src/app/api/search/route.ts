import { NextResponse, type NextRequest } from 'next/server'
import { getRepository } from '@/lib/data'
import { matchesQuery } from '@/lib/catalog'
import { startingPrice } from '@/lib/pricing'

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80)
  if (query.length < 2) return NextResponse.json({ results: [] })
  const [products, settings] = await Promise.all([getRepository().listProducts({ status: 'published' }), getRepository().getSettings()])
  const results = products
    .filter((product) => matchesQuery(product, query))
    .slice(0, 6)
    .map((product) => ({
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      imageUrl: product.images[0]?.url ?? null,
      priceCents: startingPrice(product),
      hasVariants: product.variants.length > 0,
    }))
  return NextResponse.json({ results, currency: settings.currency }, { headers: { 'Cache-Control': 'public, max-age=30' } })
}
