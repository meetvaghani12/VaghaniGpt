"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { GoogleAuthButton } from "@/components/google-auth-button"
import { authApi } from "@/lib/auth-api"
import { toast } from "@/components/ui/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [otpData, setOtpData] = useState({
    email: "",
    otp: "",
  })
  const [showOtpVerification, setShowOtpVerification] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOtpData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authApi.login(formData)
      
      if (response.requiresOTP) {
        // Show OTP verification screen
        setOtpData({ email: formData.email, otp: "" })
        setShowOtpVerification(true)
        toast({
          title: "OTP Required",
          description: "Please check your email for the OTP code.",
        })
      } else if (response.token) {
        // Direct login successful (shouldn't happen with 2FA enabled)
        localStorage.setItem('token', response.token)
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        router.push('/chat')
      } else {
        // Handle other responses
        toast({
          title: "Login Error",
          description: response.message || "An error occurred during login",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authApi.verifyLoginOTP(otpData)
      
      if (response.token) {
        // Login successful after OTP verification
        localStorage.setItem('token', response.token)
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        })
        router.push('/chat')
      } else {
        // OTP verification failed
        toast({
          title: "Verification Failed",
          description: response.message || "Invalid OTP code",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      toast({
        title: "Verification Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      await authApi.resendOTP(otpData.email)
      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email.",
      })
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast({
        title: "Failed to Resend OTP",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            {showOtpVerification 
              ? "Enter the verification code sent to your email" 
              : "Log in to your account to continue"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showOtpVerification && (
            <>
              <GoogleAuthButton />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="meet@example.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-500 dark:text-gray-400">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary underline underline-offset-4 hover:text-primary/90"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Log in"
                  )}
                </Button>
              </form>
            </>
          )}

          {showOtpVerification && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="Enter OTP code"
                  required
                  value={otpData.otp}
                  onChange={handleOtpChange}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleResendOtp}
              >
                Resend Code
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => setShowOtpVerification(false)}
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary underline underline-offset-4 hover:text-primary/90">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}