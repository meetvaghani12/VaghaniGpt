// src/app/auth/success/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Completing authentication...")

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')
    const user = searchParams.get('user')
    
    if (error) {
      setMessage(`Authentication failed: ${error}`)
      toast({
        title: "Authentication Failed",
        description: error,
        variant: "destructive"
      })
      setTimeout(() => router.push('/login'), 2000)
      return
    }
    
    if (!token) {
      setMessage("Authentication failed: No token received")
      toast({
        title: "Authentication Failed",
        description: "No authentication token received",
        variant: "destructive"
      })
      setTimeout(() => router.push('/login'), 2000)
      return
    }
    
    // Store the token in localStorage
    localStorage.setItem('token', token)
    
    // Store user data if available
    if (user) {
      try {
        const userData = JSON.parse(user)
        // You might want to dispatch this to your auth context
        localStorage.setItem('user', user)
      } catch (e) {
        console.error('Failed to parse user data:', e)
      }
    }
    
    setMessage("Authentication successful! Redirecting...")
    toast({
      title: "Authentication Successful",
      description: "You have been logged in successfully",
    })
    
    // Redirect to the protected area
    setTimeout(() => router.push('/chat'), 1000)
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}