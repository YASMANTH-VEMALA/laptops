'use client'

import { useState } from 'react'
import { Share2, Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareCardProps {
  queryHash: string
  topLaptopName: string
  role: string
  primaryUse: string
}

export function ShareCard({ queryHash, topLaptopName, role, primaryUse }: ShareCardProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/share/${queryHash}`
      : `/share/${queryHash}`

  const shareText = `Best laptop for ${role} doing ${primaryUse}: ${topLaptopName} 🎯\n\nFind yours at`

  async function handleCopy() {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">Share your result</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Got a useful recommendation? Share it with friends who are also laptop shopping.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1 gap-2">
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy link
            </>
          )}
        </Button>
        <a
          href={`https://www.instagram.com/`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Instagram"
        >
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-3 w-3" />
            Instagram
          </Button>
        </a>
      </div>
    </div>
  )
}
