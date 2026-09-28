import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSettings } from '@/lib/store'
import { CartView } from './cart-view'

export const metadata: Metadata = { title: 'Carrito', robots: { index: false } }

export default async function CartPage() {
  const settings = await getSettings()
  // WhatsApp sales mode has no cart: purchases are closed in the chat
  if (settings.sales.mode === 'whatsapp') redirect('/products')
  return (
    <div className="container-mono pb-24 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
      <h1 className="text-headline font-semibold">Carrito</h1>
      <CartView currency={settings.currency} />
    </div>
  )
}
