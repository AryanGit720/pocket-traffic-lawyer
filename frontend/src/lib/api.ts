import { ChatResponse, STTResponse, IndexResponse, StatsResponse } from './types'

// Always use direct URL - simpler and more reliable
const API_URL = 'http://localhost:8000'

class ApiClient {
  async chat(query: string): Promise<ChatResponse> {
    try {
      const url = `${API_URL}/api/chat`
      console.log('Calling:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Chat API error:', response.status, errorText)
        throw new Error(`Chat API error: ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error('Network error:', error)
      throw error
    }
  }

  async speechToText(audioBlob: Blob): Promise<STTResponse> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.wav')

    const response = await fetch(`${API_URL}/api/stt`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`STT API error: ${response.statusText}`)
    }

    return response.json()
  }

  async textToSpeech(text: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }

    return response.blob()
  }

  async buildIndex(file?: File, chunkSize: number = 512): Promise<IndexResponse> {
    const formData = new FormData()
    
    // Always use FormData, whether we have a file or not
    if (file) {
      formData.append('dataset_file', file)
    }
    
    // Add chunk_size and rebuild as form fields
    formData.append('chunk_size', chunkSize.toString())
    formData.append('rebuild', 'true')

    const response = await fetch(`${API_URL}/api/admin/index`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Index API error:', response.status, errorText)
      throw new Error(`Index API error: ${response.statusText}`)
    }

    return response.json()
  }

  async getStats(): Promise<StatsResponse> {
    const response = await fetch(`${API_URL}/api/admin/stats`)

    if (!response.ok) {
      throw new Error(`Stats API error: ${response.statusText}`)
    }

    return response.json()
  }
}

export const api = new ApiClient()