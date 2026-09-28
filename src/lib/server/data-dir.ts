import 'server-only'
import path from 'node:path'

// Vercel's filesystem is read-only except /tmp. Local mode there is only a
// throwaway demo: production deployments should configure Supabase.
export function getDataDir() {
  if (process.env.MONO_DATA_DIR) return process.env.MONO_DATA_DIR
  if (process.env.VERCEL) return '/tmp/mono-data'
  return path.join(process.cwd(), '.data')
}
