'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** True only on the client after hydration. Used for state that lives in localStorage. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
