import { createHash } from 'crypto'
import type { RecommendationFormData } from '@/types/recommendation'

export function hashFormData(data: RecommendationFormData): string {
  const normalized = JSON.stringify({
    role: data.role,
    primary_use: data.primary_use,
    budget_key: data.budget_key,
    top_priority: data.top_priority,
    os_preference: data.os_preference,
  })
  return createHash('sha256').update(normalized).digest('hex')
}
