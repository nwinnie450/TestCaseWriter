'use client'

import React, { useState, useEffect } from 'react'
import { Notification, NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/Button'
import { Bell, CheckCheck, X } from 'lucide-react'

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'export_complete',
    title: 'Export Complete',
    description: 'Your export to TestRail was successful.',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    isRead: false,
  },
  {
    id: '2',
    type: 'new_test_case',
    title: 'New Test Cases Generated',
    description: '15 new test cases were generated from your document.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
  },
  {
    id: '3',
    type: 'export_failed',
    title: 'Export Failed',
    description: 'Your export to Jira failed due to an authentication error.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
  },
]

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Start with empty state to avoid hydration mismatch
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true)
    
    const saved = localStorage.getItem('testCaseWriter_notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }))
        setNotifications(parsed)
      } catch (e) {
        console.warn('Failed to parse saved notifications:', e)
        setNotifications(mockNotifications)
      }
    } else {
      setNotifications(mockNotifications)
    }
  }, [])

  // Save notifications to localStorage whenever they change
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCaseWriter_notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  // Listen for new notifications added from other parts of the app
  React.useEffect(() => {
    const handleNotificationAdded = () => {
      // Reload notifications from localStorage
      const saved = localStorage.getItem('testCaseWriter_notifications')
      if (saved) {
        try {
          const parsed = JSON.parse(saved).map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt)
          }))
          setNotifications(parsed)
        } catch (e) {
          console.warn('Failed to parse saved notifications:', e)
        }
      }
    }

    window.addEventListener('notification-added', handleNotificationAdded)
    return () => window.removeEventListener('notification-added', handleNotificationAdded)
  }, [])

  // Only calculate unread count after hydration to avoid SSR mismatch
  const unreadCount = isHydrated ? notifications.filter(n => !n.isRead).length : 0

  const handleMarkAsRead = (id: string) => {
    console.log('📍 Marking notification as read:', id)
    const updatedNotifications = notifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
    setNotifications(updatedNotifications)
    
    // Force immediate localStorage update
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCaseWriter_notifications', JSON.stringify(updatedNotifications))
    }
  }

  const handleMarkAllAsRead = () => {
    console.log('📍 Marking all notifications as read')
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }))
    setNotifications(updatedNotifications)
    
    // Force immediate localStorage update
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCaseWriter_notifications', JSON.stringify(updatedNotifications))
    }
  }

  // Function to add new notifications (can be called from other components)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Adding to window for global access
      window.addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          createdAt: new Date(),
        }
        setNotifications(prev => [newNotification, ...prev])
      }
    }
  }, [])

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button 
        variant="ghost" 
        size="md" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                You have {unreadCount} unread messages.
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead} 
                  />
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              )}
            </div>
            <div className="p-2 text-center border-t border-gray-200">
              <div className="flex justify-center space-x-2">
                <Button variant="ghost" size="sm">
                  View all notifications
                </Button>
                {/* Debug button - remove in production */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    console.log('📊 Current notifications state:', notifications)
                    console.log('📊 Unread count:', unreadCount)
                  }}
                >
                  Debug
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
