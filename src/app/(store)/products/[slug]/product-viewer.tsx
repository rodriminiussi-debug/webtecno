'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useWebGLSupport, usePrefersReducedMotion } from '@/hooks/use-media'
import { Button } from '@/components/ui/button'

const AirpodsViewer = dynamic(() => import('@/features/hero/airpods-viewer'), { ssr: false })

/** Interactive 360° viewer. Loads three.js only once the section approaches the viewport. */
export function ProductViewer({ name }: { name: string }) {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  const [open, setOpen] = useState(true)
  const webgl = useWebGLSupport()
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setNear(true)
        observer.disconnect()
      }
    }, { rootMargin: '400px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (webgl === false) return null

  return (
    <section ref={ref} className="bg-[#0a0a0b] text-white" data-header-theme="dark" aria-label={`Vista 360° de ${name}`}>
      <div className="container-mono grid gap-6 pt-20 md:grid-cols-12 md:pt-28">
        <div className="md:col-span-6">
          <p className="label-mono mb-4 text-white/55">Vista 360°</p>
          <h2 className="text-title font-semibold">Miralo desde todos los ángulos.</h2>
        </div>
        <div className="flex items-end gap-3 md:col-span-6 md:justify-end">
          <p className="label-mono text-white/45">Arrastrá para girar</p>
          <Button variant="inverse-outline" size="sm" onClick={() => setOpen((value) => !value)} aria-pressed={open}>
            {open ? 'Cerrar estuche' : 'Abrir estuche'}
          </Button>
        </div>
      </div>
      <div className="relative h-[70svh] min-h-[420px] touch-pan-y">{near && <AirpodsViewer open={open} autoRotate={!reducedMotion} />}</div>
    </section>
  )
}
