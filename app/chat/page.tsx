import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getServiceClient } from '@/lib/supabase'
import { AiChatClient } from '@/components/AiChatClient'
import type { Laptop } from '@/types/laptop'

export const metadata: Metadata = {
  title: 'Chat — Find Your Laptop',
  description: 'Converse with Laptick AI to find the perfect laptop that matches your specifications and budget.',
}

export const dynamic = 'force-dynamic'

async function getLaptops(): Promise<Laptop[]> {
  const { data } = await getServiceClient()
    .from('laptops')
    .select('*')
    .eq('is_active', true)
    .order('price_inr', { ascending: true })

  return (data as Laptop[]) ?? []
}

export default async function ChatPage() {
  const laptops = await getLaptops()

  return (
    <div className="chat-page text-foreground flex flex-col h-screen overflow-hidden">
      <div className="mx-auto max-w-[1500px] w-full px-3 py-4 sm:px-5 lg:px-6 flex-1 flex flex-col min-h-0 overflow-hidden">
        <Suspense fallback={<div className="p-8 text-center font-bold font-mono">Initializing Laptick AI...</div>}>
          <AiChatClient laptops={laptops} />
        </Suspense>
      </div>
    </div>
  )
}
