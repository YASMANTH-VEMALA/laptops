'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  '💻 Best laptop under ₹50K?',
  '🎮 Gaming laptop recommendations',
  '👨‍💻 Best for coding & development',
  '🎬 Video editing on a budget',
]

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    setHasInteracted(true)
    setError(null)
    setInput('')

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setHasInteracted(false)
    setError(null)
  }

  // Escapes HTML tags to prevent XSS vulnerabilities
  function escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Format markdown-like text simply and safely
  function formatContent(text: string) {
    const escaped = escapeHtml(text)
    return escaped
      .split('\n')
      .map((line, i) => {
        // Bold
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Bullet points
        if (processed.startsWith('- ') || processed.startsWith('• ')) {
          return `<div class="ai-bullet" key="${i}">${processed.slice(2)}</div>`
        }
        if (processed.trim() === '') return '<br/>'
        return `<p>${processed}</p>`
      })
      .join('')
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-fab"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        id="ai-assistant-toggle"
      >
        <div className={`ai-fab-icon ${isOpen ? 'ai-fab-icon--open' : ''}`}>
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
              <line x1="10" y1="22" x2="14" y2="22" />
              <circle cx="10" cy="10" r="1" fill="currentColor" />
              <circle cx="14" cy="10" r="1" fill="currentColor" />
              <path d="M9 14c.6.9 1.6 1.5 3 1.5s2.4-.6 3-1.5" />
            </svg>
          )}
        </div>
        {!isOpen && !hasInteracted && (
          <span className="ai-fab-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      <div className={`ai-panel ${isOpen ? 'ai-panel--open' : ''}`} role="dialog" aria-label="Laptick AI Assistant">
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header-info">
            <div className="ai-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
                <circle cx="10" cy="10" r="1" fill="currentColor" />
                <circle cx="14" cy="10" r="1" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h3 className="ai-header-title">Laptick AI</h3>
              <span className="ai-header-status">
                <span className="ai-status-dot" />
                Always ready to help
              </span>
            </div>
          </div>
          <div className="ai-header-actions">
            {messages.length > 0 && (
              <button onClick={clearChat} className="ai-clear-btn" title="Clear chat" aria-label="Clear chat history">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="ai-close-btn" aria-label="Close chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="ai-messages" ref={chatContainerRef}>
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">💻</div>
              <h4>Hey! I&apos;m Laptick AI</h4>
              <p>
                Your personal laptop advisor. Ask me anything about laptops — budget picks, specs comparison, or what&apos;s best for your use case.
              </p>
              <div className="ai-quick-prompts">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="ai-quick-btn"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ai-msg--${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="ai-msg-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
                  </svg>
                </div>
              )}
              <div className="ai-msg-bubble">
                {msg.role === 'assistant' ? (
                  <div
                    className="ai-msg-content"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
                ) : (
                  <div className="ai-msg-content">{msg.content}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="ai-msg ai-msg--assistant">
              <div className="ai-msg-avatar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5 7.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.5c2.9-1.2 5-4.1 5-7.5a8 8 0 0 0-8-8z" />
                </svg>
              </div>
              <div className="ai-msg-bubble">
                <div className="ai-typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="ai-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="ai-input-area">
          <div className="ai-input-wrap">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about laptops..."
              className="ai-input"
              rows={1}
              disabled={isLoading}
              maxLength={2000}
              id="ai-chat-input"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="ai-send-btn"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="ai-disclaimer">AI can make mistakes. Verify specs before purchasing.</p>
        </div>
      </div>
    </>
  )
}
