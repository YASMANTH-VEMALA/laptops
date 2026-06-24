import { createHmac } from 'crypto'

/**
 * Decodes a base32 string into a Uint8Array.
 */
function decodeBase32(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = base32.toUpperCase().replace(/=+$/, '')
  const length = clean.length
  const buffer = new Uint8Array(Math.floor((length * 5) / 8))
  let bits = 0
  let value = 0
  let index = 0

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i])
    if (val === -1) {
      throw new Error('Invalid base32 character in secret key')
    }
    value = (value << 5) | val
    bits += 5
    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }
  return buffer
}

function calculateTOTPForCounter(key: Uint8Array, counter: number): string {
  const buffer = Buffer.alloc(8)
  let tmp = counter
  for (let j = 7; j >= 0; j--) {
    buffer[j] = tmp & 0xff
    tmp = tmp >> 8
  }

  const hmac = createHmac('sha1', key).update(buffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff
  return (binary % 1000000).toString().padStart(6, '0')
}

/**
 * Verifies a 6-digit TOTP token against a Base32 secret.
 * Supports a clock drift window (default +/- 1 step of 30 seconds).
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  try {
    const cleanToken = token.trim()
    if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) {
      return false
    }

    const key = decodeBase32(secret)
    const epoch = Math.floor(Date.now() / 1000)
    const counter = Math.floor(epoch / 30)

    const expectedCodes: string[] = []
    
    // 1. Standard verification window
    for (let i = -window; i <= window; i++) {
      const currentCounter = counter + i
      const totp = calculateTOTPForCounter(key, currentCounter)
      expectedCodes.push(totp)
      if (totp === cleanToken) {
        return true
      }
    }

    // 2. India timezone offset drift fallback (+5.5 hours / 330 minutes)
    // 5.5 hours = 19800 seconds = 660 steps of 30 seconds
    const istOffsetSteps = 660
    for (let i = -window; i <= window; i++) {
      const currentCounter = counter + istOffsetSteps + i
      const totp = calculateTOTPForCounter(key, currentCounter)
      if (totp === cleanToken) {
        console.warn(
          `[TOTP] Verification succeeded using India Standard Time (IST) offset drift fallback (+5.5 hours). Please fix your device's date/time and timezone settings.`
        )
        return true
      }
    }

    console.warn(
      `[TOTP] Mismatch. Entered: "${cleanToken}". Expected: [${expectedCodes.join(', ')}]. Server time: ${new Date().toISOString()}`
    )
  } catch (err) {
    console.error('[totp.ts] Verification failed:', err)
  }
  return false
}
