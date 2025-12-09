'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Sparkles, 
  Trash2,
  Loader2,
  MessageSquare,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { fadeIn, popIn, globalTransition, staggerContainer } from '@/lib/motion/presets'
import { getSuggestedQuestions } from '@/lib/persona/prompts'
import { getConfidenceLevel } from '@/lib/persona/utils'
import type { PersonaResponse } from '@/lib/types/persona'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  confidence?: number
  safe?: boolean
  timestamp: Date
}

interface AskHiveModalProps {
  open: boolean
  onClose: () => void
  context?: Record<string, any>
  pageContext?: string
}

export function AskHiveModal({ 
  open, 
  onClose, 
  context,
  pageContext = 'dashboard'
}: AskHiveModalProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prefersReduced = usePrefersReducedMotion()

  const suggestedQuestions = getSuggestedQuestions(pageContext)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = async (query: string) => {
    if (!query.trim() || loading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: query.trim(), 
          context: { ...context, pageContext } 
        }),
      })

      const data: PersonaResponse = await res.json()

      if (!res.ok) {
        throw new Error(data.text || 'Failed to get response')
      }

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.text,
        confidence: data.confidence,
        safe: data.safe,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error: ${error.message}. Please try again.`,
        confidence: 0,
        safe: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([])
    setInput('')
  }

  const motionProps = prefersReduced ? {} : {
    initial: 'hidden',
    animate: 'visible',
    exit: 'hidden',
  }

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            {...motionProps}
            variants={popIn}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] z-50 flex flex-col"
          >
            <div className="hive-card hive-card-cyan flex flex-col h-full sm:h-auto sm:max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hive-cyan to-hive-amber flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Ask Hive</h2>
                    <p className="text-xs text-gray-400">Your AI intelligence assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearChat}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      aria-label="Clear chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-6">
                      Ask me about narratives, creators, trends, or strategy
                    </p>
                    
                    {/* Suggested questions */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 mb-2">
                        <Lightbulb className="w-3 h-3 inline mr-1" />
                        Try asking:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestedQuestions.slice(0, 3).map((q, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => sendMessage(q)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-hive-cyan/50 hover:text-white transition-colors"
                          >
                            {q}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user'
                    const confidenceInfo = msg.confidence !== undefined 
                      ? getConfidenceLevel(msg.confidence) 
                      : null

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex gap-3',
                          isUser ? 'flex-row-reverse' : ''
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                          isUser 
                            ? 'bg-hive-amber/20 text-hive-amber'
                            : 'bg-gradient-to-br from-hive-cyan to-hive-amber'
                        )}>
                          {isUser ? (
                            <span className="text-xs font-bold">You</span>
                          ) : (
                            <Sparkles className="w-4 h-4 text-black" />
                          )}
                        </div>

                        {/* Message bubble */}
                        <div className={cn(
                          'flex-1 max-w-[80%]',
                          isUser ? 'text-right' : ''
                        )}>
                          <div className={cn(
                            'inline-block p-3 rounded-xl text-sm',
                            isUser 
                              ? 'bg-hive-amber/20 text-white'
                              : 'bg-white/5 text-gray-300'
                          )}>
                            <div 
                              className="prose prose-invert prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ 
                                __html: msg.content
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\n/g, '<br/>') 
                              }} 
                            />
                          </div>
                          
                          {/* Meta info for assistant */}
                          {!isUser && confidenceInfo && (
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                              <span className={confidenceInfo.color}>
                                {msg.confidence}% confidence
                              </span>
                              <span>•</span>
                              <span>
                                {msg.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                )}

                {/* Loading indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-hive-cyan to-hive-amber flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-black" />
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about narratives, creators, or trends..."
                    rows={1}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-hive-cyan/50 resize-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-hive-cyan to-hive-amber text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                  AI responses are directional. Always verify important decisions.
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AskHiveModal
