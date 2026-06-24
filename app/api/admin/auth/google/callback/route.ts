import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getFallbackAdmins } from '@/lib/auth-fallback'
import { createSessionToken } from '@/lib/auth-session'

const PRIMARY_ADMIN = process.env.ADMIN_EMAIL || 'yasmanthvemala007@gmail.com'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/admin/login?error=missing_code', req.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials are not configured.')
      return NextResponse.redirect(new URL('/admin/login?error=credentials_not_configured', req.url))
    }

    // Determine the redirect URI dynamically to match the current origin
    const origin = req.nextUrl.origin
    const redirectUri = `${origin}/api/admin/auth/google/callback`

    // 1. Exchange auth code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('Google Token Exchange failed:', errText)
      return NextResponse.redirect(new URL('/admin/login?error=token_exchange_failed', req.url))
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. Fetch user profile/email
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userinfoResponse.ok) {
      console.error('Google Userinfo failed')
      return NextResponse.redirect(new URL('/admin/login?error=userinfo_failed', req.url))
    }

    const userData = await userinfoResponse.json()
    const email = userData.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.redirect(new URL('/admin/login?error=missing_email', req.url))
    }

    // 3. Verify if email is authorized
    let isAuthorized = email === PRIMARY_ADMIN.toLowerCase()

    if (!isAuthorized) {
      const supabase = getServiceClient()
      try {
        // Query the admin_users table
        const { data, error } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', email)
          .maybeSingle()

        if (!error && data) {
          isAuthorized = true
        } else if (error) {
          // If table is missing, check fallback
          const isMissingTable = 
            error.code === 'PGRST116' || 
            error.code === '42P01' || 
            error.message?.includes('does not exist') ||
            error.message?.includes('schema cache') ||
            error.message?.includes('not found')

          if (isMissingTable) {
            const fallbackEmails = await getFallbackAdmins(supabase)
            if (fallbackEmails.some(e => e.toLowerCase() === email)) {
              isAuthorized = true
            }
          }
        }
      } catch (dbErr) {
        console.error('Database authorization check error:', dbErr)
      }
    }

    if (!isAuthorized) {
      console.warn(`Unauthorized login attempt by Google user: ${email}`)
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized_email', req.url))
    }

    // 4. Set the final signed admin_session cookie and redirect to /admin
    const token = createSessionToken(email)
    const response = NextResponse.redirect(new URL('/admin', req.url))

    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (err: any) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(err.message || 'unknown_error')}`, req.url))
  }
}
