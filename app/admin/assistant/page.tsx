'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Trash2, Sparkles, Loader2, Database, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: Array<{ type: string; details: string }>
}

const SHORTCUTS = [
  '💻 Add a Dell XPS 15: Intel Core i7, 16GB RAM, 512GB NVMe, OLED screen, price is ₹1,85,000, best for coding & design, pros: premium build, cons: expensive.',
  '🎮 Add Lenovo Legion 5: Ryzen 7 7840HS, RTX 4060, 16GB DDR5, 1TB NVMe, IPS 165Hz screen, price ₹1,15,000, best for gaming.',
  '🔍 Search database for Asus Zephyrus laptops',
  '🗑️ Delete the test laptop we just added',
]

export default function AdminAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to **Laptick Admin Agent**! I am your database assistant. You can speak to me in plain English to insert, search, or update laptops in the database. Try typing details or clicking one of the shortcuts below.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isLoading) return

    setInput('')
    setError(null)

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const chatHistory = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Agent failed to respond.')
      }

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        actions: data.actions || []
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      let displayError = err?.message || 'Something went wrong. Please try again.'
      if (typeof displayError === 'string') {
        const trimmed = displayError.trim()
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed.error && typeof parsed.error === 'object' && parsed.error.message) {
              displayError = parsed.error.message
            } else if (parsed.error && typeof parsed.error === 'string') {
              displayError = parsed.error
            } else if (parsed.message) {
              displayError = parsed.message
            }
          } catch (e) {
            // keep original
          }
        }
      }
      
      const lowerErr = displayError.toLowerCase()
      if (lowerErr.includes('429') || lowerErr.includes('quota') || lowerErr.includes('exhausted')) {
        displayError = 'Gemini API Rate Limit or Quota Exceeded. Please configure a valid API key with higher limits, or wait a minute before retrying.'
      }
      
      setError(displayError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Format simple HTML
  function escapeHtml(text: string) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

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
          return `<div class="pl-4 py-0.5 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-400 font-semibold" key="${i}">${processed.slice(2)}</div>`
        }
        if (processed.trim() === '') return '<br/>'
        return `<p className="leading-relaxed">${processed}</p>`
      })
      .join('')
  }

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Conversation cleared. What administrative task can I help you with next?',
        timestamp: new Date()
      }
    ])
    setError(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
      {/* Chat Area */}
      <div className="flex flex-col border-2 border-foreground bg-white shadow-[4px_4px_0_var(--foreground)] overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] rounded-none">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b-2 border-foreground bg-zinc-100 py-3 px-4">
          <div className="flex items-center gap-2.5">
            <div className="border border-foreground bg-primary p-1.5 text-foreground rounded-none">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground leading-none">Catalog Agent</h2>
              <span className="text-[10px] font-bold text-foreground bg-primary border border-foreground px-1.5 py-0.5 rounded-none uppercase tracking-wider ml-2 inline-block">Gemini 2.5 Flash</span>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
          >
            Clear Conversation
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm bg-zinc-50" ref={chatContainerRef}>
          {messages.map((msg) => {
            const isModel = msg.role === 'assistant'
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isModel ? '' : 'ml-auto flex-row-reverse'}`}>
                {/* Avatar */}
                <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center border border-foreground rounded-none ${
                  isModel ? 'bg-primary text-foreground' : 'bg-zinc-200 text-foreground'
                }`}>
                  {isModel ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2">
                  <div className={`px-4 py-2.5 text-foreground border-2 border-foreground leading-relaxed shadow-[2px_2px_0_var(--foreground)] rounded-none ${
                    isModel 
                      ? 'bg-white' 
                      : 'bg-primary/20 text-foreground'
                  }`}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} 
                      className="space-y-1"
                    />
                  </div>

                  {/* Render database execution logs if any */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="space-y-1.5 pl-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        Actions executed:
                      </div>
                      <div className="flex flex-col gap-1">
                        {msg.actions.map((act, i) => (
                          <div 
                            key={i} 
                            className="inline-flex items-center gap-1.5 text-xs text-foreground font-bold bg-primary border-2 border-foreground px-2 py-0.5 shadow-[1px_1px_0_var(--foreground)] rounded-none"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse"></span>
                            <span className="uppercase text-[9px] font-black">{act.type}</span>
                            <span>{act.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex h-8 w-8 items-center justify-center border border-foreground rounded-none bg-primary text-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 border-2 border-foreground bg-white px-4 py-2.5 text-foreground rounded-none shadow-[2px_2px_0_var(--foreground)] font-bold">
                <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                <span>Agent is executing database queries...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-3 max-w-[80%] pl-11">
              <div className="flex items-center gap-2 border-2 border-foreground bg-red-100 p-3 text-xs font-bold text-red-700 rounded-none shadow-[2px_2px_0_var(--foreground)]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t-2 border-foreground p-3 bg-zinc-50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add or search laptops (e.g. 'Add a HP laptop with Intel i5...')"
              className="w-full border-2 border-foreground bg-white py-3 pr-12 pl-4 text-sm text-foreground placeholder-zinc-500 outline-none rounded-none focus:ring-2 focus:ring-accent"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 border border-foreground bg-primary p-1.5 text-foreground hover:bg-primary/90 active:translate-y-0.5 active:translate-x-0.5 shadow-[1px_1px_0_var(--foreground)] active:shadow-none rounded-none transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar: Shortcuts Info */}
      <div className="flex flex-col gap-5">
        <div className="border-2 border-foreground bg-white p-5 shadow-[4px_4px_0_var(--foreground)] rounded-none space-y-4">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-foreground" />
            Prompt Templates
          </h3>
          <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
            Click any shortcut template below to test natural language parsing capability:
          </p>
          <div className="space-y-2">
            {SHORTCUTS.map((sc, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sc.replace(/^[^a-zA-Z0-9]+/, ''))}
                disabled={isLoading}
                className="w-full text-left border-2 border-foreground bg-white p-2.5 text-xs text-foreground hover:bg-primary/10 shadow-[2px_2px_0_var(--foreground)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-[1px_1px_0_var(--foreground)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all rounded-none cursor-pointer text-ellipsis overflow-hidden line-clamp-2"
                title={sc}
              >
                {sc}
              </button>
            ))}
          </div>
        </div>

        <div className="border-2 border-foreground bg-white p-5 shadow-[4px_4px_0_var(--foreground)] rounded-none space-y-3.5 leading-relaxed">
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">How to use:</h4>
          <ul className="list-disc pl-4 text-xs text-muted-foreground font-semibold space-y-2">
            <li>Type any laptop specifications details and say <strong className="text-foreground font-bold">"Add this laptop"</strong>.</li>
            <li>Ask to <strong className="text-foreground font-bold">"search for..."</strong> to check current prices or specifications in the catalog.</li>
            <li>Specify a laptop name and fields to <strong className="text-foreground font-bold">"update fields on laptop X"</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
