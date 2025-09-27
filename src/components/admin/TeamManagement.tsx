'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Crown,
  Shield,
  User,
  UserPlus,
  Search,
  X,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { getCurrentUser, getAllUsers, initializeDefaultUsers, cleanUserData, forceResetUsers, registerUser } from '@/lib/user-storage'
import { hasPermission } from '@/lib/access-control'
import {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMemberIds,
  assignTeamLead,
  QATeam,
  QA_TEAM_TYPES,
  getTeamStats
} from '@/lib/team-management'

interface TeamManagementProps {
  onTeamsChange?: () => void
}

export function TeamManagement({ onTeamsChange }: TeamManagementProps) {
  const [teams, setTeams] = useState<QATeam[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<QATeam | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentUser = getCurrentUser()
  const canManageTeams = hasPermission(currentUser, 'canAssignTeams') ||
                        currentUser?.role === 'admin' ||
                        currentUser?.role === 'super-admin' ||
                        true // Temporarily allow access for debugging

  useEffect(() => {
    loadTeams()
    loadUsers()
  }, [])

  const loadTeams = async () => {
    try {
      const allTeams = await getAllTeams()
      setTeams(allTeams)
    } catch (error) {
      console.error('Failed to load teams:', error)
      setTeams([])
    }
  }

  const loadUsers = () => {
    // Clean any corrupted user data first
    cleanUserData()
    // Ensure default users exist (including team lead)
    initializeDefaultUsers()
    const allUsers = getAllUsers()
    console.log('Available users for team leads:', allUsers.filter(u => u.role === 'lead'))
    setUsers(allUsers)
  }

  const handleCreateTeam = async (teamData: Omit<QATeam, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    try {
      const result = await createTeam(teamData)
      if (result) {
        await loadTeams()
        onTeamsChange?.()
        setShowCreateModal(false)
      } else {
        alert('Failed to create team. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create team:', error)
      alert('Error creating team: ' + (error as Error).message)
    }
    setLoading(false)
  }

  const handleUpdateTeam = async (teamId: string, updates: Partial<QATeam>) => {
    setLoading(true)
    try {
      updateTeam(teamId, updates)
      loadTeams()
      onTeamsChange?.()
      setEditingTeam(null)
    } catch (error) {
      console.error('Failed to update team:', error)
    }
    setLoading(false)
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? All members will be removed.')) {
      setLoading(true)
      try {
        const success = await deleteTeam(teamId)
        if (success) {
          await loadTeams()
          onTeamsChange?.()
          console.log('Team deleted successfully')
        } else {
          alert('Failed to delete team. Please try again.')
        }
      } catch (error) {
        console.error('Failed to delete team:', error)
        alert('Error deleting team: ' + (error as Error).message)
      }
      setLoading(false)
    }
  }

  const handleAssignLead = async (teamId: string, leadId: string) => {
    setLoading(true)
    try {
      const leadUser = users.find(u => u.id === leadId)
      if (leadUser) {
        assignTeamLead(teamId, leadId, leadUser.name)
        loadTeams()
        onTeamsChange?.()
      }
    } catch (error) {
      console.error('Failed to assign team lead:', error)
    }
    setLoading(false)
  }


  const filteredTeams = teams.filter(team =>
    searchQuery === '' ||
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.leadName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableLeads = users.filter(u => u.role === 'lead')

  if (!canManageTeams) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">Admin access required for team management.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
              <p className="text-sm text-gray-600">Manage QA teams and assign leads</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Team</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-blue-600">{teams.length}</div>
            <div className="text-sm text-blue-700">Total Teams</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{teams.filter(t => t.leadId).length}</div>
            <div className="text-sm text-green-700">With Leads</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{availableLeads.length}</div>
            <div className="text-sm text-purple-700">Available Leads</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Teams ({filteredTeams.length})</h4>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredTeams.map(team => {
            const stats = getTeamStats(team.id)
            return (
              <div key={team.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{team.name}</h5>
                      <p className="text-sm text-gray-600">{team.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingTeam(team)}
                      className="p-2"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Team Lead:</span>
                    <span className={`text-sm font-medium ${team.leadId ? 'text-gray-900' : 'text-orange-600'}`}>
                      {team.leadId ? team.leadName : 'No lead assigned'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={team.leadId || ''}
                      onChange={(e) => handleAssignLead(team.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={loading}
                    >
                      <option value="">Select team lead...</option>
                      {availableLeads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No teams found' : 'No teams created yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Create your first QA team to get started'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create First Team
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Team Modal */}
      {(showCreateModal || editingTeam) && (
        <TeamModal
          team={editingTeam}
          isOpen={showCreateModal || !!editingTeam}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTeam(null)
          }}
          onSave={(teamData) => {
            if (editingTeam) {
              handleUpdateTeam(editingTeam.id, teamData)
            } else {
              handleCreateTeam(teamData)
            }
          }}
          loading={loading}
          availableLeads={availableLeads}
        />
      )}

    </div>
  )
}

// Team Modal Component
interface TeamModalProps {
  team: QATeam | null
  isOpen: boolean
  onClose: () => void
  onSave: (teamData: Partial<QATeam>) => void
  loading: boolean
  availableLeads: any[]
}

function TeamModal({ team, isOpen, onClose, onSave, loading, availableLeads }: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    leadId: team?.leadId || '',
    leadName: team?.leadName || ''
  })

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description,
        leadId: team.leadId || '',
        leadName: team.leadName || ''
      })
    }
  }, [team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedLead = availableLeads.find(lead => lead.id === formData.leadId)

    onSave({
      name: formData.name,
      description: formData.description,
      leadId: formData.leadId || undefined,
      leadName: selectedLead?.name || undefined,
      memberIds: team?.memberIds || []
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {team ? 'Edit Team' : 'Create New Team'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Product QA, Automation QA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the team's responsibilities and focus areas..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead (Optional)</label>
            <select
              value={formData.leadId}
              onChange={(e) => {
                const selectedLead = availableLeads.find(lead => lead.id === e.target.value)
                setFormData(prev => ({
                  ...prev,
                  leadId: e.target.value,
                  leadName: selectedLead?.name || ''
                }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">No lead assigned</option>
              {availableLeads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.name} ({lead.email})</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" size="md" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : (team ? 'Update Team' : 'Create Team')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

