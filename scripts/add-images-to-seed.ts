/**
 * Generate a new seed file with image URLs for all laptops
 *
 * Usage: npx ts-node scripts/add-images-to-seed.ts
 *
 * This script:
 * 1. Reads the current seed file
 * 2. For each laptop, fetches image from Rainforest API
 * 3. Generates a new seed file with image_url values populated
 */

import * as fs from 'fs'
import * as path from 'path'

const RAINFOREST_API = 'https://api.rainforestapi.com/request'
const SEED_FILE = 'db-seed-31-laptops-final.sql'

interface RainforestProduct {
  image?: string
  title?: string
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
      console.warn(`[add-images] Rainforest returned ${response.status} for: ${query}`)
      return []
    }

    const data = await response.json()
    return Array.isArray(data.search_results) ? data.search_results : []
  } catch (err) {
    console.warn(`[add-images] Rainforest fetch failed for "${query}":`, err)
    return []
  }
}

// Parse laptop entries from SQL INSERT statement
function parseLaptopsFromSQL(sqlContent: string): Array<{
  name: string
  brand: string
}> {
  const laptops: Array<{ name: string; brand: string }> = []

  // Match each VALUES line: ('Name', 'Brand', ...)
  const regex =
    /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*'([^']+)',\s*(\d+),\s*'([^']+)',\s*([^,]+),\s*'([^']+)',\s*(\d+),\s*(\d+),\s*([^,]+),\s*(\d+),\s*([^,]+),\s*'([^']+)',\s*ARRAY\[([^\]]+)\],\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g

  let match
  while ((match = regex.exec(sqlContent)) !== null) {
    laptops.push({
      name: match[1],
      brand: match[2],
    })
  }

  return laptops
}

async function main() {
  const rainforestKey = process.env.RAINFOREST_API_KEY
  if (!rainforestKey) {
    console.error('❌ RAINFOREST_API_KEY not set')
    process.exit(1)
  }

  console.log('📸 Fetching images for all seed laptops...\n')

  // Read seed file
  const seedPath = path.join(process.cwd(), SEED_FILE)
  const seedContent = fs.readFileSync(seedPath, 'utf-8')

  // Parse laptops
  const laptops = parseLaptopsFromSQL(seedContent)
  console.log(`Found ${laptops.length} laptops in seed file\n`)

  const imageMap = new Map<string, string>()
  let found = 0

  // Fetch images
  for (const laptop of laptops) {
    const searchQuery = `${laptop.brand} ${laptop.name}`
    console.log(`Fetching image for: "${searchQuery}"`)

    const results = await fetchFromRainforest(searchQuery, rainforestKey)
    const firstWithImage = results.find(r => r.image)

    if (firstWithImage?.image) {
      imageMap.set(laptop.name, firstWithImage.image)
      console.log(`  ✅ Found`)
      found++
    } else {
      console.log(`  ⏭️  No image found`)
    }

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log(`\n✨ Found ${found}/${laptops.length} images\n`)

  // Generate new SQL with image_url
  let newSQL = seedContent.replace(
    /INSERT INTO laptops \(name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, cpu_model, gpu_type, gpu_model, gpu_tgp_watts, ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits, display_color_gamut, battery_wh, weight_kg, os_support, best_for, pros, cons, affiliate_amazon_in\)/,
    `INSERT INTO laptops (name, brand, slug, price_inr, cpu_arch, cpu_brand, cpu_series, cpu_model, gpu_type, gpu_model, gpu_tgp_watts, ram_gb, ram_type, storage_gb, storage_type, display_size, display_type, display_hz, display_nits, display_color_gamut, battery_wh, weight_kg, os_support, best_for, pros, cons, affiliate_amazon_in, image_url)`
  )

  // Add image URLs to each VALUES line
  newSQL = newSQL.replace(
    /\(('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*\d+,\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*'[^']+',\s*\d+,\s*\d+,\s*'[^']+',\s*\d+,\s*'[^']+',\s*[^,]+,\s*'[^']+',\s*\d+,\s*\d+,\s*[^,]+,\s*\d+,\s*[^,]+,\s*'[^']+',\s*ARRAY\[[^\]]+\],\s*'[^']+',\s*'[^']+',\s*'([^']+)')\)/g,
    (match, p1, p2, p3, p4, p5) => {
      const laptopName = p2 // The name is in second capture group
      const imageUrl = imageMap.get(laptopName)
      if (imageUrl) {
        return `(${p1}, '${imageUrl}')`
      }
      return `(${p1}, NULL)`
    }
  )

  // Save new seed file
  const newFileName = 'db-seed-31-laptops-with-images.sql'
  const newPath = path.join(process.cwd(), newFileName)
  fs.writeFileSync(newPath, newSQL)

  console.log(`✅ New seed file created: ${newFileName}`)
  console.log(`\nNext steps:`)
  console.log(`1. Open Supabase dashboard`)
  console.log(`2. Go to SQL Editor`)
  console.log(`3. Paste the content of: ${newFileName}`)
  console.log(`4. Run the query`)
  console.log(`5. Visit http://localhost:3000/laptops to see images`)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
