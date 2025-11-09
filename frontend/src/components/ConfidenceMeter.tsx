import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfidenceMeterProps {
  confidence: number
  showLabel?: boolean
  showIcon?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

export function ConfidenceMeter({ 
  confidence, 
  showLabel = true,
  showIcon = true,
  className,
  variant = 'default'
}: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100)
  
  const getConfidenceLevel = (conf: number) => {
    if (conf >= 0.7) return {
      level: 'High',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      icon: TrendingUp,
      description: 'Strong match found in legal documents'
    }
    if (conf >= 0.4) return {
      level: 'Medium',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      icon: Minus,
      description: 'Partial match, verify details'
    }
    return {
      level: 'Low',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      icon: TrendingDown,
      description: 'Limited match, consult expert'
    }
  }

  const config = getConfidenceLevel(confidence)
  const Icon = config.icon

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          {showIcon && <Icon className={cn('h-3 w-3', config.color)} />}
          <span className={cn('text-xs font-semibold', config.color)}>
            {percentage}%
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className={cn('space-y-3 p-4 rounded-lg glass border', className)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showIcon && (
              <div className={cn('p-1.5 rounded-lg', config.bgColor, 'bg-opacity-10')}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">
                {config.level} Confidence
              </p>
              <p className="text-xs text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>
          <span className={cn('text-lg font-bold', config.color)}>
            {percentage}%
          </span>
        </div>

        <div className="space-y-1">
          <Progress 
            value={percentage} 
            className="h-2"
            indicatorClassName={config.bgColor}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded bg-muted/50">
            <p className="font-semibold text-foreground">{Math.round(confidence * 5)}/5</p>
            <p className="text-muted-foreground">Relevance</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/50">
            <p className="font-semibold text-foreground">
              {confidence >= 0.7 ? 'A+' : confidence >= 0.4 ? 'B' : 'C'}
            </p>
            <p className="text-muted-foreground">Grade</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/50">
            <p className="font-semibold text-foreground">
              {confidence >= 0.7 ? '✓' : confidence >= 0.4 ? '~' : '!'}
            </p>
            <p className="text-muted-foreground">Status</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={cn('space-y-2', className)}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {showIcon && <Icon className={cn('h-4 w-4', config.color)} />}
          {showLabel && (
            <span className="text-muted-foreground font-medium">
              {config.level} Confidence
            </span>
          )}
        </div>
        <span className={cn('font-semibold', config.color)}>
          {percentage}%
        </span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        indicatorClassName={config.bgColor}
      />
    </motion.div>
  )
}