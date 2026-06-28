import type { Metadata } from 'next'
import { EB_Garamond, Inter, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { generateOrganizationSchema } from '@/lib/seo-helpers'
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper'
import { SITE_URL } from '@/lib/site'

const interSans = Inter({ variable: '--font-sans', subsets: ['latin'] })
const garamond = EB_Garamond({ variable: '--font-display', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Laptick - Get Perfect Laptop Recommendations in India',
    template: '%s | Laptick',
  },
  description:
    'AI-powered laptop recommendations for students, developers, creators and gamers in India. Compare real specs, prices, and buying guides. Free, no signup.',
  keywords: ['best laptop India', 'laptop buying guide India', 'laptop recommendations India 2026', 'best laptop recommendation India'],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Laptick - Laptop Recommendations in India',
    description: 'AI-powered laptop recommendations, buying guides, and real spec explanations for Indian buyers.',
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: 'Laptick',
    images: [
      {
        url: '/laptick-search-preview.png',
        width: 1200,
        height: 1200,
        alt: 'Laptick laptop recommendation logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laptick - Laptop Recommendations in India',
    description: 'AI-powered laptop recommendations, buying guides, and real spec explanations for Indian buyers.',
    images: ['/laptick-search-preview.png'],
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
