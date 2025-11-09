import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Source } from '@/lib/types'
import { useState } from 'react'
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

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "group overflow-hidden transition-all duration-300",
        "hover:shadow-md hover:border-primary/30",
        isExpanded && "ring-2 ring-primary/20"
      )}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 text-left"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              animate={{ rotate: isExpanded ? 360 : 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 mt-0.5"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </motion.div>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {source.source}
                </h4>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Score Badge */}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                    getScoreColor(source.score)
                  )}>
                    {(source.score * 100).toFixed(0)}%
                  </span>
                  
                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>
              
              {/* Preview Snippet */}
              <p className={cn(
                "text-xs text-muted-foreground transition-all",
                !isExpanded && "line-clamp-2"
              )}>
                {source.snippet}
              </p>
            </div>
          </div>
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                <div className="space-y-3">
                  {/* Relevance Info */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Relevance:
                    </span>
                    <span className={cn(
                      "text-xs font-semibold",
                      getScoreColor(source.score)
                    )}>
                      {getScoreLabel(source.score)}
                    </span>
                  </div>

                  {/* Full Snippet */}
                  <div className="p-3 bg-background rounded-lg border">
                    <p className="text-xs text-foreground leading-relaxed">
                      {source.snippet}
                    </p>
                  </div>

                  {/* Action Button */}
                  {source.source.includes('http') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs group/btn"
                      asChild
                    >
                      <a
                        href={source.source}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-2 group-hover/btn:text-primary" />
                        View Original Source
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}