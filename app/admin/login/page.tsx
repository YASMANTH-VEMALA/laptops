'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'

export default function AdminLoginPage() {
  // States
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errParam = params.get('error')
    
    if (errParam) {
      if (errParam === 'unauthorized_email') {
        setError('Your Google email is not authorized as an administrator.')
      } else if (errParam === 'credentials_not_configured') {
        setError('Google OAuth is not configured on this server.')
      } else if (errParam === 'token_exchange_failed' || errParam === 'userinfo_failed' || errParam === 'missing_code') {
        setError('Google authentication failed. Please try again.')
      } else {
        setError('Google login failed: ' + decodeURIComponent(errParam))
      }
    }
  }, [])

  const handleGoogleSignIn = () => {
    setError(null)
    const clientId = '14686486722-a8dirr0s57vf56efl8fpgvasa5ipdtt5.apps.googleusercontent.com'
    const redirectUri = `${window.location.origin}/api/admin/auth/google/callback`
    const scope = 'openid email profile'
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`
    window.location.href = googleAuthUrl
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground font-sans">
      <div className="relative w-full max-w-md border-2 border-foreground bg-white p-8 shadow-[6px_6px_0_var(--foreground)] rounded-none transition-all duration-300">
        
        <div className="relative space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-foreground bg-primary text-foreground shadow-[2px_2px_0_var(--foreground)]">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground font-display">Laptick Admin</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your Google account to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 border-2 border-foreground bg-red-100 p-3.5 text-sm text-red-700 font-bold shadow-[2px_2px_0_var(--foreground)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 border-2 border-foreground bg-white py-3.5 text-sm font-bold text-foreground shadow-[3px_3px_0_var(--foreground)] transition-all hover:bg-zinc-50 hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none rounded-none cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

