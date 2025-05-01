// src/lib/auth-context.tsx
"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from './auth-api'

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<any>
  verifyOTP: (email: string, otp: string) => Promise<any>
  register: (userData: any) => Promise<any>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        setIsLoading(false)
        return
      }
      
      try {
        // Fetch user profile with the token
        const userData = await authApi.getUserProfile(token)
        
        if (userData.user) {
          setUser(userData.user)
        } else {
          // If invalid token, clear it
          localStorage.removeItem('token')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('token')
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    return await authApi.login({ email, password })
  }

  const verifyOTP = async (email: string, otp: string) => {
    const response = await authApi.verifyLoginOTP({ email, otp })
    
    if (response.token) {
      localStorage.setItem('token', response.token)
      setUser(response.user)
    }
    
    return response
  }

  const register = async (userData: any) => {
    return await authApi.register(userData)
  }

  const logout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        await authApi.logout(token)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user,
        login,
        verifyOTP,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}