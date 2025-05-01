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
import { useParams, useRouter } from "next/navigation"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Function to format AI response with paragraphs and bold titles
const formatAIResponse = (content: string) => {
  // Replace special characters with line breaks
  const formattedContent = content
    .replace(/\*\*/g, '\n\n') // Replace ** with double line break
    .replace(/\*/g, '\n')     // Replace * with single line break
  
  // Split content into paragraphs
  const paragraphs = formattedContent.split('\n\n')
  
  return paragraphs.map((paragraph, index) => {
    // Check if paragraph is empty after trimming
    if (!paragraph.trim()) return null

    // Check if paragraph starts with a title pattern (e.g., "Title:", "1. Title", etc.)
    const titleMatch = paragraph.match(/^([\d.]+)?\s*([^:]+):/)
    if (titleMatch) {
      const [, number, title] = titleMatch
      const content = paragraph.replace(titleMatch[0], '').trim()
      return (
        <div key={index} className="mb-4">
          <h3 className="font-bold text-lg mb-2">
            {number ? `${number} ` : ''}{title}
          </h3>
          <p className="text-muted-foreground">{content}</p>
        </div>
      )
    }
    
    // Regular paragraph
    return (
      <p key={index} className="mb-4 text-muted-foreground">
        {paragraph}
      </p>
    )
  })
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true)
        
        // Check if user is authenticated
        if (!user) {
          const userData = localStorage.getItem('user')
          if (!userData) {
            router.push('/login')
            return
          }
        }

        // Load chat messages from localStorage
        const chatMessages = localStorage.getItem(`chat_${id}`)
        if (chatMessages) {
          const parsedMessages = JSON.parse(chatMessages) as Message[]
          setMessages(parsedMessages)
        }

        // Update chat title if it's the first message
        const history = localStorage.getItem('chatHistory')
        if (history) {
          const chats = JSON.parse(history)
          const currentChat = chats.find((chat: any) => chat.id === id)
          if (currentChat && currentChat.title === 'New Chat' && messages.length > 0) {
            const firstMessage = messages[0].content
            const newTitle = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
            const updatedChats = chats.map((chat: any) => 
              chat.id === id ? { ...chat, title: newTitle } : chat
            )
            localStorage.setItem('chatHistory', JSON.stringify(updatedChats))
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error)
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        })
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadChatHistory()
  }, [id, messages.length, user, router])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message to the chat
    const updatedMessages: Message[] = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
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
      setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                assistantMessage += data.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant' as const,
                    content: assistantMessage
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

      // Save updated messages to localStorage
      const finalMessages: Message[] = [...updatedMessages, { role: 'assistant' as const, content: assistantMessage }]
      localStorage.setItem(`chat_${id}`, JSON.stringify(finalMessages))

      // Update chat title if it's the first message
      if (updatedMessages.length === 1) {
        const history = localStorage.getItem('chatHistory')
        if (history) {
          const chats = JSON.parse(history)
          const newTitle = userMessage.length > 30 ? userMessage.substring(0, 30) + '...' : userMessage
          const updatedChats = chats.map((chat: any) => 
            chat.id === id ? { ...chat, title: newTitle } : chat
          )
          localStorage.setItem('chatHistory', JSON.stringify(updatedChats))
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process chat request',
        variant: "destructive",
      })
      // Remove the empty assistant message if there was an error
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || isLoadingHistory) return null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat header */}
      <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <h1 
          className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
          onClick={() => router.push('/chat')}
        >
          Vaghani AI
        </h1>
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
          </div>
        )}
      </header>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
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
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
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
                    {message.role === 'assistant' ? (
                      <div className="text-sm text-muted-foreground">
                        {formatAIResponse(message.content)}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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