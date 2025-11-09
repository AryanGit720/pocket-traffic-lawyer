import { useState, useEffect } from 'react'
import { Keyboard, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in message', category: 'Chat' },
  { keys: ['Ctrl', 'K'], description: 'Focus search/input', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Toggle keyboard shortcuts', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close dialog/modal', category: 'Navigation' },
  { keys: ['Ctrl', 'M'], description: 'Toggle microphone', category: 'Voice' },
  { keys: ['Ctrl', 'L'], description: 'Listen to last response', category: 'Voice' },
  { keys: ['Ctrl', 'C'], description: 'Copy last response', category: 'Actions' },
  { keys: ['Ctrl', 'N'], description: 'New conversation', category: 'Actions' },
]

const categories = Array.from(new Set(shortcuts.map(s => s.category)))

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + / to toggle shortcuts
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-primary/10"
        >
          <Keyboard className="h-4 w-4" />
          <span className="hidden md:inline">Shortcuts</span>
          <kbd className="hidden md:inline px-2 py-1 text-xs bg-muted rounded">
            Ctrl+/
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-sm text-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-xs text-muted-foreground">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs mx-1">Ctrl</kbd> + 
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs mx-1">/</kbd> anytime to toggle this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}