import type { Metadata } from 'next'
import { EB_Garamond, Inter, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import './globals.css'
import { NavLinks } from '@/components/NavLinks'
import { MobileNav } from '@/components/MobileNav'
import { generateOrganizationSchema } from '@/lib/seo-helpers'
import { AiAssistant } from '@/components/AiAssistant'

const interSans = Inter({ variable: '--font-sans', subsets: ['latin'] })
const garamond = EB_Garamond({ variable: '--font-display', subsets: ['latin'] })
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
    <header className="site-header sticky top-0 z-50">
      <div className="site-nav-bar">
        <Link href="/" className="site-logo">Laptick</Link>
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
              A sharper way to buy laptops in India. Real specs, clear tradeoffs, and recommendations built around your work.
            </p>
          </div>
          <div>
            <p className="mb-2 font-semibold text-background">Quick Links</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/laptops" className="hover:text-primary">All Laptops</Link></li>
              <li><Link href="/blog" className="hover:text-primary">Buying Guides</Link></li>
              <li><Link href="/about" className="hover:text-primary">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="space-y-2 border-t border-background/15 pt-5">
          <p className="text-center text-xs text-background/60">
            © {new Date().getFullYear()} Laptick · Built for Indian laptop buyers
          </p>
          <p className="text-center text-xs text-background/50">
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
    <html lang="en" className={`${interSans.variable} ${garamond.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
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
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <AiAssistant />
      </body>
    </html>
  )
}
