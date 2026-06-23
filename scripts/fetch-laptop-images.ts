/**
 * Fetch and update laptop images from Rainforest API
 *
 * Usage: npx ts-node scripts/fetch-laptop-images.ts
 *
 * This script:
 * 1. Fetches all laptops from Supabase
 * 2. For each laptop without an image, searches Rainforest API
 * 3. Extracts the image URL from the first result
 * 4. Updates the database
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const rainforestKey = process.env.RAINFOREST_API_KEY!

if (!supabaseUrl || !supabaseKey || !rainforestKey) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAINFOREST_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Laptop {
  id: string
  name: string
  brand: string
  image_url: string | null
}

interface RainforestProduct {
  image?: string
  title?: string
  price?: number
}

async function fetchFromRainforest(query: string): Promise<RainforestProduct[]> {
  const params = new URLSearchParams({
    api_key: rainforestKey,
    type: 'search',
    amazon_domain: 'amazon.in',
    search_term: query,
  })

  try {
    const response = await fetch(`https://api.rainforestapi.com/request?${params}`, {
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.warn(`Rainforest returned ${response.status} for query: ${query}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data.search_results) ? data.search_results : []
  } catch (err) {
    console.warn(`Rainforest fetch failed for "${query}":`, err)
    return []
  }
}

async function main() {
  console.log('📸 Fetching laptop images from Rainforest API...\n')

  // Fetch all laptops
  const { data: laptops, error } = await supabase
    .from('laptops')
    .select('id, name, brand, image_url')
    .eq('is_active', true)
    .order('brand', { ascending: true })

  if (error || !laptops) {
    console.error('Failed to fetch laptops:', error)
    process.exit(1)
  }

  console.log(`Found ${laptops.length} active laptops\n`)

  const needsImage = (laptops as Laptop[]).filter(l => !l.image_url)
  console.log(`${needsImage.length} need images, ${laptops.length - needsImage.length} already have images\n`)

  let updated = 0
  let skipped = 0

  for (const laptop of needsImage) {
    const searchQuery = `${laptop.brand} ${laptop.name}`
    console.log(`Searching: "${searchQuery}"...`)

    const results = await fetchFromRainforest(searchQuery)
    const firstResult = results.find((r: RainforestProduct) => r.image)

    if (firstResult && firstResult.image) {
      console.log(`  ✅ Found image`)
      const { error: updateError } = await supabase
        .from('laptops')
        .update({ image_url: firstResult.image })
        .eq('id', laptop.id)

      if (updateError) {
        console.error(`  ❌ Failed to update: ${updateError.message}`)
      } else {
        updated++
      }
    } else {
      console.log(`  ⏭️  No image found`)
      skipped++
    }

    // Rate limiting: wait 1.5s between requests
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log(`\n✨ Done!`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Total: ${laptops.length}`)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
