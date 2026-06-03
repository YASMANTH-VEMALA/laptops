import Image from 'next/image'
import Link from 'next/link'
import { Monitor, Cpu, Zap } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AffiliateButton } from '@/components/AffiliateButton'
import type { Laptop } from '@/types/laptop'

interface LaptopCardProps {
  laptop: Laptop
  showAffiliate?: boolean
}

const USE_CASE_LABELS: Record<string, string> = {
  'video-editing': 'Video Editing',
  programming: 'Coding',
  gaming: 'Gaming',
  general: 'General',
  business: 'Business',
  'ai-ml': 'AI / ML',
  design: 'Design',
  content: 'Creator',
  students: 'Students',
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function LaptopCard({ laptop, showAffiliate = true }: LaptopCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-colors hover:shadow-md">
      <div className="relative aspect-video bg-secondary">
        {laptop.image_url ? (
          <Image
            src={laptop.image_url}
            alt={laptop.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Monitor className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <CardContent className="flex-1 pt-4 space-y-3">
        <div>
          <Link
            href={`/laptops/${laptop.slug}`}
            className="font-bold text-base leading-tight hover:underline line-clamp-2"
          >
            {laptop.name}
          </Link>
          <p className="mt-1 text-lg font-bold text-accent">{formatPrice(laptop.price_inr)}</p>
        </div>

        {/* Key specs inline */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            <span>
              {laptop.cpu_brand} {laptop.cpu_series}-series
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{laptop.ram_gb}GB RAM</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Monitor className="h-3 w-3" />
            <span>
              {laptop.display_size}" {laptop.display_type} · {laptop.weight_kg}kg
            </span>
          </div>
        </div>

        {/* Use case tags */}
        <div className="flex flex-wrap gap-1">
          {laptop.best_for.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {USE_CASE_LABELS[tag] ?? tag}
            </Badge>
          ))}
        </div>

        {/* Pros preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">{laptop.pros}</p>
      </CardContent>

      {showAffiliate && (
        <CardFooter className="pt-0">
          <AffiliateButton
            url={laptop.affiliate_amazon_in}
            laptopName={laptop.name}
            price={laptop.price_inr}
            size="sm"
          />
        </CardFooter>
      )}
    </Card>
  )
}
