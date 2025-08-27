'use client'

import { useEffect } from 'react'
import { initializeDefaultUsers } from '@/lib/user-storage'

export default function UserInitializer() {
  useEffect(() => {
    // Initialize default users when the app starts
    initializeDefaultUsers()
  }, [])

  // This component doesn't render anything
  return null
}
