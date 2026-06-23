/**
 * Admin API: Fetch and update images for ALL laptops without images
 *
 * Protected by x-admin-key header
 * Usage: curl -X POST http://localhost:3000/api/admin/update-laptop-images \
 *          -H "x-admin-key: $CACHE_ADMIN_KEY"
 *
 * This searches Rainforest API for each laptop and updates image_url
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

const RAINFOREST_API = 'https://api.rainforestapi.com/request'

interface RainforestProduct {
  image?: string
}

async function fetchImageFromRainforest(
  laptopName: string,
  apiKey: string
): Promise<string | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'search',
    amazon_domain: 'amazon.in',
    search_term: laptopName,
  })

  try {
    const response = await fetch(`${RAINFOREST_API}?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.warn(`[update-images] Rainforest returned ${response.status}`)
      return null
    }

    const data = await response.json()
    const results = Array.isArray(data.search_results) ? data.search_results : []
    const firstWithImage = results.find((r: RainforestProduct) => r.image)

    return firstWithImage?.image ?? null
  } catch (err) {
    console.warn(`[update-images] Rainforest fetch failed:`, err)
    return null
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
      total: 0,
      without_images: 0,
      updated: 0,
      skipped: 0,
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

    // Fetch all laptops
    const { data: allLaptops, error: fetchError } = await supabase
      .from('laptops')
      .select('id, name, brand, image_url, slug')
      .eq('is_active', true)
      .order('brand', { ascending: true })

    if (fetchError || !allLaptops) {
      return NextResponse.json(
        { error: `Failed to fetch laptops: ${fetchError?.message}` },
        { status: 500 }
      )
    }

    results.stats.total = allLaptops.length

    // Filter laptops without images
    const needsImage = allLaptops.filter(l => !l.image_url)
    results.stats.without_images = needsImage.length

    console.log(`[update-images] Fetching images for ${needsImage.length}/${allLaptops.length} laptops`)

    // Fetch and update images
    for (const laptop of needsImage) {
      const searchQuery = `${laptop.brand} ${laptop.name}`
      console.log(`[update-images] Searching: "${searchQuery}"`)

      const imageUrl = await fetchImageFromRainforest(searchQuery, rainforestKey)

      if (imageUrl) {
        console.log(`[update-images] Found image for ${laptop.name}`)

        const { error: updateError } = await supabase
          .from('laptops')
          .update({ image_url: imageUrl })
          .eq('id', laptop.id)

        if (updateError) {
          console.error(`[update-images] Update failed for ${laptop.id}:`, updateError)
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
            image_url: imageUrl,
          })
          results.stats.updated++
        }
      } else {
        console.log(`[update-images] No image found for ${laptop.name}`)
        results.details.push({
          id: laptop.id,
          name: laptop.name,
          status: 'skipped',
        })
        results.stats.skipped++
      }

      // Rate limit: 1.5s between requests
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    const duration = Date.now() - startTime
    console.log(`[update-images] Complete in ${duration}ms. Updated: ${results.stats.updated}`)

    return NextResponse.json({
      ...results,
      duration_ms: duration,
    })
  } catch (err) {
    console.error('[update-images] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
