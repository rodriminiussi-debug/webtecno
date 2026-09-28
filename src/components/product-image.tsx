import Image from 'next/image'
import { cn } from '@/lib/cn'

/**
 * SVG renders are served as-is (they are vector and tiny); raster uploads go
 * through next/image for responsive AVIF/WebP.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string | null | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}) {
  if (!src) {
    return (
      <div className={cn('flex size-full items-center justify-center', className)} role="img" aria-label={alt}>
        <span className="label-mono text-muted">Sin imagen</span>
      </div>
    )
  }
  if (src.endsWith('.svg')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- vector renders gain nothing from the image optimizer
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('size-full object-contain', className)}
      />
    )
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn('object-contain', className)} />
}
