'use client'

import { useState, useRef, useEffect } from 'react'
import { AiChatClient } from '@/components/AiChatClient'
import type { Laptop } from '@/types/laptop'
import dynamic from 'next/dynamic'

const Laptop3DScene = dynamic(() => import('./Laptop3DScene'), { ssr: false })

interface AnimatedChatLandingProps {
  laptops: Laptop[]
}

export function AnimatedChatLanding({ laptops }: AnimatedChatLandingProps) {
  const [animationComplete, setAnimationComplete] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll through the animation over 4 seconds
    const startTime = Date.now()
    const duration = 4000 // 4 seconds
    let animationId: number

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Scroll to position that drives the 3D animation
      // The container is 400vh tall, so scroll 0-400vh
      const scrollTarget = progress * window.innerHeight * 4
      if (animationScrollRef.current) {
        animationScrollRef.current.scrollTop = scrollTarget
      }

      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        // Animation complete, transition to chat
        setAnimationComplete(true)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className="animated-chat-landing" ref={containerRef}>
      <style>{`
        .animated-chat-landing {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .animation-scroll-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow-y: scroll;
          scroll-behavior: auto;
          z-index: 50;
          transition: opacity 0.6s ease-out, visibility 0.6s ease-out;
        }

        .animation-scroll-container.fade-out {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .animation-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .animation-scroll-content {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .animation-spacer {
          height: 300vh;
          width: 100%;
          pointer-events: none;
        }

        .chat-section {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          background: white;
          z-index: 10;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.6s ease-out, visibility 0.6s ease-out;
          overflow-y: auto;
        }

        .chat-section.visible {
          opacity: 1;
          visibility: visible;
        }

        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          border-bottom: 2px solid hsl(0 0% 2%);
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 32px;
          transition: transform 0.3s ease-out, opacity 0.3s ease-out;
          transform-origin: top;
        }

        .sticky-header.hidden {
          transform: translateY(-100%);
          opacity: 0;
          pointer-events: none;
        }

        .sticky-header .logo {
          background: #d9ff3f;
          border: 2px solid hsl(0 0% 2%);
          padding: 4px 12px;
          font-weight: 950;
          font-size: 14px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sticky-header nav {
          display: flex;
          gap: 24px;
          flex: 1;
          align-items: center;
        }

        .sticky-header nav span {
          font-size: 14px;
          font-weight: 500;
          color: hsl(0 0% 2%);
          cursor: pointer;
          white-space: nowrap;
        }

        .chat-wrapper {
          padding: 20px;
          max-width: 1500px;
          margin: 0 auto;
        }
      `}</style>

      {/* Animation Phase - Scrollable Container */}
      <div className={`animation-scroll-container ${animationComplete ? 'fade-out' : ''}`} ref={animationScrollRef}>
        <div className="animation-scroll-content">
          <Laptop3DScene />
        </div>
        <div className="animation-spacer" />
      </div>

      {/* Chat Phase */}
      <div className={`chat-section ${animationComplete ? 'visible' : ''}`}>
        <header className={`sticky-header ${!headerVisible ? 'hidden' : ''}`}>
          <span className="logo">Laptick</span>
          <nav>
            <span>Chat with AI</span>
            <span>All Laptops</span>
            <span>Buying Guides</span>
            <span>Understanding</span>
            <span>About</span>
          </nav>
        </header>
        <div className="chat-wrapper">
          <ChatWithInputHandler laptops={laptops} onUserInput={() => setHeaderVisible(false)} />
        </div>
      </div>
    </div>
  )
}

interface ChatWithInputHandlerProps {
  laptops: Laptop[]
  onUserInput: () => void
}

function ChatWithInputHandler({ laptops, onUserInput }: ChatWithInputHandlerProps) {
  const handleInputStart = (e: React.FocusEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    if (e.type === 'focus' || e.type === 'keydown') {
      onUserInput()
    }
  }

  return (
    <div onFocus={handleInputStart} onKeyDown={handleInputStart}>
      <AiChatClient laptops={laptops} />
    </div>
  )
}
