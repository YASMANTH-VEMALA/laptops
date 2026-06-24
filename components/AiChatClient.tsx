'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Bot, Loader2, Search, Send, X, User, Sparkles, SlidersHorizontal, ArrowRight, Laptop as LaptopIcon, Plus, Mic } from 'lucide-react'
import type { Laptop } from '@/types/laptop'

interface AiChatClientProps {
  laptops: Laptop[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  localLaptops?: Laptop[]
  webResults?: WebLaptopResult[]
}

type WebLaptopResult = {
  position: number | null
  title: string
  source: string | null
  price: string | null
  extracted_price: number | null
  rating: number | null
  reviews: number | null
  delivery: string | null
  link: string | null
  product_link: string | null
  product_id: string | null
  thumbnail: string | null
  extensions: string[]
  snippet: string | null
  tag: string | null
  condition_warning?: string | null
  price_verified?: boolean
}

const TOP_BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI']
const USE_CASES = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'programming', label: 'Coding' },
  { value: 'video-editing', label: 'Video editing' },
  { value: 'business', label: 'Business' },
  { value: 'students', label: 'College' },
  { value: 'content', label: 'Creator' },
]

const USE_CASE_LABELS: Record<string, string> = {
  'video-editing': 'Video Editing',
  programming: 'Coding',
  gaming: 'Gaming',
  general: 'General',
  business: 'Business',
  'ai-ml': 'AI / ML',
  design: 'Design',
  content: 'Creator',
  students: 'Students',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

const SUGGESTIONS = [
  'Best coding laptop under 60k',
  'High-end gaming laptop with RTX 4060',
  'MacBook Air for college students',
  'Premium laptop with OLED display',
]

export function AiChatClient({ laptops }: AiChatClientProps) {
  // Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am **Laptick AI**, your personal laptop expert. Tell me what you are looking for (e.g. "I need a Dell laptop under 80k for coding") and I will filter the catalog and search online marketplaces for you!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // AI-deduced Filter States (to sync laptop grid)
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedUseCase, setSelectedUseCase] = useState<string>('all')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Web Results (SerpApi)
  const [webResults, setWebResults] = useState<WebLaptopResult[]>([])
  const [webSearchLoading, setWebSearchLoading] = useState(false)
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchError, setWebSearchError] = useState<string | null>(null)

  // Detail Modal States
  const [selectedLocalLaptop, setSelectedLocalLaptop] = useState<Laptop | null>(null)
  const [selectedWebResult, setSelectedWebResult] = useState<WebLaptopResult | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, loading, scrollToBottom])

  const hasStartedChatting = messages.length > 1 || loading

  // Extract budget logic
  function extractBudget(text: string) {
    const lower = text.toLowerCase()
    
    // If the text specifies "above X" or "X+", we want to clear the max budget constraint
    if (/\b(?:above|greater|more|starting)\b|\+/.test(lower) && !/\b(?:under|below|less|upto|up to)\b/.test(lower)) {
      return null
    }

    const lakh = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|l\b)/)
    if (lakh) return Math.round(Number(lakh[1]) * 100000)

    const thousand = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*(\d+)\s*(k|thousand)/)
    if (thousand) return Number(thousand[1]) * 1000

    const rupees = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*₹?\s*(\d[\d,]{4,})/)
    if (rupees) {
      const budget = Number(rupees[1].replace(/,/g, ''))
      if (budget >= 15000 && budget <= 500000) return budget
    }

    return null
  }

  // Parse filters from text using rule-based keyword matching
  function parseFilters(text: string) {
    const lower = text.toLowerCase()
    // Direct brand match first
    let brand = TOP_BRANDS.find((item) => lower.includes(item.toLowerCase()))
    
    // Brand alias mapping (e.g. macbook → Apple)
    if (!brand) {
      const brandAliases: Record<string, string> = {
        'macbook': 'Apple',
        'mac book': 'Apple',
        'mac': 'Apple',
        'imac': 'Apple',
        'ipad': 'Apple',
        'thinkpad': 'Lenovo',
        'ideapad': 'Lenovo',
        'yoga': 'Lenovo',
        'legion': 'Lenovo',
        'inspiron': 'Dell',
        'xps': 'Dell',
        'latitude': 'Dell',
        'alienware': 'Dell',
        'vostro': 'Dell',
        'pavilion': 'HP',
        'envy': 'HP',
        'omen': 'HP',
        'spectre': 'HP',
        'vivobook': 'ASUS',
        'zenbook': 'ASUS',
        'rog': 'ASUS',
        'tuf': 'ASUS',
        'nitro': 'Acer',
        'swift': 'Acer',
        'predator': 'Acer',
        'aspire': 'Acer',
        'raider': 'MSI',
        'stealth': 'MSI',
        'katana': 'MSI',
        'bravo': 'MSI',
      }
      for (const [alias, brandName] of Object.entries(brandAliases)) {
        if (new RegExp(`\\b${alias}\\b`, 'i').test(lower)) {
          brand = brandName
          break
        }
      }
    }
    
    // Match use cases using broad synonym/keyword matching
    let useCase = null
    if (/gaming|game|games|play|fps|rog|alien/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'gaming')
    } else if (/coding|developer|programming|dev|software|engineer|code/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'programming')
    } else if (/video|editing|render|creator|stream|production|photoshop/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'video-editing')
    } else if (/business|office|work|professional|corporate/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'business')
    } else if (/student|college|study|university|school/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'students')
    } else if (/content/i.test(lower)) {
      useCase = USE_CASES.find(u => u.value === 'content')
    }

    const budget = extractBudget(text)

    // Dynamic keyword search query extraction
    let queryCleaned = lower
    if (brand) {
      queryCleaned = queryCleaned.replace(brand.toLowerCase(), '')
    }
    if (useCase) {
      queryCleaned = queryCleaned.replace(useCase.label.toLowerCase(), '')
      queryCleaned = queryCleaned.replace(useCase.value.toLowerCase(), '')
    }
    const noiseWords = [
      'laptop', 'laptops', 'show', 'find', 'best', 'me', 'with', 'under', 'below', 'above', 
      'budget', 'for', 'about', 'and', 'buy', 'get', 'recommend', 'recommends', 'recommendation', 
      'recommendations', 'suggest', 'suggests', 'suggestion', 'suggestions', 'please', 'could', 
      'you', 'i', 'want', 'need', 'needs', 'looking', 'to', 'a', 'an', 'the', 'is', 'are', 
      'can', 'should', 'would', 'help', 'give', 'list', 'display', 'of', 'good', 'great', 
      'excellent', 'perfect', 'suited', 'any', 'some', 'suitable', 'which', 'that', 'who', 
      'top', 'cheap', 'cheapest', 'premium', 'expensive',
      'play', 'games', 'game', 'suits', 'suit', 'particular', 'particularly', 'specifically', 'specific',
      'specs', 'specifications', 'specification', 'processor', 'screen', 'display', 'brand', 'model',
      'match', 'matching', 'latops', 'latop', 'coding', 'code', 'programming', 'developer', 'dev',
      'college', 'students', 'student', 'university', 'school', 'study',
      'air', 'pro', 'macbook', 'mac', 'book'
    ]
    noiseWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      queryCleaned = queryCleaned.replace(regex, '')
    })
    queryCleaned = queryCleaned.replace(/(?:under|below|less than|upto|up to|budget)?\s*\d+(?:\.\d+)?\s*(lakhs?|lacs?|l\b|k|thousand)/g, '')
    queryCleaned = queryCleaned.replace(/₹?\s*\d[\d,]{4,}/g, '')
    
    const nextSearch = queryCleaned.replace(/\s+/g, ' ').trim()

    return { brand, useCase, budget, nextSearch }
  }

  // Fetch online results from SerpApi
  async function searchWebLaptops(query: string, maxPriceVal: number | null) {
    if (!query.trim()) return []
    setWebSearchLoading(true)
    setWebSearchError(null)
    setWebSearchQuery(query)

    try {
      const params = new URLSearchParams({
        q: `${query} laptop`,
        limit: '12',
      })
      if (maxPriceVal) params.set('max_price', String(maxPriceVal))

      const res = await fetch(`/api/serpapi/laptops?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'SerpApi search failed.')
      }

      return data.results ?? []
    } catch (err: any) {
      console.warn('[web search]: No online stores returned results.', err)
      setWebSearchError(err.message || 'No online stores returned results.')
      return []
    } finally {
      setWebSearchLoading(false)
    }
  }

  // Handle message sending
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    }
    setMessages((prev) => [...prev, userMsg])

    // Detect filters
    const parsed = parseFilters(text)
    
    // Accumulate filters based on previous state
    const nextBrand = parsed.brand || (selectedBrand !== 'all' ? selectedBrand : null)
    const nextUseCaseObj = parsed.useCase || (selectedUseCase !== 'all' ? USE_CASES.find(u => u.value === selectedUseCase) : null)
    const nextBudget = parsed.budget || maxPrice

    const finalBrand = nextBrand ?? 'all'
    const finalUseCase = nextUseCaseObj?.value ?? 'all'
    const finalBudget = nextBudget

    // Filter local laptops catalog for this message
    let messageLocalLaptops: Laptop[] = []
    const greetingsRegex = /^(?:hi+|hello|hey+|yo|hola|greetings|good\s+(?:morning|afternoon|evening))(?:\s+there)?\s*!?$/i
    const isGreeting = greetingsRegex.test(text)

    if (!isGreeting) {
      let currentFiltered = laptops
      if (finalBrand !== 'all') {
        if (finalBrand === 'other') {
          currentFiltered = currentFiltered.filter((l) => !TOP_BRANDS.includes(l.brand))
        } else {
          currentFiltered = currentFiltered.filter((l) => l.brand === finalBrand)
        }
      }
      if (finalUseCase !== 'all') {
        currentFiltered = currentFiltered.filter((l) => l.best_for.includes(finalUseCase as never))
      }
      if (finalBudget) {
        currentFiltered = currentFiltered.filter((l) => l.price_inr <= finalBudget)
      }
      if (parsed.nextSearch.trim()) {
        const query = parsed.nextSearch.toLowerCase()
        const strictFiltered = currentFiltered.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            l.brand.toLowerCase().includes(query) ||
            l.cpu_model.toLowerCase().includes(query) ||
            l.gpu_model.toLowerCase().includes(query)
        )
        if (strictFiltered.length > 0) {
          currentFiltered = strictFiltered
        }
      }
      messageLocalLaptops = currentFiltered
    }

    // Construct cleaned query for SerpApi Web search using accumulated filters
    const brandStr = nextBrand ? nextBrand : ''
    const useCaseStr = nextUseCaseObj ? nextUseCaseObj.label : ''
    const webQuery = `${brandStr} ${useCaseStr} ${parsed.nextSearch}`.trim() || 'laptop'
    const webSearchPromise = !isGreeting ? searchWebLaptops(webQuery, nextBudget) : Promise.resolve([])

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      })

      const data = await res.json()
      const webResultsData = await webSearchPromise

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: isGreeting 
              ? `Hello! I am **Laptick AI**. How can I help you find the perfect laptop today? Tell me your preferred brand, use case, or budget!`
              : `I have filtered the laptops matching your specifications. You can check the results below. (Note: The chat assistant is temporarily rate-limited, but your filters are active!)`,
            localLaptops: messageLocalLaptops,
            webResults: webResultsData,
          },
        ])
        
        // Apply filters now
        setSelectedBrand(finalBrand)
        setSelectedUseCase(finalUseCase)
        setMaxPrice(finalBudget)
        setSearchQuery(parsed.nextSearch)
        setWebResults(webResultsData)

        setLoading(false)
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          localLaptops: messageLocalLaptops,
          webResults: webResultsData,
        },
      ])

      // Apply filters now
      setSelectedBrand(finalBrand)
      setSelectedUseCase(finalUseCase)
      setMaxPrice(finalBudget)
      setSearchQuery(parsed.nextSearch)
      setWebResults(webResultsData)

    } catch (err: any) {
      console.warn('[chat api error]: request failed, using database fallback.', err)
      const webResultsData = await webSearchPromise
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: isGreeting 
            ? `Hello! I am **Laptick AI**. How can I help you find the perfect laptop today? Tell me your preferred brand, use case, or budget!`
            : `I have filtered the laptops matching your specifications. You can check the results below. (Note: The chat assistant is temporarily rate-limited, but your filters are active!)`,
          localLaptops: messageLocalLaptops,
          webResults: webResultsData,
        },
      ])

      // Apply filters now
      setSelectedBrand(finalBrand)
      setSelectedUseCase(finalUseCase)
      setMaxPrice(finalBudget)
      setSearchQuery(parsed.nextSearch)
      setWebResults(webResultsData)

    } finally {
      setLoading(false)
    }
  }

  // Reset Filters & Conversation
  const handleReset = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation reset. What kind of laptop are you looking for?',
      },
    ])
    setSelectedBrand('all')
    setSelectedUseCase('all')
    setMaxPrice(null)
    setSearchQuery('')
    setWebResults([])
    setWebSearchQuery('')
    setWebSearchError(null)
    setSelectedLocalLaptop(null)
    setSelectedWebResult(null)
  }

  // Filter local laptops catalog
  const filteredLaptops = useMemo(() => {
    let filtered = laptops

    if (selectedBrand !== 'all') {
      if (selectedBrand === 'other') {
        filtered = filtered.filter((laptop) => !TOP_BRANDS.includes(laptop.brand))
      } else {
        filtered = filtered.filter((laptop) => laptop.brand === selectedBrand)
      }
    }

    if (selectedUseCase !== 'all') {
      filtered = filtered.filter((laptop) => laptop.best_for.includes(selectedUseCase as never))
    }

    if (maxPrice) {
      filtered = filtered.filter((laptop) => laptop.price_inr <= maxPrice)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const strictFiltered = filtered.filter(
        (laptop) =>
          laptop.name.toLowerCase().includes(query) ||
          laptop.brand.toLowerCase().includes(query) ||
          laptop.cpu_model.toLowerCase().includes(query) ||
          laptop.gpu_model.toLowerCase().includes(query)
      )
      // Soft fallback: if query filtering yields no matches, don't apply it so the user still gets results.
      if (strictFiltered.length > 0) {
        filtered = strictFiltered
      }
    }

    return filtered
  }, [laptops, searchQuery, selectedBrand, selectedUseCase, maxPrice])

  // Simple HTML markdown formatter
  function escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function formatContent(text: string) {
    const escaped = escapeHtml(text)
    return escaped
      .split('\n')
      .map((line, i) => {
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
        if (processed.startsWith('- ') || processed.startsWith('• ')) {
          return `<div class="ai-bullet" key="${i}">${processed.slice(2)}</div>`
        }
        if (processed.trim() === '') return '<br/>'
        return `<p>${processed}</p>`
      })
      .join('')
  }

  if (!hasStartedChatting) {
    return (
      <div className="flex-1 flex flex-col w-full animate-fade-in font-sans">
        {/* Top Header Row (Logo Only on landing page) */}
        <div className="flex items-center justify-between pb-3.5 mb-4 flex-none">
          <Link href="/" className="site-logo">
            Laptick
          </Link>
        </div>

        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-6 px-4">
          {/* Header Title */}
          <h1 className="text-4xl sm:text-5xl font-black text-center text-foreground mb-8 tracking-tight leading-none italic font-display">
            Ready when you are.
          </h1>

          {/* ChatGPT Style Rounded Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="w-full max-w-2xl relative flex items-center mb-8"
          >

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about laptops (e.g. gaming under 80k)..."
              className="w-full border-2 border-foreground bg-white pl-6 pr-16 py-4 text-sm font-semibold shadow-[4px_4px_0_var(--foreground)] rounded-full focus:outline-none focus:ring-0 focus:border-foreground"
            />

            {/* Submit Button */}
            <div className="absolute right-3.5 flex items-center">
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <ArrowRight className="h-5 w-5 stroke-[3]" />
              </button>
            </div>
          </form>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                className="text-[11px] font-black uppercase border-2 border-foreground bg-white px-4.5 py-2.5 hover:bg-[#ccff33] active:translate-y-0.5 active:shadow-none transition shadow-[2px_2px_0_var(--foreground)] rounded-full cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderLaptopCard = (laptop: Laptop) => (
    <div
      key={`local-${laptop.id}`}
      onClick={() => setSelectedLocalLaptop(laptop)}
      className="flex-none w-[260px] border-2 border-foreground bg-white shadow-[4px_4px_0_var(--foreground)] rounded-xl overflow-hidden p-3.5 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--foreground)] transition-all cursor-pointer"
    >
      <div>
        <div className="w-full h-32 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden mb-3 border border-foreground/10">
          {laptop.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={laptop.image_url} alt={laptop.name} className="object-contain h-full w-full p-2" />
          ) : (
            <Search className="h-6 w-6 text-foreground/35" />
          )}
        </div>
        <h3 className="line-clamp-2 font-black leading-tight text-xs mb-1.5 text-foreground">{laptop.name}</h3>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2 font-mono">
          {laptop.cpu_model} · {laptop.ram_gb}GB · {laptop.storage_gb}GB SSD
        </p>
      </div>
      <div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-sm font-black text-foreground">{formatPrice(laptop.price_inr)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {laptop.best_for && laptop.best_for.length > 0 && (
            <span className="text-[9px] font-black uppercase border border-foreground bg-zinc-50 px-2 py-0.5 rounded-none">
              {USE_CASE_LABELS[laptop.best_for[0]] || laptop.best_for[0]}
            </span>
          )}
          <button className="text-[10px] font-black uppercase bg-[#ccff33] border-2 border-foreground px-2.5 py-1 shadow-[2px_2px_0_var(--foreground)] hover:translate-y-0.5 transition-all">
            Details
          </button>
        </div>
      </div>
    </div>
  )

  const renderWebLaptopCard = (webLaptop: WebLaptopResult) => (
    <div
      key={`web-${webLaptop.product_id || webLaptop.position}`}
      onClick={() => setSelectedWebResult(webLaptop)}
      className="flex-none w-[260px] border-2 border-foreground bg-white shadow-[4px_4px_0_var(--foreground)] rounded-xl overflow-hidden p-3.5 flex flex-col justify-between hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--foreground)] transition-all cursor-pointer animate-fade-in"
      style={{ borderColor: '#00d5ff' }}
    >
      <div>
        <div className="w-full h-32 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden mb-3 border border-foreground/10">
          {webLaptop.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={webLaptop.thumbnail} alt={webLaptop.title} className="object-contain h-full w-full p-2" />
          ) : (
            <Search className="h-6 w-6 text-foreground/35" />
          )}
        </div>
        <h3 className="line-clamp-2 font-black leading-tight text-xs mb-1.5 text-foreground">{webLaptop.title}</h3>
        <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2 font-mono">
          {webLaptop.source || 'Online Store'}
        </p>
      </div>
      <div>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-sm font-black text-foreground">{webLaptop.price || 'Check price'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase border border-foreground bg-zinc-50 px-2 py-0.5 rounded-none text-accent">
            Online Match
          </span>
          <button className="text-[10px] font-black uppercase bg-[#00d5ff] border-2 border-foreground px-2.5 py-1 shadow-[2px_2px_0_var(--foreground)] hover:translate-y-0.5 transition-all text-foreground">
            View
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col w-full animate-fade-in font-sans h-full overflow-hidden">
      {/* Chat Log Header - pinned at top */}
      <div className="flex items-center justify-between pb-3.5 mb-0 flex-none">
        <Link href="/" className="site-logo">
          Laptick
        </Link>
        <button
          onClick={handleReset}
          className="text-xs font-black uppercase text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
        >
          Reset Chat
        </button>
      </div>

      {/* Message Log Area - full width so scrollbar is at screen edge */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}
      >
        <div className="w-full max-w-4xl mx-auto px-1 py-4 space-y-5">
          {messages.map((message) => {
            const isBot = message.role === 'assistant'
            const hasLaptops = isBot && ((message.localLaptops && message.localLaptops.length > 0) || (message.webResults && message.webResults.length > 0))
            return (
              <div key={message.id} className="space-y-3">
                <div className={`flex gap-3 max-w-[85%] ${isBot ? '' : 'ml-auto flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center border-2 border-foreground ${
                    isBot ? 'bg-[#ccff33] text-foreground' : 'bg-primary/20 text-foreground'
                  }`}>
                    {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Content Bubble */}
                  <div className={`px-4 py-2.5 border-2 border-foreground leading-relaxed shadow-[3px_3px_0_var(--foreground)] rounded-2xl ${
                    isBot ? 'bg-white/75 backdrop-blur-sm text-foreground' : 'bg-white/95 text-foreground'
                  }`}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} 
                      className="space-y-1.5 text-sm"
                    />
                  </div>
                </div>

                {/* Inline Laptops Row specific to this message */}
                {hasLaptops && (
                  <div className="w-full pl-11 animate-fade-in">
                    <div className="flex flex-row overflow-x-auto gap-4 pb-2 no-scrollbar">
                      {message.localLaptops?.map(renderLaptopCard)}
                      {message.webResults?.map(renderWebLaptopCard)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-[#ccff33] text-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 border-2 border-foreground bg-white px-4 py-2 text-sm font-bold shadow-[2px_2px_0_var(--foreground)] rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Footer / Input area - pinned at bottom */}
      <div className="py-3 bg-transparent flex-none border-t border-foreground/10">
        {/* Quick Suggestions */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSendMessage(s)}
              disabled={loading}
              className="text-[10px] font-black uppercase border-2 border-foreground bg-white px-3.5 py-1.5 hover:bg-[#ccff33] active:translate-y-0.5 active:shadow-none transition shadow-[2px_2px_0_var(--foreground)] rounded-full cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {s}
            </button>
          ))}
        </div>

        {/* ChatGPT Style Rounded Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="w-full max-w-2xl mx-auto relative flex items-center"
        >

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about laptops (e.g. gaming under 80k)..."
            disabled={loading}
            className="w-full border-2 border-foreground bg-white pl-5 pr-14 py-3.5 text-xs font-semibold shadow-[4px_4px_0_var(--foreground)] rounded-full focus:outline-none focus:ring-0 focus:border-foreground disabled:opacity-60"
          />

          {/* Submit Button */}
          <div className="absolute right-3 flex items-center">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background hover:bg-foreground/90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>

      {/* Portal Details Dialog: Verified Local Laptop */}
      {typeof document !== 'undefined' && selectedLocalLaptop && createPortal(
        <div className="web-result-dialog" role="dialog" aria-modal="true" aria-label={selectedLocalLaptop.name}>
          <button
            type="button"
            className="web-result-dialog__backdrop"
            onClick={() => setSelectedLocalLaptop(null)}
            aria-label="Close details"
          />
          <article className="web-result-dialog__panel" style={{ borderColor: 'var(--primary)', borderWidth: '3px' }}>
            <div className="web-result-dialog__header">
              <div>
                <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Laptick Verified Catalog Details
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight">{selectedLocalLaptop.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLocalLaptop(null)}
                className="web-result-dialog__close"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="web-result-dialog__body">
              <div className="web-result-dialog__image">
                {selectedLocalLaptop.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedLocalLaptop.image_url} alt={selectedLocalLaptop.name} />
                ) : (
                  <Search className="h-10 w-10 text-foreground/35" />
                )}
              </div>

              <div className="web-result-dialog__info">
                <p className="text-3xl font-black text-accent">{formatPrice(selectedLocalLaptop.price_inr)}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Verified catalog price in India
                </p>

                <div className="web-result-detail-grid">
                  <div><span>Brand</span><strong>{selectedLocalLaptop.brand}</strong></div>
                  <div><span>CPU Processor</span><strong>{selectedLocalLaptop.cpu_model} ({selectedLocalLaptop.cpu_brand} {selectedLocalLaptop.cpu_series || ''})</strong></div>
                  <div><span>CPU Architecture</span><strong>{selectedLocalLaptop.cpu_arch}</strong></div>
                  <div><span>Graphics (GPU)</span><strong>{selectedLocalLaptop.gpu_model} ({selectedLocalLaptop.gpu_type})</strong></div>
                  <div><span>RAM Memory</span><strong>{selectedLocalLaptop.ram_gb}GB {selectedLocalLaptop.ram_type}</strong></div>
                  <div><span>Storage SSD</span><strong>{selectedLocalLaptop.storage_gb}GB {selectedLocalLaptop.storage_type}</strong></div>
                  <div><span>Display Screen</span><strong>{selectedLocalLaptop.display_size}&quot; {selectedLocalLaptop.display_type} {selectedLocalLaptop.display_hz}Hz ({selectedLocalLaptop.display_nits} nits)</strong></div>
                  <div><span>Battery Capacity</span><strong>{selectedLocalLaptop.battery_wh} Wh</strong></div>
                  <div><span>Weight</span><strong>{selectedLocalLaptop.weight_kg} kg</strong></div>
                  <div><span>Operating System</span><strong>{selectedLocalLaptop.os_support}</strong></div>
                  <div>
                    <span>Best For</span>
                    <strong>
                      {selectedLocalLaptop.best_for && selectedLocalLaptop.best_for.length > 0 
                        ? selectedLocalLaptop.best_for.map(bf => USE_CASE_LABELS[bf] || bf).join(', ') 
                        : 'General Use'}
                    </strong>
                  </div>
                </div>

                {selectedLocalLaptop.pros && (
                  <div className="mt-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-green-600">
                      Pros
                    </p>
                    <div className="border-2 border-green-600 bg-green-50/20 p-2 text-xs font-semibold leading-5">
                      {selectedLocalLaptop.pros}
                    </div>
                  </div>
                )}

                {selectedLocalLaptop.cons && (
                  <div className="mt-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-red-600">
                      Cons
                    </p>
                    <div className="border-2 border-red-600 bg-red-50/20 p-2 text-xs font-semibold leading-5">
                      {selectedLocalLaptop.cons}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {selectedLocalLaptop.affiliate_amazon_in && (
                    <a
                      href={selectedLocalLaptop.affiliate_amazon_in}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border-2 border-foreground bg-[#ccff33] px-4 py-2 text-xs font-black text-foreground shadow-[3px_3px_0_var(--foreground)]"
                    >
                      Buy on Amazon India
                    </a>
                  )}
                  <a
                    href={`/laptops/${selectedLocalLaptop.slug}`}
                    className="inline-flex border-2 border-foreground bg-background px-4 py-2 text-xs font-black text-foreground shadow-[3px_3px_0_var(--foreground)]"
                  >
                    Open Dedicated Page
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>,
        document.body
      )}

      {/* Portal Details Dialog: Web Result */}
      {typeof document !== 'undefined' && selectedWebResult && createPortal(
        <div className="web-result-dialog" role="dialog" aria-modal="true" aria-label={selectedWebResult.title}>
          <button
            type="button"
            className="web-result-dialog__backdrop"
            onClick={() => setSelectedWebResult(null)}
            aria-label="Close details"
          />
          <article className="web-result-dialog__panel">
            <div className="web-result-dialog__header">
              <div>
                <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Marketplace listing details - unverified
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight">{selectedWebResult.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWebResult(null)}
                className="web-result-dialog__close"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="web-result-dialog__body">
              <div className="web-result-dialog__image">
                {selectedWebResult.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedWebResult.thumbnail} alt={selectedWebResult.title} />
                ) : (
                  <Search className="h-10 w-10 text-foreground/35" />
                )}
              </div>

              <div className="web-result-dialog__info">
                <p className="text-3xl font-black text-accent">{selectedWebResult.price ?? 'Price not shown'}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Unverified web listing price
                </p>

                <div className="web-result-detail-grid">
                  <div><span>Seller</span><strong>{selectedWebResult.source ?? 'Not returned'}</strong></div>
                  <div><span>Numeric price</span><strong>{selectedWebResult.extracted_price ? `₹${selectedWebResult.extracted_price.toLocaleString('en-IN')}` : 'Not returned'}</strong></div>
                  <div><span>Rating</span><strong>{selectedWebResult.rating ?? 'Not returned'}</strong></div>
                  <div><span>Reviews</span><strong>{selectedWebResult.reviews ? selectedWebResult.reviews.toLocaleString('en-IN') : 'Not returned'}</strong></div>
                  <div><span>Delivery</span><strong>{selectedWebResult.delivery ?? 'Not returned'}</strong></div>
                </div>

                {selectedWebResult.snippet && (
                  <div className="mt-4 border-2 border-foreground bg-secondary p-3.5 text-xs font-semibold leading-5">
                    {selectedWebResult.snippet}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {selectedWebResult.link && (
                    <a
                      href={selectedWebResult.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border-2 border-foreground bg-[#ccff33] px-4 py-2 text-xs font-black text-foreground shadow-[3px_3px_0_var(--foreground)]"
                    >
                      Open store listing
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>,
        document.body
      )}
    </div>
  )
}
