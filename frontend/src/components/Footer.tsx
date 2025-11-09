import { Heart, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="border-t glass mt-auto">
      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
            <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">Legal Disclaimer</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This application provides informational content about Indian traffic laws and is not a substitute for professional legal advice. Always consult with a qualified legal professional for specific legal matters.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          <motion.div 
            className="text-center md:text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
              Made with <Heart className="w-4 h-4 text-red-500 fill-current" /> for safer roads in India
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              © {currentYear} Pocket Traffic Lawyer • For informational purposes only
            </p>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-muted-foreground">
              Powered by AI • Motor Vehicles Act 1988 • CMVR 1989
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}