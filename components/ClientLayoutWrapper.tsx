'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { NavLinks } from '@/components/NavLinks'
import { MobileNav } from '@/components/MobileNav'
import { AiAssistant } from '@/components/AiAssistant'

function SiteHeader({ isChat }: { isChat?: boolean }) {
  if (isChat) {
    return null
  }

  return (
    <header className="site-header sticky top-0 z-50">
      <div className="site-nav-bar">
        <Link href="/" className="site-logo">
          Laptick
        </Link>
        <nav className="site-nav-links hidden sm:flex">
          <NavLinks />
        </nav>
        <MobileNav />
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer mt-auto border-t border-border/70 bg-foreground text-background">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <div className="grid gap-8 text-sm text-background/70 sm:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="mb-2 font-display text-3xl italic text-background">Laptick</p>
            <p className="max-w-md text-sm leading-relaxed">
              A sharper way to buy laptops in India. Real specs, clear tradeoffs, and recommendations
              built around your work.
            </p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-background">Quick Links</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/laptops" className="hover:text-primary">
                  All Laptops
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary">
                  Buying Guides
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary">
                  Laptop Buying FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="space-y-2 border-t border-background/15 pt-5">
          <p className="text-center text-xs text-background/60">
            © {new Date().getFullYear()} Laptick · Built for Indian laptop buyers
          </p>
          <p className="text-center text-xs text-background/50">
            Laptick contains affiliate links. We earn a commission when you purchase through Amazon links
            at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  const isChat = pathname === '/chat'
  const isHome = pathname === '/'

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isHome && <SiteHeader isChat={isChat} />}
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
      {!isChat && <SiteFooter />}
      <AiAssistant />
    </div>
  )
}
