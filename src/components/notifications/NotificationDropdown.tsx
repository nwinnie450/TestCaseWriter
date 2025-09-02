'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationItem } from './NotificationItem'
import { Button } from '@/components/ui/Button'
import { Bell, CheckCheck, X } from 'lucide-react'
import { notificationService, type Notification } from '@/lib/notification-service'
import { getCurrentUser } from '@/lib/user-storage'

export function NotificationDropdown() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Start with empty state to avoid hydration mismatch
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Load notifications from service after hydration, but only if user is logged in
  useEffect(() => {
    setIsHydrated(true)
    const currentUser = getCurrentUser()
    if (currentUser) {
      setNotifications(notificationService.getNotifications())
    } else {
      setNotifications([])
    }
  }, [])

  // Listen for notification updates, but only if user is logged in
  useEffect(() => {
    const handleNotificationUpdate = () => {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setNotifications(notificationService.getNotifications())
      } else {
        setNotifications([])
      }
    }

    // Also listen for user login/logout events
    const handleUserUpdate = () => {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setNotifications(notificationService.getNotifications())
      } else {
        setNotifications([])
      }
    }

    window.addEventListener('notifications-updated', handleNotificationUpdate)
    // Keep the old event for backward compatibility
    window.addEventListener('notification-added', handleNotificationUpdate)
    window.addEventListener('userUpdated', handleUserUpdate)
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationUpdate)
      window.removeEventListener('notification-added', handleNotificationUpdate)
      window.removeEventListener('userUpdated', handleUserUpdate)
    }
  }, [])

  // Only calculate unread count after hydration and if user is logged in to avoid SSR mismatch
  const unreadCount = isHydrated && getCurrentUser() ? notificationService.getUnreadCount() : 0

  const handleMarkAsRead = (id: string) => {
    console.log('📍 Marking notification as read:', id)
    notificationService.markAsRead(id)
    setNotifications(notificationService.getNotifications())
  }

  const handleMarkAllAsRead = () => {
    console.log('📍 Marking all notifications as read')
    notificationService.markAllAsRead()
    setNotifications(notificationService.getNotifications())
  }

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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/settings#notifications')
                  }}
                >
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
