import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabase
    .from('laptops')
    .select('brand')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ brands: [] }, { status: 500 })
  }

  const brands = [...new Set((data ?? []).map((l: { brand: string }) => l.brand))]
    .filter(Boolean)
    .sort()

  return NextResponse.json({ brands })
}
