import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { GoogleGenAI } from '@google/genai'
import { searchPipeline } from '@/lib/search-pipeline'
import crypto from 'crypto'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Upstash Redis rate limiting (10 msgs/min per IP)
let ratelimit: Ratelimit | null = null

function isRateLimitConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    !process.env.UPSTASH_REDIS_REST_URL.includes('your-upstash') &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    !process.env.UPSTASH_REDIS_REST_TOKEN.includes('your-')
  )
}

function getRateLimit(): Ratelimit | null {
  if (!isRateLimitConfigured()) return null

  if (!ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
    })
  }
  return ratelimit
}

async function checkChatRateLimit(ip: string): Promise<boolean> {
  const rl = getRateLimit()
  if (!rl) return true // Rate limiting not configured, allow (dev mode)

  try {
    const { success } = await rl.limit(ip)
    return success
  } catch (err) {
    console.warn('[/api/chat] Rate limit check failed, allowing request:', err)
    return true // Fail open
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function getSessionId(req: NextRequest): string {
  const ip = getClientIp(req)
  const ua = req.headers.get('user-agent') || 'unknown'
  return crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)
}

/**
 * Detect if user is asking for laptop recommendations
 */
function shouldSearch(message: string): boolean {
  const lower = message.toLowerCase()
  const keywords = [
    'best laptop',
    'recommend',
    'which laptop',
    'should i buy',
    'good laptop',
    'laptop for',
    'laptop under',
    'gaming laptop',
    'budget laptop',
    'laptop suggestion',
    'price',
    'cost',
  ]
  return keywords.some((kw) => lower.includes(kw))
}

/**
 * Format products as markdown for context
 */
function formatProductsAsContext(products: any[]): string {
  return products
    .slice(0, 5)
    .map(
      (p) =>
        `• **${p.title}** — ₹${p.price?.toLocaleString('en-IN') || 'N/A'} | Rating: ${p.rating || 'N/A'}★ (${p.reviews_count || 0} reviews)\n  ${p.why_text || 'Check specs and reviews before buying.'}`
    )
    .join('\n\n')
}

/**
 * Generate chat response using Gemini
 */
async function generateChatResponse(
  messages: ChatMessage[],
  productContext?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const systemPrompt = `You are **Laptick AI** — India's expert laptop buying assistant.
- Deep expertise: CPUs, GPUs (TGP wattage!), RAM, displays, battery life, thermals
- Indian market pricing in ₹ INR
- Use-case specific: gaming, coding, video editing, design, business, students, AI/ML
- Honest about trade-offs and weaknesses
- Always verify specs before recommending

${productContext ? `\n## Relevant Laptops Available:\n${productContext}` : ''}

Keep responses concise (2-4 paragraphs max) unless asked for detail. Use bullet points for specs.`

  const ai = new GoogleGenAI({ apiKey })

  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: msg.content }],
  }))

  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    })
  } catch (error: any) {
    const errorStr = String(error?.message || '').toLowerCase()
    const isQuotaError = errorStr.includes('quota') || errorStr.includes('429') || errorStr.includes('limit exceeded') || errorStr.includes('exhausted')
    
    if (isQuotaError) {
      console.warn('[/api/chat] gemini-2.5-flash quota exceeded/rate-limited, attempting fallback to gemini-1.5-flash')
      try {
        response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        })
      } catch (fallbackError) {
        console.error('[/api/chat] Fallback to gemini-1.5-flash also failed:', fallbackError)
        throw error // Throw the original quota error if fallback fails
      }
    } else {
      throw error
    }
  }

  return response.text ?? 'I apologize, I could not generate a response. Please try again!'
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  const allowed = await checkChatRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many messages. Please wait a moment before sending more.' },
      { status: 429 }
    )
  }

  let body: { messages?: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { messages } = body
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
  }

  if (messages.length > 30) {
    return NextResponse.json({ error: 'Conversation too long. Please start a new chat.' }, { status: 400 })
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 })
    }
    if (msg.content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
    }
  }

  try {
    const latestUserMsg = messages.filter((m) => m.role === 'user').pop()
    let productContext: string | undefined = undefined

    // If asking for recommendations, fetch from search pipeline
    if (latestUserMsg && shouldSearch(latestUserMsg.content)) {
      const sessionId = getSessionId(req)
      const result = await searchPipeline(latestUserMsg.content, sessionId, ip)

      if (result.products.length > 0) {
        productContext = formatProductsAsContext(result.products)
      }
    }

    const reply = await generateChatResponse(messages, productContext)
    return NextResponse.json({ reply })
  } catch (err: any) {
    console.error('[/api/chat] Error:', err)
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }
}
