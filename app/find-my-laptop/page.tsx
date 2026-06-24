'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Briefcase, Camera, ChevronDown, Code, Film, Gamepad2, GraduationCap, HelpCircle } from 'lucide-react'

const ONBOARD_BUDGET_STEPS = [
  { value: 30000, label: '₹30K', display: '₹30K' },
  { value: 60000, label: '₹60K', display: '₹60K' },
  { value: 90000, label: '₹90K', display: '₹90K' },
  { value: 120000, label: '₹1.2L', display: '₹1.2L' },
  { value: 150000, label: '₹1.5L', display: '₹1.5L' },
  { value: 1000000, label: '1.5L+', display: '₹1.5L+' },
]

const USE_CASE_ICONS: Record<string, React.ReactNode> = {
  'video-editing': <Film className="h-4 w-4 text-foreground" />,
  students: <GraduationCap className="h-4 w-4 text-foreground" />,
  gaming: <Gamepad2 className="h-4 w-4 text-foreground" />,
  business: <Briefcase className="h-4 w-4 text-foreground" />,
  content: <Camera className="h-4 w-4 text-foreground" />,
  programming: <Code className="h-4 w-4 text-foreground" />,
  other: <HelpCircle className="h-4 w-4 text-foreground" />,
}

function FindMyLaptopQuiz() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [onboardBudgetIndex, setOnboardBudgetIndex] = useState(5) // default to ₹1.5L+
  const [onboardUseCase, setOnboardUseCase] = useState('gaming') // default to Gaming
  const [customUseCaseText, setCustomUseCaseText] = useState('')

  // Pre-populate selections from query params if available
  useEffect(() => {
    const budgetParam = searchParams.get('budget')
    const purposeTypeParam = searchParams.get('purpose_type')
    const customParam = searchParams.get('custom')

    if (budgetParam) {
      const val = Number(budgetParam)
      const idx = ONBOARD_BUDGET_STEPS.findIndex((s) => s.value === val)
      if (idx !== -1) setOnboardBudgetIndex(idx)
    }

    if (purposeTypeParam) {
      setOnboardUseCase(purposeTypeParam)
    }

    if (customParam) {
      setCustomUseCaseText(customParam)
    }
  }, [searchParams])

  function handleOnboardingSubmit() {
    const budgetObj = ONBOARD_BUDGET_STEPS[onboardBudgetIndex]
    const budgetVal = budgetObj.value

    let finalUseCase = onboardUseCase
    let customText = ''

    if (onboardUseCase === 'other') {
      finalUseCase = 'all'
      customText = customUseCaseText.trim()
    }

    const query = new URLSearchParams()
    query.set('budget', String(budgetVal))
    query.set('purpose', finalUseCase)
    if (onboardUseCase === 'other') {
      query.set('purpose_type', 'other')
      if (customText) query.set('custom', customText)
    } else {
      query.set('purpose_type', finalUseCase)
    }

    router.push(`/laptops?${query.toString()}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-mono text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          AI Laptop Advisor
        </p>
        <h1 className="mt-2 text-3xl font-black text-foreground">
          Find Your Perfect Laptop
        </h1>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          Answer two quick preferences questions and browse custom specs and AI recommendations in seconds.
        </p>
      </div>

      <div className="onboard-card border-2 border-foreground bg-background p-6 md:p-8 rounded-lg shadow-[6px_6px_0_var(--foreground)] mb-8 animate-fade-in">
        {/* Budget Selector */}
        <div className="onboard-section mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Your Budget
              </p>
              <div className="onboard-budget-value font-black text-[#0000ff] text-5xl md:text-6xl mt-1 leading-none">
                {ONBOARD_BUDGET_STEPS[onboardBudgetIndex].display}
              </div>
            </div>
          </div>
          
          <div className="onboard-slider-container relative mt-6 px-2">
            {/* Slider Track and ticks */}
            <div className="onboard-slider-track-ticks flex justify-between absolute w-[calc(100%-1rem)] left-[0.5rem] top-[14px] -translate-y-1/2 pointer-events-none">
              {ONBOARD_BUDGET_STEPS.map((step, idx) => (
                <span 
                  key={idx} 
                  className={`w-3.5 h-3.5 rounded-full border-2 border-foreground transition ${
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
              onChange={(e) => setOnboardBudgetIndex(Number(e.target.value))}
              className="w-full relative z-10 opacity-0 cursor-pointer h-7"
            />
            
            {/* Visual Slider Cover / Track line */}
            <div className="onboard-slider-line absolute left-4 right-4 top-[14px] -translate-y-1/2 h-1 bg-foreground/20 pointer-events-none -z-10" />
            <div 
              className="onboard-slider-fill absolute left-4 top-[14px] -translate-y-1/2 h-1 bg-[#0000ff] pointer-events-none -z-10 transition-all duration-150" 
              style={{ width: `calc(${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 100}% - 1rem)` }}
            />
            
            {/* Custom styled thumb that tracks the value */}
            <div 
              className="onboard-slider-thumb absolute top-[14px] -translate-y-1/2 w-6 h-6 rounded-full bg-[#0000ff] border-4 border-white shadow-[0_0_0_2px_var(--foreground)] pointer-events-none -translate-x-1/2 transition-all duration-150"
              style={{ left: `calc(1rem + ${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 100}% - ${(onboardBudgetIndex / (ONBOARD_BUDGET_STEPS.length - 1)) * 2}rem)` }}
            />

            {/* Labels below the track */}
            <div className="flex justify-between mt-4 text-xs font-bold text-muted-foreground font-mono">
              {ONBOARD_BUDGET_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOnboardBudgetIndex(idx)}
                  className={`transition hover:text-foreground ${
                    idx === onboardBudgetIndex ? 'text-[#0000ff] font-black scale-110' : ''
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 my-6" />

        {/* Purpose Selector */}
        <div className="onboard-section mb-6">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground mb-4">
            What do you use it for?
          </p>
          
          <div className="flex items-center gap-3">
            <div className="border-2 border-foreground bg-primary p-2.5 shadow-[2px_2px_0_var(--foreground)] rounded-md flex items-center justify-center">
              {USE_CASE_ICONS[onboardUseCase] || <HelpCircle className="h-4 w-4 text-foreground" />}
            </div>
            <div className="relative flex-1 max-w-[280px]">
              <select
                value={onboardUseCase}
                onChange={(e) => setOnboardUseCase(e.target.value)}
                className="w-full appearance-none border-2 border-foreground bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.08em] shadow-[2px_2px_0_var(--foreground)] outline-none cursor-pointer rounded-md pr-10"
              >
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

          {/* Custom Use Case Input */}
          {onboardUseCase === 'other' && (
            <div className="mt-4 animate-fade-in">
              <input
                type="text"
                value={customUseCaseText}
                onChange={(e) => setCustomUseCaseText(e.target.value)}
                placeholder="Specify your custom use case (e.g. Music production, Excel sheets, Casual browsing...)"
                className="w-full max-w-xl border-2 border-foreground bg-background px-4 py-2.5 text-sm font-semibold shadow-[3px_3px_0_var(--foreground)] focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Find Laptops Action */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <p className="text-xs font-bold text-muted-foreground leading-relaxed hidden sm:block">
            Select budget and purpose to filter the catalog and trigger the AI laptop recommendations.
          </p>
          <button
            type="button"
            onClick={handleOnboardingSubmit}
            className="w-full sm:w-auto border-2 border-foreground bg-accent px-6 py-3 font-black uppercase tracking-[0.12em] text-accent-foreground shadow-[4px_4px_0_var(--foreground)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_var(--foreground)]"
          >
            Find Laptops
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FindMyLaptopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading quiz...</div>}>
      <FindMyLaptopQuiz />
    </Suspense>
  )
}
