// Comprehensive notification service for in-app and browser notifications
export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'export_complete' | 'export_failed' | 'new_test_case' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  createdAt: Date
  isRead: boolean
  actionUrl?: string
  category?: 'generation' | 'export' | 'system' | 'user'
}

export interface NotificationPreferences {
  browserNotifications: boolean
  emailNotifications: boolean
  showInApp: boolean
}

class NotificationService {
  private static instance: NotificationService
  private notifications: Notification[] = []
  private preferences: NotificationPreferences
  private permissionStatus: NotificationPermission | null = null

  constructor() {
    this.preferences = this.loadPreferences()
    this.initializeBrowserNotifications()
    this.loadNotifications()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private loadPreferences(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences()
    }

    try {
      const saved = localStorage.getItem('testCaseWriter_notificationPreferences')
      if (saved) {
        return { ...this.getDefaultPreferences(), ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error)
    }
    
    return this.getDefaultPreferences()
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      browserNotifications: false,
      emailNotifications: true,
      showInApp: true
    }
  }

  private savePreferences(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCaseWriter_notificationPreferences', JSON.stringify(this.preferences))
    }
  }

  private loadNotifications(): void {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem('testCaseWriter_notifications')
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }))
      } else {
        // Start with empty notifications - no mock data
        this.notifications = []
        this.saveNotifications()
      }
    } catch (error) {
      console.warn('Failed to load notifications:', error)
      this.notifications = []
    }
  }


  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('testCaseWriter_notifications', JSON.stringify(this.notifications))
      // Dispatch event for components to update
      window.dispatchEvent(new CustomEvent('notifications-updated'))
    }
  }

  private async initializeBrowserNotifications(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser notifications not supported')
      return
    }

    this.permissionStatus = Notification.permission
  }

  async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permissionStatus = permission
      
      if (permission === 'granted') {
        this.preferences.browserNotifications = true
        this.savePreferences()
        
        return true
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
    
    return false
  }

  private sendBrowserNotification(options: {
    title: string
    body: string
    icon?: string
    tag?: string
  }): void {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !this.preferences.browserNotifications ||
      this.permissionStatus !== 'granted'
    ) {
      return
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: false,
        silent: false
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Handle click to focus window
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
    } catch (error) {
      console.error('Failed to send browser notification:', error)
    }
  }

  // Public API methods
  addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): string {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    }

    this.notifications.unshift(newNotification)
    this.saveNotifications()

    // Send browser notification if enabled
    if (this.preferences.browserNotifications && this.permissionStatus === 'granted') {
      this.sendBrowserNotification({
        title: notification.title,
        body: notification.description,
        tag: notification.type
      })
    }

    return newNotification.id
  }

  getNotifications(): Notification[] {
    return [...this.notifications]
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id)
    if (notification && !notification.isRead) {
      notification.isRead = true
      this.saveNotifications()
    }
  }

  markAllAsRead(): void {
    let hasChanges = false
    this.notifications.forEach(n => {
      if (!n.isRead) {
        n.isRead = true
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      this.saveNotifications()
    }
  }

  deleteNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.splice(index, 1)
      this.saveNotifications()
    }
  }

  clearAllNotifications(): void {
    this.notifications = []
    this.saveNotifications()
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences }
    this.savePreferences()
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences }
  }

  getBrowserPermissionStatus(): NotificationPermission | null {
    return this.permissionStatus
  }

  // Convenience methods for common notification types
  notifyExportComplete(details: string): string {
    return this.addNotification({
      type: 'export_complete',
      title: 'Export Complete',
      description: details,
      isRead: false,
      category: 'export'
    })
  }

  notifyExportFailed(error: string): string {
    return this.addNotification({
      type: 'export_failed',
      title: 'Export Failed',
      description: error,
      isRead: false,
      category: 'export'
    })
  }

  notifyTestCasesGenerated(count: number): string {
    return this.addNotification({
      type: 'new_test_case',
      title: 'Test Cases Generated',
      description: `${count} new test cases were successfully generated.`,
      isRead: false,
      category: 'generation'
    })
  }

  notifySystemMessage(title: string, description: string): string {
    return this.addNotification({
      type: 'system',
      title,
      description,
      isRead: false,
      category: 'system'
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Global window function for backward compatibility
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    return notificationService.addNotification(notification)
  }
}