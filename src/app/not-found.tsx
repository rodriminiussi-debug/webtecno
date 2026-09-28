import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="container-mono flex min-h-svh flex-col items-start justify-center gap-8 py-24">
      <p className="label-mono text-muted">Error 404</p>
      <h1 className="text-[clamp(3.5rem,10vw,9rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
        Esta página
        <br />
        no existe.
      </h1>
      <p className="max-w-md text-lead text-ink-2">Puede que el producto ya no esté disponible o que el enlace haya cambiado.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonClass({ size: 'lg' })}>
          Ir al inicio
        </Link>
        <Link href="/products" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          Ver productos
        </Link>
      </div>
    </main>
  )
}
