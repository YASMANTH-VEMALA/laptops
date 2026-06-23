import { getServiceClient } from './supabase'
import type { NormalizedQuery } from './normalize'
import type { ParsedProduct } from './serpapi'
import type { ProductBlurb } from './blurb'

/**
 * Fetch search cache hit
 */
export async function getCacheHit(queryHash: string) {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('search_cache')
    .select('result_product_ids, normalized_query, fetched_at, hit_count')
    .eq('query_hash', queryHash)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // No rows
    throw error
  }

  return data
}

/**
 * Upsert products into the products table
 * On conflict (source, source_product_id), update price/rating/reviews_count/last_updated_at
 */
export async function upsertProducts(
  products: Array<ParsedProduct & { use_case_tags?: string[] }>
) {
  if (products.length === 0) return []

  const supabase = getServiceClient()

  const rows = products.map((p) => ({
    source: 'google_shopping',
    source_product_id: p.source_product_id,
    title: p.title,
    brand: p.brand,
    price: p.price,
    rating: p.rating,
    reviews_count: p.reviews_count,
    image_url: p.image_url,
    product_url: p.product_url,
    specs: p.specs,
    use_case_tags: p.use_case_tags || [],
    last_updated_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'source,source_product_id' })
    .select('id')

  if (error) {
    console.error('[db.ts] upsertProducts failed:', error)
    throw error
  }

  return (data || []).map((row: any) => row.id)
}

/**
 * Fetch products by IDs
 */
export async function getProductsByIds(ids: string[]) {
  if (ids.length === 0) return []

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('[db.ts] getProductsByIds failed:', error)
    throw error
  }

  return data || []
}

/**
 * Store search cache (permanent)
 */
export async function setCacheHit(
  queryHash: string,
  normalized: NormalizedQuery,
  rawQuery: string,
  resultProductIds: string[]
) {
  const supabase = getServiceClient()

  const { error } = await supabase
    .from('search_cache')
    .upsert(
      {
        query_hash: queryHash,
        normalized_query: normalized,
        raw_query_text: rawQuery,
        result_product_ids: resultProductIds,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'query_hash' }
    )

  if (error) {
    console.error('[db.ts] setCacheHit failed:', error)
    // Don't throw, cache write failure shouldn't break the request
  }
}

/**
 * Increment cache hit counter
 */
export async function incrementCacheHitCount(queryHash: string) {
  const supabase = getServiceClient()

  const { error } = await supabase.rpc('increment_cache_hit_count', {
    query_hash_arg: queryHash,
  })

  if (error) {
    console.warn('[db.ts] incrementCacheHitCount failed (non-critical):', error)
  }
}

/**
 * Log a search query
 */
export async function logSearch(
  rawQuery: string,
  normalized: NormalizedQuery,
  queryHash: string,
  cacheHit: boolean,
  sessionId: string,
  ipAddress: string
) {
  const supabase = getServiceClient()

  const { error } = await supabase.from('search_log').insert({
    raw_query: rawQuery,
    normalized_query: normalized,
    query_hash: queryHash,
    cache_hit: cacheHit,
    session_id: sessionId,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.warn('[db.ts] logSearch failed (non-critical):', error)
  }
}

/**
 * Update product blurbs (why_text)
 */
export async function updateProductBlurbs(blurbs: ProductBlurb[]) {
  if (blurbs.length === 0) return

  const supabase = getServiceClient()

  const updates = blurbs.map((b) => ({
    id: b.product_id,
    why_text: b.why_text,
    last_updated_at: new Date().toISOString(),
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('products')
      .update({ why_text: update.why_text, last_updated_at: update.last_updated_at })
      .eq('id', update.id)

    if (error) {
      console.error('[db.ts] updateProductBlurbs failed for', update.id, error)
    }
  }
}

/**
 * Helper: Create or update an RPC function to increment cache hit count
 * Run this once to set up the RPC, or add to migration
 */
export const incrementCacheHitCountRPC = `
CREATE OR REPLACE FUNCTION increment_cache_hit_count(query_hash_arg text)
RETURNS void AS $$
BEGIN
  UPDATE search_cache
  SET hit_count = hit_count + 1
  WHERE query_hash = query_hash_arg;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`
