'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react'

export interface Notification {
  id: string
  type: 'new_test_case' | 'export_complete' | 'export_failed' | 'duplicate_warning'
  title: string
  description: string
  createdAt: Date
  isRead: boolean
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

const notificationIcons = {
  new_test_case: FileText,
  export_complete: CheckCircle,
  export_failed: AlertCircle,
  duplicate_warning: AlertTriangle,
}

const notificationColors = {
  new_test_case: 'text-primary-500',
  export_complete: 'text-success-500',
  export_failed: 'text-error-500',
  duplicate_warning: 'text-yellow-500',
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = notificationIcons[notification.type]
  const color = notificationColors[notification.type]

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🔔 Notification clicked:', {
      id: notification.id,
      title: notification.title,
      isRead: notification.isRead,
      willCallMarkAsRead: !notification.isRead
    })
    
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    } else {
      console.log('🔔 Notification already read, no action needed')
    }
  }

  return (
    <div 
      className={cn(
        'p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200',
        !notification.isRead && 'bg-primary-50/50 border-l-2 border-l-primary-500'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-4">
        <div className={cn('flex-shrink-0', color)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {notification.title}
          </p>
          <p className="text-sm text-gray-500">
            {notification.description}
          </p>
          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
            <Clock className="h-3 w-3" />
            <span>{notification.createdAt.toLocaleString()}</span>
          </div>
        </div>
        {!notification.isRead && (
          <div className="flex-shrink-0 self-center">
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )
}
