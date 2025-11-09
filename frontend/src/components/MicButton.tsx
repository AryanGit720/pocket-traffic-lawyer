import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiveSpeechRecognition } from '@/lib/hooks'
import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface MicButtonProps {
  onTranscriptUpdate: (text: string, isFinal: boolean) => void
  onStatusChange?: (isListening: boolean) => void
}

export const MicButton = forwardRef<{ handleClick: () => void }, MicButtonProps>(
  ({ onTranscriptUpdate, onStatusChange }, ref) => {
    const {
      isListening,
      transcript,
      interimTranscript,
      startListening,
      stopListening,
      resetTranscript,
      isSupported,
    } = useLiveSpeechRecognition()

    // Notify parent of status changes
    useEffect(() => {
      if (onStatusChange) {
        onStatusChange(isListening)
      }
    }, [isListening, onStatusChange])

    // Update parent component with live transcript
    useEffect(() => {
      if (isListening) {
        const fullTranscript = transcript + interimTranscript
        if (fullTranscript) {
          onTranscriptUpdate(fullTranscript, !interimTranscript)
        }
      }
    }, [transcript, interimTranscript, isListening, onTranscriptUpdate])

    // Auto-stop after 2 seconds of silence
    useEffect(() => {
      if (transcript && !interimTranscript && isListening) {
        const timer = setTimeout(() => {
          stopListening()
        }, 2000)

        return () => clearTimeout(timer)
      }
    }, [transcript, interimTranscript, isListening, stopListening])

    const handleClick = () => {
      if (isListening) {
        stopListening()
      } else {
        resetTranscript()
        startListening()
      }
    }

    // Expose handleClick to parent via ref
    useImperativeHandle(ref, () => ({
      handleClick,
    }))

    if (!isSupported) {
      return (
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="h-12"
          disabled
          title="Speech recognition not supported in this browser"
        >
          <Mic className="h-5 w-5 opacity-50" />
        </Button>
      )
    }

    return (
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'secondary'}
            size="lg"
            onClick={handleClick}
            className={cn(
              "h-12 transition-all duration-300 shadow-md",
              isListening && "shadow-lg shadow-red-500/50"
            )}
          >
            <motion.div
              animate={isListening ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </motion.div>
          </Button>
        </motion.div>
        
        <AnimatePresence>
          {isListening && (
            <>
              {/* Recording indicator */}
              <motion.span 
                className="absolute -top-1 -right-1 flex h-4 w-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 shadow-lg" />
              </motion.span>
              
              {/* Waveform animation */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-1"
              >
                {[0, 150, 300, 450, 600].map((delay, index) => (
                  <motion.div
                    key={index}
                    className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
                    animate={{
                      height: ['8px', '16px', '8px'],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: delay / 1000,
                    }}
                  />
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

MicButton.displayName = 'MicButton'