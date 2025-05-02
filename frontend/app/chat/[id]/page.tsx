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
import { ThemeToggle } from "@/components/theme-toggle"
import { ModelSelector } from "@/components/model-selector"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Function to format AI response with paragraphs and bold titles
const formatAIResponse = (content: string) => {
  // Split content by asterisks for bullet points
  const sections = content.split('*').filter(section => section.trim());
  
  return sections.map((section, index) => {
    const trimmedSection = section.trim();
    
    // Check if section starts with a number or bullet point
    if (trimmedSection.match(/^\d+\./) || trimmedSection.startsWith('-')) {
      return (
        <li key={index} className="mb-2 text-muted-foreground">
          {trimmedSection}
        </li>
      );
    }
    
    // Regular paragraph
    return (
      <p key={index} className="mb-4 text-muted-foreground">
        {trimmedSection}
      </p>
    );
  });
}

const LoadingDots = () => {
  return (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

const TypingAnimation = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-muted-foreground">VAGHANI is typing...</span>
    </div>
  )
}

export default function ChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [selectedModel, setSelectedModel] = useState('gemini')
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

  // Scroll to bottom when messages change or when typing indicator appears/disappears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isAiTyping])

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
    setIsAiTyping(true)

    const updatedMessages: Message[] = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedMessages)

    try {
      console.log('Sending request with model:', selectedModel);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
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

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.content) {
                if (!firstChunkReceived) {
                  firstChunkReceived = true
                  setIsAiTyping(false)
                  // Add the assistant message to the chat
                  setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }])
                }
                
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
    } finally {
      setIsLoading(false)
      setIsAiTyping(false)
    }
  }

  if (!mounted || isLoadingHistory) return null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Chat header */}
      <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Vaghani AI</h1>
          <ModelSelector value={selectedModel} onChange={setSelectedModel} />
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
          <ThemeToggle />
        </div>
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
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={`message-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/ai-avatar.png" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'assistant' ? (
                      <div className="space-y-2">
                        {formatAIResponse(message.content)}
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL} alt={user?.name || 'User'} />
                      <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}

              {/* AI typing indicator (outside of messages array) */}
              {isAiTyping && (
                <motion.div
                  key="ai-typing-indicator"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-4 justify-start"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/ai-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                    <TypingAnimation />
                  </div>
                </motion.div>
              )}
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