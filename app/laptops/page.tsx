import type { Metadata } from 'next'
import { getServiceClient } from '@/lib/supabase'
import { LaptopsClient } from '@/components/LaptopsClient'
import type { Laptop } from '@/types/laptop'

export const metadata: Metadata = {
  title: 'All Laptops — Browse by Brand, Use Case & Budget',
  description:
    'Browse 100+ laptops available in India with full specs, expert reviews and Amazon prices. Filter by brand, use case and budget range.',
}

export const dynamic = 'force-dynamic'

async function getLaptops(): Promise<Laptop[]> {
  const { data } = await getServiceClient()
    .from('laptops')
    .select('*')
    .eq('is_active', true)
    .order('price_inr', { ascending: true })

  return (data as Laptop[]) ?? []
}

export default async function LaptopsPage() {
  const laptops = await getLaptops()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">All Laptops</h1>
        <p className="text-muted-foreground">
          {laptops.length} laptops available in India · Prices updated weekly
        </p>
      </div>

      {/* SEO intro */}
      <p className="text-sm text-muted-foreground max-w-3xl">
        Every laptop includes real spec breakdowns — not marketing copy. We list the actual GPU
        TGP wattage, sustained CPU performance class, and which tasks each laptop handles well.
        Use the recommendation tool above for personalised advice.
      </p>

      {/* Client-side filtering */}
      <LaptopsClient laptops={laptops} />

      {laptops.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-5xl mb-4">💻</p>
          <p>Database is being populated. Check back soon.</p>
        </div>
      )}
    </div>
  )
}
