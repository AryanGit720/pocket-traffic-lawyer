import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface ScrollToBottomProps {
  show: boolean
  onClick: () => void
}

export function ScrollToBottom({ show, onClick }: ScrollToBottomProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 right-4 z-10"
        >
          <Button
            onClick={onClick}
            size="icon"
            className="rounded-full shadow-lg hover:shadow-xl transition-shadow pulse-glow"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}