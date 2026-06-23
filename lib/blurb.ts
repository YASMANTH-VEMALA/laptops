import { GoogleGenAI } from '@google/genai'

export interface ProductBlurb {
  product_id: string
  why_text: string
}

/**
 * Generate a template blurb (fallback when no GEMINI_API_KEY)
 */
function generateTemplateBlurb(product: {
  title: string
  brand?: string | null
  price?: number | null
  rating?: number | null
  reviews_count?: number
  specs?: Record<string, string>
}): string {
  const brand = product.brand || 'This laptop'
  const specs = product.specs || {}

  const cpu = specs.cpu || 'powerful processor'
  const ram = specs.ram || 'ample RAM'
  const ratingStr = product.rating ? `${product.rating.toFixed(1)}★` : 'highly rated'
  const reviewsStr = product.reviews_count || 0

  return `${brand} with ${cpu}, ${ram} — ${ratingStr} from ${reviewsStr} reviews. Excellent value for performance.`
}

/**
 * Generate a Gemini blurb (one-time per laptop)
 */
async function generateGeminiBlurb(product: {
  title: string
  brand?: string | null
  price?: number | null
  rating?: number | null
  reviews_count?: number
  specs?: Record<string, string>
  use_case_tags?: string[]
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return generateTemplateBlurb(product)
  }

  try {
    const ai = new GoogleGenAI({ apiKey })

    const prompt = `Generate a 1–2 sentence blurb for this laptop that explains why it's a great pick. Be specific to its specs and price. Max 150 characters.

Title: ${product.title}
Price: ₹${product.price || 'N/A'}
Rating: ${product.rating || 'N/A'}/5 (${product.reviews_count || 0} reviews)
Specs: ${JSON.stringify(product.specs || {})}
Use cases: ${(product.use_case_tags || []).join(', ') || 'general'}

Return ONLY the blurb text, no quotes.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    })

    const blurb = response.text?.trim()
    return blurb && blurb.length < 300 ? blurb : generateTemplateBlurb(product)
  } catch (err) {
    console.error('[blurb.ts] Gemini generation failed, falling back to template:', err)
    return generateTemplateBlurb(product)
  }
}

/**
 * Generate blurbs for products missing why_text
 * Call this after inserting products, but before returning results
 */
export async function ensureBlurbs(products: Array<{
  id: string
  title: string
  brand?: string | null
  price?: number | null
  rating?: number | null
  reviews_count?: number
  specs?: Record<string, string>
  use_case_tags?: string[]
  why_text?: string | null
}>): Promise<ProductBlurb[]> {
  const needsBlurb = products.filter((p) => !p.why_text)

  const blurbs = await Promise.all(
    needsBlurb.map(async (p) => {
      const why_text = await generateGeminiBlurb({
        title: p.title,
        brand: p.brand,
        price: p.price,
        rating: p.rating,
        reviews_count: p.reviews_count,
        specs: p.specs,
        use_case_tags: p.use_case_tags,
      })

      return {
        product_id: p.id,
        why_text,
      }
    })
  )

  return blurbs
}
