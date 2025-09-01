'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ProfileModal } from '@/components/ui/ProfileModal'
import { LoginModal } from '@/components/auth/LoginModal'
import { getCurrentUser, logoutUser } from '@/lib/user-storage'
import { 
  Home, 
  FileText, 
  Wand2, 
  Database, 
  Download, 
  Settings,
  User,
  Bell,
  Menu,
  X,
  LogOut,
  UserIcon,
  SettingsIcon,
  Folder,
  Book,
  GitPullRequest
} from 'lucide-react'
import { useState } from 'react'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'

// All navigation items (now we have space to show them all)
const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Generate', href: '/generate', icon: Wand2 },
  { name: 'Library', href: '/library', icon: Database },
  { name: 'Export', href: '/export', icon: Download },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Management', href: '/management', icon: GitPullRequest },
  { name: 'Docs', href: '/docs', icon: Book },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<{name: string, email: string, avatar?: string} | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Check for user session on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkUser = () => {
        const currentUser = getCurrentUser()
        setUser(currentUser)
      }

      // Check initially
      checkUser()

      // Listen for storage changes (when user logs in from another tab or window)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'testCaseWriter_currentUser') {
          checkUser()
        }
      }

      // Listen for custom user update events
      const handleUserUpdate = () => {
        checkUser()
      }

      window.addEventListener('storage', handleStorageChange)
      window.addEventListener('userUpdated', handleUserUpdate)

      return () => {
        window.removeEventListener('storage', handleStorageChange)
        window.removeEventListener('userUpdated', handleUserUpdate)
      }
    }
  }, [])

  // Handle navigation with client-side routing
  const handleNavigation = (href: string) => {
    console.log('🚀 Navigating to:', href)
    router.push(href)
  }

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button 
              onClick={() => handleNavigation('/')} 
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-700 transition-colors">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">Test Case Manager</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => handleNavigation('/settings')}
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 px-3 py-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="h-7 w-7 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name || 'Guest'}</span>
              </Button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 pointer-events-auto">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user?.name || 'Guest User'}</p>
                          <p className="text-sm text-gray-500">{user?.email || 'Not logged in'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      {user ? (
                        <>
                          <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Profile settings clicked')
                              setUserMenuOpen(false)
                              setShowProfileModal(true)
                            }}
                          >
                            <UserIcon className="h-4 w-4 mr-3" />
                            Profile Settings
                          </button>
                          <button 
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('App settings clicked, navigating to /settings')
                              setUserMenuOpen(false)
                              handleNavigation('/settings')
                            }}
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            App Settings
                          </button>
                          <hr className="my-1 border-gray-200" />
                        </>
                      ) : (
                        <>
                          <button
                            className="flex items-center w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 cursor-pointer"
                            onClick={() => {
                              setUserMenuOpen(false)
                              handleNavigation('/auth/register')
                            }}
                          >
                            <UserIcon className="h-4 w-4 mr-3" />
                            Create Account
                          </button>
                          <hr className="my-1 border-gray-200" />
                        </>
                      )}
                      {user ? (
                        <button 
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('Logout clicked')
                            setUserMenuOpen(false)
                            if (confirm('Are you sure you want to log out?')) {
                              // Use secure logout function
                              const { performSecureLogout } = require('@/lib/auth-utils')
                              performSecureLogout()
                            }
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Log Out
                        </button>
                      ) : (
                        <button
                          className="flex items-center w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 cursor-pointer"
                          onClick={() => {
                            setUserMenuOpen(false)
                            setShowLoginModal(true)
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Log In
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleNavigation(item.href)
                  }}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium w-full text-left',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          setUser(user)
          setShowLoginModal(false)
        }}
      />
    </header>
  )
}