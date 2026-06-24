'use client'

import { useEffect } from 'react'

export function LandingScrollLock() {
  useEffect(() => {
    const normalSite = document.querySelector<HTMLElement>('.laptick-normal-site')
    if (!normalSite) return

    let locked = false
    let frame = 0
    let lastTouchY = 0

    const getLockY = () => Math.max(0, normalSite.offsetTop)
    const getSnapPoint = () => 0

    const lockToWebsite = () => {
      locked = true
      document.body.classList.add('laptick-site-mode')
      const clamp = () => window.scrollTo({ top: getLockY(), behavior: 'auto' })
      clamp()
      window.requestAnimationFrame(clamp)
      window.setTimeout(clamp, 80)
      window.setTimeout(clamp, 180)
    }

    const handleScroll = () => {
      if (frame) return

      frame = window.requestAnimationFrame(() => {
        frame = 0
        const snapPoint = getSnapPoint()

        if (!locked && window.scrollY > 500 && normalSite.getBoundingClientRect().top <= snapPoint) {
          lockToWebsite()
          return
        }

        if (locked && window.scrollY < getLockY()) {
          window.scrollTo({ top: getLockY(), behavior: 'auto' })
        }
      })
    }

    const handleWheel = (event: WheelEvent) => {
      if (!locked) return

      const nextLockY = getLockY()
      if (event.deltaY < 0 && window.scrollY + event.deltaY <= nextLockY + 2) {
        event.preventDefault()
        window.scrollTo({ top: nextLockY, behavior: 'auto' })
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!locked) return

      const touchY = event.touches[0]?.clientY ?? lastTouchY
      const deltaY = lastTouchY - touchY
      lastTouchY = touchY

      const nextLockY = getLockY()
      if (deltaY < 0 && window.scrollY + deltaY <= nextLockY + 2) {
        event.preventDefault()
        window.scrollTo({ top: nextLockY, behavior: 'auto' })
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!locked) return
      if (!['ArrowUp', 'PageUp', 'Home'].includes(event.key)) return

      if (window.scrollY <= getLockY() + 2) {
        event.preventDefault()
        window.scrollTo({ top: getLockY(), behavior: 'auto' })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    handleScroll()

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      document.body.classList.remove('laptick-site-mode')
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null
}
