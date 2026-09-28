'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '../actions/auth'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null })
  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && (
        <p role="alert" className="text-[14px] text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
