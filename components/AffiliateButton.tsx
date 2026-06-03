'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AffiliateButtonProps {
  url: string
  laptopName: string
  price: number
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline'
}

export function AffiliateButton({
  url,
  laptopName,
  price,
  size = 'default',
  variant = 'default',
}: AffiliateButtonProps) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Buy ${laptopName} on Amazon India for ${formattedPrice}`}
      className="block"
    >
      <Button
        size={size}
        variant={variant}
        className={
          variant === 'default'
            ? 'w-full bg-[#FF9900] hover:bg-[#e68900] text-black font-semibold gap-2'
            : 'w-full gap-2'
        }
      >
        <ShoppingCart className="h-4 w-4" />
        Buy on Amazon — {formattedPrice}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </Button>
    </a>
  )
}
