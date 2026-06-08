import Anthropic from '@anthropic-ai/sdk'
import type { Laptop } from '@/types/laptop'

const SYSTEM_PROMPT = `You are India's top laptop hardware expert. Write concise, specific explanations for why a laptop is great for a specific use case.

RULES:
1. Explain WHY specs matter, not just what they are
2. Use real-world numbers and comparisons
3. Be honest about weaknesses specific to THIS laptop for THIS use case
4. Write for non-technical readers

Return ONLY valid JSON:
{
  "explanation": "2-3 sentences explaining why this laptop fits this use case based on specific specs",
  "key_strengths": [
    "Specific strength with real-world impact",
    "Another specific strength",
    "A third specific strength"
  ],
  "one_weakness": "ONE specific weakness for THIS laptop and THIS use case, not generic"
}`

function buildExplanationPrompt(laptop: Laptop, useCase: string): string {
  const useCaseContext: Record<string, string> = {
    gaming: `For gaming, prioritize GPU TGP, display refresh rate, CPU cooling.
This ${laptop.name}: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W, ${laptop.display_hz}Hz display, ${laptop.cpu_model}`,

    programming: `For programming, prioritize CPU cores, RAM, SSD speed.
This ${laptop.name}: ${laptop.cpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.storage_gb}GB ${laptop.storage_type}`,

    'video-editing': `For video editing, prioritize GPU VRAM, RAM (32GB+), CPU cores, display accuracy.
This ${laptop.name}: ${laptop.gpu_model} @ ${laptop.gpu_tgp_watts}W, ${laptop.ram_gb}GB RAM, ${laptop.display_color_gamut || 'unknown'} color accuracy`,

    design: `For graphic design, prioritize display color accuracy, brightness, GPU, RAM.
This ${laptop.name}: ${laptop.display_nits}nits, ${laptop.display_color_gamut || 'unknown'} DCI-P3, ${laptop.gpu_model}, ${laptop.ram_gb}GB RAM`,

    'ai-ml': `For AI/ML, prioritize GPU VRAM (8GB+), RAM (32GB+), CUDA cores, CPU.
This ${laptop.name}: ${laptop.gpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.cpu_model}`,

    general: `For general everyday use, prioritize battery life, weight, efficiency, display brightness.
This ${laptop.name}: ${laptop.battery_wh}Wh battery, ${laptop.weight_kg}kg, ${laptop.display_nits}nits`,

    business: `For business work, prioritize build quality, keyboard, display brightness, webcam.
This ${laptop.name}: ${laptop.brand}, ${laptop.display_nits}nits, ${laptop.weight_kg}kg`,

    content: `For content creation (YouTubers, streamers), prioritize balanced GPU+CPU, RAM, display color, audio.
This ${laptop.name}: ${laptop.gpu_model}, ${laptop.cpu_model}, ${laptop.ram_gb}GB RAM, ${laptop.battery_wh}Wh battery`,
  }

  return `Why is ${laptop.name} (₹${laptop.price_inr.toLocaleString()}) good for ${useCase}?

${useCaseContext[useCase] || useCaseContext['general']}

Be specific. Mention actual specs and real-world performance expectations.`
}

export async function generateExplanation(
  laptop: Laptop,
  useCase: string
): Promise<{ explanation: string; key_strengths: string[]; one_weakness: string }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 500,
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
    return JSON.parse(jsonText) as { explanation: string; key_strengths: string[]; one_weakness: string }
  } catch (err) {
    console.error(`[explanation-generator] JSON parse failed for ${laptop.id}/${useCase}. Raw:`, raw.substring(0, 200))
    throw err
  }
}
