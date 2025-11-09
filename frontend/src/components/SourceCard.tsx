import { FileText, ExternalLink, ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Source } from '@/lib/types'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SourceCardProps {
  source: Source
}

export function SourceCard({ source }: SourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50 dark:bg-green-950'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    return 'text-orange-600 bg-orange-50 dark:bg-orange-950'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'High Relevance'
    if (score >= 0.4) return 'Medium Relevance'
    return 'Low Relevance'
  }

  const prettyHost = useMemo(() => {
    try {
      const u = new URL(source.source)
      return u.hostname.replace('www.', '')
    } catch {
      return null
    }
  }, [source.source])

  const isLink = /^https?:\/\//i.test(source.source)

  return (
    <motion.div whileHover={{ scale: 1.005 }} transition={{ duration: 0.15 }}>
      <Card className={cn(
        'group overflow-hidden transition-all duration-300',
        'hover:shadow-md hover:border-primary/30',
        isExpanded && 'ring-2 ring-primary/20'
      )}>
        <div className="w-full p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {prettyHost || source.source}
                </h4>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                    getScoreColor(source.score)
                  )}>
                    {(source.score * 100).toFixed(0)}%
                  </span>

                  {isLink && (
                    <a
                      href={source.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      title="Open source"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>
                  )}

                  <button
                    onClick={() => setIsExpanded(v => !v)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Expand"
                  >
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Preview Snippet */}
              <p className={cn('text-xs text-muted-foreground transition-all', !isExpanded && 'line-clamp-2')}>
                {source.snippet}
              </p>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 pb-4 pt-2 border-t bg-muted/30"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Relevance:</span>
                  <span className={cn('text-xs font-semibold', getScoreColor(source.score))}>
                    {getScoreLabel(source.score)}
                  </span>
                </div>

                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-foreground leading-relaxed">{source.snippet}</p>
                </div>

                {isLink && (
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs group/btn" asChild>
                    <a href={source.source} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2 group-hover/btn:text-primary" />
                      View Original Source
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}