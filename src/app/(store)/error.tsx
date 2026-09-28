'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Store route error', { message: error.message, digest: error.digest })
  }, [error])
  return (
    <div className="container-mono flex min-h-[70svh] flex-col items-start justify-center gap-6 pt-[var(--header-h)]">
      <p className="label-mono text-muted">Algo salió mal</p>
      <h1 className="text-title font-semibold">No pudimos cargar esta página.</h1>
      <p className="max-w-md text-[15px] text-ink-2">Puede ser un problema momentáneo de conexión. Probá de nuevo en unos segundos.</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  )
}
