import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { getServiceClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/auth-session'

function isAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value
  return !!token && !!verifySessionToken(token)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Define the function declarations for Gemini function calling
const addLaptopTool = {
  name: 'add_laptop',
  description: 'Add a new laptop to the database. Call this when the admin wants to add or register a laptop and provides its details.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Display name of the laptop, e.g. HP Pavilion Plus 14' },
      brand: { type: 'string', description: 'Brand of the laptop, e.g. HP, Lenovo, Dell, Apple, Asus, Acer' },
      price_inr: { type: 'integer', description: 'Price in INR, e.g. 78000' },
      price_usd: { type: 'integer', description: 'Price in USD (optional)' },
      cpu_arch: { type: 'string', enum: ['x86', 'ARM'], description: 'CPU architecture' },
      cpu_brand: { type: 'string', enum: ['Intel', 'AMD', 'Apple', 'Qualcomm'], description: 'CPU Brand' },
      cpu_series: { type: 'string', enum: ['U', 'P', 'H', 'HX', 'M-series', 'X-series'], description: 'CPU series' },
      cpu_model: { type: 'string', description: 'Specific CPU model, e.g. Intel Core i5-13500H' },
      gpu_type: { type: 'string', enum: ['integrated', 'dedicated'], description: 'GPU type' },
      gpu_model: { type: 'string', description: 'Specific GPU model, e.g. NVIDIA GeForce RTX 3050 or Intel Iris Xe' },
      gpu_tgp_watts: { type: 'integer', description: 'TGP in watts (default 0 for integrated)' },
      ram_gb: { type: 'integer', description: 'RAM capacity in GB, e.g. 16' },
      ram_type: { type: 'string', enum: ['LPDDR5X', 'LPDDR5', 'DDR5', 'DDR4'], description: 'RAM type' },
      storage_gb: { type: 'integer', description: 'Storage capacity in GB, e.g. 512' },
      storage_type: { type: 'string', enum: ['NVMe', 'SATA'], description: 'Storage type' },
      display_size: { type: 'number', description: 'Screen size in inches, e.g. 14' },
      display_type: { type: 'string', enum: ['IPS', 'OLED', 'Mini-LED', 'TN', 'AMOLED'], description: 'Display type' },
      display_hz: { type: 'integer', description: 'Display refresh rate in Hz, e.g. 90' },
      display_nits: { type: 'integer', description: 'Display peak brightness in nits, e.g. 400' },
      display_color_gamut: { type: 'integer', description: 'Display color gamut % (optional)' },
      battery_wh: { type: 'integer', description: 'Battery size in Wh, e.g. 68' },
      weight_kg: { type: 'number', description: 'Laptop weight in kilograms, e.g. 1.4' },
      os_support: { type: 'string', enum: ['Windows', 'macOS', 'Linux', 'any'], description: 'OS support' },
      best_for: {
        type: 'array',
        items: { type: 'string' },
        description: 'Use-case tags. Values can be: video-editing, programming, gaming, general, business, ai-ml, design, content, students'
      },
      pros: { type: 'string', description: 'Pros (comma separated or description)' },
      cons: { type: 'string', description: 'Cons (comma separated or description)' },
      affiliate_amazon_in: { type: 'string', description: 'Amazon India link (optional)' },
      affiliate_amazon_com: { type: 'string', description: 'Amazon US link (optional)' },
      image_url: { type: 'string', description: 'Image URL (optional)' },
      is_active: { type: 'boolean', description: 'Is active and visible (default true)' }
    },
    required: [
      'name', 'brand', 'price_inr', 'cpu_arch', 'cpu_brand', 'cpu_series', 'cpu_model',
      'gpu_type', 'gpu_model', 'ram_gb', 'ram_type', 'storage_gb', 'storage_type',
      'display_size', 'display_type', 'display_hz', 'display_nits', 'battery_wh',
      'weight_kg', 'os_support', 'best_for', 'pros', 'cons'
    ]
  }
}

const searchLaptopsTool = {
  name: 'search_laptops',
  description: 'Search for laptops in the database by name or brand. Call this to check if a laptop already exists.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Name or brand query, e.g. Dell XPS or Acer' }
    },
    required: ['query']
  }
}

const updateLaptopTool = {
  name: 'update_laptop',
  description: 'Update details of an existing laptop in the database.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The UUID of the laptop' },
      fields: {
        type: 'object',
        description: 'Key-value pairs of fields to update (matching fields from add_laptop)'
      }
    },
    required: ['id', 'fields']
  }
}

const deleteLaptopTool = {
  name: 'delete_laptop',
  description: 'Delete a laptop from the database by its ID.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The UUID of the laptop to delete' }
    },
    required: ['id']
  }
}

const SYSTEM_INSTRUCTION = `You are Laptick Admin Agent — a powerful backend agent for the Laptick laptop catalog database.
Your job is to assist the administrator in managing the laptop catalog.
You have tools to:
1. Search laptops (\`search_laptops\`)
2. Add laptops (\`add_laptop\`)
3. Update laptops (\`update_laptop\`)
4. Delete laptops (\`delete_laptop\`)

When the user gives you a specification list or tells you about a laptop, use the \`add_laptop\` or \`update_laptop\` tool to make the database change.
If they do not provide some required values:
- Deduce them logically based on your tech knowledge (e.g. standard RAM types, CPU architectures like ARM for Apple/Qualcomm or x86 for Intel/AMD).
- If it's a gaming laptop, GPU is dedicated; if it's a thin-and-light with no GPU mentioned, it is integrated.
- If you still cannot deduce, ask the user. But try to execute the tool first using reasonable defaults based on the specifications.
Always explain clearly what you did (e.g. "I successfully added Asus Zephyrus G14...").`

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })
    const supabase = getServiceClient()
    const actionsExecuted: Array<{ type: string; details: string }> = []

    // Reformat history into Gemini client contents format
    // Since Gemini models need role: 'user' or 'model'
    let geminiContents: any[] = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Execute the agent loop
    let loop = true
    let maxIterations = 5
    let assistantReply = ''

    while (loop && maxIterations > 0) {
      maxIterations--

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: geminiContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{
            functionDeclarations: [addLaptopTool, searchLaptopsTool, updateLaptopTool, deleteLaptopTool]
          }]
        }
      })

      const functionCalls = response.functionCalls
      if (functionCalls && functionCalls.length > 0) {
        // Prepare model's message in the conversation history
        const modelParts: any[] = []
        const toolResponsesParts: any[] = []

        for (const call of functionCalls) {
          const { name, args, id: callId } = call as any
          modelParts.push({ functionCall: { name, args, id: callId } })

          let result: any = null

          try {
            if (name === 'add_laptop') {
              const laptopData = args as any
              // Generate unique slug
              let baseSlug = slugify(laptopData.name)
              let slug = baseSlug
              let conflict = true
              let attempt = 0
              
              while (conflict && attempt < 5) {
                const { data } = await supabase
                  .from('laptops')
                  .select('id')
                  .eq('slug', slug)
                  .maybeSingle()
                
                if (!data) conflict = false
                else {
                  attempt++
                  slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`
                }
              }

              const insertData = {
                ...laptopData,
                slug,
                is_active: laptopData.is_active !== undefined ? laptopData.is_active : true,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
              }

              const { data, error } = await supabase.from('laptops').insert([insertData]).select()
              if (error) throw error
              result = { success: true, laptop: data[0] }
              actionsExecuted.push({ type: 'add', details: `Added laptop: ${laptopData.name} (${laptopData.brand})` })
            } 
            else if (name === 'search_laptops') {
              const { query } = args as any
              const { data, error } = await supabase
                .from('laptops')
                .select('id, name, brand, price_inr, is_active')
                .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
                .limit(10)
              
              if (error) throw error
              result = { success: true, laptops: data || [] }
              actionsExecuted.push({ type: 'search', details: `Searched for "${query}"` })
            } 
            else if (name === 'update_laptop') {
              const { id, fields } = args as any
              const { data, error } = await supabase
                .from('laptops')
                .update({ ...fields, last_updated: new Date().toISOString() })
                .eq('id', id)
                .select('id, name')
              
              if (error) throw error
              result = { success: true, laptop: data?.[0] }
              actionsExecuted.push({ type: 'update', details: `Updated laptop ID: ${id}` })
            } 
            else if (name === 'delete_laptop') {
              const { id } = args as any
              const { error } = await supabase.from('laptops').delete().eq('id', id)
              if (error) throw error
              result = { success: true }
              actionsExecuted.push({ type: 'delete', details: `Deleted laptop ID: ${id}` })
            }
          } catch (err: any) {
            console.error(`[Agent Tool Call Error] ${name}:`, err)
            result = { error: err.message || 'Database error' }
          }

          toolResponsesParts.push({
            functionResponse: {
              name,
              id: callId,
              response: { result }
            }
          })
        }

        // Add model parts (function calls) and tool parts to history
        geminiContents.push({
          role: 'model',
          parts: modelParts
        })

        geminiContents.push({
          role: 'tool',
          parts: toolResponsesParts
        })

      } else {
        // No function calls, get the final reply
        assistantReply = response.text || "I've processed your request."
        loop = false
      }
    }

    return NextResponse.json({
      reply: assistantReply,
      actions: actionsExecuted
    })
  } catch (err: any) {
    console.error('[Admin Chat API] Error:', err)
    
    let errMsg = err?.message || 'Internal server error'
    if (typeof errMsg === 'string') {
      const trimmed = errMsg.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
            errMsg = parsed.error.message
          } else if (parsed.error && typeof parsed.error === 'string') {
            errMsg = parsed.error
          }
        } catch (e) {
          // not JSON, keep original
        }
      }
    }

    // If it contains rate limit or quota indicators
    const lowerMsg = errMsg.toLowerCase()
    if (lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('exhausted')) {
      errMsg = 'Gemini API Rate Limit or Quota Exceeded. Please configure a valid API key with higher limits, or wait a minute before retrying.'
    }

    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
