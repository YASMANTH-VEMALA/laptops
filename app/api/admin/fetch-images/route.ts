/**
 * Admin API: Fetch and update laptop images from Rainforest
 *
 * Protected by x-admin-key header
 * Usage: curl -X POST http://localhost:3000/api/admin/fetch-images \
 *          -H "x-admin-key: $CACHE_ADMIN_KEY"
 *
 * This endpoint:
 * 1. Fetches all active laptops
 * 2. For each without an image, searches Rainforest
 * 3. Extracts image URL from first result
 * 4. Updates the database
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const RAINFOREST_API = 'https://api.rainforestapi.com/request'

interface RainforestProduct {
  image?: string
}

async function fetchFromRainforest(
  query: string,
  apiKey: string
): Promise<RainforestProduct[]> {
  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'search',
    amazon_domain: 'amazon.in',
    search_term: query,
  })

  try {
    const response = await fetch(`${RAINFOREST_API}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.warn(`[fetch-images] Rainforest returned ${response.status} for: ${query}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data.search_results) ? data.search_results : []
  } catch (err) {
    console.warn(`[fetch-images] Rainforest fetch failed for "${query}":`, err)
    return []
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.CACHE_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rainforestKey = process.env.RAINFOREST_API_KEY
  if (!rainforestKey) {
    return NextResponse.json(
      { error: 'RAINFOREST_API_KEY not configured' },
      { status: 500 }
    )
  }

  const startTime = Date.now()
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    stats: {
      total_laptops: 0,
      without_images: 0,
      found: 0,
      updated: 0,
      errors: 0,
    },
    details: [] as Array<{
      id: string
      name: string
      status: 'updated' | 'skipped' | 'error'
      image_url?: string
      error?: string
    }>,
  }

  try {
    const supabase = getServiceClient()

    // Fetch all active laptops
    const { data: laptops, error: fetchError } = await supabase
      .from('laptops')
      .select('id, name, brand, image_url')
      .eq('is_active', true)
      .order('brand', { ascending: true })

    if (fetchError || !laptops) {
      return NextResponse.json(
        { error: `Failed to fetch laptops: ${fetchError?.message}` },
        { status: 500 }
      )
    }

    results.stats.total_laptops = laptops.length
    const needsImage = laptops.filter(l => !l.image_url)
    results.stats.without_images = needsImage.length

    console.log(`[fetch-images] Starting: ${needsImage.length}/${laptops.length} laptops need images`)

    // Fetch images for each laptop
    for (const laptop of needsImage) {
      const searchQuery = `${laptop.brand} ${laptop.name}`
      console.log(`[fetch-images] Searching: "${searchQuery}"`)

      const rainforestResults = await fetchFromRainforest(searchQuery, rainforestKey)
      const firstWithImage = rainforestResults.find(r => r.image)

      if (firstWithImage?.image) {
        console.log(`[fetch-images] Found image for ${laptop.name}`)

        const { error: updateError } = await supabase
          .from('laptops')
          .update({ image_url: firstWithImage.image })
          .eq('id', laptop.id)

        if (updateError) {
          console.error(`[fetch-images] Update failed for ${laptop.id}:`, updateError)
          results.details.push({
            id: laptop.id,
            name: laptop.name,
            status: 'error',
            error: updateError.message,
          })
          results.stats.errors++
        } else {
          results.details.push({
            id: laptop.id,
            name: laptop.name,
            status: 'updated',
            image_url: firstWithImage.image,
          })
          results.stats.updated++
          results.stats.found++
        }
      } else {
        console.log(`[fetch-images] No image found for ${laptop.name}`)
        results.details.push({
          id: laptop.id,
          name: laptop.name,
          status: 'skipped',
        })
      }

      // Rate limiting: 1.5s between requests
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    const duration = Date.now() - startTime
    console.log(
      `[fetch-images] Complete in ${duration}ms. Updated: ${results.stats.updated}, Skipped: ${results.stats.without_images - results.stats.updated - results.stats.errors}`
    )

    return NextResponse.json({
      ...results,
      duration_ms: duration,
    })
  } catch (err) {
    console.error('[fetch-images] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
