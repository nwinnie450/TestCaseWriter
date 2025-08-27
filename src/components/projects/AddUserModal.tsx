'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { addUserToProject, getCurrentUser, getAllUsers, getProjectMembers, User } from '@/lib/user-storage'
import { Mail, AlertCircle, CheckCircle, UserPlus, Users, ChevronDown, Search } from 'lucide-react'

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onSuccess?: () => void
}

export function AddUserModal({ isOpen, onClose, projectId, projectName, onSuccess }: AddUserModalProps) {
  const [email, setEmail] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [role, setRole] = useState<'member' | 'owner'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load available users when modal opens
  useEffect(() => {
    if (isOpen) {
      const allUsers = getAllUsers()
      const projectMembers = getProjectMembers(projectId)
      const memberIds = projectMembers.map(m => m.id)
      
      // Filter out users already in the project
      const available = allUsers.filter(user => !memberIds.includes(user.id))
      setAvailableUsers(available)
      setFilteredUsers(available)
    }
  }, [isOpen, projectId])

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(availableUsers)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = availableUsers.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, availableUsers])

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setEmail(user.email)
    setSearchQuery(user.name + ' (' + user.email + ')')
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let emailToAdd = ''
    if (selectedUser) {
      emailToAdd = selectedUser.email
    } else if (searchQuery.trim()) {
      // Check if searchQuery is a valid email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(searchQuery.trim())) {
        emailToAdd = searchQuery.trim()
      } else {
        setError('Please enter a valid email address')
        return
      }
    } else {
      setError('Please select a user or enter an email address')
      return
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
      setError('You must be logged in to add users')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await addUserToProject(projectId, emailToAdd, role, currentUser.id)
      setSuccess(`User ${emailToAdd} has been added to the project!`)
      
      setTimeout(() => {
        onSuccess?.()
        resetForm()
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to add user to project')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setSelectedUser(null)
    setRole('member')
    setError('')
    setSuccess('')
    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Add User to Project
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a team member to "{projectName}"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={selectedUser ? selectedUser.name + ' (' + selectedUser.email + ')' : 'Search users or enter email...'}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              </div>
              
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    <div className="py-1">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                        Available Users ({filteredUsers.length})
                      </div>
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                          onClick={() => handleUserSelect(user)}
                        >
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
                            alt={user.name}
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      {searchQuery ? 'No users found matching your search' : 'No available users'}
                      <div className="mt-2 text-xs">
                        You can still enter an email address manually
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search from existing users or type an email address to add new user
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'owner')}
              className="input w-full"
              disabled={loading}
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div><strong>Member:</strong> Can view and work on test cases</div>
              <div><strong>Owner:</strong> Can manage project and add/remove users</div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}


          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Add User
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}