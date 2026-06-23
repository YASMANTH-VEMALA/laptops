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
    <div className="laptops-page laptops-agent-page">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
        <LaptopsClient laptops={laptops} />

        {laptops.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-foreground/20 bg-white p-12 text-center text-muted-foreground shadow-sm">
            <p className="text-5xl font-black text-foreground">0</p>
            <p className="mt-2">Database is being populated. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
