export interface Source {
  id: string
  source: string
  snippet: string
  score: number
}

export interface ChatResponse {
  answer: string
  sources: Source[]
  latency_ms: number
  confidence: number
  timestamp: string
}

export interface STTResponse {
  text: string
  latency_ms: number
}

export interface IndexResponse {
  success: boolean
  message: string
  doc_count: number
  index_size_mb: number
}

export interface StatsResponse {
  doc_count: number
  index_size_mb: number
  last_updated: string | null
  embedding_model: string
  top_k: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  confidence?: number
  timestamp: Date
}