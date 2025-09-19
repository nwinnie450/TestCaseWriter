'use client'

import { useEffect } from 'react'
import { cleanupExistingUsers, initializeDefaultUsers } from '@/lib/user-storage'

export default function UserInitializer() {
  useEffect(() => {
    // Clean up demo users and initialize only admin user for production
    console.log('UserInitializer: Cleaning up demo users for production...')
    cleanupExistingUsers()
    initializeDefaultUsers()
    console.log('UserInitializer: Production user setup complete - only admin user available')
  }, [])

  // This component doesn't render anything
  return null
}
