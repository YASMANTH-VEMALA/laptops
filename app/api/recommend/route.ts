import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getRanking, mapFormToUseCaseTag } from '@/lib/claude'
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

  const queryHash = hashFormData(form)
  const supabase = getServiceClient()

  // Layer 1: Full query cache — identical inputs return instantly
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

  // Smart pre-filter: budget → OS → brand → use-case tag
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

  if (form.brand_preference && form.brand_preference !== 'no-preference') {
    query = query.eq('brand', form.brand_preference)
  }

  const { data: allFiltered } = await query.order('last_updated', { ascending: false }).limit(50)

  if (!allFiltered || allFiltered.length === 0) {
    const brandMsg = form.brand_preference && form.brand_preference !== 'no-preference'
      ? ` Try removing the ${form.brand_preference} brand filter.`
      : ' Try a wider budget.'
    return NextResponse.json(
      { error: `No laptops found in this budget range.${brandMsg}` },
      { status: 404 }
    )
  }

  let laptopsForClaude = (allFiltered as Laptop[]).filter((l) =>
    l.best_for.includes(useCaseTag)
  )
  if (laptopsForClaude.length < 6) {
    laptopsForClaude = allFiltered as Laptop[]
  }
  laptopsForClaude = laptopsForClaude.slice(0, 15)

  // Layer 2: Fetch all cached explanations for these laptops
  const { data: cachedExplanations } = await supabase
    .from('laptop_explanations')
    .select('*')
    .in('laptop_id', laptopsForClaude.map((l) => l.id))
    .eq('use_case', useCaseTag)

  const explanationMap = new Map(
    (cachedExplanations || []).map((e: any) => [e.laptop_id, e])
  )

  // Claude ALWAYS ranks — it analyzes specs to pick the best 3 for this user.
  // Cache only provides the explanation text (why it's great), not the ranking decision.
  let ranking
  try {
    ranking = await getRanking(form, laptopsForClaude, budgetRange.label)
  } catch (err) {
    console.error('[/api/recommend] Claude ranking failed:', err)
    // Fallback: order by price fit and use cached explanations
    ranking = laptopsForClaude.slice(0, 3).map((l, i) => ({
      rank: (i + 1) as 1 | 2 | 3,
      laptop_id: l.id,
      headline: `${l.brand} — solid ${useCaseTag} pick`,
      buy_confidence: 'Medium' as const,
      use_case_fit_score: 7,
    }))
  }

  // Merge ranking with cached explanations (or fallback text)
  const top3 = ranking.slice(0, 3).map((r) => {
    const laptop = laptopsForClaude.find((l) => l.id === r.laptop_id)!
    const expl = explanationMap.get(r.laptop_id)

    return {
      rank: r.rank,
      laptop_id: r.laptop_id,
      headline: r.headline,
      why_best: expl?.explanation ?? `${laptop.name} is a strong match for your needs based on specs.`,
      key_strengths: expl?.key_strengths ?? [
        `${laptop.cpu_model} processor`,
        `${laptop.ram_gb}GB ${laptop.ram_type} RAM`,
        laptop.gpu_type === 'dedicated' ? `${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W` : 'Efficient integrated graphics',
      ],
      one_honest_weakness: expl?.one_weakness ?? laptop.cons?.split('.')[0] ?? 'Check specs before purchasing',
      buy_confidence: r.buy_confidence,
      use_case_fit_score: r.use_case_fit_score,
    }
  })

  const result: RecommendationResult = {
    top3,
    generated_at: new Date().toISOString(),
    from_cache: false,
  }

  const responsePayload = { result, query_hash: queryHash }

  // Store full response in cache (24h TTL)
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
