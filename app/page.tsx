import type { Metadata } from 'next'
import { ProvidedLandingPage } from '@/components/ProvidedLandingPage'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Laptick - Best Laptop Recommendations in India',
  description:
    'Get AI-powered laptop recommendations in India for students, developers, gamers, creators, and business users. Compare real specs, prices, and buying guides.',
  keywords: ['best laptop recommendations India', 'AI laptop advisor India', 'laptop buying guide India'],
}

export default function HomePage() {
  return (
    <div className="exact-animation-home exact-animation-home-landing">
      <ProvidedLandingPage />
    </div>
  )
}
