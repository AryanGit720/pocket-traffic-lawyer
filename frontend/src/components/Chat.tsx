import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Message } from './Message'
import { MicButton } from './MicButton'
import { SuggestedQuestions } from './SuggestedQuestions'
import { ScrollToBottom } from './ScrollToBottom'
import { useChat } from '@/lib/hooks'
import { Message as MessageType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState('')
  const [isListeningActive, setIsListeningActive] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const micButtonRef = useRef<{ handleClick: () => void } | null>(null)
  const chatMutation = useChat()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Check scroll position
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom && messages.length > 0)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }

      // Ctrl+M or Cmd+M: Toggle microphone
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault()
        micButtonRef.current?.handleClick()
      }

      // Shift+Enter: New line (allow default behavior)
      // Enter alone: Submit (handled in form)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || chatMutation.isPending) return

    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    
    // Immediately clear input and disable speech updates
    setInput('')
    setIsListeningActive(false)

    try {
      const response = await chatMutation.mutateAsync(currentInput)
      
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date(response.timestamp),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Auto-submit
    const userMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])

    chatMutation.mutateAsync(question).then((response) => {
      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        confidence: response.confidence,
        timestamp: new Date(response.timestamp),
      }
      setMessages(prev => [...prev, assistantMessage])
    }).catch((error) => {
      console.error('Chat error:', error)
    })
  }

  // Live transcription handler
  const handleTranscriptUpdate = (text: string, isFinal: boolean) => {
    if (!chatMutation.isPending) {
      setInput(text)
      setIsListeningActive(true)
    }
  }

  const handleMicStatusChange = (isListening: boolean) => {
    if (!isListening) {
      setIsListeningActive(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] relative">
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <SuggestedQuestions onQuestionClick={handleSuggestedQuestion} />
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Message message={message} />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {chatMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70">
              <Sparkles className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div className="flex-1 glass rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span className="text-sm text-muted-foreground font-medium">
                  Analyzing traffic laws...
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <ScrollToBottom show={showScrollButton} onClick={scrollToBottom} />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass border-t"
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <div className="flex-1 relative group">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Indian traffic laws..."
                disabled={chatMutation.isPending}
                className={cn(
                  "h-12 pr-16 border-2 transition-all duration-300",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                  "group-hover:border-primary/50"
                )}
              />
              {input && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <kbd className="px-2 py-1 text-xs bg-muted rounded border border-border shadow-sm">
                    Enter ↵
                  </kbd>
                </motion.div>
              )}
            </div>
            
            <MicButton 
              ref={micButtonRef}
              onTranscriptUpdate={handleTranscriptUpdate}
              onStatusChange={handleMicStatusChange}
            />
            
            <Button 
              type="submit" 
              disabled={chatMutation.isPending || !input.trim()}
              size="lg"
              className={cn(
                "h-12 px-6 bg-gradient-to-r from-primary to-primary/80",
                "hover:from-primary/90 hover:to-primary/70",
                "transition-all duration-300 shadow-lg hover:shadow-xl",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          {messages.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-muted-foreground mt-3"
            >
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border border-border">Ctrl</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border border-border">K</kbd>
              {' to focus • '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border border-border">Ctrl</kbd>
              {' + '}
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs border border-border">M</kbd>
              {' for mic'}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  )
}