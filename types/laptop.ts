export type CpuArch = 'x86' | 'ARM'
export type CpuBrand = 'Intel' | 'AMD' | 'Apple' | 'Qualcomm'
export type CpuSeries = 'U' | 'P' | 'H' | 'HX' | 'M-series' | 'X-series'
export type GpuType = 'integrated' | 'dedicated'
export type DisplayType = 'IPS' | 'OLED' | 'Mini-LED' | 'TN' | 'AMOLED'
export type RamType = 'LPDDR5X' | 'LPDDR5' | 'DDR5' | 'DDR4'
export type StorageType = 'NVMe' | 'SATA'
export type OsSupport = 'Windows' | 'macOS' | 'Linux' | 'any'

export type UseCaseTag =
  | 'video-editing'
  | 'programming'
  | 'gaming'
  | 'general'
  | 'business'
  | 'ai-ml'
  | 'design'
  | 'content'
  | 'students'

export interface Laptop {
  id: string
  name: string
  brand: string
  slug: string
  price_inr: number
  price_usd: number | null
  cpu_arch: CpuArch
  cpu_brand: CpuBrand
  cpu_series: CpuSeries
  cpu_model: string
  gpu_type: GpuType
  gpu_model: string
  gpu_tgp_watts: number
  ram_gb: number
  ram_type: RamType
  storage_gb: number
  storage_type: StorageType
  display_size: number
  display_type: DisplayType
  display_hz: number
  display_nits: number
  display_color_gamut: number | null
  battery_wh: number
  weight_kg: number
  os_support: OsSupport
  best_for: UseCaseTag[]
  pros: string
  cons: string
  affiliate_amazon_in: string
  affiliate_amazon_com: string | null
  image_url: string | null
  is_active: boolean
  last_updated: string
  created_at: string
}

export type LaptopInsert = Omit<Laptop, 'id' | 'created_at' | 'last_updated'>

export interface BudgetRange {
  label: string
  min: number
  max: number
}

export const BUDGET_RANGES: BudgetRange[] = [
  { label: 'Under ₹50,000', min: 0, max: 50000 },
  { label: '₹50,000 – ₹80,000', min: 50000, max: 80000 },
  { label: '₹80,000 – ₹1,20,000', min: 80000, max: 120000 },
  { label: '₹1,20,000 – ₹2,00,000', min: 120000, max: 200000 },
  { label: 'Above ₹2,00,000', min: 200000, max: 999999 },
]
