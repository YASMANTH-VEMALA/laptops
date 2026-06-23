import type { Metadata } from 'next'
import Link from 'next/link'
import { getServiceClient } from '@/lib/supabase'
import type { RecommendationResponse } from '@/types/recommendation'
import type { Laptop } from '@/types/laptop'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'My Laptop Recommendation — Laptick',
    description: 'See which laptop was recommended for me on Laptick. Get your own recommendation free.',
  }
}

async function getSharedResult(id: string) {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from('recommendation_cache')
    .select('result_json')
    .eq('query_hash', id)
    .single()

  if (!data) return null
  const result = data.result_json as RecommendationResponse
  const laptopIds = result.result.top3.map((r) => r.laptop_id)
  
  const { data: laptops } = await supabase.from('laptops').select('*').in('id', laptopIds)
  
  const foundLaptopIds = new Set((laptops || []).map((l: any) => l.id))
  const missingIds = laptopIds.filter(id => !foundLaptopIds.has(id))

  let mappedProducts: Laptop[] = []
  if (missingIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', missingIds)
    
    if (products) {
      mappedProducts = products.map((prod: any) => {
        const cpu = prod.specs?.cpu || ''
        const cpuBrand = cpu.toLowerCase().includes('amd') ? 'AMD' : cpu.toLowerCase().includes('apple') ? 'Apple' : cpu.toLowerCase().includes('qualcomm') ? 'Qualcomm' : 'Intel'
        const cpuSeries = cpu.toLowerCase().includes('hx') ? 'HX' : cpu.toLowerCase().includes('h') ? 'H' : cpu.toLowerCase().includes('p') ? 'P' : cpu.toLowerCase().includes('m') ? 'M-series' : 'U'
        
        const ramGb = parseInt(prod.specs?.ram || '8') || 8
        const storageGb = parseInt(prod.specs?.storage || '512') || 512
        const displaySize = parseFloat(prod.specs?.display || '15.6') || 15.6
        const isOled = prod.title.toLowerCase().includes('oled') || (prod.specs?.display || '').toLowerCase().includes('oled')

        return {
          id: prod.id,
          name: prod.title,
          brand: prod.brand || 'Generic',
          slug: prod.id,
          price_inr: prod.price || 0,
          price_usd: null,
          cpu_arch: cpuBrand === 'Apple' || cpuBrand === 'Qualcomm' ? 'ARM' : 'x86',
          cpu_brand: cpuBrand,
          cpu_series: cpuSeries,
          cpu_model: cpu || 'Processor',
          gpu_type: 'integrated',
          gpu_model: 'Graphics',
          gpu_tgp_watts: 0,
          ram_gb: ramGb,
          ram_type: prod.specs?.ram?.includes('DDR5') ? 'DDR5' : 'DDR4',
          storage_gb: storageGb,
          storage_type: 'NVMe',
          display_size: displaySize,
          display_type: isOled ? 'OLED' : 'IPS',
          display_hz: 60,
          display_nits: 300,
          display_color_gamut: 100,
          battery_wh: 50,
          weight_kg: 1.6,
          os_support: 'Windows',
          best_for: [],
          pros: '',
          cons: '',
          affiliate_amazon_in: prod.product_url || '',
          affiliate_amazon_com: null,
          image_url: prod.image_url,
          is_active: true,
          last_updated: prod.last_updated_at || new Date().toISOString(),
          created_at: prod.first_seen_at || new Date().toISOString(),
        } as unknown as Laptop
      })
    }
  }

  const allLaptops = [...(laptops || []), ...mappedProducts]
  if (allLaptops.length === 0) return null

  const laptopMap = Object.fromEntries((allLaptops as Laptop[]).map((l) => [l.id, l]))
  return { result, laptops: laptopMap }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getSharedResult(id)

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-4xl">🔗</p>
          <p className="font-semibold">This shared result has expired.</p>
          <Link href="/" className="text-blue-400 hover:underline text-sm">
            Get your own recommendation →
          </Link>
        </div>
      </div>
    )
  }

  const top = data.result.result.top3[0]
  const topLaptop = top ? data.laptops[top.laptop_id] : null

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p)

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Share card visual */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 p-8 space-y-4">
          <p className="text-5xl">🏆</p>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended for me</p>
            <p className="text-xl font-bold">{topLaptop?.name ?? 'Top Pick'}</p>
            {topLaptop && (
              <p className="text-blue-400 font-semibold mt-1">{formatPrice(topLaptop.price_inr)}</p>
            )}
          </div>
          {top && (
            <p className="text-sm text-muted-foreground italic">&ldquo;{top.headline}&rdquo;</p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This recommendation was generated by Laptick — free AI-powered laptop advice for India.
          </p>
          <Link
            href="/"
            className="block w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Get My Own Recommendation →
          </Link>
        </div>
      </div>
    </div>
  )
}
