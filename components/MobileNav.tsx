'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/chat', label: 'Chat with AI' },
  { href: '/laptops', label: 'All Laptops' },
  { href: '/blog', label: 'Buying Guides' },
  { href: '/understanding', label: 'Understanding' },
  { href: '/about', label: 'About' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 border-b border-border/30 bg-background z-50 px-4 py-3 space-y-1 shadow-sm">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${pathname === href
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
