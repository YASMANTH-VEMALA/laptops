import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { verifySessionToken } from '@/lib/auth-session'

function isAuthorized(req: NextRequest): boolean {
  const token = req.cookies.get('admin_session')?.value
  return !!token && !!verifySessionToken(token)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Laptop ID is required' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('laptops')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE laptop] Error:', err)
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 })
  }
}
