import Anthropic from '@anthropic-ai/sdk'
import type { Laptop } from '@/types/laptop'
import type {
  RecommendationFormData,
  RecommendationResult,
  RankedLaptop,
} from '@/types/recommendation'
import { USE_CASE_TO_TAG } from '@/types/recommendation'

const MODEL = 'claude-haiku-4-5'

const SYSTEM_PROMPT = `You are an expert laptop hardware advisor with deep knowledge of:
- CPU performance: why H-series processors outperform U-series for sustained workloads
- GPU TGP (Total Graphics Power): how the same GPU model at different wattages performs completely differently (an RTX 4060 at 80W is 40% faster than at 50W)
- RAM impact: why 8GB is insufficient for modern workflows and when 32GB is necessary
- Display technology: IPS vs OLED vs Mini-LED trade-offs for different use cases
- Battery life: how ARM (Apple Silicon) achieves 2x the battery life vs x86 at similar performance
- Thermal design: why thin laptops throttle and what TDP limits mean for real-world sustained performance
- Value analysis: price-to-performance across different market segments in India

Your job is to analyze a filtered list of laptops and recommend the TOP 3 for the user's specific use case.

IMPORTANT RULES:
1. Your explanation must be specific — mention actual specs and WHY they matter for this person
2. Do NOT use generic phrases like "powerful processor" — say "Intel Core i7-13700H which maintains 45W sustained = no throttling during long Premiere Pro exports"
3. Rank based on the user's top priority, not just general quality
4. Be honest about weaknesses — mention TGP limits, soldered RAM, fan noise, weight
5. Write for a non-technical reader — explain every technical term you use

You MUST respond with valid JSON only. No markdown, no extra text.`

function buildUserPrompt(
  form: RecommendationFormData,
  laptops: Laptop[],
  budgetLabel: string
): string {
  const laptopList = laptops.map((l) => ({
    id: l.id,
    name: l.name,
    price_inr: l.price_inr,
    cpu: `${l.cpu_brand} ${l.cpu_model} (${l.cpu_series}-series, ${l.cpu_arch})`,
    gpu: l.gpu_type === 'dedicated'
      ? `${l.gpu_model} @ ${l.gpu_tgp_watts}W TGP`
      : `${l.gpu_model} (integrated)`,
    ram: `${l.ram_gb}GB ${l.ram_type}`,
    storage: `${l.storage_gb}GB ${l.storage_type}`,
    display: `${l.display_size}" ${l.display_type} ${l.display_hz}Hz ${l.display_nits}nits`,
    battery: `${l.battery_wh}Wh`,
    weight: `${l.weight_kg}kg`,
    best_for: l.best_for.join(', '),
    pros: l.pros,
    cons: l.cons,
  }))

  return JSON.stringify({
    user: {
      role: form.role,
      primary_use: form.primary_use,
      budget: budgetLabel,
      top_priority: form.top_priority,
      os_preference: form.os_preference,
    },
    available_laptops: laptopList,
    task: 'Rank the top 3 laptops from available_laptops for this user. Return JSON with this exact structure:',
    response_schema: {
      top3: [
        {
          rank: '1 | 2 | 3',
          laptop_id: 'uuid string',
          headline: 'Short compelling reason (max 8 words)',
          why_best: 'Detailed 3-4 sentence explanation using specific specs and why they matter for this user',
          key_strengths: ['strength 1', 'strength 2', 'strength 3'],
          one_honest_weakness: 'One real limitation of this laptop for this use case',
          buy_confidence: 'High | Medium',
          use_case_fit_score: '1-10 integer',
        },
      ],
    },
  })
}

export async function getRecommendations(
  form: RecommendationFormData,
  laptops: Laptop[],
  budgetLabel: string
): Promise<RecommendationResult> {
  const client = new Anthropic()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: buildUserPrompt(form, laptops, budgetLabel),
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip markdown code fences if Claude wraps the JSON (handles any whitespace/newlines)
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const text = fenceMatch ? fenceMatch[1].trim() : raw.trim()

  let parsed: { top3: RankedLaptop[] }
  try {
    parsed = JSON.parse(text) as { top3: RankedLaptop[] }
  } catch (err) {
    console.error('[Claude] JSON parse failed. Raw response (first 500 chars):', raw.substring(0, 500))
    throw err
  }

  return {
    top3: parsed.top3,
    generated_at: new Date().toISOString(),
    from_cache: false,
  }
}

export function mapFormToUseCaseTag(form: RecommendationFormData) {
  return USE_CASE_TO_TAG[form.primary_use]
}
