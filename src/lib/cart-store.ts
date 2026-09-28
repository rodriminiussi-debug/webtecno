'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CartLine = {
  key: string
  productId: string
  variantId: string | null
  slug: string
  name: string
  variantName: string | null
  imageUrl: string | null
  unitPriceCents: number
  maxQuantity: number
  quantity: number
}

type CartState = {
  lines: CartLine[]
  isOpen: boolean
  // Incremented on every add so the header icon can play its micro-animation
  pulse: number
  add: (line: Omit<CartLine, 'key' | 'quantity'>, quantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  replace: (lines: CartLine[]) => void
  clear: () => void
  open: () => void
  close: () => void
}

export const MAX_PER_LINE = 20

export const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? 'base'}`

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      pulse: 0,
      add: (line, quantity = 1) =>
        set((state) => {
          const key = lineKey(line.productId, line.variantId)
          const limit = Math.min(line.maxQuantity, MAX_PER_LINE)
          const existing = state.lines.find((item) => item.key === key)
          const lines = existing
            ? state.lines.map((item) => (item.key === key ? { ...item, ...line, quantity: Math.min(item.quantity + quantity, limit) } : item))
            : [...state.lines, { ...line, key, quantity: Math.min(quantity, limit) }]
          return { lines, isOpen: true, pulse: state.pulse + 1 }
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((item) =>
            item.key === key ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity, MAX_PER_LINE)) } : item,
          ),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((item) => item.key !== key) })),
      replace: (lines) => set({ lines }),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'mono-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      version: 1,
    },
  ),
)

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
}
