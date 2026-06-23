'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { Bot, Filter, Loader2, Minus, Search, Send, SlidersHorizontal, X } from 'lucide-react'
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })
import type { Laptop } from '@/types/laptop'

interface LaptopsClientProps {
  laptops: Laptop[]
}

const TOP_BRANDS = ['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI']
const USE_CASES = [
  { value: 'all', label: 'All use cases' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'programming', label: 'Coding' },
  { value: 'video-editing', label: 'Video editing' },
  { value: 'business', label: 'Business' },
  { value: 'students', label: 'Students' },
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


type AgentMessage = {
  id: string
  role: 'user' | 'agent'
  content: string
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

const WEB_RESULTS_STORAGE_KEY = 'laptick:web-laptop-results'

type StoredWebResults = {
  query: string
  results: WebLaptopResult[]
}

function readStoredWebResults(): StoredWebResults | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(WEB_RESULTS_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as StoredWebResults
    if (!Array.isArray(parsed.results)) return null
    return parsed
  } catch {
    return null
  }
}

export function LaptopsClient({ laptops }: LaptopsClientProps) {
  const [globalNetworkAnimation, setGlobalNetworkAnimation] = useState<unknown>(null)

  useEffect(() => {
    let active = true
    fetch('/animations/global-network.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setGlobalNetworkAnimation(data)
      })
      .catch(() => null)
    return () => {
      active = false
    }
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedUseCase, setSelectedUseCase] = useState<string>('all')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [agentInput, setAgentInput] = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentMinimized, setAgentMinimized] = useState(false)
  const [webResults, setWebResults] = useState<WebLaptopResult[]>([])
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchLoading, setWebSearchLoading] = useState(false)
  const [selectedWebResult, setSelectedWebResult] = useState<WebLaptopResult | null>(null)
  const [selectedLocalLaptop, setSelectedLocalLaptop] = useState<Laptop | null>(null)
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      content: 'Ask me to show data here: "show gaming laptops under 80k", "Lenovo coding laptops", or "OLED laptops".',
    },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [isDiscoveryRunning, setIsDiscoveryRunning] = useState(false)
  const [discoveryStatus, setDiscoveryStatus] = useState<string | null>(null)

  // Escapes HTML tags to prevent XSS vulnerabilities
  function escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Format markdown-like text simply and safely
  function formatContent(text: string) {
    const escaped = escapeHtml(text)
    return escaped
      .split('\n')
      .map((line, i) => {
        // Bold
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Bullet points
        if (processed.startsWith('- ') || processed.startsWith('• ')) {
          return `<div class="ai-bullet" key="${i}">${processed.slice(2)}</div>`
        }
        if (processed.trim() === '') return '<br/>'
        return `<p>${processed}</p>`
      })
      .join('')
  }

  async function handleTriggerDiscovery() {
    if (isDiscoveryRunning) return
    setIsDiscoveryRunning(true)
    setDiscoveryStatus('Running AI Discovery...')
    try {
      const res = await fetch('/api/cron/ingest-batch?test=true')
      const data = await res.json()
      if (res.ok && data.success) {
        const added = data.stats?.new_laptops_added
        if (added && added.length > 0) {
          setDiscoveryStatus(`Success! Added: ${added.join(', ')}`)
        } else {
          setDiscoveryStatus('Discovery Finished: No new laptops added.')
        }
      } else {
        setDiscoveryStatus(`Failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      setDiscoveryStatus(`Error: ${err.message || 'Request failed'}`)
    } finally {
      setIsDiscoveryRunning(false)
      setTimeout(() => setDiscoveryStatus(null), 10000)
    }
  }

  const activeFilters =
    Number(Boolean(searchQuery.trim())) +
    Number(selectedBrand !== 'all') +
    Number(selectedUseCase !== 'all') +
    Number(maxPrice !== null)

  const filteredLaptops = useMemo(() => {
    let filtered = laptops

    // Filter by brand
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

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (laptop) =>
          laptop.name.toLowerCase().includes(query) ||
          laptop.brand.toLowerCase().includes(query) ||
          laptop.cpu_model.toLowerCase().includes(query) ||
          laptop.gpu_model.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [laptops, searchQuery, selectedBrand, selectedUseCase, maxPrice])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [agentMessages, agentLoading])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedWebResults = readStoredWebResults()
      if (!storedWebResults) return

      setWebResults(storedWebResults.results)
      setWebSearchQuery(storedWebResults.query)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!webSearchQuery && webResults.length === 0) return

    if (webResults.length === 0) {
      window.localStorage.removeItem(WEB_RESULTS_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      WEB_RESULTS_STORAGE_KEY,
      JSON.stringify({ query: webSearchQuery, results: webResults })
    )
  }, [webResults, webSearchQuery])

  function resetFilters() {
    setSearchQuery('')
    setSelectedBrand('all')
    setSelectedUseCase('all')
    setMaxPrice(null)
    setWebResults([])
    setWebSearchQuery('')
    setWebSearchError(null)
    setSelectedWebResult(null)
    setAgentSummary('Showing the full laptop table.')
  }

  async function searchWebLaptops(queryOverride?: string, maxPriceOverride = maxPrice) {
    const query = (queryOverride ?? searchQuery).trim()
    if (!query || webSearchLoading) return

    setWebSearchLoading(true)
    setWebSearchError(null)
    setWebSearchQuery(query)

    try {
      const params = new URLSearchParams({
        q: `${query} laptop`,
        limit: '12',
      })
      if (maxPriceOverride) params.set('max_price', String(maxPriceOverride))

      const res = await fetch(`/api/serpapi/laptops?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'SerpApi search failed.')
      }

      const results = data.results ?? []
      setWebResults(results)
      setSelectedWebResult(null)
      return results.length as number
    } catch {
      console.warn('[web search]: No online stores returned results.')
      setWebResults([])
      return null
    } finally {
      setWebSearchLoading(false)
    }
  }

  function extractBudget(text: string) {
    const lower = text.toLowerCase()
    const lakh = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac)/)
    if (lakh) return Math.round(Number(lakh[1]) * 100000)

    const thousand = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*(\d+)\s*(k|thousand)/)
    if (thousand) return Number(thousand[1]) * 1000

    const rupees = lower.match(/(?:under|below|less than|upto|up to|budget)?\s*₹?\s*(\d[\d,]{4,})/)
    if (rupees) {
      const budget = Number(rupees[1].replace(/,/g, ''))
      // Only treat it as budget if it's a realistic INR price range for laptops (15k - 500k)
      if (budget >= 15000 && budget <= 500000) return budget
    }

    return null
  }

  function runAgent(text: string) {
    const lower = text.toLowerCase()
    const brand = TOP_BRANDS.find((item) => lower.includes(item.toLowerCase()))
    
    // Match useCase against labels OR values
    const useCase = USE_CASES.find(
      (item) =>
        item.value !== 'all' &&
        (lower.includes(item.label.toLowerCase()) || lower.includes(item.value.toLowerCase()))
    )
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
    const noiseWords = ['laptop', 'laptops', 'show', 'find', 'best', 'me', 'with', 'under', 'below', 'above', 'budget', 'for', 'about', 'and', 'buy', 'get']
    noiseWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      queryCleaned = queryCleaned.replace(regex, '')
    })
    // Strip budget patterns
    queryCleaned = queryCleaned.replace(/(?:under|below|less than|upto|up to|budget)?\s*\d+(?:\.\d+)?\s*(lakh|lac|k|thousand)/g, '')
    queryCleaned = queryCleaned.replace(/₹?\s*\d[\d,]{4,}/g, '')
    
    const nextSearch = queryCleaned.replace(/\s+/g, ' ').trim()

    setSelectedBrand(brand ?? 'all')
    setSelectedUseCase(useCase?.value ?? 'all')
    setMaxPrice(budget)
    setSearchQuery(nextSearch)

    const preview = laptops.filter((laptop) => {
      if (brand && laptop.brand !== brand) return false
      if (useCase && !laptop.best_for.includes(useCase.value as never)) return false
      if (budget && laptop.price_inr > budget) return false
      const haystack = `${laptop.name} ${laptop.cpu_model} ${laptop.gpu_model} ${laptop.display_type} ${laptop.ram_gb}gb`.toLowerCase()
      if (nextSearch && !haystack.includes(nextSearch)) return false
      return true
    })

    const labelParts = [
      brand,
      useCase?.label,
      budget ? `under ₹${budget.toLocaleString('en-IN')}` : null,
      nextSearch ? `matching ${nextSearch.toUpperCase()}` : null,
    ].filter(Boolean)

    const summary = labelParts.length
      ? `Agent filtered ${preview.length} laptops: ${labelParts.join(', ')}.`
      : `Agent reset the view and is showing all ${laptops.length} laptops.`

    return summary
  }

  async function sendAgentMessage(messageText?: string) {
    const text = (messageText ?? agentInput).trim()
    if (!text || agentLoading) return

    setAgentInput('')
    setAgentMinimized(false)
    setAgentMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])

    // Check if the user is asking to reset or clear
    const isReset = /^\s*(reset|clear|show\s+all)\s*$/i.test(text)
    if (isReset) {
      resetFilters()
      setWebResults([])
      setWebSearchQuery('')
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          content: 'I have reset the filters and cleared the web search results for you. Showing all laptops.',
        },
      ])
      return
    }

    const actionSummary = runAgent(text)
    const agentBudget = extractBudget(text)
    const webSearchPromise = searchWebLaptops(text, agentBudget)
    setAgentLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...agentMessages.map((message) => ({
              role: message.role === 'user' ? 'user' : 'assistant',
              content: message.content,
            })),
            { role: 'user', content: text },
          ],
        }),
      })
      const data = await res.json()
      await webSearchPromise
      const reply = res.ok ? data.reply : 'I have filtered the list of laptops for you.'
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          content: reply,
        },
      ])
    } catch {
      await webSearchPromise
      const cleanSummary = actionSummary
        .replace('Agent filtered ', 'Filtered to ')
        .replace('Agent reset the view and is showing ', 'Showing ')
      
      setAgentMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'agent',
          content: `${cleanSummary}\n\n(Note: The chat assistant is currently rate-limited, but your filters and web listings have been updated below!)`,
        },
      ])
    } finally {
      setAgentLoading(false)
    }
  }

  return (
    <div className="laptops-browser">
      {/* AI Agent at the Center Bottom */}
      {agentMinimized ? (
        <button
          type="button"
          className="agent-launcher-right"
          onClick={() => setAgentMinimized(false)}
          aria-label="Open AI Agent"
        >
          <Bot className="h-4 w-4" />
          <span>Ask AI Agent</span>
        </button>
      ) : (
        <div className="agent-card" role="dialog" aria-label="Laptick AI Agent">
          <div className="agent-card__box">
            {/* Header */}
            <div className="agent-card__header">
              <div className="agent-card__header-left">
                <div className="agent-card__icon"><Bot className="h-3.5 w-3.5" /></div>
                <span className="agent-card__title">Laptick AI Agent</span>
              </div>
              <div className="agent-card__header-actions">
                <button
                  type="button"
                  onClick={() => setAgentMinimized(true)}
                  aria-label="Minimize agent"
                  title="Minimize"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="agent-card__body">
              {/* Messages log */}
              <div className="agent-messages">
                {agentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`agent-message agent-message--${message.role}`}
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                  />
                ))}
                {agentLoading && (
                  <div className="agent-message agent-message--agent flex items-center gap-2">
                    <span>Thinking and checking specs</span>
                    <div className="ai-typing inline-flex" style={{ padding: 0, height: 'auto', gap: '3px' }}>
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="agent-card__input-area">
                <div className="agent-quick-row">
                  {['gaming under 80k', 'coding under 60k', 'show Lenovo', 'OLED laptops'].map((prompt) => (
                    <button key={prompt} type="button" onClick={() => sendAgentMessage(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="agent-input-row">
                  <textarea
                    value={agentInput}
                    onChange={(event) => setAgentInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        sendAgentMessage()
                      }
                    }}
                    placeholder="Ask about laptops (e.g. gaming under 80k)..."
                    rows={1}
                  />
                  <button type="button" onClick={() => sendAgentMessage()} disabled={!agentInput.trim() || agentLoading}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <p className="agent-card__disclaimer">
                  AI can make mistakes. Verify specs before purchasing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-5">
        <div className="border-2 border-foreground bg-background p-3 shadow-[6px_6px_0_var(--foreground)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search laptops, chips, GPUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    searchWebLaptops()
                  }
                }}
                className="h-14 w-full border-2 border-foreground bg-background pl-12 pr-4 text-base font-bold text-foreground outline-none placeholder:text-foreground/40 focus:bg-primary/20"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-center">
              <label className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/45">
                  <Filter className="h-4 w-4" />
                </span>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="h-14 min-w-full cursor-pointer appearance-none border-2 border-foreground bg-background pl-11 pr-11 text-sm font-black text-foreground outline-none focus:bg-primary/20 sm:min-w-[210px]"
                >
                  <option value="all">All brands</option>
                  {TOP_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                  <option value="other">Other brands</option>
                </select>
                <SlidersHorizontal className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
              </label>

              <select
                value={selectedUseCase}
                onChange={(e) => setSelectedUseCase(e.target.value)}
                className="h-14 min-w-full cursor-pointer border-2 border-foreground bg-background px-4 text-sm font-black text-foreground outline-none focus:bg-primary/20 sm:min-w-[180px]"
              >
                {USE_CASES.map((useCase) => (
                  <option key={useCase.value} value={useCase.value}>
                    {useCase.label}
                  </option>
                ))}
              </select>

              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-14 items-center justify-center gap-2 border-2 border-foreground bg-primary px-5 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <X className="h-4 w-4" />
                  Reset
                </button>
              )}

              <button
                type="button"
                onClick={() => searchWebLaptops()}
                disabled={!searchQuery.trim() || webSearchLoading}
                className="inline-flex h-14 items-center justify-center gap-2 border-2 border-foreground bg-accent px-5 text-sm font-black text-accent-foreground shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                {webSearchLoading ? 'Searching...' : 'Search web'}
              </button>
            </div>
          </div>
        </div>

      <section className="border-2 border-foreground bg-background p-4 shadow-[6px_6px_0_var(--foreground)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
              Laptop Catalog & Live Results
            </p>
            <h2 className="text-xl font-black">
              {searchQuery ? `Results for "${searchQuery}"` : 'All Laptops'}
            </h2>
            <p className="mt-1 max-w-3xl text-xs font-bold leading-5 text-muted-foreground">
              Showing verified catalog specifications and live unverified marketplace listings.
            </p>
            {!webSearchLoading && (filteredLaptops.length > 0 || webResults.length > 0) && (
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Showing <span className="text-foreground">{filteredLaptops.length}</span> verified and <span className="text-foreground">{webResults.length}</span> marketplace laptops
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {discoveryStatus && (
              <span className="border border-foreground bg-secondary px-2.5 py-1 text-xs font-bold text-foreground animate-pulse">
                {discoveryStatus}
              </span>
            )}
            <button
              type="button"
              onClick={handleTriggerDiscovery}
              disabled={isDiscoveryRunning}
              className="border-2 border-foreground bg-accent px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-accent-foreground shadow-[3px_3px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
              title="Trigger manual weekly discovery and ingestion"
            >
              {isDiscoveryRunning ? 'Running...' : 'Trigger AI Discovery'}
            </button>
            <p className="border-2 border-foreground bg-primary px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-foreground">
              Prices updated weekly
            </p>
          </div>
        </div>

        {webSearchLoading && (
          <div className="border-2 border-dashed border-foreground bg-secondary p-6 text-center text-sm font-bold flex flex-col items-center justify-center gap-3">
            {globalNetworkAnimation ? (
              <Lottie
                animationData={globalNetworkAnimation}
                loop={true}
                style={{ height: 180, width: 180 }}
              />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            <span>Searching the best laptops for you...</span>
          </div>
        )}

        {!webSearchLoading && (filteredLaptops.length > 0 || webResults.length > 0) && (
          <div className="web-laptop-grid">
            {/* Render verified local laptops first */}
            {filteredLaptops.map((laptop) => (
              <article
                key={`local-${laptop.id}`}
                className="web-laptop-card"
                style={{ borderColor: 'var(--primary)', borderWidth: '3px' }}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedLocalLaptop(laptop)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedLocalLaptop(laptop)
                  }
                }}
              >
                <div className="web-laptop-card__image">
                  {laptop.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={laptop.image_url} alt={laptop.name} />
                  ) : (
                    <Search className="h-8 w-8 text-foreground/35" />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="line-clamp-2 font-black leading-tight text-lg">{laptop.name}</h3>
                    <p className="mt-2 text-2xl font-black text-accent">{formatPrice(laptop.price_inr)}</p>
                  </div>
                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedLocalLaptop(laptop)
                      }}
                      className="inline-flex border-2 border-foreground bg-primary px-3 py-2 text-xs font-black text-foreground shadow-[3px_3px_0_var(--foreground)]"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {/* Render unverified web laptops second */}
            {webResults.map((item) => (
              <article
                key={`${item.product_id ?? item.link ?? item.title}-${item.position}`}
                className="web-laptop-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedWebResult(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedWebResult(item)
                  }
                }}
              >
                <div className="web-laptop-card__image">
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt={item.title} />
                  ) : (
                    <Search className="h-8 w-8 text-foreground/35" />
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {item.source && <span className="web-laptop-card__source">{item.source}</span>}
                      {item.rating && (
                        <span className="web-laptop-card__meta">
                          {item.rating} rating{item.reviews ? ` · ${item.reviews.toLocaleString('en-IN')} reviews` : ''}
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 font-black leading-tight">{item.title}</h3>
                    <p className="mt-2 text-2xl font-black text-accent">{item.price ?? 'Price not shown'}</p>
                    <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Unverified web price
                    </p>
                    {item.condition_warning && (
                      <p className="mt-2 border border-foreground bg-primary px-2 py-1 text-xs font-black leading-5">
                        {item.condition_warning}
                      </p>
                    )}
                    {item.delivery && <p className="mt-1 text-xs font-bold text-muted-foreground">{item.delivery}</p>}
                    {item.extensions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {item.extensions.slice(0, 3).map((extension) => (
                          <span key={extension} className="web-laptop-card__tag">{extension}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedWebResult(item)
                      }}
                      className="inline-flex border-2 border-foreground bg-primary px-3 py-2 text-xs font-black text-foreground shadow-[3px_3px_0_var(--foreground)]"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredLaptops.length === 0 && webResults.length === 0 && !webSearchLoading && (
          <div className="border-2 border-dashed border-foreground bg-background p-12 text-center text-muted-foreground shadow-[6px_6px_0_var(--foreground)]">
            <Search className="mx-auto mb-4 h-10 w-10 text-foreground/35" />
            <p className="font-semibold text-foreground">
              No laptops found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => {
                resetFilters()
              }}
              className="mt-4 border-2 border-foreground bg-primary px-5 py-2 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {typeof document !== 'undefined' && selectedWebResult && createPortal(
        <div className="web-result-dialog" role="dialog" aria-modal="true" aria-label={selectedWebResult.title}>
          <button
            type="button"
            className="web-result-dialog__backdrop"
            onClick={() => setSelectedWebResult(null)}
            aria-label="Close web result details"
          />
          <article className="web-result-dialog__panel">
            <div className="web-result-dialog__header">
              <div>
                <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  Marketplace listing details - unverified
                </p>
                <h2 className="mt-1 text-2xl font-black leading-tight">{selectedWebResult.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWebResult(null)}
                className="web-result-dialog__close"
                aria-label="Close web result details"
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
                  <Search className="h-12 w-12 text-foreground/35" />
                )}
              </div>

              <div className="web-result-dialog__info">
                <p className="text-4xl font-black text-accent">{selectedWebResult.price ?? 'Price not shown'}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                  Unverified Google Shopping price. Not a Laptick-verified new-laptop price.
                </p>
                {selectedWebResult.condition_warning && (
                  <div className="mt-4 border-2 border-foreground bg-primary p-3 text-sm font-black leading-6 shadow-[3px_3px_0_var(--foreground)]">
                    {selectedWebResult.condition_warning}
                  </div>
                )}
                <div className="web-result-detail-grid">
                  <div><span>Seller</span><strong>{selectedWebResult.source ?? 'Not returned'}</strong></div>
                  <div><span>Numeric price</span><strong>{selectedWebResult.extracted_price ? `₹${selectedWebResult.extracted_price.toLocaleString('en-IN')}` : 'Not returned'}</strong></div>
                  <div><span>Price status</span><strong>{selectedWebResult.price_verified ? 'Verified' : 'Unverified API result'}</strong></div>
                  <div><span>Rating</span><strong>{selectedWebResult.rating ?? 'Not returned'}</strong></div>
                  <div><span>Reviews</span><strong>{selectedWebResult.reviews ? selectedWebResult.reviews.toLocaleString('en-IN') : 'Not returned'}</strong></div>
                  <div><span>Delivery</span><strong>{selectedWebResult.delivery ?? 'Not returned'}</strong></div>
                  <div><span>Position</span><strong>{selectedWebResult.position ?? 'Not returned'}</strong></div>
                  <div><span>Product ID</span><strong>{selectedWebResult.product_id ?? 'Not returned'}</strong></div>
                  <div><span>Tag</span><strong>{selectedWebResult.tag ?? 'Not returned'}</strong></div>
                </div>

                {selectedWebResult.extensions.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
                      Extensions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedWebResult.extensions.map((extension) => (
                        <span key={extension} className="web-laptop-card__tag">{extension}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedWebResult.snippet && (
                  <div className="mt-4 border-2 border-foreground bg-secondary p-3 text-sm font-bold leading-6">
                    {selectedWebResult.snippet}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedWebResult.link && (
                    <a
                      href={selectedWebResult.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border-2 border-foreground bg-primary px-4 py-2 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)]"
                    >
                      Open store listing
                    </a>
                  )}
                  {selectedWebResult.product_link && selectedWebResult.product_link !== selectedWebResult.link && (
                    <a
                      href={selectedWebResult.product_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border-2 border-foreground bg-background px-4 py-2 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)]"
                    >
                      Open Google product page
                    </a>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>,
        document.body
      )}

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
                <h2 className="mt-1 text-2xl font-black leading-tight">{selectedLocalLaptop.name}</h2>
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
                  <Search className="h-12 w-12 text-foreground/35" />
                )}
              </div>

              <div className="web-result-dialog__info">
                <p className="text-4xl font-black text-accent">{formatPrice(selectedLocalLaptop.price_inr)}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
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
                    <p className="mb-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-green-600">
                      Pros
                    </p>
                    <div className="border-2 border-green-600 bg-green-50/20 p-3 text-sm font-semibold leading-6 text-foreground">
                      {selectedLocalLaptop.pros}
                    </div>
                  </div>
                )}

                {selectedLocalLaptop.cons && (
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-red-600">
                      Cons
                    </p>
                    <div className="border-2 border-red-600 bg-red-50/20 p-3 text-sm font-semibold leading-6 text-foreground">
                      {selectedLocalLaptop.cons}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {selectedLocalLaptop.affiliate_amazon_in && (
                    <a
                      href={selectedLocalLaptop.affiliate_amazon_in}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex border-2 border-foreground bg-primary px-4 py-2 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)]"
                    >
                      Buy on Amazon India
                    </a>
                  )}
                  <a
                    href={`/laptops/${selectedLocalLaptop.slug}`}
                    className="inline-flex border-2 border-foreground bg-background px-4 py-2 text-sm font-black text-foreground shadow-[4px_4px_0_var(--foreground)]"
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
      </section>
    </div>
  )
}
