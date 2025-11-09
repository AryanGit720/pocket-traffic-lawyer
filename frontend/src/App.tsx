import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Chat } from './components/Chat'
import { AdminPanel } from './components/AdminPanel'
import { useTheme } from './lib/hooks'
import { Toaster } from '@/components/ui/toaster'

function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Apply theme class to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header theme={theme} setTheme={setTheme} />
      
      <main className="flex-1 container mx-auto px-4 py-4 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
            <TabsTrigger value="admin">Admin Panel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-0">
            <Chat />
          </TabsContent>
          
          <TabsContent value="admin" className="mt-0">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <Toaster />
    </div>
  )
}

export default App