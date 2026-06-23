import Image from 'next/image'
import Link from 'next/link'
import type { Laptop } from '@/types/laptop'

interface LaptopCardProps {
  laptop: Laptop
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)
}

export function LaptopCard({ laptop }: LaptopCardProps) {
  return (
    <div className="flex flex-col gap-3 border border-foreground bg-background p-3">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {laptop.brand && (
          <div className="absolute left-2 top-2 z-10 border border-foreground bg-primary px-2 py-0.5 text-[0.65rem] font-black text-foreground">
            {laptop.brand}
          </div>
        )}
        {laptop.image_url ? (
          <Image
            src={laptop.image_url}
            alt={laptop.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-black text-muted-foreground">
            Image unavailable
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <Link
          href={`/laptops/${laptop.slug}`}
          className="line-clamp-2 text-sm font-black leading-tight text-foreground hover:bg-primary"
        >
          {laptop.name}
        </Link>

        <p className="text-lg font-black tracking-tight text-accent">{formatPrice(laptop.price_inr)}</p>

        <Link
          href={`/laptops/${laptop.slug}`}
          className="inline-block border border-foreground bg-primary px-3 py-1 text-center text-xs font-black uppercase tracking-wide text-foreground hover:bg-secondary"
        >
          View details
        </Link>
      </div>
    </div>
  )
}
