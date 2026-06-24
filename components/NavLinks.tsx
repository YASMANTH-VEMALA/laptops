'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/chat', label: 'Chat with AI' },
  { href: '/laptops', label: 'Laptops' },
  { href: '/blog', label: 'Buying Guides' },
  { href: '/understanding', label: 'Understanding' },
  { href: '/about', label: 'About' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {NAV_ITEMS.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`site-nav-link${isActive ? ' site-nav-link--active' : ''}`}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
