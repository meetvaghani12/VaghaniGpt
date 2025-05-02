"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Send } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Avatar } from "@/components/ui/avatar"
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isAiTyping])

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  const saveChatHistory = (title: string) => {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]')
    const newChat = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleDateString(),
    }
    localStorage.setItem('chatHistory', JSON.stringify([newChat, ...chatHistory]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    
    // Set AI typing indicator to true BEFORE adding user message
    setIsAiTyping(true)

    // Add user message to the chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get response from AI service: ${errorText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      let assistantMessage = ''
      let firstChunkReceived = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // On first chunk received, replace typing indicator with actual message
        if (!firstChunkReceived) {
          firstChunkReceived = true
          // We'll keep isAiTyping true until we get the first chunk of the response
        }

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                // Only on the first content chunk, remove typing indicator and add assistant message
                if (assistantMessage === '') {
                  setIsAiTyping(false)
                  setMessages(prev => [...prev, { role: 'assistant', content: '' }])
                }
                
                assistantMessage += data.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  // Make sure we're updating the last message and it's an assistant message
                  if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage
                    }
                  }
                  return newMessages
                })
              }
            } catch (e) {
              console.error('Error parsing chunk:', e, line)
            }
          }
        }
      }

      // Save chat history after successful response
      if (messages.length === 0) {
        saveChatHistory(userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''))
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process chat request',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsAiTyping(false) // Ensure typing indicator is removed
    }
  }

  if (!mounted) return null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat header */}
      <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <h1 className="text-lg font-semibold">Vaghani AI</h1>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        )}
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !isAiTyping ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 py-12">
              <div className="rounded-full bg-primary/10 p-4">
                <svg
                  className="h-10 w-10 text-primary"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Start a conversation</h2>
              <p className="text-center text-muted-foreground">
                Ask anything to Vaghani AI
              </p>
            </div>
          ) : (
            <>
              {/* Regular messages */}
              {messages.map((message, index) => (
                <motion.div
                  key={`message-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-start space-x-4"
                >
                  <Avatar>
                    <AvatarImage
                      src={message.role === 'user' ? '/placeholder-user.jpg' : '/placeholder-logo.png'}
                      alt={message.role === 'user' ? 'User' : 'AI'}
                    />
                    <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">
                      {message.role === 'user' ? 'You' : 'Vaghani AI'}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* AI typing indicator - separate from the messages array */}
              {isAiTyping && (
                <motion.div
                  key="ai-typing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-start space-x-4"
                >
                  <Avatar>
                    <AvatarImage
                      src="/placeholder-logo.png"
                      alt="AI"
                    />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">Vaghani AI</p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <span>AI is writing</span>
                      <span className="typing-dots inline-flex w-8 h-5 items-end"></span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Vaghani..."
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}