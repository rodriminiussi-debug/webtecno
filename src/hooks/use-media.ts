'use client'

import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

let webglSupport: boolean | null = null

function detectWebGL() {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    webglSupport = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch (error) {
    console.warn('detectWebGL failed', { error })
    webglSupport = false
  }
  return webglSupport
}

/** null during SSR/hydration, then true/false. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore(
    () => () => {},
    () => detectWebGL(),
    () => null,
  )
}
