'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Cpu, Monitor, Battery, DollarSign, Zap, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  ROLE_LABELS,
  USE_LABELS,
  PRIORITY_LABELS,
  OS_LABELS,
  type RecommendationFormData,
} from '@/types/recommendation'
import { BUDGET_RANGES } from '@/types/laptop'

const REQUIRED_FIELDS = ['role', 'primary_use', 'budget_key', 'top_priority', 'os_preference'] as const

const BASE_FORM_FIELDS = [
  {
    key: 'role' as const,
    label: 'Who are you?',
    icon: <Cpu className="h-5 w-5" />,
    hint: 'Helps us match laptops used by people in your field',
    options: Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    key: 'primary_use' as const,
    label: 'What will you mainly do?',
    icon: <Monitor className="h-5 w-5" />,
    hint: 'Your #1 task — we optimise everything around this',
    options: Object.entries(USE_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    key: 'budget_key' as const,
    label: 'What is your budget?',
    icon: <DollarSign className="h-5 w-5" />,
    hint: 'We only show laptops actually available in this range',
    options: BUDGET_RANGES.map((b) => ({ value: b.label, label: b.label })),
  },
  {
    key: 'top_priority' as const,
    label: 'What matters most to you?',
    icon: <Zap className="h-5 w-5" />,
    hint: 'Tiebreaker when two laptops are equally good',
    options: Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
  {
    key: 'os_preference' as const,
    label: 'Operating system?',
    icon: <Battery className="h-5 w-5" />,
    hint: 'macOS only runs on Apple hardware',
    options: Object.entries(OS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  },
]

export function RecommendationForm() {
  const router = useRouter()
  const [form, setForm] = useState<Partial<RecommendationFormData>>({ brand_preference: 'no-preference' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/brands')
      .then((r) => r.json())
      .then(({ brands }) => setBrands(brands ?? []))
      .catch(() => {})
  }, [])

  const brandOptions = [
    { value: 'no-preference', label: 'No preference — show best overall' },
    ...brands.map((b) => ({ value: b, label: b })),
  ]

  const isComplete = REQUIRED_FIELDS.every((f) => form[f])

  async function handleSubmit() {
    if (!isComplete) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.status === 429) {
        setError('Too many requests. Please wait an hour before trying again.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      const data = await res.json()
      router.push(`/result?id=${data.query_hash}`)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {BASE_FORM_FIELDS.map((field) => (
        <Card key={field.key}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">{field.icon}</div>
              <div className="flex-1 space-y-2.5">
                <div>
                  <p className="font-medium text-sm">{field.label}</p>
                  <p className="text-xs text-muted-foreground">{field.hint}</p>
                </div>
                <Select
                  value={(form[field.key] as string) ?? ''}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, [field.key]: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Brand preference — optional, populated dynamically from DB */}
      {brandOptions.length > 1 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">
                <Tag className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div>
                  <p className="font-medium text-sm">Preferred brand? <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span></p>
                  <p className="text-xs text-muted-foreground">Limit to one brand, or let us pick the best across all</p>
                </div>
                <Select
                  value={form.brand_preference ?? 'no-preference'}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, brand_preference: val ?? undefined }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive text-center px-4 py-2 rounded-md bg-destructive/10 border border-destructive/20">
          {error}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isComplete || loading}
        size="lg"
        className="w-full text-base font-semibold py-6"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analysing {REQUIRED_FIELDS.filter((f) => form[f]).length * 20}% complete…
          </>
        ) : (
          'Find My Perfect Laptop →'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        No signup required · Results in under 5 seconds · Free forever
      </p>
    </div>
  )
}
