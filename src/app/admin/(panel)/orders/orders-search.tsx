'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { adminInput } from '@/components/admin/form'
import { SearchIcon } from '@/components/icons'

export function OrdersSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState(defaultValue)
  return (
    <form
      role="search"
      className="relative w-full sm:w-72"
      onSubmit={(event) => {
        event.preventDefault()
        const next = new URLSearchParams(params.toString())
        if (value.trim()) next.set('q', value.trim())
        else next.delete('q')
        router.replace(`${pathname}?${next.toString()}`)
      }}
    >
      <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input className={`${adminInput} pl-9`} placeholder="Número, cliente o email" value={value} onChange={(event) => setValue(event.target.value)} aria-label="Buscar pedidos" />
    </form>
  )
}
