import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

function isRateLimitConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    !process.env.UPSTASH_REDIS_REST_URL.includes('your-upstash') &&
    process.env.UPSTASH_REDIS_REST_TOKEN &&
    !process.env.UPSTASH_REDIS_REST_TOKEN.includes('your-')
  )
}

function getRatelimit() {
  if (!isRateLimitConfigured()) return null

  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      analytics: true,
      prefix: 'laptop-advisor:rl',
    })
  }
  return ratelimit
}

export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean
  remaining: number
  reset: number
}> {
  const rl = getRatelimit()
  if (!rl) {
    return { allowed: true, remaining: 999, reset: Date.now() + 3600000 }
  }
  try {
    const { success, remaining, reset } = await rl.limit(ip)
    return { allowed: success, remaining, reset }
  } catch (error) {
    console.warn('[rateLimit.ts] Rate limit check failed, allowing request:', error)
    return { allowed: true, remaining: 999, reset: Date.now() + 3600000 }
  }
}
