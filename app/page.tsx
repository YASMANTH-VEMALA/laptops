import type { Metadata } from 'next'
import { ProvidedLandingPage } from '@/components/ProvidedLandingPage'

export const metadata: Metadata = {
  title: 'Laptick',
  description: 'Laptick landing page.',
}

export default function HomePage() {
  return (
    <div className="exact-animation-home">
      <ProvidedLandingPage />
    </div>
  )
}
