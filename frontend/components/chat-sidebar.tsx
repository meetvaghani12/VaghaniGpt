"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Plus, MessageSquare, LogOut, User } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/components/ui/use-toast"

interface ChatHistory {
  id: string
  title: string
  date: string
}

interface ChatSidebarProps {
  onClose?: () => void
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])

  useEffect(() => {
    // Load chat history from localStorage
    const loadChatHistory = () => {
      const history = localStorage.getItem('chatHistory')
      if (history) {
        setChatHistory(JSON.parse(history))
      }
    }
    loadChatHistory()
  }, [])

  const handleNewChat = () => {
    // Generate a new chat ID
    const newChatId = Date.now().toString()
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      date: new Date().toLocaleDateString()
    }
    
    // Update chat history
    const updatedHistory = [newChat, ...chatHistory]
    setChatHistory(updatedHistory)
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
    
    // Navigate to new chat
    router.push(`/chat/${newChatId}`)
    if (onClose) onClose()
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background border-r">
      {/* New Chat Button */}
      <div className="p-4">
        <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="default">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Chat History */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {chatHistory.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={`/chat/${chat.id}`}
                className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  if (onClose) onClose()
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{chat.title}</div>
                </div>
                <span className="text-xs text-muted-foreground">{chat.date}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile & Logout */}
      <div className="border-t p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium">
                  {user?.displayName || user?.name || (user?.email ? user.email[0].toUpperCase() : 'Guest')}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || 'Not logged in'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>

          {/* Theme Toggle (commented out)
          <div className="flex items-center justify-between rounded-lg border p-2">
            ...
          </div>
          */}
        </div>
      </div>
    </div>
  )
}