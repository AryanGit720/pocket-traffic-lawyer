import { Volume2, Loader2, Square, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTextToSpeech } from '@/lib/hooks'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AudioPlayerProps {
  text: string
}

// Function to strip markdown and clean text for TTS
function stripMarkdownForTTS(text: string): string {
  let cleaned = text
  
  // Remove markdown bold/italic (**text** or *text*)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  
  // Remove markdown headers (### Header)
  cleaned = cleaned.replace(/#{1,6}\s+/g, '')
  
  // Remove markdown links [text](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[^`]*```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  
  // Replace list markers with natural pauses
  cleaned = cleaned.replace(/^[-*+]\s+/gm, '')
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '')
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.trim()
  
  return cleaned
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const { speak, audioRef, isPlaying, stopAudio } = useTextToSpeech()
  const [currentlyPlaying, setCurrentlyPlaying] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      
      const handlePlay = () => setCurrentlyPlaying(true)
      const handlePause = () => setCurrentlyPlaying(false)
      const handleEnded = () => setCurrentlyPlaying(false)
      
      audio.addEventListener('play', handlePlay)
      audio.addEventListener('pause', handlePause)
      audio.addEventListener('ended', handleEnded)
      
      return () => {
        audio.removeEventListener('play', handlePlay)
        audio.removeEventListener('pause', handlePause)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioRef])

  const handlePlay = () => {
    // Strip markdown before sending to TTS
    const cleanText = stripMarkdownForTTS(text)
    speak.mutate(cleanText)
  }

  const handleStop = () => {
    stopAudio()
    setCurrentlyPlaying(false)
  }

  if (currentlyPlaying || isPlaying) {
    return (
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="h-8 hover:bg-destructive/10 group"
        >
          <Square className="h-3 w-3 fill-current group-hover:text-destructive transition-colors" />
          <span className="ml-2 text-xs group-hover:text-destructive">Stop</span>
          <motion.div
            className="ml-2 flex gap-0.5"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-destructive rounded-full"
                animate={{ height: ['4px', '8px', '4px'] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePlay}
        disabled={speak.isPending}
        className="h-8 hover:bg-primary/10 group"
      >
        {speak.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
        ) : (
          <Volume2 className="h-3 w-3 group-hover:text-primary transition-colors" />
        )}
        <span className="ml-2 text-xs group-hover:text-primary transition-colors">
          Listen
        </span>
      </Button>
    </motion.div>
  )
}