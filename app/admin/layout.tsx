'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Laptop, Bot, LogOut, ShieldCheck, Users } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Don't render the header and layout wrapper on the login page itself
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await fetch('/api/admin/auth/logout', { method: 'POST' })
        router.push('/admin/login')
        router.refresh()
      } catch (err) {
        console.error('Logout error:', err)
      }
    })
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/laptops', label: 'Laptops Catalog', icon: Laptop },
    { href: '/admin/assistant', label: 'AI Agent Assistant', icon: Bot },
    { href: '/admin/users', label: 'Manage Admins', icon: Users },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-white py-3 shadow-[4px_4px_0_var(--foreground)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center border-2 border-foreground bg-primary text-foreground font-bold">
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-lg font-black tracking-tight text-foreground font-display">
              Laptick<span className="ml-1 bg-foreground text-primary px-1.5 py-0.5 text-xs font-bold font-sans">Admin</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 border-2 border-foreground px-4 py-1.5 text-sm font-bold shadow-[2px_2px_0_var(--foreground)] transition-all hover:bg-primary/20 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ${
                    isActive
                      ? 'bg-primary text-foreground'
                      : 'bg-white text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-2 border-2 border-foreground bg-white px-3.5 py-1.5 text-sm font-bold text-foreground shadow-[2px_2px_0_var(--foreground)] hover:bg-red-100 hover:text-red-600 active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Subnav for Mobile */}
      <div className="border-b-2 border-foreground md:hidden bg-white mb-2 shadow-[2px_2px_0_var(--foreground)]">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 text-[10px] font-bold border border-foreground transition-all ${
                  isActive ? 'bg-primary text-foreground' : 'bg-white text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label.split(' ')[0]} {/* Shorten label for mobile */}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}

