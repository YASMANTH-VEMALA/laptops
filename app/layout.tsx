import type { Metadata } from 'next'
import { EB_Garamond, Inter, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { generateOrganizationSchema } from '@/lib/seo-helpers'
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper'

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
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  )
}
