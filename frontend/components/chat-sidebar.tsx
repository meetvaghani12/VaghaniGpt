"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MessageSquare, MoreVertical, LogOut, Trash2, User } from "lucide-react"
import { motion } from "framer-motion"

// Mock chat history data
const mockChatHistory = [
  { id: "1", title: "Quantum Computing Basics", date: "2 hours ago" },
  { id: "2", title: "Creative Story Ideas", date: "Yesterday" },
  { id: "3", title: "Python Programming Help", date: "2 days ago" },
  { id: "4", title: "Travel Recommendations", date: "1 week ago" },
  { id: "5", title: "Recipe for Chocolate Cake", date: "2 weeks ago" },
]

interface ChatSidebarProps {
  onClose?: () => void
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const router = useRouter()
  const [chatHistory, setChatHistory] = useState(mockChatHistory)

  const handleNewChat = () => {
    // In a real app, you would create a new chat in the backend
    // and then redirect to it
    router.push("/chat")
    if (onClose) onClose()
  }

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // Filter out the deleted chat
    setChatHistory(chatHistory.filter((chat) => chat.id !== id))
  }

  const handleLogout = () => {
    // In a real app, you would handle logout logic here
    router.push("/")
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-800">
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
                className="group flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  if (onClose) onClose()
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="h-4 w-4 shrink-0 text-gray-500" />
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{chat.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{chat.date}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={(e) => handleDeleteChat(chat.id, e as any)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* User Profile & Logout */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium">John Doe</p>
              <p className="truncate text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
