// src/app/auth/callback/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("Processing authentication...")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get('code')
        
        if (!code) {
          setMessage("Authentication failed: No code received")
          toast({
            title: "Authentication Failed",
            description: "No authentication code received from provider",
            variant: "destructive"
          })
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // Send the code to your backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        })

        if (!response.ok) {
          throw new Error('Failed to authenticate with Google')
        }

        const data = await response.json()
        
        if (data.token) {
          // Authentication successful
          localStorage.setItem('token', data.token)
          setMessage("Authentication successful! Redirecting...")
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully",
          })
          router.push('/chat')
        } else {
          throw new Error(data.message || 'Authentication failed')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        toast({
          title: "Authentication Failed",
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: "destructive"
        })
        setTimeout(() => router.push('/login'), 2000)
      }
    }

    handleCallback()
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