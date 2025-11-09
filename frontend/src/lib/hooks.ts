import { useState, useEffect, useCallback, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './api'
import { useToast } from '@/components/ui/use-toast'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, setTheme }
}

export function useChat() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: api.chat,
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useSpeechToText() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: api.speechToText,
    onError: (error) => {
      toast({
        title: 'Speech Recognition Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useTextToSpeech() {
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }, [])

  const speak = useMutation({
    mutationFn: api.textToSpeech,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      
      // Stop any currently playing audio
      stopAudio()
      
      // Create or update audio element
      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      
      audioRef.current.src = url
      setIsPlaying(true)
      
      audioRef.current.play().catch((error) => {
        console.error('Audio playback error:', error)
        setIsPlaying(false)
        toast({
          title: 'Playback Error',
          description: 'Could not play audio. Please try again.',
          variant: 'destructive',
        })
      })
      
      // Clean up blob URL after playing
      audioRef.current.onended = () => {
        URL.revokeObjectURL(url)
        setIsPlaying(false)
      }
    },
    onError: (error) => {
      setIsPlaying(false)
      toast({
        title: 'Text-to-Speech Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  return { speak, audioRef, isPlaying, stopAudio }
}

export function useIndexStats() {
  return useQuery({
    queryKey: ['index-stats'],
    queryFn: api.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// New Live Speech Recognition Hook using Web Speech API
export function useLiveSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Browser does not support Speech Recognition')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN' // Indian English

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      if (final) {
        setTranscript(prev => prev + final)
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      if (event.error === 'no-speech') {
        // Automatically restart if no speech detected
        return
      }
      
      toast({
        title: 'Speech Recognition Error',
        description: `Error: ${event.error}. Please try again.`,
        variant: 'destructive',
      })
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [toast])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      setInterimTranscript('')
      recognitionRef.current.start()
      
      toast({
        title: 'Listening...',
        description: 'Speak your question clearly',
      })
    }
  }, [isListening, toast])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
  }
}

// Keep the old recorder for fallback
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { toast } = useToast()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      toast({
        title: 'Recording...',
        description: 'Speak your question clearly',
      })
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      toast({
        title: 'Processing...',
        description: 'Converting speech to text',
      })
    }
  }, [isRecording, toast])

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    setAudioBlob,
  }
}