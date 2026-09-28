'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { SalesMode } from '@/lib/data/types'
import { GENERAL_WHATSAPP_MESSAGE, fillTemplate, whatsappUrl } from '@/lib/whatsapp'

type StoreMode = {
  mode: SalesMode
  storeName: string
  siteUrl: string
  whatsappNumber: string
  whatsappTemplate: string
}

const StoreModeContext = createContext<StoreMode | null>(null)

export function StoreModeProvider({ value, children }: { value: StoreMode; children: ReactNode }) {
  return <StoreModeContext.Provider value={value}>{children}</StoreModeContext.Provider>
}

export function useStoreMode() {
  const value = useContext(StoreModeContext)
  if (!value) throw new Error('useStoreMode must be used inside StoreModeProvider')
  return value
}

/** True when prices are hidden and products are sold through WhatsApp. */
export function useConsultative() {
  return useStoreMode().mode === 'whatsapp'
}

export function useWhatsAppLink() {
  const { storeName, siteUrl, whatsappNumber, whatsappTemplate } = useStoreMode()
  return {
    forProduct: (product: { name: string; slug: string }, option?: string | null) =>
      whatsappUrl(
        whatsappNumber,
        fillTemplate(whatsappTemplate, { store: storeName, product: product.name, option, link: `${siteUrl}/products/${product.slug}` }),
      ),
    general: () => whatsappUrl(whatsappNumber, fillTemplate(GENERAL_WHATSAPP_MESSAGE, { store: storeName })),
  }
}
