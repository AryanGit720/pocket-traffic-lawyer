import { test, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Chat } from '../src/components/Chat'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

test('Chat component renders welcome message', () => {
  render(<Chat />, { wrapper: createWrapper() })
  
  expect(screen.getByText(/Welcome to Pocket Traffic Lawyer!/i)).toBeInTheDocument()
  expect(screen.getByPlaceholderText(/Ask about Indian traffic laws/i)).toBeInTheDocument()
})

test('Chat component sends message on form submit', async () => {
  render(<Chat />, { wrapper: createWrapper() })
  
  const input = screen.getByPlaceholderText(/Ask about Indian traffic laws/i)
  const sendButton = screen.getByRole('button', { name: /send/i })
  
  fireEvent.change(input, { target: { value: 'What is the fine for not wearing helmet?' } })
  fireEvent.click(sendButton)
  
  await waitFor(() => {
    expect(screen.getByText('What is the fine for not wearing helmet?')).toBeInTheDocument()
  })
})