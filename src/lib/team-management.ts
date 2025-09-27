export interface QATeam {
  id: string
  name: string
  description: string
  leadId?: string
  leadName?: string
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  userId: string
  teamId: string
  joinedAt: Date
  assignedBy: string
}

// Predefined QA team types
export const QA_TEAM_TYPES = {
  PRODUCT_QA: {
    id: 'product-qa',
    name: 'Product QA',
    description: 'Functional testing, user acceptance testing, and product quality assurance'
  },
  WHITEBOX_QA: {
    id: 'whitebox-qa',
    name: 'Whitebox QA',
    description: 'Code review, unit testing, integration testing, and technical quality assurance'
  },
  BACKEND_QA: {
    id: 'backend-qa',
    name: 'Backend QA',
    description: 'API testing, service integration testing, and backend quality assurance'
  }
} as const

const TEAMS_STORAGE_KEY = 'testCaseWriter_qaTeams'
const TEAM_MEMBERS_STORAGE_KEY = 'testCaseWriter_teamMembers'

// Team Management Functions
export async function getAllTeams(): Promise<QATeam[]> {
  try {
    const response = await fetch('/api/teams-direct')
    if (response.ok) {
      const teams = await response.json()
      // Convert database format to QATeam format
      return teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description || '',
        leadId: undefined, // TODO: Implement team leads
        leadName: undefined,
        memberIds: team.members?.map((m: any) => m.userId) || [],
        createdAt: new Date(team.createdAt),
        updatedAt: new Date(team.updatedAt)
      }))
    } else {
      console.error('Failed to fetch teams from API')
      return []
    }
  } catch (error) {
    console.error('Error fetching teams:', error)
    return []
  }
}

export async function createTeam(teamData: Omit<QATeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<QATeam | null> {
  try {
    const response = await fetch('/api/teams-direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: teamData.name,
        description: teamData.description,
        color: '#3B82F6', // Default blue color
        createdBy: 'user' // TODO: Get current user
      })
    })

    if (response.ok) {
      const team = await response.json()
      return {
        id: team.id,
        name: team.name,
        description: team.description || '',
        leadId: undefined,
        leadName: undefined,
        memberIds: [],
        createdAt: new Date(team.createdAt),
        updatedAt: new Date(team.updatedAt)
      }
    } else {
      const error = await response.json()
      console.error('Failed to create team:', error)
      return null
    }
  } catch (error) {
    console.error('Error creating team:', error)
    return null
  }
}

export async function updateTeam(teamId: string, updates: Partial<Omit<QATeam, 'id' | 'createdAt'>>): Promise<QATeam | null> {
  const teams = await getAllTeams()
  const teamIndex = teams.findIndex(t => t.id === teamId)

  if (teamIndex === -1) return null

  teams[teamIndex] = {
    ...teams[teamIndex],
    ...updates,
    updatedAt: new Date()
  }

  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  return teams[teamIndex]
}

export async function deleteTeam(teamId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/teams-direct?id=${teamId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      console.log('Team deleted successfully from database')
      return true
    } else {
      const error = await response.json()
      console.error('Failed to delete team:', error)
      return false
    }
  } catch (error) {
    console.error('Error deleting team:', error)
    return false
  }
}

export async function getTeamById(teamId: string): Promise<QATeam | null> {
  const teams = await getAllTeams()
  return teams.find(t => t.id === teamId) || null
}

export async function getTeamsByLead(leadId: string): Promise<QATeam[]> {
  const teams = await getAllTeams()
  return teams.filter(t => t.leadId === leadId)
}

// Team Member Management
export function getAllTeamMembers(): TeamMember[] {
  try {
    const stored = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export async function addMemberToTeam(teamId: string, userId: string, assignedBy: string): Promise<boolean> {
  const members = getAllTeamMembers()

  // Check if user is already in this team
  if (members.find(m => m.teamId === teamId && m.userId === userId)) {
    return false
  }

  const newMember: TeamMember = {
    teamId,
    userId,
    joinedAt: new Date(),
    assignedBy
  }

  members.push(newMember)
  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(members))

  // Update team member count
  const teams = await getAllTeams()
  const team = teams.find(t => t.id === teamId)
  if (team) {
    team.memberIds = getTeamMemberIds(teamId)
    team.updatedAt = new Date()
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  }

  return true
}

export async function removeMemberFromTeam(teamId: string, userId: string): Promise<boolean> {
  const members = getAllTeamMembers()
  const filteredMembers = members.filter(m => !(m.teamId === teamId && m.userId === userId))

  if (filteredMembers.length === members.length) return false

  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(filteredMembers))

  // Update team member count
  const teams = await getAllTeams()
  const team = teams.find(t => t.id === teamId)
  if (team) {
    team.memberIds = getTeamMemberIds(teamId)
    team.updatedAt = new Date()
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  }

  return true
}

export function removeAllMembersFromTeam(teamId: string): void {
  const members = getAllTeamMembers()
  const filteredMembers = members.filter(m => m.teamId !== teamId)
  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(filteredMembers))
}

export function getTeamMemberIds(teamId: string): string[] {
  const members = getAllTeamMembers()
  return members.filter(m => m.teamId === teamId).map(m => m.userId)
}

export async function getUserTeams(userId: string): Promise<QATeam[]> {
  const members = getAllTeamMembers()
  const userTeamIds = members.filter(m => m.userId === userId).map(m => m.teamId)

  const teams = await getAllTeams()
  return teams.filter(t => userTeamIds.includes(t.id) || t.leadId === userId)
}

export async function isTeamLead(userId: string, teamId?: string): Promise<boolean> {
  const teams = await getAllTeams()

  if (teamId) {
    const team = teams.find(t => t.id === teamId)
    return team?.leadId === userId || false
  }

  // Check if user is lead of any team
  return teams.some(t => t.leadId === userId)
}

export async function assignTeamLead(teamId: string, leadId: string, leadName: string): Promise<boolean> {
  const teams = await getAllTeams()
  const team = teams.find(t => t.id === teamId)

  if (!team) return false

  team.leadId = leadId
  team.leadName = leadName
  team.updatedAt = new Date()

  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  return true
}

// Initialize default teams if none exist
export async function initializeDefaultTeams(): Promise<void> {
  const existingTeams = await getAllTeams()

  if (existingTeams.length === 0) {
    const defaultTeams = Object.values(QA_TEAM_TYPES).map(teamType => ({
      name: teamType.name,
      description: teamType.description,
      memberIds: [],
      leadId: undefined,
      leadName: undefined
    }))

    for (const teamData of defaultTeams) {
      await createTeam(teamData)
    }
    console.log('Default QA teams initialized')
  }
}

// Get teams available for assignment (teams without a lead or led by current user)
export async function getAssignableTeams(currentUserId: string, isAdmin: boolean): Promise<QATeam[]> {
  const teams = await getAllTeams()

  if (isAdmin) {
    return teams // Admins can assign to any team
  }

  // Leads can only manage their own teams
  return teams.filter(t => t.leadId === currentUserId)
}

// Get team statistics
export async function getTeamStats(teamId: string) {
  const team = await getTeamById(teamId)
  if (!team) return null

  const memberIds = getTeamMemberIds(teamId)

  return {
    memberCount: memberIds.length,
    hasLead: !!team.leadId,
    leadName: team.leadName,
    createdAt: team.createdAt,
    lastUpdated: team.updatedAt
  }
}