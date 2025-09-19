'use client'

import { useEffect } from 'react'
import { AuthService } from '@/lib/auth-service'

export default function UserInitializer() {
  useEffect(() => {
    // Initialize demo users when the app starts
    // AuthService already has demo users in its internal array
    // No need for separate initialization
    console.log('UserInitializer: AuthService ready with demo users')
  }, [])

  // This component doesn't render anything
  return null
}
