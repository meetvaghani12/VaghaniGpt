"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

interface MobileSidebarToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export function MobileSidebarToggle({ isOpen, onToggle }: MobileSidebarToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 top-3 z-50 lg:hidden"
      onClick={onToggle}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  )
}
