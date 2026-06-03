import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

// Admin-only cache management — requires CACHE_ADMIN_KEY header
function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  return key === process.env.CACHE_ADMIN_KEY && !!process.env.CACHE_ADMIN_KEY
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? 'expired'

  const supabase = getServiceClient()

  if (mode === 'all') {
    const { error, data } = await supabase
      .from('recommendation_cache')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select('id')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: data?.length ?? 0, mode: 'all' })
  }

  // Default: delete only expired entries
  const { error, data } = await supabase
    .from('recommendation_cache')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: data?.length ?? 0, mode: 'expired' })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  const [cacheResult, explResult] = await Promise.all([
    supabase.from('recommendation_cache').select('id, created_at, expires_at', { count: 'exact' }),
    supabase.from('laptop_explanations').select('id', { count: 'exact', head: true }),
  ])

  const now = new Date().toISOString()
  const active = cacheResult.data?.filter((r: {expires_at: string}) => r.expires_at > now).length ?? 0
  const expired = (cacheResult.count ?? 0) - active

  return NextResponse.json({
    recommendation_cache: { total: cacheResult.count, active, expired },
    laptop_explanations: { total: explResult.count },
  })
}
