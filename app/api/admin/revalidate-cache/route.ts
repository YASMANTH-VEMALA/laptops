import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

/**
 * POST /api/admin/revalidate-cache
 *
 * Force-refresh a cached search by deleting its entry from search_cache.
 * On next request, it will be re-fetched from SerpAPI.
 *
 * Requires: x-admin-key header matching ADMIN_KEY env var
 */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_KEY

  if (!expectedKey || !adminKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { query_hash?: string } | null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { query_hash } = body || {}
  if (!query_hash) {
    return NextResponse.json({ error: 'query_hash is required' }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('search_cache')
      .delete()
      .eq('query_hash', query_hash)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Cache for query_hash=${query_hash} cleared. Next request will re-fetch from SerpAPI.`,
      deleted_rows: (data || []).length,
    })
  } catch (err: any) {
    console.error('[/api/admin/revalidate-cache] Error:', err)
    return NextResponse.json(
      { error: 'Failed to revalidate cache' },
      { status: 500 }
    )
  }
}
