import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

function getRatelimit() {
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
  const { success, remaining, reset } = await getRatelimit().limit(ip)
  return { allowed: success, remaining, reset }
}
