'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ManagementSettings, updateManagementSetting } from '@/lib/management-settings'

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  settingType: 'version-control' | 'change-requests' | 'notifications'
  currentSettings: ManagementSettings
  onSettingsUpdate: () => void
}

export function ConfigurationModal({
  isOpen,
  onClose,
  settingType,
  currentSettings,
  onSettingsUpdate
}: ConfigurationModalProps) {
  const [localSettings, setLocalSettings] = useState<Partial<ManagementSettings>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Initialize local settings based on setting type
      switch (settingType) {
        case 'version-control':
          setLocalSettings({
            versionRetentionDays: currentSettings.versionRetentionDays,
            maxVersionsPerTestCase: currentSettings.maxVersionsPerTestCase
          })
          break
        case 'change-requests':
          setLocalSettings({
            defaultApproverRole: currentSettings.defaultApproverRole
          })
          break
        case 'notifications':
          setLocalSettings({
            notifyOnChangeRequest: currentSettings.notifyOnChangeRequest,
            notifyOnApproval: currentSettings.notifyOnApproval,
            notifyOnRejection: currentSettings.notifyOnRejection
          })
          break
      }
    }
  }, [isOpen, settingType, currentSettings])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update each setting individually
      for (const [key, value] of Object.entries(localSettings)) {
        await updateManagementSetting(key as keyof ManagementSettings, value)
      }
      
      onSettingsUpdate()
      onClose()
      console.log('✅ Settings updated successfully')
    } catch (error) {
      console.error('❌ Failed to update settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getModalTitle = () => {
    switch (settingType) {
      case 'version-control':
        return 'Version Control Configuration'
      case 'change-requests':
        return 'Change Request Configuration'
      case 'notifications':
        return 'Notification Preferences'
      default:
        return 'Configuration'
    }
  }

  const renderVersionControlSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Version Retention Period (days)
        </label>
        <Input
          type="number"
          min="1"
          max="3650"
          value={localSettings.versionRetentionDays || 90}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            versionRetentionDays: parseInt(e.target.value) || 90
          }))}
          placeholder="90"
        />
        <p className="text-xs text-gray-500 mt-1">
          How long to keep old versions before archiving (1-3650 days)
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Versions per Test Case
        </label>
        <Input
          type="number"
          min="1"
          max="1000"
          value={localSettings.maxVersionsPerTestCase || 50}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            maxVersionsPerTestCase: parseInt(e.target.value) || 50
          }))}
          placeholder="50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maximum number of versions to keep per test case (1-1000)
        </p>
      </div>
    </div>
  )

  const renderChangeRequestSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Approver Role
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={localSettings.defaultApproverRole || 'project-lead'}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            defaultApproverRole: e.target.value
          }))}
        >
          <option value="project-lead">Project Lead</option>
          <option value="qa-lead">QA Lead</option>
          <option value="team-lead">Team Lead</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Default role for approving change requests
        </p>
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Notify on Change Request</p>
          <p className="text-xs text-gray-500">Send notifications when new change requests are created</p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.notifyOnChangeRequest || false}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            notifyOnChangeRequest: e.target.checked
          }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Notify on Approval</p>
          <p className="text-xs text-gray-500">Send notifications when change requests are approved</p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.notifyOnApproval || false}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            notifyOnApproval: e.target.checked
          }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Notify on Rejection</p>
          <p className="text-xs text-gray-500">Send notifications when change requests are rejected</p>
        </div>
        <input
          type="checkbox"
          checked={localSettings.notifyOnRejection || false}
          onChange={(e) => setLocalSettings(prev => ({
            ...prev,
            notifyOnRejection: e.target.checked
          }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  )

  const renderContent = () => {
    switch (settingType) {
      case 'version-control':
        return renderVersionControlSettings()
      case 'change-requests':
        return renderChangeRequestSettings()
      case 'notifications':
        return renderNotificationSettings()
      default:
        return <div>Invalid setting type</div>
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getModalTitle()}>
      <div className="p-6">
        {renderContent()}
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
} 