'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { trackOrder, type TrackState } from '@/app/actions/track-order'
import { ArrowNudge, Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

const initial: TrackState & { redirectTo?: string } = { status: 'idle', message: '' }

export function TrackOrderForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(trackOrder, initial)
  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo)
  }, [state.redirectTo, router])
  return (
    <form action={action} className="flex flex-col gap-5 rounded-[var(--radius-lg)] bg-surface p-6 md:p-8">
      <Field label="Número de pedido" htmlFor="order-number">
        <Input id="order-number" name="number" placeholder="MONO-10023" autoComplete="off" required />
      </Field>
      <Field label="Email de la compra" htmlFor="order-email">
        <Input id="order-email" name="email" type="email" autoComplete="email" required />
      </Field>
      {state.status === 'error' && (
        <p role="alert" className="text-[14px] text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Buscando…' : 'Ver estado'} <ArrowNudge />
      </Button>
    </form>
  )
}
