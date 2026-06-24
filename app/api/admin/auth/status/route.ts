import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth-session'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  
  if (!token) {
    return NextResponse.json({ authenticated: false })
  }
  
  const payload = verifySessionToken(token)
  if (!payload) {
    return NextResponse.json({ authenticated: false })
  }
  
  return NextResponse.json({
    authenticated: true,
    email: payload.email,
  })
}
