import 'server-only'
import type { StoreRepository } from './repository'
import { LocalRepository } from './local-repository'
import { SupabaseRepository } from './supabase-repository'

declare global {
  // Survives dev hot reloads so the local JSON cache is not re-read on every edit
  var __monoRepository: StoreRepository | undefined
}

export function getRepository(): StoreRepository {
  if (!globalThis.__monoRepository) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    globalThis.__monoRepository = url && key ? new SupabaseRepository(url, key) : new LocalRepository()
  }
  return globalThis.__monoRepository
}

export type { StoreRepository } from './repository'
