'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/hooks/use-media'
import { cn } from '@/lib/cn'

/**
 * Apple's pattern for product highlights: the clip plays once when it is well into
 * view and rests on its last frame; a small button replays it.
 */
export function AutoplayVideo({ src, poster, className, label }: { src: string; poster: string | null; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video || reducedMotion) return
    let played = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || played) return
        played = true
        video.play().catch(() => {
          // Autoplay refused (data saver, low power): the poster stays, the replay button still works
          setEnded(true)
        })
      },
      { threshold: 0.6 },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [reducedMotion])

  const replay = () => {
    const video = ref.current
    if (!video) return
    video.currentTime = 0
    setEnded(false)
    void video.play().catch(() => setEnded(true))
  }

  return (
    <div className={cn('relative', className)}>
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        muted
        playsInline
        preload="metadata"
        aria-label={label}
        onEnded={() => setEnded(true)}
        className="size-full object-cover"
      />
      {ended && (
        <button
          type="button"
          onClick={replay}
          className="absolute bottom-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
          aria-label={`Reproducir de nuevo: ${label}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <path d="M3 3v6h6" />
          </svg>
        </button>
      )}
    </div>
  )
}
