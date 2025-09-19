'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService, User, LoginCredentials } from '@/lib/auth-service'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  canAccess: (resource: string) => boolean
  hasRole: (role: string | string[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated on app start
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true)
    try {
      const authenticatedUser = await AuthService.authenticate(credentials)
      if (authenticatedUser) {
        setUser(authenticatedUser)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  const canAccess = (resource: string): boolean => {
    return AuthService.canAccess(resource)
  }

  const hasRole = (role: string | string[]): boolean => {
    return AuthService.hasRole(role)
  }

  const value = {
    user,
    login,
    logout,
    isLoading,
    canAccess,
    hasRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for route protection
export function withAuth<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredRole?: string | string[]
) {
  return function AuthenticatedComponent(props: T) {
    const { user, hasRole } = useAuth()

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      )
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Required role: {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
            </p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}