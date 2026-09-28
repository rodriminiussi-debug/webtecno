'use client'

import { useActionState, useId } from 'react'
import { subscribe, type NewsletterState } from '@/app/actions/newsletter'
import { ArrowRightIcon, CheckIcon } from '@/components/icons'
import { cn } from '@/lib/cn'

const initial: NewsletterState = { status: 'idle', message: '' }

export function NewsletterForm({ placeholder, ctaLabel, note }: { placeholder: string; ctaLabel: string; note: string }) {
  const [state, action, pending] = useActionState(subscribe, initial)
  const id = useId()
  if (state.status === 'success') {
    return (
      <p className="flex items-center gap-3 border-b border-ink pb-4 text-[19px] font-medium tracking-[-0.02em]" role="status">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-ink text-paper">
          <CheckIcon size={16} />
        </span>
        {state.message}
      </p>
    )
  }
  return (
    <form action={action} noValidate>
      <label htmlFor={id} className="sr-only">
        Email
      </label>
      <div className={cn('flex items-center gap-4 border-b pb-3 transition-colors focus-within:border-ink', state.status === 'error' ? 'border-danger' : 'border-line-strong')}>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={placeholder}
          aria-invalid={state.status === 'error'}
          aria-describedby={`${id}-msg`}
          className="min-w-0 flex-1 bg-transparent py-2 text-[20px] tracking-[-0.02em] placeholder:text-muted focus:outline-none md:text-[24px]"
        />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button type="submit" disabled={pending} className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-medium text-paper disabled:opacity-50">
          {pending ? 'Enviando…' : ctaLabel}
          <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <p id={`${id}-msg`} className={cn('mt-3 text-[13px]', state.status === 'error' ? 'text-danger' : 'text-muted')} role={state.status === 'error' ? 'alert' : undefined}>
        {state.status === 'error' ? state.message : note}
      </p>
    </form>
  )
}
