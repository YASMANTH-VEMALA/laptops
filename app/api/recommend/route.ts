import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getRecommendations, mapFormToUseCaseTag } from '@/lib/claude'
import { hashFormData } from '@/lib/hash'
import { checkRateLimit } from '@/lib/rateLimit'
import { BUDGET_RANGES } from '@/types/laptop'
import type { RecommendationFormData, RecommendationResult } from '@/types/recommendation'
import type { Laptop } from '@/types/laptop'

const VALID_ROLES = ['student','software-developer','designer','business-professional','gamer','content-creator','ai-ml-engineer']
const VALID_USES = ['coding','gaming','office-work','video-editing','graphic-design','general-use','ai-ml']
const VALID_PRIORITIES = ['battery-life','raw-performance','portability','display-quality','value-for-money']
const VALID_OS = ['Windows','macOS','Linux','no-preference']

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

export async function POST(req: NextRequest) {
  // Rate limiting
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

  // Parse + validate inputs
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

  const queryHash = hashFormData(form)
  const supabase = getServiceClient()

  // Layer 1: Full query cache check
  const { data: cached } = await supabase
    .from('recommendation_cache')
    .select('result_json')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (cached) {
    return NextResponse.json(
      { ...cached.result_json, query_hash: queryHash },
      { headers: { 'X-Cache': 'HIT' } }
    )
  }

  // Smart pre-filter: budget → OS → use case tag
  const budgetRange = BUDGET_RANGES.find((r) => r.label === form.budget_key)!
  const useCaseTag = mapFormToUseCaseTag(form)

  let query = supabase
    .from('laptops')
    .select('*')
    .eq('is_active', true)
    .gte('price_inr', budgetRange.min)
    .lte('price_inr', budgetRange.max)

  if (form.os_preference !== 'no-preference') {
    query = query.in('os_support', [form.os_preference, 'any'])
  }

  const { data: allFiltered } = await query.order('last_updated', { ascending: false }).limit(50)

  if (!allFiltered || allFiltered.length === 0) {
    return NextResponse.json(
      { error: 'No laptops found in this budget range. Try a wider budget.' },
      { status: 404 }
    )
  }

  // Apply use-case tag filter; fallback to all if < 6 results
  let laptopsForClaude = (allFiltered as Laptop[]).filter((l) =>
    l.best_for.includes(useCaseTag)
  )
  if (laptopsForClaude.length < 6) {
    laptopsForClaude = allFiltered as Laptop[]
  }

  // Cap at 15 laptops to control Claude token usage
  laptopsForClaude = laptopsForClaude.slice(0, 15)

  // Layer 2: Check laptop_explanations cache for each laptop
  const { data: cachedExplanations } = await supabase
    .from('laptop_explanations')
    .select('*')
    .in('laptop_id', laptopsForClaude.map((l) => l.id))
    .eq('use_case', useCaseTag)

  const cachedExplanationMap = new Map(
    (cachedExplanations || []).map((e: any) => [e.laptop_id, e])
  )

  // Check if we have explanations for all laptops
  const allCached = laptopsForClaude.every((l) => cachedExplanationMap.has(l.id))

  let result: RecommendationResult
  if (allCached) {
    // All explanations cached — construct response without calling Claude
    console.log('[/api/recommend] All explanations cached, using cached data')
    const top3 = laptopsForClaude
      .slice(0, 3)
      .map((laptop, idx) => {
        const cached = cachedExplanationMap.get(laptop.id)!
        return {
          rank: (idx + 1) as 1 | 2 | 3,
          laptop_id: laptop.id,
          headline: `${laptop.brand} ${laptop.name.split(' ').slice(-2).join(' ')}`,
          why_best: cached.explanation,
          key_strengths: cached.key_strengths,
          one_honest_weakness: cached.one_weakness,
          buy_confidence: 'High' as const,
          use_case_fit_score: 8,
        }
      })

    result = {
      top3,
      generated_at: new Date().toISOString(),
      from_cache: true,
    }
  } else {
    // Some missing — call Claude
    let claudeResult
    try {
      claudeResult = await getRecommendations(form, laptopsForClaude, budgetRange.label)
    } catch (err) {
      console.error('[/api/recommend] Claude call failed:', err)
      return NextResponse.json(
        { error: 'AI recommendation failed. Please try again.' },
        { status: 500 }
      )
    }

    result = claudeResult

    // Store new explanations from this result
    const newExplanations = claudeResult.top3
      .filter((r) => !cachedExplanationMap.has(r.laptop_id))
      .map((r) => ({
        laptop_id: r.laptop_id,
        use_case: useCaseTag,
        explanation: r.why_best,
        key_strengths: r.key_strengths,
        one_weakness: r.one_honest_weakness,
        cached_at: new Date().toISOString(),
      }))

    if (newExplanations.length > 0) {
      await supabase.from('laptop_explanations').upsert(newExplanations, {
        onConflict: 'laptop_id,use_case',
      })
    }
  }

  const responsePayload = {
    result,
    query_hash: queryHash,
  }

  // Store in recommendation_cache (24h TTL)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('recommendation_cache').upsert({
    query_hash: queryHash,
    result_json: responsePayload,
    expires_at: expiresAt,
  })

  return NextResponse.json(responsePayload, {
    headers: {
      'X-Cache': 'MISS',
      'X-RateLimit-Remaining': String(remaining),
    },
  })
}
