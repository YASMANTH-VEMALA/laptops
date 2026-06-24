import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/auth-session'
import { getFallbackAdmins, saveFallbackAdmins } from '@/lib/auth-fallback'

const PRIMARY_ADMIN = process.env.ADMIN_EMAIL || 'yasmanthvemala007@gmail.com'

function isAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value
  return !!token && !!verifySessionToken(token)
}

// 1. GET: List all authorized admin emails
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      // If table does not exist, return fallback list containing primary admin
      const isMissingTable = 
        error.code === 'PGRST116' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('not found')

      if (isMissingTable) {
        const fallbackEmails = await getFallbackAdmins(supabase)
        const fallbackUsers = fallbackEmails.map((email, idx) => ({
          id: `fallback-${idx}`,
          email,
          created_at: new Date().toISOString(),
          is_primary: email.toLowerCase() === PRIMARY_ADMIN.toLowerCase()
        }))

        // Ensure primary admin is always in list
        if (!fallbackUsers.some((u) => u.email.toLowerCase() === PRIMARY_ADMIN.toLowerCase())) {
          fallbackUsers.unshift({
            id: 'primary',
            email: PRIMARY_ADMIN,
            created_at: new Date().toISOString(),
            is_primary: true
          })
        }

        return NextResponse.json({ users: fallbackUsers })
      }
      throw error
    }

    // Mark primary admin in list if found
    const markedUsers = (users || []).map((u: any) => ({
      ...u,
      is_primary: u.email.toLowerCase() === PRIMARY_ADMIN.toLowerCase()
    }))

    // If primary admin is not in database yet, prepend it to list
    if (!markedUsers.some((u) => u.email.toLowerCase() === PRIMARY_ADMIN.toLowerCase())) {
      markedUsers.unshift({
        id: 'primary',
        email: PRIMARY_ADMIN,
        created_at: new Date().toISOString(),
        is_primary: true
      })
    }

    return NextResponse.json({ users: markedUsers })
  } catch (err: any) {
    console.error('[GET admin users] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}

// 2. POST: Add a new authorized admin email
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const supabase = getServiceClient()

    const { error } = await supabase
      .from('admin_users')
      .insert([{ email: cleanEmail }])

    if (error) {
      const isMissingTable = 
        error.code === 'PGRST116' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('not found')

      if (isMissingTable) {
        const fallbackEmails = await getFallbackAdmins(supabase)
        if (fallbackEmails.some(e => e.toLowerCase() === cleanEmail) || cleanEmail === PRIMARY_ADMIN.toLowerCase()) {
          return NextResponse.json({ error: 'Email is already authorized' }, { status: 400 })
        }
        fallbackEmails.push(cleanEmail)
        const saved = await saveFallbackAdmins(supabase, fallbackEmails)
        if (!saved) {
          return NextResponse.json({ error: 'Failed to authorize email in fallback storage' }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }
      if (error.code === '23505') { // Unique constraint
        return NextResponse.json({ error: 'Email is already authorized' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST admin users] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}

// 3. DELETE: Remove admin authorization
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = req.nextUrl
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    if (cleanEmail === PRIMARY_ADMIN.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot revoke permissions from primary administrator' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('email', cleanEmail)

    if (error) {
      const isMissingTable = 
        error.code === 'PGRST116' || 
        error.code === '42P01' || 
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache') ||
        error.message?.includes('not found')

      if (isMissingTable) {
        const fallbackEmails = await getFallbackAdmins(supabase)
        const updatedEmails = fallbackEmails.filter(e => e.toLowerCase() !== cleanEmail)
        const saved = await saveFallbackAdmins(supabase, updatedEmails)
        if (!saved) {
          return NextResponse.json({ error: 'Failed to revoke permissions in fallback storage' }, { status: 500 })
        }
        return NextResponse.json({ success: true })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE admin user] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}

