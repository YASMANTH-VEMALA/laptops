import type { Laptop, UseCaseTag } from './laptop'

export type UserRole =
  | 'student'
  | 'software-developer'
  | 'designer'
  | 'business-professional'
  | 'gamer'
  | 'content-creator'
  | 'ai-ml-engineer'

export type PrimaryUse =
  | 'coding'
  | 'gaming'
  | 'office-work'
  | 'video-editing'
  | 'graphic-design'
  | 'general-use'
  | 'ai-ml'

export type TopPriority =
  | 'battery-life'
  | 'raw-performance'
  | 'portability'
  | 'display-quality'
  | 'value-for-money'

export type OsPreference = 'Windows' | 'macOS' | 'Linux' | 'no-preference'

export interface RecommendationFormData {
  role: UserRole
  primary_use: PrimaryUse
  budget_key: string
  top_priority: TopPriority
  os_preference: OsPreference
  brand_preference?: string
}

export interface RankedLaptop {
  rank: 1 | 2 | 3
  laptop_id: string
  headline: string
  why_best: string
  key_strengths: [string, string, string]
  one_honest_weakness: string
  buy_confidence: 'High' | 'Medium'
  use_case_fit_score: number
}

// Lean ranking returned by Claude (explanations come from cache)
export interface RankedLaptopLean {
  rank: 1 | 2 | 3
  laptop_id: string
  headline: string
  buy_confidence: 'High' | 'Medium'
  use_case_fit_score: number
}

export interface RecommendationResult {
  top3: RankedLaptop[]
  generated_at: string
  from_cache: boolean
}

export interface RecommendationResponse {
  result: RecommendationResult
  laptops: Record<string, Laptop>
  query_hash: string
}

export interface LaptopExplanation {
  id: string
  laptop_id: string
  use_case: UseCaseTag
  explanation: string
  key_strengths: string[]
  one_weakness: string
  cached_at: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  'software-developer': 'Software Developer',
  designer: 'Designer',
  'business-professional': 'Business Professional',
  gamer: 'Gamer',
  'content-creator': 'Content Creator',
  'ai-ml-engineer': 'AI / ML Engineer',
}

export const USE_LABELS: Record<PrimaryUse, string> = {
  coding: 'Coding & Development',
  gaming: 'Gaming',
  'office-work': 'Office & Productivity',
  'video-editing': 'Video Editing',
  'graphic-design': 'Graphic Design',
  'general-use': 'General Use',
  'ai-ml': 'AI & Machine Learning',
}

export const PRIORITY_LABELS: Record<TopPriority, string> = {
  'battery-life': 'Battery Life',
  'raw-performance': 'Raw Performance',
  portability: 'Portability',
  'display-quality': 'Display Quality',
  'value-for-money': 'Value for Money',
}

export const OS_LABELS: Record<OsPreference, string> = {
  Windows: 'Windows',
  macOS: 'macOS (MacBook)',
  Linux: 'Linux',
  'no-preference': 'No Preference',
}

export const USE_CASE_TO_TAG: Record<PrimaryUse, UseCaseTag> = {
  coding: 'programming',
  gaming: 'gaming',
  'office-work': 'business',
  'video-editing': 'video-editing',
  'graphic-design': 'design',
  'general-use': 'general',
  'ai-ml': 'ai-ml',
}
