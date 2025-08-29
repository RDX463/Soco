import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser } from '../services/auth'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    setUser(getCurrentUser()) // Update state immediately
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null) // Update state immediately
  }

  const value = {
    user,
    login,
    logout,
    loading,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
