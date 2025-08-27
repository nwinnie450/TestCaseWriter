'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  getProjectMembers, 
  removeUserFromProject, 
  getCurrentUser, 
  isProjectOwner,
  ProjectUser 
} from '@/lib/user-storage'
import { 
  Users, 
  Crown, 
  User, 
  Calendar, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  UserPlus 
} from 'lucide-react'

interface ProjectMembersModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  onAddUser?: () => void
}

export function ProjectMembersModal({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName, 
  onAddUser 
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<ProjectUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const currentUser = getCurrentUser()
  const isOwner = currentUser ? isProjectOwner(projectId, currentUser.id) : false

  useEffect(() => {
    if (isOpen) {
      loadMembers()
    }
  }, [isOpen, projectId])

  const loadMembers = () => {
    setLoading(true)
    setError('')
    try {
      const projectMembers = getProjectMembers(projectId)
      setMembers(projectMembers)
    } catch (err: any) {
      setError('Failed to load project members')
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!isOwner) {
      setError('Only project owners can remove users')
      return
    }

    if (currentUser?.id === userId) {
      setError('You cannot remove yourself from the project')
      return
    }

    if (!confirm(`Are you sure you want to remove ${userEmail} from this project?`)) {
      return
    }

    setRemoving(userId)
    setError('')
    setSuccess('')

    try {
      const removed = removeUserFromProject(projectId, userId)
      if (removed) {
        setSuccess(`${userEmail} has been removed from the project`)
        loadMembers() // Reload the members list
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove user')
    } finally {
      setRemoving(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'owner') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
          <Crown className="h-3 w-3 mr-1" />
          Owner
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 text-xs">
        <User className="h-3 w-3 mr-1" />
        Member
      </Badge>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Project Members
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage members for "{projectName}"
            </p>
          </div>
          
          {isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose()
                onAddUser?.()
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm mb-4">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 text-sm mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Loading members...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Members Yet</h3>
            <p className="text-gray-600 mb-4">
              This project doesn't have any members yet.
            </p>
            {isOwner && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  onAddUser?.()
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff`}
                      alt={member.name}
                      className="h-10 w-10 rounded-full"
                    />
                    {member.role === 'owner' && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      {getRoleBadge(member.role)}
                      {currentUser?.id === member.id && (
                        <Badge className="bg-green-100 text-green-800 text-xs">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {member.joinedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isOwner && currentUser?.id !== member.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(member.id, member.email)}
                      disabled={removing === member.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {removing === member.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        {!isOwner && members.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Only project owners can add or remove members
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}