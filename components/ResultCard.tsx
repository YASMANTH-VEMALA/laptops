'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Trophy,
  Medal,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  Weight,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AffiliateButton } from '@/components/AffiliateButton'
import { SpecGrid } from '@/components/SpecBadge'
import type { RankedLaptop } from '@/types/recommendation'
import type { Laptop } from '@/types/laptop'
import { cn } from '@/lib/utils'

const RANK_CONFIG = {
  1: {
    icon: Trophy,
    label: 'Best Pick',
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/5',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  2: {
    icon: Medal,
    label: 'Runner Up',
    color: 'text-slate-300',
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/5',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
  3: {
    icon: Award,
    label: 'Great Value',
    color: 'text-amber-600',
    border: 'border-amber-700/40',
    bg: 'bg-amber-700/5',
    badge: 'bg-amber-700/20 text-amber-500 border-amber-700/40',
  },
} as const

interface ResultCardProps {
  ranked: RankedLaptop
  laptop: Laptop
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function ResultCard({ ranked, laptop }: ResultCardProps) {
  const [expanded, setExpanded] = useState(true)
  const cfg = RANK_CONFIG[ranked.rank]
  const RankIcon = cfg.icon

  const specs = [
    {
      label: 'Processor',
      value: `${laptop.cpu_brand} ${laptop.cpu_series}-series`,
      highlight: laptop.cpu_series === 'H' || laptop.cpu_series === 'HX',
    },
    {
      label: 'GPU',
      value:
        laptop.gpu_type === 'dedicated'
          ? `${laptop.gpu_model} ${laptop.gpu_tgp_watts}W`
          : `${laptop.gpu_model}`,
      highlight: laptop.gpu_type === 'dedicated',
    },
    { label: 'RAM', value: `${laptop.ram_gb}GB`, highlight: laptop.ram_gb >= 16 },
    { label: 'Storage', value: `${laptop.storage_gb}GB ${laptop.storage_type}` },
    {
      label: 'Display',
      value: `${laptop.display_size}" ${laptop.display_type} ${laptop.display_hz}Hz`,
      highlight: laptop.display_type === 'OLED',
    },
    { label: 'Battery', value: `${laptop.battery_wh}Wh` },
    { label: 'Weight', value: `${laptop.weight_kg}kg` },
  ]

  return (
    <Card className="overflow-hidden transition-all duration-200 border-l-4" style={{ borderLeftColor: 'var(--color-accent)' }}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          {/* Laptop image */}
          <div className="relative h-36 w-full sm:h-20 sm:w-32 sm:flex-shrink-0 overflow-hidden rounded-md bg-secondary">
            {laptop.image_url ? (
              <Image
                src={laptop.image_url}
                alt={laptop.name}
                fill
                className="object-contain p-2"
                sizes="(max-width: 640px) 100vw, 128px"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Monitor className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="default" className="text-xs">
                #{ranked.rank} {cfg.label}
              </Badge>
              <Badge
                variant="default"
                className={cn(
                  'text-xs',
                  ranked.buy_confidence === 'High'
                    ? 'bg-status-success/10 text-status-success border-status-success/30'
                    : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                )}
              >
                {ranked.buy_confidence} Confidence
              </Badge>
            </div>
            <Link
              href={`/laptops/${laptop.slug}`}
              className="font-bold text-lg leading-tight hover:underline"
            >
              {laptop.name}
            </Link>
            <p className="mt-1 text-sm font-medium text-accent">
              {formatPrice(laptop.price_inr)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground italic">&quot;{ranked.headline}&quot;</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Spec grid — always visible */}
        <SpecGrid specs={specs} />

        {/* Expand/collapse why section */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <span>Why this laptop is right for you</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {expanded && (
          <div className="space-y-4 pt-1">
            {/* Expert explanation */}
            <div className="rounded-lg bg-muted/30 border border-border/50 p-4">
              <p className="text-sm leading-relaxed text-foreground/90">{ranked.why_best}</p>
            </div>

            {/* Strengths + Weakness */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--status-success)]">
                  Key Strengths
                </p>
                {ranked.key_strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--status-success)]" />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--status-warning)]">
                  One Weakness
                </p>
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--status-warning)]" />
                  <span className="text-sm">{ranked.one_honest_weakness}</span>
                </div>
              </div>
            </div>

            <Separator />
          </div>
        )}

        {/* Affiliate CTA */}
        <AffiliateButton
          url={laptop.affiliate_amazon_in}
          laptopName={laptop.name}
          price={laptop.price_inr}
          size="lg"
        />

        <p className="text-center text-xs text-muted-foreground">
          As an Amazon Associate, we earn from qualifying purchases.
        </p>
      </CardContent>
    </Card>
  )
}
