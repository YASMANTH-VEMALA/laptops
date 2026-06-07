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

function detectStore(url: string): { label: string; className: string } {
  if (url.includes('amazon') || url.includes('amzn.to')) {
    return {
      label: 'Buy on Amazon',
      className: 'w-full bg-[#FF9900] hover:bg-[#e68900] text-black font-semibold gap-2',
    }
  }
  if (url.includes('flipkart') || url.includes('fktr.in')) {
    return {
      label: 'Buy on Flipkart',
      className: 'w-full bg-[#2874f0] hover:bg-[#1a5fc8] text-white font-semibold gap-2',
    }
  }
  // Company website (ASUS store, etc.)
  return {
    label: 'Check Price',
    className: 'w-full gap-2',
  }
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

  const store = detectStore(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`${store.label} — ${laptopName} for ${formattedPrice}`}
      className="block"
    >
      <Button
        size={size}
        variant={variant}
        className={variant === 'default' ? store.className : 'w-full gap-2'}
      >
        <ShoppingCart className="h-4 w-4" />
        {store.label} — {formattedPrice}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </Button>
    </a>
  )
}
