import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { OrderStatus, PaymentStatus } from '@/lib/data/types'
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from '@/lib/order-status'

// Operational UI (Modo B): dense, tabular, no decorative motion.

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-[13px] text-muted hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[24px] font-semibold tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn('rounded-[var(--radius-md)] border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="text-[14px] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  )
}

export const tableClass = 'w-full border-collapse text-[13px]'
export const thClass = 'label-mono whitespace-nowrap border-b border-line px-4 py-3 text-left font-normal text-muted'
export const tdClass = 'border-b border-line px-4 py-3 align-middle'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' }) {
  const tones = {
    neutral: 'bg-tile-2 text-ink-2',
    success: 'bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-success',
    warning: 'bg-[color-mix(in_oklab,var(--color-warning)_16%,transparent)] text-warning',
    danger: 'bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-danger',
    info: 'bg-[color-mix(in_oklab,#2f5bd3_12%,transparent)] text-[#2f5bd3]',
    accent: 'bg-[color-mix(in_oklab,var(--mono-accent)_14%,transparent)] text-accent',
  }
  return <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium', tones[tone])}>{children}</span>
}

const ORDER_TONE: Record<OrderStatus, Parameters<typeof Badge>[0]['tone']> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'accent',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'neutral',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={ORDER_TONE[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone = status === 'paid' ? 'success' : status === 'failed' ? 'danger' : status === 'refunded' ? 'neutral' : 'warning'
  return <Badge tone={tone}>{PAYMENT_STATUS_LABEL[status]}</Badge>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-[16px] font-medium">{title}</p>
      <p className="max-w-sm text-[14px] text-ink-2">{description}</p>
      {action}
    </div>
  )
}
