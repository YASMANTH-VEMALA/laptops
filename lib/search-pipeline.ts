import { Redis } from '@upstash/redis'
import { normalizeAndHash } from './normalize'
import { fetchFromSerpAPI } from './serpapi'
import { rankAndSlice } from './rank'
import { ensureBlurbs } from './blurb'
import {
  getCacheHit,
  upsertProducts,
  getProductsByIds,
  setCacheHit,
  incrementCacheHitCount,
  logSearch,
  updateProductBlurbs,
} from './db'

export interface SearchResult {
  products: any[]
  cached: boolean
  fetched_at: string
}

/**
 * In-flight dedup lock (Upstash SET NX, 15s TTL)
 * Prevents concurrent identical searches from firing multiple SerpAPI calls
 */
async function acquireInFlightLock(queryHash: string): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) return true // No Redis, skip lock (dev mode)

  try {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    const key = `in-flight:${queryHash}`
    const result = await redis.set(key, '1', { ex: 15, nx: true })
    return result === 'OK'
  } catch (err) {
    console.warn('[search-pipeline] In-flight lock failed, proceeding:', err)
    return true // Fail open
  }
}

/**
 * Wait briefly for cache to populate (for concurrent callers who didn't win the lock)
 */
async function waitForCachePopulation(
  queryHash: string,
  maxWaitMs: number = 5000
): Promise<any> {
  const start = Date.now()
  const interval = 200 // Check every 200ms

  while (Date.now() - start < maxWaitMs) {
    const cached = await getCacheHit(queryHash)
    if (cached) return cached

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  return null
}

/**
 * Main search pipeline: normalize -> cache check -> fetch/rank/store -> return
 */
export async function searchPipeline(
  rawQuery: string,
  sessionId: string,
  ipAddress: string
): Promise<SearchResult> {
  // 1. Normalize and hash
  const { normalized, hash } = normalizeAndHash(rawQuery)

  // 2. Check cache
  const cached = await getCacheHit(hash)

  if (cached) {
    // Cache HIT
    await incrementCacheHitCount(hash)
    await logSearch(rawQuery, normalized, hash, true, sessionId, ipAddress)

    const products = await getProductsByIds(cached.result_product_ids)
    return {
      products,
      cached: true,
      fetched_at: cached.fetched_at,
    }
  }

  // 3. Attempt in-flight lock (prevent duplicate SerpAPI calls)
  const acquiredLock = await acquireInFlightLock(hash)

  if (!acquiredLock) {
    // Another request is fetching, wait for cache population
    console.log('[search-pipeline] Waiting for concurrent fetch...')
    const cachedAfterWait = await waitForCachePopulation(hash)

    if (cachedAfterWait) {
      const products = await getProductsByIds(cachedAfterWait.result_product_ids)
      await logSearch(rawQuery, normalized, hash, true, sessionId, ipAddress)
      return {
        products,
        cached: true,
        fetched_at: cachedAfterWait.fetched_at,
      }
    }
  }

  // 4. MISS — Fetch from SerpAPI
  console.log('[search-pipeline] Cache MISS, fetching from SerpAPI...')

  const serpResults = await fetchFromSerpAPI(normalized)
  const enrichedResults = serpResults.map((p) => ({
    ...p,
    use_case_tags: [normalized.use_case],
  }))

  // 5. Upsert products into DB
  const productIds = await upsertProducts(enrichedResults)

  // 6. Rank by score
  const productsWithMeta = enrichedResults.map((p, i) => ({
    id: productIds[i],
    price: p.price,
    rating: p.rating,
    reviews_count: p.reviews_count,
  }))

  const rankedIds = rankAndSlice(productsWithMeta, normalized.budget_max, 5)

  // 7. Store search cache (permanent)
  await setCacheHit(hash, normalized, rawQuery, rankedIds)

  // 8. Fetch products with full details
  const products = await getProductsByIds(rankedIds)

  // 9. Ensure blurbs (generate missing why_text)
  const blurbs = await ensureBlurbs(products)
  await updateProductBlurbs(blurbs)

  // 10. Log the search
  await logSearch(rawQuery, normalized, hash, false, sessionId, ipAddress)

  // 11. Fetch again to include updated blurbs
  const finalProducts = await getProductsByIds(rankedIds)

  return {
    products: finalProducts,
    cached: false,
    fetched_at: new Date().toISOString(),
  }
}
