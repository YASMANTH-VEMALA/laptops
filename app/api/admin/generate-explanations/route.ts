import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServiceClient } from '@/lib/supabase'
import type { Laptop } from '@/types/laptop'

function isAuthorized(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  return key === process.env.CACHE_ADMIN_KEY && !!process.env.CACHE_ADMIN_KEY
}

const USE_CASES = ['gaming', 'programming', 'video-editing', 'design', 'ai-ml', 'general', 'business', 'content']

// NOTE: This endpoint is now optional. Explanations are generated on-demand in /api/recommend.
// This endpoint can pre-generate for specific laptops to optimize cache, but is not required.
const SYSTEM_PROMPT = `You are India's top laptop hardware expert. Write specific, confident explanations for why a laptop is great for a use case.

RULES:
1. Explain WHY specs matter, not just what they are
2. Use real-world numbers and comparisons
3. Be honest about India-specific context (battery, brightness, weight)
4. Write for non-technical readers

Return ONLY valid JSON:
{
  "explanation": "2-3 sentences with specific specs and real-world impact",
  "key_strengths": [
    "Specific strength with real-world impact",
    "Another specific strength",
    "A third specific strength"
  ],
  "one_weakness": "ONE specific weakness for THIS laptop and THIS use case"
}`

function buildExplanationPrompt(laptop: Laptop, useCase: string): string {
  const useCaseContext: Record<string, string> = {
    gaming: `For gaming, prioritize:
- GPU TGP (Total Graphics Power) — higher TGP = sustained performance without throttling
- Display refresh rate — 144Hz+ for competitive gaming
- CPU cooling — must handle sustained loads without thermal throttling
- RAM — 16GB minimum for modern AAA games

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- Display: ${laptop.display_hz}Hz ${laptop.display_type}
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- RAM: ${laptop.ram_gb}GB
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    programming: `For programming, prioritize:
- CPU cores — more cores = faster compilation and build times
- RAM — 16GB+ for large projects and Docker containers
- SSD speed — fast I/O matters for large codebases and package management
- Keyboard quality — must be comfortable for 8+ hours of typing

This ${laptop.name} has:
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model} (${laptop.cpu_series}-series)
- RAM: ${laptop.ram_gb}GB
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Display: ${laptop.display_size}" ${laptop.display_type}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    'video-editing': `For video editing, prioritize:
- GPU VRAM and TGP — 4GB+ VRAM with sufficient power for real-time effects
- RAM — 32GB minimum for smooth 4K editing
- CPU cores — 8+ cores for multi-threaded rendering
- Display color accuracy — important for color grading

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    design: `For graphic design and creative work, prioritize:
- Display color accuracy — DCI-P3 95%+ or Adobe RGB coverage essential
- Display brightness — 300+ nits for bright room usage
- GPU acceleration — for smooth Photoshop and Figma performance
- RAM — 16GB+ for large design files and multiple apps

This ${laptop.name} has:
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits, ${laptop.display_color_gamut ? laptop.display_color_gamut + '% DCI-P3' : 'color gamut unknown'}
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    'ai-ml': `For AI/ML development, prioritize:
- GPU VRAM — 8GB+ for training large models (hard constraint)
- System RAM — 32GB+ for data preprocessing and model evaluation
- CUDA cores — for GPU-accelerated training
- CPU cores — helps with data loading and preprocessing

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP (VRAM unknown, verify separately)
- System RAM: ${laptop.ram_gb}GB
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Storage: ${laptop.storage_gb}GB ${laptop.storage_type}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    general: `For general everyday use, prioritize:
- Battery life — 8+ hours of real-world usage
- Weight — under 1.8kg for portability
- CPU efficiency — ARM processors (Apple Silicon) excel here
- Display brightness — 300+ nits for outdoor usage

This ${laptop.name} has:
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model} (${laptop.cpu_arch})
- Battery: ${laptop.battery_wh}Wh (estimated ${Math.round(laptop.battery_wh / 10)}-12 hours)
- Weight: ${laptop.weight_kg}kg
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    business: `For business professionals, prioritize:
- Build quality — solid aluminum chassis that survives bag tossing
- Keyboard — must be comfortable for all-day typing
- Display brightness — 400+ nits for video calls in bright rooms
- Webcam quality — 1080p minimum for professional video calls

This ${laptop.name} has:
- Build quality: ${laptop.brand} typically uses ${laptop.cpu_arch === 'ARM' ? 'premium aluminum' : 'mixed materials'}
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Weight: ${laptop.weight_kg}kg
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- Price: ₹${laptop.price_inr.toLocaleString()}`,

    content: `For content creation (YouTubers, podcasters, streamers), prioritize:
- Balanced GPU and CPU — need both for rendering and streaming simultaneously
- RAM — 16GB+ for background processes while recording
- Display — good color accuracy for thumbnail editing and video review
- Audio quality — clear microphone and speaker for recording

This ${laptop.name} has:
- GPU: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W TGP
- CPU: ${laptop.cpu_brand} ${laptop.cpu_model}
- RAM: ${laptop.ram_gb}GB
- Display: ${laptop.display_size}" ${laptop.display_type}, ${laptop.display_nits} nits
- Battery: ${laptop.battery_wh}Wh
- Price: ₹${laptop.price_inr.toLocaleString()}`,
  }

  const context = useCaseContext[useCase] || useCaseContext['general']

  return `Generate a detailed explanation for why the ${laptop.name} is relevant for ${useCase}.

${context}

Focus on:
1. How this specific laptop's specs match the ${useCase} use case
2. Real performance expectations (don't oversell)
3. What makes it better than cheaper alternatives
4. What limitations exist (be honest)

Make the explanation confident and detailed — the goal is to build trust by showing you understand both the specs AND why they matter for this person's workflow.`
}

async function generateExplanation(
  laptop: Laptop,
  useCase: string
): Promise<{ explanation: string; key_strengths: string[]; one_weakness: string }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildExplanationPrompt(laptop, useCase),
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const jsonText = fenceMatch ? fenceMatch[1].trim() : raw.trim()

  try {
    return JSON.parse(jsonText)
  } catch (err) {
    console.error(`[${laptop.id}/${useCase}] JSON parse failed. Raw:`, raw.substring(0, 200))
    throw err
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const laptopIds = b.laptop_ids as string[] | undefined
  const useCasesToGen = b.use_cases as string[] | undefined
  const force = b.force as boolean | undefined

  // Fetch specified laptops (or all if not specified)
  const query = supabase.from('laptops').select('*').eq('is_active', true)

  if (laptopIds && laptopIds.length > 0) {
    query.in('id', laptopIds)
  }

  const { data: laptops, error: laptopsError } = await query

  if (laptopsError || !laptops) {
    return NextResponse.json({ error: laptopsError?.message || 'Failed to fetch laptops' }, { status: 500 })
  }

  const useCases = useCasesToGen && useCasesToGen.length > 0 ? useCasesToGen : USE_CASES

  let generated = 0
  let skipped = 0
  const errors: { laptop_id: string; use_case: string; error: string }[] = []

  for (const laptop of laptops as Laptop[]) {
    for (const useCase of useCases) {
      // Check if already exists (unless force=true)
      if (!force) {
        const { data: existing } = await supabase
          .from('laptop_explanations')
          .select('id')
          .eq('laptop_id', laptop.id)
          .eq('use_case', useCase)
          .single()

        if (existing) {
          skipped++
          continue
        }
      }

      try {
        const explanation = await generateExplanation(laptop, useCase)

        const { error: insertError } = await supabase
          .from('laptop_explanations')
          .upsert(
            {
              laptop_id: laptop.id,
              use_case: useCase,
              explanation: explanation.explanation,
              key_strengths: explanation.key_strengths,
              one_weakness: explanation.one_weakness,
              cached_at: new Date().toISOString(),
            },
            {
              onConflict: 'laptop_id,use_case',
            }
          )

        if (insertError) {
          errors.push({ laptop_id: laptop.id, use_case: useCase, error: insertError.message })
        } else {
          generated++
        }

        // Rate limit: ~50ms per request to stay under rate limits
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (err) {
        errors.push({
          laptop_id: laptop.id,
          use_case: useCase,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }
  }

  return NextResponse.json({
    generated,
    skipped,
    total: laptops.length * useCases.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Return generation status and stats
  const { count: total } = await supabase
    .from('laptop_explanations')
    .select('*', { count: 'exact', head: true })

  const { data: byCaseCount } = await supabase
    .from('laptop_explanations')
    .select('use_case')
    .then((res) => ({
      data: res.data?.reduce(
        (acc, r) => {
          const useCase = r.use_case as string
          acc[useCase] = (acc[useCase] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
    }))

  return NextResponse.json({
    total_explanations: total,
    by_use_case: byCaseCount,
    available_use_cases: USE_CASES,
  })
}
