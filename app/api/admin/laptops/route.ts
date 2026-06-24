import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/auth-session'
import type { LaptopInsert } from '@/types/laptop'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Verifies if the request has a valid admin session.
 */
function isAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value
  return !!token && !!verifySessionToken(token)
}

// 1. GET: List all laptops
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const { data: laptops, error } = await supabase
      .from('laptops')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ laptops })
  } catch (err: any) {
    console.error('[GET laptops] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}

// 2. POST: Create a new laptop
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const laptopData = body as LaptopInsert

    if (!laptopData.name || !laptopData.brand || !laptopData.price_inr) {
      return NextResponse.json({ error: 'Name, Brand, and Price INR are required' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Generate unique slug
    let baseSlug = slugify(laptopData.name)
    if (!baseSlug) {
      baseSlug = 'laptop-' + Math.floor(Math.random() * 1000)
    }
    
    let slug = baseSlug
    let conflict = true
    let attempt = 0

    while (conflict && attempt < 10) {
      const { data, error } = await supabase
        .from('laptops')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        conflict = false
      } else {
        attempt++
        slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`
      }
    }

    const finalLaptop = {
      ...laptopData,
      slug,
      is_active: laptopData.is_active !== undefined ? laptopData.is_active : true,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('laptops')
      .insert([finalLaptop])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, laptop: data[0] })
  } catch (err: any) {
    console.error('[POST laptops] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}

// 3. PUT: Update an existing laptop
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'Laptop ID is required for update' }, { status: 400 })
    }

    const supabase = getServiceClient()

    // If name changed, we can optionally regenerate the slug or keep the old one.
    // Keeping the old one is standard to prevent broken links, but let's allow updating if slug is provided.
    const finalUpdate = {
      ...updateFields,
      last_updated: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('laptops')
      .update(finalUpdate)
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, laptop: data[0] })
  } catch (err: any) {
    console.error('[PUT laptops] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}
