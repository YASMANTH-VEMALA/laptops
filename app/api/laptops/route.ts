import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const brand = searchParams.get('brand')
  const useCase = searchParams.get('use_case')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  let query = supabase.from('laptops').select('*').eq('is_active', true)

  if (brand) query = query.eq('brand', brand)
  if (useCase) query = query.contains('best_for', [useCase])
  if (minPrice) query = query.gte('price_inr', parseInt(minPrice))
  if (maxPrice) query = query.lte('price_inr', parseInt(maxPrice))

  const { data, error } = await query
    .order('price_inr', { ascending: true })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ laptops: data, count: data?.length ?? 0 })
}
