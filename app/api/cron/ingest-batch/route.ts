import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { GoogleGenAI } from '@google/genai'

// Search queries designed to find new/trending laptop models in India
const DISCOVERY_QUERIES = [
  'latest laptops launched in India 2026',
  'new laptop launch India Amazon',
  'best gaming laptop launch India 2026',
]

interface CandidateProduct {
  title: string
  brand: string | null
  price: number | null
  rating: number | null
  reviews_count: number
  link: string | null
  thumbnail: string | null
}

async function fetchDiscoveryProducts(query: string): Promise<CandidateProduct[]> {
  const apiKey = process.env.SERPAPI_KEY
  if (!apiKey) {
    console.error('[cron/ingest-batch] SERPAPI_KEY not configured')
    return []
  }

  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    gl: 'in',
    hl: 'en',
    location: 'India',
    api_key: apiKey,
    num: '15',
  })

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`,
      { signal: AbortSignal.timeout(12000) }
    )

    if (!response.ok) {
      console.error(`[cron/ingest-batch] SerpAPI error for query "${query}":`, response.status)
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data.shopping_results)) {
      return []
    }

    return data.shopping_results.map((item: any) => {
      const priceStr = item.price || ''
      const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
      return {
        title: item.title || '',
        brand: item.brand || null,
        price: isNaN(priceNum) ? null : priceNum,
        rating: item.rating ? parseFloat(item.rating) : null,
        reviews_count: item.reviews ? parseInt(item.reviews) : 0,
        link: item.link || null,
        thumbnail: item.image || null,
      }
    })
  } catch (err) {
    console.error(`[cron/ingest-batch] SerpAPI fetch failed for "${query}":`, err)
    return []
  }
}

export async function GET(req: NextRequest) {
  // Authorization check (Vercel Cron Secret or Admin Key)
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.get('authorization')
    const adminKeyHeader = req.headers.get('x-admin-key')

    const isCronAuthed = auth === `Bearer ${process.env.CRON_SECRET}`
    const isAdminAuthed = adminKeyHeader === process.env.ADMIN_KEY && !!process.env.ADMIN_KEY

    if (!isCronAuthed && !isAdminAuthed) {
      console.warn('[cron/ingest-batch] Unauthorized request attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const startTime = Date.now()
  const supabase = getServiceClient()
  let addedLaptops: string[] = []
  let totalQueriesRun = 0
  let totalCandidatesFound = 0

  try {
    // 1. Fetch existing laptops in database to avoid duplicate additions
    const { data: existing, error: dbError } = await supabase
      .from('laptops')
      .select('name, brand, slug')

    if (dbError) {
      throw new Error(`Failed to fetch existing laptops: ${dbError.message}`)
    }

    const existingLaptops = (existing || []).map((l: any) => ({
      name: l.name,
      brand: l.brand,
      slug: l.slug,
    }))

    // 2. Fetch candidates from SerpAPI Google Shopping
    const candidatesMap = new Map<string, CandidateProduct>()
    for (const query of DISCOVERY_QUERIES) {
      totalQueriesRun++
      const results = await fetchDiscoveryProducts(query)
      results.forEach((item) => {
        if (item.title && item.link && item.price) {
          // Dedupe by link
          candidatesMap.set(item.link, item)
        }
      })
      // Small pause to be gentle on API rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const candidates = Array.from(candidatesMap.values())
    totalCandidatesFound = candidates.length

    // 3. Prompt Gemini to identify or generate best NEW laptops and structure them
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const isFallbackMode = candidates.length === 0

    let prompt = ''
    if (!isFallbackMode) {
      prompt = `You are a database discovery assistant for Laptick.in (India's premier laptop recommender).

Here is a list of candidate laptops crawled from Google Shopping:
${JSON.stringify(candidates.slice(0, 35))}

Here is a list of laptops already present in our database to avoid duplicates:
${JSON.stringify(existingLaptops)}

Task:
Identify 4 to 6 best laptops from the candidate list that are NOT already in our database (do not add minor variations of existing laptops, only add the absolute best new models or significantly better variants, prioritizing the highest value and performance).
For each selected laptop, parse and generate complete, highly accurate specifications to fit our database schema. Since some specs might not be fully described in the shopping titles, use your deep general knowledge of the specified model (e.g. Asus ROG Strix 2026, Dell Inspiron 14 2026, MacBook Air M4, etc.) to estimate or fill in missing fields (like CPU model, GPU TGP, weight, battery capacity, display type, color gamut, pros, cons, and use cases).
`
    } else {
      prompt = `You are a database discovery assistant for Laptick.in (India's premier laptop recommender).
Since the online marketplace crawler is currently unavailable or returning no data, you must search the live internet using your search tool (Google Search Grounding) to find the latest laptop models.

Here is a list of laptops already present in our database to avoid duplicates:
${JSON.stringify(existingLaptops)}

Task:
1. Search the web for the latest or trending laptop models in the Indian market (launched recently or popular in 2026).
2. Generate 4 to 6 of the best laptops that are NOT already in our database (prioritizing high-value, popularity, performance, and newer models).
3. Use Google Search to find their exact specifications, pricing in INR, CPU, GPU, RAM, screen details, pros, cons, and mock or real Amazon affiliate link with tag netha-21.
`
    }

    prompt += `
Return the output as a strict JSON array of objects matching the database columns:
{
  "name": string (full laptop model name, e.g. "Acer Swift Go 14 OLED"),
  "brand": string (e.g. "Acer", "HP", "Dell", "Lenovo", "Asus", "Apple", "MSI", "Razer"),
  "slug": string (URL-safe slug, e.g. "acer-swift-go-14-oled"),
  "price_inr": number (integer price in INR, e.g. 74990),
  "cpu_arch": "x86" | "ARM",
  "cpu_brand": "Intel" | "AMD" | "Apple" | "Qualcomm",
  "cpu_series": "U" | "P" | "H" | "HX" | "M-series" | "X-series",
  "cpu_model": string (exact cpu model name, e.g. "Core Ultra 7 155H"),
  "gpu_type": "integrated" | "dedicated",
  "gpu_model": string (e.g. "Intel Arc Graphics" or "RTX 4050"),
  "gpu_tgp_watts": number (integer, if integrated put 0),
  "ram_gb": number (integer, e.g. 16),
  "ram_type": "LPDDR5X" | "LPDDR5" | "DDR5" | "DDR4",
  "storage_gb": number (integer, e.g. 512 or 1024),
  "storage_type": "NVMe" | "SATA",
  "display_size": number (float, e.g. 14.0 or 15.6),
  "display_type": "IPS" | "OLED" | "Mini-LED" | "TN" | "AMOLED",
  "display_hz": number (integer, e.g. 60 or 120),
  "display_nits": number (integer, e.g. 300 or 400),
  "display_color_gamut": number | null (percentage of sRGB/DCI-P3, e.g. 100 or 45 or null),
  "battery_wh": number (integer, e.g. 57 or 75),
  "weight_kg": number (float, e.g. 1.32 or 2.1),
  "os_support": "Windows" | "macOS" | "Linux" | "any",
  "best_for": string[] (array of tags selected from: ["video-editing", "programming", "gaming", "general", "business", "ai-ml", "design", "content", "students"]),
  "pros": string (comma-separated list or short phrase summarizing strengths, e.g. "Vibrant OLED display, light weight, long battery life"),
  "cons": string (summarizing weaknesses, e.g. "Soldered RAM, no dedicated GPU"),
  "affiliate_amazon_in": string (generate a mock or real Amazon.in affiliate link containing the tag netha-21, e.g. "https://www.amazon.in/dp/B0D5D8XXXX/?tag=netha-21"),
  "is_active": boolean (true)
}

Provide ONLY the raw JSON array. Do not wrap the JSON in markdown blocks (e.g. no \`\`\`json).`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        tools: isFallbackMode ? [{ googleSearch: {} }] : undefined,
      },
    })

    const newLaptops = JSON.parse(response.text || '[]')
    if (Array.isArray(newLaptops) && newLaptops.length > 0) {
      // Validate object structure
      const validLaptops = newLaptops.filter((l) => {
        return (
          l.name &&
          l.brand &&
          l.slug &&
          l.price_inr &&
          l.cpu_arch &&
          l.cpu_brand &&
          l.cpu_series &&
          l.cpu_model &&
          l.gpu_type &&
          l.gpu_model &&
          typeof l.gpu_tgp_watts === 'number' &&
          l.ram_gb &&
          l.ram_type &&
          l.storage_gb &&
          l.storage_type &&
          l.display_size &&
          l.display_type &&
          l.display_hz &&
          l.display_nits &&
          l.battery_wh &&
          l.weight_kg &&
          l.os_support &&
          Array.isArray(l.best_for) &&
          l.pros &&
          l.cons &&
          l.affiliate_amazon_in
        )
      })

      if (validLaptops.length > 0) {
        // Upsert to database to avoid crashing on duplicate slug
        const { error: insertError } = await supabase
          .from('laptops')
          .upsert(validLaptops, { onConflict: 'slug' })

        if (insertError) {
          throw new Error(`Failed to insert discovered laptops: ${insertError.message}`)
        }

        addedLaptops = validLaptops.map((l: any) => l.name)
      }
    }

    const duration = Date.now() - startTime
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      stats: {
        queries_run: totalQueriesRun,
        candidates_found: totalCandidatesFound,
        new_laptops_added_count: addedLaptops.length,
        new_laptops_added: addedLaptops,
      },
    })
  } catch (err) {
    console.error('[cron/ingest-batch] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
