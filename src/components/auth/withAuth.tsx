'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth-service'
import { canAccessPage, isGuest } from '@/lib/access-control'
import { User } from '@/types'
import { AlertCircle, Lock } from 'lucide-react'

interface AccessDeniedProps {
  user: User | null
  requiredPage: string
}

function AccessDenied({ user, requiredPage }: AccessDeniedProps) {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-red-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Restricted
        </h2>
        
        <p className="text-gray-600 mb-4">
          {isGuest(user) 
            ? `Guest users cannot access this page. Please log in with a full account to continue.`
            : `You don't have permission to access this page.`
          }
        </p>
        
        <div className="space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </button>
          
          {isGuest(user) && (
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Log in with Full Account
            </button>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Guest Mode Limitations</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Guest users have read-only access to the library. Create a full account for complete functionality.
          </p>
        </div>
      </div>
    </div>
  )
}

export interface WithAuthOptions {
  redirectTo?: string
  requireAuth?: boolean
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { redirectTo = '/auth/login', requireAuth = true } = options

  return function AuthGuard(props: P) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isHydrated, setIsHydrated] = useState(false)
    const router = useRouter()

    useEffect(() => {
      setIsHydrated(true)
      const currentUser = AuthService.getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)

      // Listen for user updates
      const handleUserUpdate = () => {
        const updatedUser = AuthService.getCurrentUser()
        setUser(updatedUser)
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('userUpdated', handleUserUpdate)
        return () => window.removeEventListener('userUpdated', handleUserUpdate)
      }
    }, [])

    // Don't render anything during server-side rendering
    if (!isHydrated) {
      return null
    }

    // Show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    // Get the current page path
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
    
    // Check if user can access this page
    if (!canAccessPage(user, currentPath)) {
      return <AccessDenied user={user} requiredPage={currentPath} />
    }

    // Render the protected component
    return <WrappedComponent {...props} />
  }
}