import { AuthService } from './auth-service'

// Authentication utilities
export function requireAuth(): boolean {
  const user = AuthService.getCurrentUser()
  return !!user
}

export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login'
  }
}

export function clearAllUserData(): void {
  if (typeof window === 'undefined') return

  console.log('🔄 Clearing all user data...')
  
  // Keep these essential keys for app functionality
  const keysToKeep = [
    'testCaseWriter_settings', // App settings (non-user specific)
    'testCaseWriter_templates', // Template definitions  
    'testCaseWriter_users', // User registry for login
    'testCaseWriter_projectTemplates' // Project templates
  ]
  
  // Get all localStorage keys
  const allKeys = Object.keys(localStorage)
  let clearedCount = 0
  
  // Remove user-specific data
  allKeys.forEach(key => {
    if (key.startsWith('testCaseWriter_') && !keysToKeep.includes(key)) {
      try {
        localStorage.removeItem(key)
        console.log(`🗑️ Cleared: ${key}`)
        clearedCount++
      } catch (error) {
        console.warn(`Failed to clear ${key}:`, error)
      }
    }
  })
  
  console.log(`✅ Cleared ${clearedCount} user data items`)
}

// Data that should be cleared on logout
export const USER_DATA_KEYS = [
  'testCaseWriter_generatedTestCases', // User's generated test cases
  'testCaseWriter_notifications', // User's notifications
  'testCaseWriter_projects', // User's projects
  'testCaseWriter_projectMembers', // Project memberships
  'testCaseWriter_currentUser', // Current user session
  'testCaseWriter_tokenUsage', // User's token usage statistics
  'testCaseWriter_recentActivity', // User's recent activity
  'testCaseWriter_exportProfiles' // User's export profiles
]

// Check if a page requires authentication
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/projects',
    '/library', 
    '/generate',
    '/export',
    '/settings'
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
}

// Safe logout that clears everything
export function performSecureLogout(): void {
  console.log('🚪 Performing secure logout...')

  // Clear user session using AuthService
  AuthService.logout()
  
  // Clear all user data
  clearAllUserData()
  
  // Force page refresh and redirect to home
  if (typeof window !== 'undefined') {
    console.log('🔄 Redirecting to home page...')
    window.location.href = '/'
  }
}