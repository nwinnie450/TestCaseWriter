'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Users,
  Plus,
  Search,
  Check,
  X,
  User,
  Crown,
  Shield,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react'
import { getAllUsers, getCurrentUser } from '@/lib/user-storage'
import { hasPermission } from '@/lib/access-control'
import {
  getAllTeams,
  addMemberToTeam,
  removeMemberFromTeam,
  getTeamMemberIds,
  assignTeamLead,
  QATeam,
  initializeDefaultTeams,
  getAssignableTeams,
  getUserTeams
} from '@/lib/team-management'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface TeamAssignmentProps {
  userId: string
  userName: string
  userRole: string
  onAssignmentChange?: () => void
}

export function TeamAssignment({ userId, userName, userRole, onAssignmentChange }: TeamAssignmentProps) {
  const [teams, setTeams] = useState<QATeam[]>([])
  const [userTeams, setUserTeams] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const currentUser = getCurrentUser()
  const canAssignTeams = hasPermission(currentUser, 'canAssignTeams') ||
                        hasPermission(currentUser, 'canManageTeamMembers')

  useEffect(() => {
    if (isOpen) {
      loadTeams()
      setTimeout(() => {
        loadUserTeams()
      }, 50)
    }
  }, [isOpen, userId])

  useEffect(() => {
    // Initialize default teams if none exist
    initializeDefaultTeams()
  }, [])

  const loadTeams = () => {
    const allTeams = getAllTeams()

    // Filter teams based on user permissions
    let availableTeams = allTeams
    if (currentUser?.role === 'lead') {
      availableTeams = getAssignableTeams(currentUser.id, false)
    }

    setTeams(availableTeams)
  }

  const loadUserTeams = () => {
    // Use the proper library function to get user teams
    const userTeamsData = getUserTeams(userId)
    const userTeamIds = userTeamsData.map(team => team.id)
    setUserTeams(userTeamIds)
  }

  const assignToTeam = async (teamId: string) => {
    setLoading(true)
    try {
      if (userRole === 'lead') {
        // Assign as team lead
        const team = teams.find(t => t.id === teamId)
        if (team) {
          assignTeamLead(teamId, userId, userName)
        }
      } else {
        // Assign as team member
        addMemberToTeam(teamId, userId, currentUser?.id || 'admin')
      }

      loadUserTeams()
      onAssignmentChange?.()
    } catch (error) {
      console.error('Failed to assign to team:', error)
    }
    setLoading(false)
  }

  const removeFromTeam = async (teamId: string) => {
    setLoading(true)
    try {
      if (userRole === 'lead') {
        // Remove as team lead
        const teams = getAllTeams()
        const team = teams.find(t => t.id === teamId)
        if (team) {
          assignTeamLead(teamId, '', '')
        }
      } else {
        // Remove as team member
        removeMemberFromTeam(teamId, userId)
      }

      loadUserTeams()
      onAssignmentChange?.()
    } catch (error) {
      console.error('Failed to remove from team:', error)
    }
    setLoading(false)
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      loadTeams()
      await new Promise(resolve => setTimeout(resolve, 50))
      loadUserTeams()
      onAssignmentChange?.()
    } catch (error) {
      console.error('Error during refresh:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTeams = teams.filter(team =>
    searchQuery === '' ||
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const availableTeams = filteredTeams.filter(team => !userTeams.includes(team.id))
  const assignedTeams = filteredTeams.filter(team => userTeams.includes(team.id))

  if (!canAssignTeams) {
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
        <Users className="h-4 w-4" />
        <span>Manage Teams</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Assignment
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refreshData}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Refresh data"
                  >
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 text-left">
                <strong>{userName}</strong> ({userRole})
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

            <div className="max-h-96 overflow-y-auto">
              {/* Assigned Teams */}
              {assignedTeams.length > 0 && (
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    Assigned Teams ({assignedTeams.length})
                  </h4>
                  <div className="space-y-3">
                    {assignedTeams.map(team => {
                      const isLead = team.leadId === userId
                      return (
                        <div key={team.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isLead ? 'bg-yellow-200' : 'bg-green-200'
                            }`}>
                              {isLead ? (
                                <Crown className="w-3 h-3 text-yellow-700" />
                              ) : (
                                <User className="w-3 h-3 text-green-700" />
                              )}
                            </div>
                            <div className="text-left flex-1">
                              <div className="text-base font-medium text-gray-900">
                                {team.name}
                                {isLead && <span className="ml-1 text-xs text-yellow-600">(Lead)</span>}
                              </div>
                              <div className="text-sm text-gray-500">{team.description}</div>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => removeFromTeam(team.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Available Teams */}
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Available Teams
                </h4>
                {availableTeams.length === 0 ? (
                  <div className="text-sm text-gray-500 py-6">
                    {searchQuery ? 'No teams match your search' : 'No available teams to assign'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableTeams.map(team => (
                      <div key={team.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <Shield className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="text-base font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500">{team.description}</div>
                            <div className="text-sm text-blue-600">
                              {team.leadName ? `Lead: ${team.leadName}` : 'No lead assigned'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => assignToTeam(team.id)}
                          disabled={loading}
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

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Assigned: {assignedTeams.length} teams</span>
                <span>Available: {availableTeams.length} teams</span>
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Summary component for showing user teams inline
export function UserTeamsSummary({
  userId,
  maxDisplay = 2
}: {
  userId: string
  maxDisplay?: number
}) {
  const [userTeams, setUserTeams] = useState<{team: QATeam, isLead: boolean}[]>([])

  useEffect(() => {
    // Use the proper library function
    const teams = getUserTeams(userId)
    const userTeamData: {team: QATeam, isLead: boolean}[] = []

    teams.forEach(team => {
      const isLead = team.leadId === userId
      userTeamData.push({ team, isLead })
    })

    setUserTeams(userTeamData)
  }, [userId])

  if (userTeams.length === 0) {
    return (
      <span className="text-xs text-gray-500">No teams assigned</span>
    )
  }

  const displayTeams = userTeams.slice(0, maxDisplay)
  const remainingCount = userTeams.length - maxDisplay

  return (
    <div className="flex items-center space-x-1">
      {displayTeams.map(({ team, isLead }, index) => (
        <div
          key={team.id}
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isLead
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-blue-100 text-blue-800 border border-blue-200'
          }`}
          title={`${team.name}${isLead ? ' (Lead)' : ' (Member)'}`}
        >
          {isLead && <Crown className="w-3 h-3 inline mr-1" />}
          {team.name}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}