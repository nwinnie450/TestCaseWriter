'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Users,
  Plus,
  UserPlus,
  FolderOpen,
  Target,
  Search,
  Check,
  X,
  ArrowRight,
  User,
  Mail
} from 'lucide-react'
import { getCurrentUser } from '@/lib/user-storage'
import { hasPermission } from '@/lib/access-control'

interface UserAssignmentProps {
  type: 'project' | 'execution'
  targetId: string
  targetName: string
  onAssignmentChange?: (assignedUsers: string[]) => void
}

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

export function UserAssignment({ type, targetId, targetName, onAssignmentChange }: UserAssignmentProps) {
  const [availableUsers, setAvailableUsers] = useState<UserInfo[]>([])
  const [assignedUsers, setAssignedUsers] = useState<UserInfo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentUser = getCurrentUser()
  const canAssignUsers = hasPermission(currentUser, 'canManageProjects') ||
                        currentUser?.role === 'lead' ||
                        currentUser?.role === 'admin'

  // Load users and assignments
  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadAssignments()
    }
  }, [isOpen, targetId])

  const loadUsers = () => {
    // Get all users from localStorage (QA testers)
    const allUsers = JSON.parse(localStorage.getItem('testCaseWriter_users') || '[]')
    const qaUsers = allUsers.filter((u: any) => u.role === 'user' || u.role === 'qa')
    setAvailableUsers(qaUsers)
  }

  const loadAssignments = () => {
    // Get current assignments for this project/execution
    const storageKey = type === 'project'
      ? `testCaseWriter_project_${targetId}_assignments`
      : `testCaseWriter_execution_${targetId}_assignments`

    const assignments = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const allUsers = JSON.parse(localStorage.getItem('testCaseWriter_users') || '[]')

    const assigned = assignments.map((userId: string) =>
      allUsers.find((u: any) => u.id === userId)
    ).filter(Boolean)

    setAssignedUsers(assigned)
  }

  const saveAssignments = (userIds: string[]) => {
    const storageKey = type === 'project'
      ? `testCaseWriter_project_${targetId}_assignments`
      : `testCaseWriter_execution_${targetId}_assignments`

    localStorage.setItem(storageKey, JSON.stringify(userIds))
    onAssignmentChange?.(userIds)
  }

  const assignUser = (user: UserInfo) => {
    const newAssigned = [...assignedUsers, user]
    setAssignedUsers(newAssigned)
    saveAssignments(newAssigned.map(u => u.id))
  }

  const unassignUser = (userId: string) => {
    const newAssigned = assignedUsers.filter(u => u.id !== userId)
    setAssignedUsers(newAssigned)
    saveAssignments(newAssigned.map(u => u.id))
  }

  const filteredAvailableUsers = availableUsers.filter(user =>
    !assignedUsers.find(assigned => assigned.id === user.id) &&
    (searchQuery === '' ||
     user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!canAssignUsers) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <UserPlus className="h-4 w-4" />
        <span>Assign Users ({assignedUsers.length})</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assign Users to {type === 'project' ? 'Project' : 'Execution Run'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <strong>{targetName}</strong>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search QA testers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {/* Currently Assigned Users */}
              {assignedUsers.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Assigned Users ({assignedUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {assignedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-green-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => unassignUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Users */}
              <div className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Available QA Testers
                </h4>
                {filteredAvailableUsers.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">
                    {searchQuery ? 'No users match your search' : 'No available users to assign'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => assignUser(user)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Assigned: {assignedUsers.length} users</span>
                <span>Available: {filteredAvailableUsers.length} users</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Summary component for showing assigned users inline
export function AssignedUsersSummary({
  type,
  targetId,
  maxDisplay = 3
}: {
  type: 'project' | 'execution'
  targetId: string
  maxDisplay?: number
}) {
  const [assignedUsers, setAssignedUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    const storageKey = type === 'project'
      ? `testCaseWriter_project_${targetId}_assignments`
      : `testCaseWriter_execution_${targetId}_assignments`

    const assignments = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const allUsers = JSON.parse(localStorage.getItem('testCaseWriter_users') || '[]')

    const assigned = assignments.map((userId: string) =>
      allUsers.find((u: any) => u.id === userId)
    ).filter(Boolean)

    setAssignedUsers(assigned)
  }, [type, targetId])

  if (assignedUsers.length === 0) {
    return (
      <span className="text-xs text-gray-500">No users assigned</span>
    )
  }

  const displayUsers = assignedUsers.slice(0, maxDisplay)
  const remainingCount = assignedUsers.length - maxDisplay

  return (
    <div className="flex items-center space-x-1">
      {displayUsers.map((user, index) => (
        <div
          key={user.id}
          className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700"
          title={`${user.name} (${user.email})`}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}