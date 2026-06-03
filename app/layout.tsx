import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'
import { generateOrganizationSchema } from '@/lib/seo-helpers'

const interSans = Inter({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Laptick — Find Your Perfect Laptop in India',
    template: '%s | Laptick',
  },
  description:
    'AI-powered laptop recommendations for students, developers, creators and gamers in India. Get expert advice with real specs explained simply. Free, no signup.',
  keywords: ['best laptop India', 'laptop buying guide', 'laptop recommendations India 2026'],
  metadataBase: new URL('https://laptick.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://laptick.in',
    siteName: 'Laptick',
  },
  twitter: { card: 'summary_large_image' },
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-accent">⚡</span> Laptick
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/laptops" className="hover:text-foreground transition-colors">
            All Laptops
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">
            Buying Guides
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="rounded-md bg-accent text-accent-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Find My Laptop
          </Link>
        </div>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/30 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        <div className="grid gap-6 sm:grid-cols-2 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-2">Laptick</p>
            <p className="text-xs leading-relaxed">
              AI-powered laptop recommendations for Indian buyers. Expert specs explained simply.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Quick Links</p>
            <ul className="space-y-1 text-xs">
              <li><Link href="/laptops" className="hover:text-foreground">All Laptops</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">Buying Guides</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/30 pt-4 space-y-2">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Laptick · Built for Indian laptop buyers
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Laptick contains affiliate links. We earn a commission when you purchase through Amazon links at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = generateOrganizationSchema()

  return (
    <html lang="en" className={`${interSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
