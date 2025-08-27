// Utility functions for managing notifications
export type NotificationType = 'new_test_case' | 'export_complete' | 'export_failed' | 'duplicate_warning'

export interface NotificationData {
  type: NotificationType
  title: string
  description: string
  isRead?: boolean
}

export function addNotification(notification: NotificationData) {
  if (typeof window !== 'undefined') {
    // Try to get existing notifications from localStorage
    const existingNotifications = JSON.parse(
      localStorage.getItem('testCaseWriter_notifications') || '[]'
    )

    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      isRead: notification.isRead || false
    }

    // Add to the beginning of the array
    const updatedNotifications = [newNotification, ...existingNotifications]

    // Keep only last 50 notifications to prevent storage bloat
    const trimmedNotifications = updatedNotifications.slice(0, 50)

    // Save back to localStorage
    localStorage.setItem('testCaseWriter_notifications', JSON.stringify(trimmedNotifications))

    // Trigger a storage event for components to update
    window.dispatchEvent(new CustomEvent('notification-added', {
      detail: newNotification
    }))

    console.log('📧 Notification added:', notification.title)
  }
}

export function addDuplicateWarningNotification(exactDuplicates: number, potentialDuplicates: number) {
  const totalDuplicates = exactDuplicates + potentialDuplicates
  
  let description = ''
  if (exactDuplicates > 0 && potentialDuplicates > 0) {
    description = `Found ${exactDuplicates} exact duplicate(s) and ${potentialDuplicates} similar test case(s). Review them in the Library.`
  } else if (exactDuplicates > 0) {
    description = `Found ${exactDuplicates} exact duplicate test case(s). Review them in the Library to avoid redundancy.`
  } else if (potentialDuplicates > 0) {
    description = `Found ${potentialDuplicates} potentially similar test case(s). Review them in the Library.`
  }

  addNotification({
    type: 'duplicate_warning',
    title: `Duplicate Test Cases Detected`,
    description
  })
}

export function addTestCaseGenerationNotification(count: number, hasDuplicates: boolean = false) {
  const title = `${count} Test Cases Generated`
  const description = hasDuplicates 
    ? `Successfully generated ${count} test cases with potential duplicates detected.`
    : `Successfully generated ${count} comprehensive test cases from your requirements.`

  addNotification({
    type: 'new_test_case',
    title,
    description
  })
}