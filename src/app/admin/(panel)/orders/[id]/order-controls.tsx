'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { updateOrderStatus, updatePaymentStatus } from '@/app/admin/actions/orders'
import { SelectInput } from '@/components/admin/form'
import { toast } from '@/components/admin/toast'
import { Panel } from '@/components/admin/ui'
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from '@/lib/data/types'
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/order-status'

export function OrderControls({ orderId, status, paymentStatus }: { orderId: string; status: OrderStatus; paymentStatus: PaymentStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const cancelled = status === 'cancelled'

  const changeStatus = (next: OrderStatus) => {
    if (next === status) return
    if (next === 'cancelled' && !window.confirm('¿Cancelar el pedido? Las unidades vuelven al stock y no se puede reabrir.')) return
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, next)
      if (result.error !== null) return toast.error(result.error)
      toast.success(`Pedido ${ORDER_STATUS_LABEL[next].toLowerCase()}.`)
      router.refresh()
    })
  }

  const changePayment = (next: PaymentStatus) => {
    if (next === paymentStatus) return
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, next)
      if (result.error !== null) return toast.error(result.error)
      toast.success('Estado de pago actualizado.')
      router.refresh()
    })
  }

  return (
    <Panel title="Gestión">
      <div className={`flex flex-col gap-4 ${pending ? 'opacity-60' : ''}`}>
        <SelectInput label="Estado del pedido" value={status} disabled={pending || cancelled} onChange={(event) => changeStatus(event.target.value as OrderStatus)} hint={cancelled ? 'Los pedidos cancelados no se pueden reabrir.' : 'Cancelar devuelve el stock.'}>
          {ORDER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {ORDER_STATUS_LABEL[item]}
            </option>
          ))}
        </SelectInput>
        <SelectInput label="Estado del pago" value={paymentStatus} disabled={pending} onChange={(event) => changePayment(event.target.value as PaymentStatus)} hint="Marcá “Pagado” al recibir una transferencia.">
          {PAYMENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {PAYMENT_STATUS_LABEL[item]}
            </option>
          ))}
        </SelectInput>
      </div>
    </Panel>
  )
}
