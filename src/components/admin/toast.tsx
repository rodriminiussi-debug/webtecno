'use client'

import { AnimatePresence, motion } from 'motion/react'
import { create } from 'zustand'
import { CheckIcon, CloseIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

type Toast = { id: number; message: string; tone: 'success' | 'error' }

const useToasts = create<{ toasts: Toast[]; push: (message: string, tone: Toast['tone']) => void; dismiss: (id: number) => void }>((set) => ({
  toasts: [],
  push: (message, tone) => {
    const id = Date.now() + Math.random()
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }))
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), tone === 'error' ? 7000 : 3500)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))

export const toast = {
  success: (message: string) => useToasts.getState().push(message, 'success'),
  error: (message: string) => useToasts.getState().push(message, 'error'),
}

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={cn('pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[14px] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)]', item.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-paper')}
          >
            {item.tone === 'success' && <CheckIcon size={18} className="mt-px shrink-0" />}
            <p className="flex-1 leading-snug">{item.message}</p>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Cerrar aviso" className="shrink-0 opacity-70 hover:opacity-100">
              <CloseIcon size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
