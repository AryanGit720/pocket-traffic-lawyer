// frontend/src/lib/api.ts
import { ChatResponse, STTResponse, IndexResponse, StatsResponse } from './types'
import { API_URL, authorizedRequest, UserPublic, ChatHistoryItem } from './auth'

class ApiClient {
  async chat(query: string): Promise<ChatResponse> {
    const response = await authorizedRequest(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Chat API error:', response.status, errorText)
      throw new Error(`Chat API error: ${response.statusText}`)
    }
    return response.json()
  }

  async speechToText(audioBlob: Blob): Promise<STTResponse> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')
    const response = await fetch(`${API_URL}/api/stt`, { method: 'POST', body: formData })
    if (!response.ok) {
      throw new Error(`STT API error: ${response.statusText}`)
    }
    return response.json()
  }

  async textToSpeech(text: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }
    return response.blob()
  }

  async buildIndex(file?: File, chunkSize: number = 512): Promise<IndexResponse> {
    const formData = new FormData()
    if (file) formData.append('dataset_file', file)
    formData.append('chunk_size', chunkSize.toString())
    formData.append('rebuild', 'true')

    const response = await authorizedRequest(`${API_URL}/api/admin/index`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Index API error:', response.status, errorText)
      throw new Error(`Index API error: ${response.statusText}`)
    }
    return response.json()
  }

  async getStats(): Promise<StatsResponse> {
    const response = await authorizedRequest(`${API_URL}/api/admin/stats`, { method: 'GET' })
    if (!response.ok) {
      throw new Error(`Stats API error: ${response.statusText}`)
    }
    return response.json()
  }

  // Auth-related helpers (for dialogs)
  async getHistory(): Promise<ChatHistoryItem[]> {
    const res = await authorizedRequest(`${API_URL}/api/auth/history`, { method: 'GET' })
    if (!res.ok) throw new Error((await res.text()) || 'Failed to fetch history')
    return res.json()
  }
}

export const api = new ApiClient()