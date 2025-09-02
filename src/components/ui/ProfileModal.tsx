'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Save, User } from 'lucide-react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {id: string, name: string, email: string, avatar?: string} | null
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [user])

  if (!isOpen) {
    return null
  }

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert('Name and email are required')
      return
    }

    // Validate password change if provided
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        alert('Current password is required to change password')
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert('New passwords do not match')
        return
      }
      if (formData.newPassword.length < 6) {
        alert('New password must be at least 6 characters')
        return
      }
    }

    // Update user in localStorage
    const updatedUser = {
      name: formData.name,
      email: formData.email,
      avatar: user?.avatar
    }

    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    // Trigger user update event so header refreshes
    window.dispatchEvent(new Event('userUpdated'))

    alert('✅ Profile updated successfully!')
    onClose()
  }

  const handleClose = () => {
    // Reset form
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                  Profile Settings
                </h3>
                <p className="text-sm text-gray-500">Update your personal information</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {user?.id || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Your unique user identifier (cannot be changed)</p>
            </div>
            
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
              required
            />

            {/* Password Change Section */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password (Optional)</h4>
              
              <div className="space-y-3">
                <Input
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />

                <Input
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  helperText="Minimum 6 characters"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}