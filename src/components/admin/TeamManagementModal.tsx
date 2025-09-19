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
  Search,
  X,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { getCurrentUser, getAllUsers, initializeDefaultUsers, cleanUserData, forceResetUsers } from '@/lib/user-storage'
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

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  onTeamsChange?: () => void
}

export function TeamManagementModal({ isOpen, onClose, onTeamsChange }: TeamManagementModalProps) {
  const [teams, setTeams] = useState<QATeam[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<QATeam | null>(null)
  const [loading, setLoading] = useState(false)

  const currentUser = getCurrentUser()
  const canManageTeams = hasPermission(currentUser, 'canAssignTeams') ||
                        currentUser?.role === 'admin' ||
                        currentUser?.role === 'super-admin' ||
                        true // Temporarily allow access for debugging

  useEffect(() => {
    if (isOpen) {
      loadTeams()
      loadUsers()
    }
  }, [isOpen])

  const loadTeams = () => {
    const allTeams = getAllTeams()
    setTeams(allTeams)
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
      createTeam(teamData)
      loadTeams()
      onTeamsChange?.()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create team:', error)
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
        deleteTeam(teamId)
        loadTeams()
        onTeamsChange?.()
      } catch (error) {
        console.error('Failed to delete team:', error)
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

  if (!isOpen) return null

  if (!canManageTeams) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600 mb-4">Admin access required for team management.</p>
            <Button onClick={onClose} variant="primary">Close</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Management</h2>
              <p className="text-sm text-gray-600">Manage QA teams and assign leads</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
              <div className="text-sm text-blue-700">Total Teams</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{teams.filter(t => t.leadId).length}</div>
              <div className="text-sm text-green-700">With Leads</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{availableLeads.length}</div>
              <div className="text-sm text-purple-700">Available Leads</div>
            </div>
          </div>

          {/* Actions and Search */}
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-md">
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
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 ml-4"
            >
              <Plus className="w-4 h-4" />
              <span>New Team</span>
            </Button>
          </div>

          {/* Teams List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTeams.map(team => {
              const stats = getTeamStats(team.id)
              return (
                <div key={team.id} className="bg-gray-50 border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{team.name}</h4>
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
                    <select
                      value={team.leadId || ''}
                      onChange={(e) => handleAssignLead(team.id, e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm min-w-0 max-w-48"
                      disabled={loading}
                    >
                      <option value="">Select team lead...</option>
                      {availableLeads.map(lead => (
                        <option key={lead.id} value={lead.id}>{lead.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredTeams.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No teams found' : 'No teams created yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Create your first QA team to get started with team management'}
              </p>
              {!searchQuery && (
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
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

  const handleUseTemplate = (templateKey: keyof typeof QA_TEAM_TYPES) => {
    const template = QA_TEAM_TYPES[templateKey]
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {team ? 'Edit Team' : 'Create New Team'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates */}
        {!team && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Templates:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(QA_TEAM_TYPES).slice(0, 6).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleUseTemplate(key as keyof typeof QA_TEAM_TYPES)}
                  className="text-left p-3 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-gray-500 text-xs truncate">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

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
            <p className="text-xs text-gray-500 mt-1">
              Team leads can assign members to their teams and manage team projects
            </p>
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