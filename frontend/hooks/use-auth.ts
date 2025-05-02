import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  displayName?: string
  email: string
  photoURL?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Load user from localStorage
    const loadUser = () => {
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    loadUser()
  }, [])

  const signOut = async () => {
    try {
      // Clear user data
      localStorage.removeItem('user')
      setUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return {
    user,
    signOut,
  }
} 