'use client'

import { useEffect, useState } from 'react'

// Finds a portal target inside the landing page's injected static HTML and
// re-acquires it if that HTML gets re-rendered (e.g. a same-route soft
// navigation replaces the DOM under an existing portal). The observer
// callback is a no-op unless the current slot was actually disconnected.
export function useLandingSlot(id: string): HTMLElement | null {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const reacquire = () =>
      setSlot((prev) => (prev && prev.isConnected ? prev : document.getElementById(id)))

    reacquire()
    const observer = new MutationObserver(reacquire)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [id])

  return slot
}
