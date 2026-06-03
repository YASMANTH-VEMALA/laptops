import { createClient } from '@supabase/supabase-js'

// Lazy browser-safe client (anon key — public read)
let _browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!_browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase public env vars')
    _browserClient = createClient(url, key)
  }
  return _browserClient
}

// Named export for convenience in server components (non-sensitive reads)
export const supabase = {
  from: (...args: Parameters<ReturnType<typeof createClient>['from']>) =>
    getSupabaseClient().from(...args),
  rpc: (...args: Parameters<ReturnType<typeof createClient>['rpc']>) =>
    getSupabaseClient().rpc(...args),
}

// Server-only service role client (full access, never import in client components)
export function getServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getServiceClient() must only be called server-side')
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase service role env vars')
  return createClient(url, key, { auth: { persistSession: false } })
}
