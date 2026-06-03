import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getServiceClient } from '@/lib/supabase'
import { ResultCard } from '@/components/ResultCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { RecommendationResponse } from '@/types/recommendation'
import type { Laptop } from '@/types/laptop'

export const metadata: Metadata = {
  title: 'Your Laptop Recommendations',
  description: 'Your personalised top 3 laptop recommendations with expert explanations.',
  robots: { index: false },
}

async function getResult(queryHash: string): Promise<RecommendationResponse | null> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('recommendation_cache')
    .select('result_json')
    .eq('query_hash', queryHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null

  const result = data.result_json as RecommendationResponse
  const laptopIds = result.result.top3.map((r) => r.laptop_id)

  const { data: laptops } = await supabase
    .from('laptops')
    .select('*')
    .in('id', laptopIds)

  if (!laptops) return null

  const laptopMap = Object.fromEntries(laptops.map((l: Laptop) => [l.id, l]))
  return { ...result, laptops: laptopMap }
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) notFound()

  const data = await getResult(id)
  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-6">
        <p className="text-5xl">⏰</p>
        <h1 className="text-2xl font-bold">Result expired or not found</h1>
        <p className="text-muted-foreground">
          Recommendation results are cached for 24 hours. Please run the tool again to get fresh
          results with the latest prices.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Get New Recommendations
          </Button>
        </Link>
      </div>
    )
  }

  const { result, laptops } = data
  const topLaptop = laptops[result.top3[0]?.laptop_id]

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Refine my search
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">Your Top 3 Laptops</h1>
          {result.from_cache && (
            <Badge variant="secondary" className="text-xs">
              Cached result
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Ranked specifically for your use case, budget, and priorities. Expand each card for the
          full expert explanation.
        </p>
      </div>

      {/* Result cards */}
      <div className="space-y-6">
        {result.top3.map((ranked) => {
          const laptop = laptops[ranked.laptop_id]
          if (!laptop) return null
          return <ResultCard key={ranked.rank} ranked={ranked} laptop={laptop} />
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground px-4">
        Prices shown are approximate and may vary on Amazon. Always verify the current price before
        purchasing. As an Amazon Associate, we earn from qualifying purchases.
      </p>
    </div>
  )
}
