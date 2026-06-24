import { Redis } from '@upstash/redis'
import { getServiceClient } from './supabase'
import { normalizeAndHash } from './normalize'
import { rankAndSlice } from './rank'
import {
  getCacheHit,
  getProductsByIds,
  setCacheHit,
  incrementCacheHitCount,
  logSearch,
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

  if (
    !redisUrl ||
    redisUrl.includes('your-upstash') ||
    !redisToken ||
    redisToken.includes('your-')
  ) {
    return true // No Redis, skip lock (dev mode)
  }

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

  // 4. MISS — Fetch active laptops from the database directly
  console.log('[search-pipeline] Cache MISS, fetching from database (laptops)...')

  const supabase = getServiceClient()
  const { data: allLaptops, error: fetchErr } = await supabase
    .from('laptops')
    .select('*')
    .eq('is_active', true)

  if (fetchErr) {
    console.error('[search-pipeline] Failed to fetch laptops from DB:', fetchErr)
    throw fetchErr
  }

  let filtered = allLaptops || []

  // Filter by OS support
  if (normalized.os) {
    const osLower = normalized.os.toLowerCase()
    if (osLower === 'macos') {
      filtered = filtered.filter(l => l.os_support?.toLowerCase() === 'macos')
    } else if (osLower === 'windows') {
      filtered = filtered.filter(l => l.os_support?.toLowerCase() === 'windows')
    }
  }

  // Filter by Brand
  if (normalized.brand) {
    const brandLower = normalized.brand.toLowerCase()
    filtered = filtered.filter(l => l.brand?.toLowerCase() === brandLower)
  }

  // Filter by Budget
  if (normalized.budget_max) {
    const strictFiltered = filtered.filter(l => l.price_inr <= normalized.budget_max!)
    // Soft fallback: if strict budget filter yields 0 matches, fallback to full list
    if (strictFiltered.length > 0) {
      filtered = strictFiltered
    }
  }

  // Filter by Use Case (mapping use_case to best_for array tags)
  if (normalized.use_case) {
    const useCaseMap: Record<string, string[]> = {
      gaming: ['gaming'],
      coding: ['programming'],
      student: ['general', 'programming', 'students'],
      editing: ['video-editing', 'design', 'content'],
      business: ['business'],
      general: ['general']
    }
    const targetTags = useCaseMap[normalized.use_case] || ['general']
    const useCaseFiltered = filtered.filter(l => 
      l.best_for?.some((tag: string) => targetTags.includes(tag.toLowerCase()))
    )
    if (useCaseFiltered.length >= 3) {
      filtered = useCaseFiltered
    }
  }

  // Map filtered laptops to mock specs score for rankAndSlice
  const productsWithMeta = filtered.map((l) => {
    let rating = 4.2
    let reviews_count = 50
    if (l.cpu_series === 'HX' || l.cpu_series === 'H') {
      rating += 0.3
      reviews_count += 80
    }
    if (l.gpu_type === 'dedicated') {
      rating += 0.2
      reviews_count += 60
    }
    if (l.ram_gb >= 16) {
      rating += 0.2
    }
    if (l.display_type === 'OLED') {
      rating += 0.1
    }
    rating = Math.min(5.0, rating)

    return {
      id: l.id,
      price: l.price_inr,
      rating,
      reviews_count,
    }
  })

  // Rank and slice top 5
  const rankedIds = rankAndSlice(productsWithMeta, normalized.budget_max, 5)

  // Store cache hit mapping
  await setCacheHit(hash, normalized, rawQuery, rankedIds)

  // Fetch mapped products by their ranked laptop IDs
  const finalProducts = await getProductsByIds(rankedIds)

  // Log search analytics
  await logSearch(rawQuery, normalized, hash, false, sessionId, ipAddress)

  return {
    products: finalProducts,
    cached: false,
    fetched_at: new Date().toISOString(),
  }
}
