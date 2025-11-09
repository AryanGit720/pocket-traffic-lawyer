import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
  message?: string
}

export function TypingIndicator({ className, message = 'Analyzing traffic laws...' }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* AI Avatar */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="h-5 w-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Typing Animation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 glass rounded-2xl p-4 shadow-md"
      >
        <div className="space-y-3">
          {/* Dots */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
              />
            ))}
            <span className="text-sm text-muted-foreground font-medium ml-2">
              {message}
            </span>
          </div>

          {/* Progress bars simulation */}
          <div className="space-y-2">
            {[60, 80, 40].map((width, index) => (
              <motion.div
                key={index}
                className="h-1.5 bg-muted rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.8, delay: index * 0.15 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/50 to-primary rounded-full"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}