import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { searchPipeline } from '@/lib/search-pipeline'
import { BUDGET_RANGES } from '@/types/laptop'
import type { RecommendationFormData } from '@/types/recommendation'
import crypto from 'crypto'

import { getServiceClient } from '@/lib/supabase'
import { normalizeAndHash } from '@/lib/normalize'

const VALID_ROLES = [
  'student',
  'software-developer',
  'designer',
  'business-professional',
  'gamer',
  'content-creator',
  'ai-ml-engineer',
]
const VALID_USES = ['coding', 'gaming', 'office-work', 'video-editing', 'graphic-design', 'general-use', 'ai-ml']
const VALID_PRIORITIES = ['battery-life', 'raw-performance', 'portability', 'display-quality', 'value-for-money']
const VALID_OS = ['Windows', 'macOS', 'Linux', 'no-preference']

function validateForm(body: unknown): RecommendationFormData | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (!VALID_ROLES.includes(b.role as string)) return null
  if (!VALID_USES.includes(b.primary_use as string)) return null
  if (!BUDGET_RANGES.find((r) => r.label === b.budget_key)) return null
  if (!VALID_PRIORITIES.includes(b.top_priority as string)) return null
  if (!VALID_OS.includes(b.os_preference as string)) return null
  return b as unknown as RecommendationFormData
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function getSessionId(req: NextRequest): string {
  // Use a combination of IP + user-agent hash as session ID
  const ip = getClientIp(req)
  const ua = req.headers.get('user-agent') || 'unknown'
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)
}

/**
 * Build natural language query from form data
 */
function buildQueryFromForm(form: RecommendationFormData): string {
  const parts: string[] = []

  if (form.budget_key) {
    const budgetMatch = BUDGET_RANGES.find((r) => r.label === form.budget_key)
    if (budgetMatch) {
      parts.push(`under ₹${budgetMatch.max}`)
    }
  }

  if (form.primary_use && form.primary_use !== 'general-use') {
    parts.push(form.primary_use.replace('-', ' '))
  }

  if (form.os_preference && form.os_preference !== 'no-preference') {
    parts.push(form.os_preference)
  }

  return `${parts.join(' ')} laptop`.trim()
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const { allowed, remaining, reset } = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in an hour.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const form = validateForm(body)
  if (!form) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  try {
    const rawQuery = buildQueryFromForm(form)
    const sessionId = getSessionId(req)

    const result = await searchPipeline(rawQuery, sessionId, ip)
    const { hash: queryHash } = normalizeAndHash(rawQuery)

    // Construct recommendation result formatted to match expected schema of recommendation_cache
    const top3Ranked = result.products.slice(0, 3).map((prod: any, idx: number) => {
      const cpu = prod.specs?.cpu || 'Performance processor'
      const ram = prod.specs?.ram ? `${prod.specs.ram} RAM` : 'Ample memory'
      const storage = prod.specs?.storage || 'Fast SSD'
      return {
        rank: (idx + 1) as 1 | 2 | 3,
        laptop_id: prod.id,
        headline: prod.title.split(' ').slice(0, 4).join(' '),
        why_best: prod.why_text || 'Excellent choice for your needs.',
        key_strengths: [cpu, ram, storage],
        one_honest_weakness: 'Review retail links for warranty and return details.',
        buy_confidence: prod.rating && prod.rating >= 4.0 ? 'High' : 'Medium',
        use_case_fit_score: prod.rating ? Math.round(prod.rating * 2) : 8,
      }
    })

    const recommendationResponse = {
      result: {
        top3: top3Ranked,
        generated_at: new Date().toISOString(),
        from_cache: result.cached,
      },
      query_hash: queryHash,
    }

    // Write to recommendation_cache
    const supabase = getServiceClient()
    const { error: cacheError } = await supabase.from('recommendation_cache').upsert({
      query_hash: queryHash,
      result_json: recommendationResponse,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'query_hash' })

    if (cacheError) {
      console.error('Failed to write to recommendation_cache:', cacheError)
    }

    return NextResponse.json(
      {
        products: result.products.slice(0, 3), // Top 3 for form
        all_products: result.products,
        cached: result.cached,
        fetched_at: result.fetched_at,
        query_hash: queryHash,
      },
      {
        headers: {
          'X-Cache': result.cached ? 'HIT' : 'MISS',
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    )
  } catch (err) {
    console.error('[/api/recommend] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations. Please try again.' },
      { status: 500 }
    )
  }
}
