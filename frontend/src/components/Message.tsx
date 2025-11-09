import { User, Bot, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SourceCard } from './SourceCard'
import { AudioPlayer } from './AudioPlayer'
import { Message as MessageType } from '@/lib/types'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type)
    // TODO: Send feedback to backend
    console.log('Feedback:', type, message.id)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-500'
    if (confidence >= 0.4) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High Confidence'
    if (confidence >= 0.4) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div className={cn('flex gap-3 max-w-4xl', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md',
          isUser 
            ? 'bg-gradient-to-br from-secondary to-secondary/80' 
            : 'bg-gradient-to-br from-primary to-primary/70'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={cn('flex-1 space-y-3', isUser && 'flex flex-col items-end')}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={cn(
            'p-4 shadow-md transition-all duration-300',
            isUser 
              ? 'bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20' 
              : 'glass border-primary/10 hover:shadow-lg'
          )}>
            {isUser ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground">{message.content}</p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h3 className="text-base font-bold mt-3 mb-2 gradient-text" {...props} />,
                    h2: ({node, ...props}) => <h4 className="text-sm font-bold mt-2 mb-1 text-primary" {...props} />,
                    h3: ({node, ...props}) => <h5 className="text-sm font-semibold mt-2 mb-1" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-foreground" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1.5" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1.5" {...props} />,
                    li: ({node, ...props}) => <li className="ml-2 text-foreground" {...props} />,
                    code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Confidence Meter for AI responses */}
            {!isUser && message.confidence !== undefined && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-3 border-t space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {getConfidenceLabel(message.confidence)}
                  </span>
                  <span className="font-semibold text-primary">
                    {(message.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress 
                  value={message.confidence * 100} 
                  className="h-2"
                  indicatorClassName={getConfidenceColor(message.confidence)}
                />
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 w-full"
          >
            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-primary" />
              Legal References ({message.sources.length})
            </p>
            <div className="grid gap-2">
              {message.sources.map((source, index) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <SourceCard source={source} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        {!isUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <AudioPlayer text={message.content} />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 hover:bg-primary/10 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="ml-1 text-xs text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="ml-1 text-xs">Copy</span>
                </>
              )}
            </Button>

            <div className="h-4 w-px bg-border" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('up')}
              className={cn(
                "h-8 hover:bg-green-500/10 transition-colors",
                feedback === 'up' && "bg-green-500/20 text-green-600"
              )}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('down')}
              className={cn(
                "h-8 hover:bg-red-500/10 transition-colors",
                feedback === 'down' && "bg-red-500/20 text-red-600"
              )}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </motion.div>
        )}

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground flex items-center gap-2"
        >
          <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
          {message.timestamp.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </motion.div>
      </div>
    </div>
  )
}