'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AiChatClient } from '@/components/AiChatClient'
import { useLandingSlot } from '@/components/useLandingSlot'
import type { Laptop } from '@/types/laptop'

// Renders the AI chat into the post-animation landing section
// (#landing-chat-slot in provided-landing/source.html). While the user is
// typing or chatting, `laptick-chat-active` on <body> hides the site header.
export function LandingChat({ laptops }: { laptops: Laptop[] }) {
  const slot = useLandingSlot('landing-chat-slot')

  useEffect(() => {
    return () => document.body.classList.remove('laptick-chat-active')
  }, [])

  const handleActivity = useCallback((active: boolean) => {
    document.body.classList.toggle('laptick-chat-active', active)
  }, [])

  // The chat logo links to "/" — a soft navigation on the landing page
  // replaces the injected HTML under our portals. Reload instead so the
  // visitor gets the landing animation from the top.
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    const anchor = (e.target as Element).closest?.('a[href="/"]')
    if (anchor) {
      e.preventDefault()
      e.stopPropagation()
      window.location.assign('/')
    }
  }, [])

  if (!slot) return null
  return createPortal(
    <div
      className="landing-chat mx-auto max-w-[1500px] w-full h-full flex flex-col min-h-0 overflow-hidden text-foreground font-sans"
      onClickCapture={handleClickCapture}
    >
      <AiChatClient laptops={laptops} onActivityChange={handleActivity} />
    </div>,
    slot
  )
}
