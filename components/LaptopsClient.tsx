'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Bot, Filter, Loader2, Search, SlidersHorizontal, X, Briefcase, Camera, ChevronDown, Code, Film, Gamepad2, GraduationCap, HelpCircle } from 'lucide-react'
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

const ONBOARD_BUDGET_STEPS = [
  { value: 30000, label: '₹30K', display: '₹30K' },
  { value: 60000, label: '₹60K', display: '₹60K' },
  { value: 90000, label: '₹90K', display: '₹90K' },
  { value: 120000, label: '₹1.2L', display: '₹1.2L' },
  { value: 150000, label: '₹1.5L', display: '₹1.5L' },
  { value: 1000000, label: '1.5L+', display: '₹1.5L+' },
]

const ONBOARD_USE_CASES = [
  { value: 'video-editing', label: 'Video Editing', icon: '🎬' },
  { value: 'students', label: 'College', icon: '🎓' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'content', label: 'Content Creator', icon: '📸' },
  { value: 'programming', label: 'Coding', icon: '💻' },
]

const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  all: <SlidersHorizontal className="h-4 w-4 text-foreground" />,
  'video-editing': <Film className="h-4 w-4 text-foreground" />,
  students: <GraduationCap className="h-4 w-4 text-foreground" />,
  gaming: <Gamepad2 className="h-4 w-4 text-foreground" />,
  business: <Briefcase className="h-4 w-4 text-foreground" />,
  content: <Camera className="h-4 w-4 text-foreground" />,
  programming: <Code className="h-4 w-4 text-foreground" />,
  other: <HelpCircle className="h-4 w-4 text-foreground" />,
}



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

  const searchParams = useSearchParams()
  const router = useRouter()

  // Onboarding Preference states
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const [onboardBudgetIndex, setOnboardBudgetIndex] = useState(5) // default to ₹1.5L+
  const [onboardUseCase, setOnboardUseCase] = useState('all') // default to All Use Cases
  const [customUseCaseText, setCustomUseCaseText] = useState('')
  const catalogRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return

    const budgetParam = searchParams.get('budget')
    const purposeParam = searchParams.get('purpose')
    const purposeTypeParam = searchParams.get('purpose_type')
    const customParam = searchParams.get('custom')

    if (budgetParam && purposeParam) {
      initializedRef.current = true
      const budgetVal = Number(budgetParam)
      setMaxPrice(budgetVal)
      setSelectedUseCase(purposeParam)
      setSearchQuery('')
      setHasOnboarded(true)

      // Find index
      const idx = ONBOARD_BUDGET_STEPS.findIndex((s) => s.value === budgetVal)
      if (idx !== -1) setOnboardBudgetIndex(idx)

      if (purposeTypeParam) setOnboardUseCase(purposeTypeParam)
      if (customParam) setCustomUseCaseText(customParam)


    }
  }, [searchParams])

  // Sync state changes back to URL search params silently
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (maxPrice !== null) {
      params.set('budget', String(maxPrice))
    }
    
    if (selectedUseCase !== 'all') {
      params.set('purpose', selectedUseCase)
      params.set('purpose_type', selectedUseCase)
    } else if (onboardUseCase === 'other') {
      params.set('purpose', 'all')
      params.set('purpose_type', 'other')
      if (customUseCaseText) params.set('custom', customUseCaseText)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `/laptops?${queryString}` : '/laptops'
    
    window.history.replaceState(null, '', newUrl)
  }, [maxPrice, selectedUseCase, onboardUseCase, customUseCaseText])
  
  // Sync maxPrice back to onboarding slider
  useEffect(() => {
    if (maxPrice !== null) {
      const idx = ONBOARD_BUDGET_STEPS.findIndex((s) => s.value === maxPrice)
      if (idx !== -1) {
        setOnboardBudgetIndex(idx)
      } else {
        setOnboardBudgetIndex(5) // default to 1.5L+
      }
    } else {
      setOnboardBudgetIndex(5) // default to 1.5L+
    }
  }, [maxPrice])

  // Sync selectedUseCase back to onboarding use case selector
  useEffect(() => {
    if (selectedUseCase !== 'all') {
      setOnboardUseCase(selectedUseCase)
    } else if (onboardUseCase !== 'other') {
      setOnboardUseCase('all')
    }
  }, [selectedUseCase])

  const [webResults, setWebResults] = useState<WebLaptopResult[]>([])
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchLoading, setWebSearchLoading] = useState(false)
  const [webSearchError, setWebSearchError] = useState<string | null>(null)
  const [selectedWebResult, setSelectedWebResult] = useState<WebLaptopResult | null>(null)
  const [selectedLocalLaptop, setSelectedLocalLaptop] = useState<Laptop | null>(null)

  const [isDiscoveryRunning, setIsDiscoveryRunning] = useState(false)
  const [discoveryStatus, setDiscoveryStatus] = useState<string | null>(null)



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
    Number(maxPrice !== null && maxPrice < 1000000)

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
    setHasOnboarded(false)
    setOnboardBudgetIndex(5)
    setOnboardUseCase('all')
    router.push('/laptops')
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
    } catch (err: any) {
      console.warn('[web search]: No online stores returned results.')
      setWebResults([])
      setWebSearchError(err.message || 'No online stores returned results.')
      return null
    } finally {
      setWebSearchLoading(false)
    }
  }

  return (
    <div className="laptops-browser">
      {/* AI Agent at the Center Bottom */}
      <button
        type="button"
        className="agent-launcher-right"
        onClick={() => router.push('/chat')}
        aria-label="Open AI Agent"
      >
        <Bot className="h-4 w-4" />
        <span>Ask AI Agent</span>
      </button>




      <section ref={catalogRef} className="border-2 border-foreground bg-background p-4 shadow-[6px_6px_0_var(--foreground)]">
        <div className="mb-4">
          <p className="font-mono text-[0.68rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Laptop Catalog & Live Results
          </p>
          <h2 className="text-xl font-black">
            {searchQuery ? `Results for "${searchQuery}"` : 'All Laptops'}
          </h2>

          <div className="mt-4 border-2 border-foreground bg-background p-4 rounded-lg shadow-[3px_3px_0_var(--foreground)] mb-6 animate-fade-in">
            {/* Budget Selector */}
            <div className="onboard-section mb-6">
              <div className="flex justify-between items-end mb-2">
                <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Budget Limit: <span className="font-black text-[#0000ff] text-base ml-1">{ONBOARD_BUDGET_STEPS[onboardBudgetIndex].display}</span>
                </p>
              </div>
              
              <div className="onboard-slider-container relative px-1">
                {/* Slider Track and ticks */}
                <div className="onboard-slider-track-ticks flex justify-between absolute w-[calc(100%-1rem)] left-[0.5rem] top-[14px] -translate-y-1/2 pointer-events-none">
                  {ONBOARD_BUDGET_STEPS.map((step, idx) => (
                    <span 
                      key={idx} 
                      className={`w-3 h-3 rounded-full border-2 border-foreground transition ${
                        idx <= onboardBudgetIndex ? 'bg-[#0000ff]' : 'bg-background'
                      }`} 
                    />
                  ))}
                </div>
                
                {/* Actual Input Range */}
                <input
                  type="range"
                  min="0"
                  max={ONBOARD_BUDGET_STEPS.length - 1}
                  step="1"
                  value={onboardBudgetIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value)
                    setOnboardBudgetIndex(idx)
                    setMaxPrice(ONBOARD_BUDGET_STEPS[idx].value)
                  }}
                  className="w-full relative z-10 opacity-0 cursor-pointer h-7"
                />
                
                {/* Visual Slider Cover / Track line */}
                <div className="onboard-slider-line absolute left-4 right-4 top-[14px] -translate-y-1/2 h-1 bg-foreground/20 pointer-events-none -z-10" />
                <div 
                  className="onboard-slider-fill absolute left-4 top-[14px] -translate-y-1/2 h-1 bg-[#0000ff] pointer-events-none -z-10 transition-all duration-150" 
                  style={{ width: `calc(${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 100}% - 1rem)` }}
                />
                
                {/* Custom thumb */}
                <div 
                  className="onboard-slider-thumb absolute top-[14px] -translate-y-1/2 w-5.5 h-5.5 rounded-full bg-[#0000ff] border-4 border-white shadow-[0_0_0_2px_var(--foreground)] pointer-events-none -translate-x-1/2 transition-all duration-150"
                  style={{ left: `calc(1rem + ${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 100}% - ${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 2}rem)` }}
                />

                {/* Labels */}
                <div className="flex justify-between mt-2.5 text-[0.68rem] font-bold text-muted-foreground font-mono">
                  {ONBOARD_BUDGET_STEPS.map((step, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setOnboardBudgetIndex(idx)
                        setMaxPrice(step.value)
                      }}
                      className={`transition hover:text-foreground ${
                        idx === onboardBudgetIndex ? 'text-[#0000ff] font-black scale-105' : ''
                      }`}
                    >
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-foreground/10 my-4" />

            {/* Purpose Dropdown Selector */}
            <div className="onboard-section">
              <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3.5">
                Purpose / Use Case
              </p>
              
              <div className="flex items-center gap-3">
                <div className="border-2 border-foreground bg-primary p-2.5 shadow-[2px_2px_0_var(--foreground)] rounded-md flex items-center justify-center">
                  {USE_CASE_ICONS[onboardUseCase] || <HelpCircle className="h-4 w-4 text-foreground" />}
                </div>
                <div className="relative flex-1 max-w-[280px]">
                  <select
                    value={onboardUseCase}
                    onChange={(e) => {
                      const val = e.target.value
                      setOnboardUseCase(val)
                      if (val === 'other' || val === 'all') {
                        setSelectedUseCase('all')
                      } else {
                        setSelectedUseCase(val)
                      }
                    }}
                    className="w-full appearance-none border-2 border-foreground bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_var(--foreground)] outline-none cursor-pointer rounded-md pr-10"
                  >
                    <option value="all">All Use Cases</option>
                    <option value="gaming">Gaming</option>
                    <option value="programming">Coding</option>
                    <option value="video-editing">Video Editing</option>
                    <option value="business">Business</option>
                    <option value="students">College</option>
                    <option value="content">Content Creator</option>
                    <option value="other">Other...</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" />
                </div>
              </div>

              {onboardUseCase === 'other' && (
                <div className="mt-3.5 animate-fade-in">
                  <input
                    type="text"
                    value={customUseCaseText}
                    onChange={(e) => setCustomUseCaseText(e.target.value)}
                    placeholder="Specify your custom use case (e.g. music production)"
                    className="w-full max-w-md border-2 border-foreground bg-background px-3 py-2 text-xs font-semibold shadow-[2px_2px_0_var(--foreground)] focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {!webSearchLoading && (filteredLaptops.length > 0 || webResults.length > 0) && activeFilters > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-black uppercase tracking-wider underline hover:text-destructive transition"
              >
                Clear filters
              </button>
            </div>
          )}
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
    </div>

  )
}
