// frontend/src/components/Header.tsx
import { Scale, Sparkles } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { motion } from 'framer-motion'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export function Header({ theme, setTheme }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b glass">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="relative"
              >
                <Scale className="h-8 w-8 text-primary" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-3 w-3 text-secondary" />
                </motion.div>
              </motion.div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">
                Pocket Traffic Lawyer
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                AI-Powered Indian Traffic Law Assistant
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <KeyboardShortcuts />
            <UserMenu />
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </motion.div>
        </div>
      </div>
    </header>
  )
}