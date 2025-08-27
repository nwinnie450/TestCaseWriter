'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ExportProfile } from '@/types'
import { X, Save, FileText, Database } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profile: ExportProfile) => void
  profile: ExportProfile | null
}

const formatOptions = [
  { value: 'excel', label: 'Microsoft Excel', icon: FileText, description: 'Export as .xlsx file' },
  { value: 'csv', label: 'CSV File', icon: FileText, description: 'Comma-separated values' },
  { value: 'json', label: 'JSON File', icon: FileText, description: 'JSON format' },
  { value: 'testrail', label: 'TestRail', icon: Database, description: 'TestRail integration' },
  { value: 'jira', label: 'Jira Xray', icon: Database, description: 'Jira Xray integration' }
]

export function EditProfileModal({ isOpen, onClose, onSave, profile }: EditProfileModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState<string>('excel')
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setDescription(profile.description || '')
      setFormat(profile.format)
    }
  }, [profile])

  if (!isOpen || !profile) {
    return null
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!name.trim()) {
      newErrors.name = 'Profile name is required'
    }
    
    if (!format) {
      newErrors.format = 'Export format is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      return
    }

    const updatedProfile: ExportProfile = {
      ...profile,
      name: name.trim(),
      description: description.trim() || undefined,
      format: format as any,
      updatedAt: new Date()
    }

    onSave(updatedProfile)
    onClose()
  }

  const selectedFormat = formatOptions.find(f => f.value === format)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                Edit Export Profile
              </h3>
              <p className="text-sm text-gray-500">Update the profile configuration</p>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Profile Name */}
            <div>
              <Input
                label="Profile Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Excel Export"
                required
                error={errors.name}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Describe what this profile is used for..."
              />
            </div>

            {/* Export Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format *
              </label>
              <div className="space-y-2">
                {formatOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        format === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={format === option.value}
                        onChange={(e) => setFormat(e.target.value)}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 ${format === option.value ? 'text-primary-600' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                      {format === option.value && (
                        <div className="h-2 w-2 bg-primary-600 rounded-full"></div>
                      )}
                    </label>
                  )
                })}
              </div>
              {errors.format && (
                <p className="mt-1 text-sm text-red-600">{errors.format}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Preview */}
          {selectedFormat && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <div className="flex items-center space-x-2">
                <selectedFormat.icon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">{name || 'Untitled Profile'}</span>
                <span className="text-sm text-gray-500">→</span>
                <span className="text-sm text-gray-600">{selectedFormat.label}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
