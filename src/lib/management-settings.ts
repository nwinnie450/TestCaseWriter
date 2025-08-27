/**
 * Management Settings Storage
 * 
 * Handles storage and retrieval of management configuration settings
 */

export interface ManagementSettings {
  // Version Control Settings
  autoVersionOnChanges: boolean
  requireApprovalForChanges: boolean
  versionRetentionDays: number
  
  // Change Request Settings
  autoAssignReviewers: boolean
  emailNotifications: boolean
  
  // Workflow Settings
  defaultApproverRole: string
  autoArchiveOldVersions: boolean
  maxVersionsPerTestCase: number
  
  // Notification Settings
  notifyOnChangeRequest: boolean
  notifyOnApproval: boolean
  notifyOnRejection: boolean
}

// Default settings
export const DEFAULT_MANAGEMENT_SETTINGS: ManagementSettings = {
  autoVersionOnChanges: true,
  requireApprovalForChanges: true,
  versionRetentionDays: 90,
  autoAssignReviewers: false,
  emailNotifications: false,
  defaultApproverRole: 'project-lead',
  autoArchiveOldVersions: true,
  maxVersionsPerTestCase: 50,
  notifyOnChangeRequest: true,
  notifyOnApproval: true,
  notifyOnRejection: true
}

const SETTINGS_STORAGE_KEY = 'testCaseManager_settings'

/**
 * Get current management settings
 */
export function getManagementSettings(): ManagementSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) {
      // Return defaults if no settings exist
      return DEFAULT_MANAGEMENT_SETTINGS
    }
    
    const settings = JSON.parse(stored)
    // Merge with defaults to ensure all properties exist
    return { ...DEFAULT_MANAGEMENT_SETTINGS, ...settings }
  } catch (error) {
    console.error('❌ Failed to get management settings:', error)
    return DEFAULT_MANAGEMENT_SETTINGS
  }
}

/**
 * Save management settings
 */
export function saveManagementSettings(settings: Partial<ManagementSettings>): void {
  try {
    const currentSettings = getManagementSettings()
    const updatedSettings = { ...currentSettings, ...settings }
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings))
    console.log('✅ Management settings saved:', updatedSettings)
  } catch (error) {
    console.error('❌ Failed to save management settings:', error)
    throw new Error('Failed to save management settings')
  }
}

/**
 * Update a specific setting
 */
export function updateManagementSetting<K extends keyof ManagementSettings>(
  key: K,
  value: ManagementSettings[K]
): void {
  try {
    const currentSettings = getManagementSettings()
    currentSettings[key] = value
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings))
    console.log(`✅ Updated setting ${key}:`, value)
  } catch (error) {
    console.error(`❌ Failed to update setting ${key}:`, error)
    throw new Error(`Failed to update setting ${key}`)
  }
}

/**
 * Reset settings to defaults
 */
export function resetManagementSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
    console.log('✅ Management settings reset to defaults')
  } catch (error) {
    console.error('❌ Failed to reset management settings:', error)
    throw new Error('Failed to reset management settings')
  }
}

/**
 * Get settings for a specific project (future enhancement)
 */
export function getProjectManagementSettings(projectId: string): ManagementSettings {
  // For now, return global settings
  // In the future, this could load project-specific settings
  return getManagementSettings()
}

/**
 * Check if a specific setting is enabled
 */
export function isSettingEnabled(setting: keyof ManagementSettings): boolean {
  const settings = getManagementSettings()
  return settings[setting] === true
}

/**
 * Get numeric setting value
 */
export function getNumericSetting(setting: keyof ManagementSettings): number {
  const settings = getManagementSettings()
  return settings[setting] as number
} 