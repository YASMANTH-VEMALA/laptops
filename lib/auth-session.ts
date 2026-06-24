import { createHmac } from 'crypto'

// Use Supabase Service Role Key as the session secret to sign tokens securely
const SESSION_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-key-change-in-prod'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days session persistence

/**
 * Creates a signed session token.
 */
export function createSessionToken(email: string): string {
  const expires = Date.now() + SESSION_DURATION
  const payload = JSON.stringify({ email, expires })
  const base64Payload = Buffer.from(payload).toString('base64url')
  
  const hmac = createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  return `${base64Payload}.${hmac}`
}

/**
 * Verifies a signed session token and returns the payload if valid.
 */
export function verifySessionToken(token: string): { email: string } | null {
  if (!token) return null
  
  const parts = token.split('.')
  if (parts.length !== 2) return null
  
  const [base64Payload, signature] = parts
  const expectedHmac = createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  
  if (signature !== expectedHmac) {
    return null
  }
  
  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'))
    if (payload.expires < Date.now()) {
      return null // Expired
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

const PENDING_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Creates a short-lived signed token indicating Google Auth succeeded, pending 2FA.
 */
export function createPending2faToken(email: string): string {
  const expires = Date.now() + PENDING_DURATION
  const payload = JSON.stringify({ email, expires, pending: true })
  const base64Payload = Buffer.from(payload).toString('base64url')
  
  const hmac = createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  return `${base64Payload}.${hmac}`
}

/**
 * Verifies the pending 2FA token.
 */
export function verifyPending2faToken(token: string): { email: string } | null {
  if (!token) return null
  
  const parts = token.split('.')
  if (parts.length !== 2) return null
  
  const [base64Payload, signature] = parts
  const expectedHmac = createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('base64url')
  
  if (signature !== expectedHmac) {
    return null
  }
  
  try {
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'))
    if (payload.expires < Date.now() || !payload.pending) {
      return null
    }
    return { email: payload.email }
  } catch {
    return null
  }
}

