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
export function getAllTeams(): QATeam[] {
  try {
    const stored = localStorage.getItem(TEAMS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function createTeam(teamData: Omit<QATeam, 'id' | 'createdAt' | 'updatedAt'>): QATeam {
  const teams = getAllTeams()

  const newTeam: QATeam = {
    ...teamData,
    id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  teams.push(newTeam)
  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))

  return newTeam
}

export function updateTeam(teamId: string, updates: Partial<Omit<QATeam, 'id' | 'createdAt'>>): QATeam | null {
  const teams = getAllTeams()
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

export function deleteTeam(teamId: string): boolean {
  const teams = getAllTeams()
  const filteredTeams = teams.filter(t => t.id !== teamId)

  if (filteredTeams.length === teams.length) return false

  // Also remove all team members
  removeAllMembersFromTeam(teamId)

  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(filteredTeams))
  return true
}

export function getTeamById(teamId: string): QATeam | null {
  const teams = getAllTeams()
  return teams.find(t => t.id === teamId) || null
}

export function getTeamsByLead(leadId: string): QATeam[] {
  const teams = getAllTeams()
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

export function addMemberToTeam(teamId: string, userId: string, assignedBy: string): boolean {
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
  const teams = getAllTeams()
  const team = teams.find(t => t.id === teamId)
  if (team) {
    team.memberIds = getTeamMemberIds(teamId)
    team.updatedAt = new Date()
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  }

  return true
}

export function removeMemberFromTeam(teamId: string, userId: string): boolean {
  const members = getAllTeamMembers()
  const filteredMembers = members.filter(m => !(m.teamId === teamId && m.userId === userId))

  if (filteredMembers.length === members.length) return false

  localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(filteredMembers))

  // Update team member count
  const teams = getAllTeams()
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

export function getUserTeams(userId: string): QATeam[] {
  const members = getAllTeamMembers()
  const userTeamIds = members.filter(m => m.userId === userId).map(m => m.teamId)

  const teams = getAllTeams()
  return teams.filter(t => userTeamIds.includes(t.id) || t.leadId === userId)
}

export function isTeamLead(userId: string, teamId?: string): boolean {
  const teams = getAllTeams()

  if (teamId) {
    const team = teams.find(t => t.id === teamId)
    return team?.leadId === userId || false
  }

  // Check if user is lead of any team
  return teams.some(t => t.leadId === userId)
}

export function assignTeamLead(teamId: string, leadId: string, leadName: string): boolean {
  const teams = getAllTeams()
  const team = teams.find(t => t.id === teamId)

  if (!team) return false

  team.leadId = leadId
  team.leadName = leadName
  team.updatedAt = new Date()

  localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams))
  return true
}

// Initialize default teams if none exist
export function initializeDefaultTeams(): void {
  const existingTeams = getAllTeams()

  if (existingTeams.length === 0) {
    const defaultTeams = Object.values(QA_TEAM_TYPES).map(teamType => ({
      name: teamType.name,
      description: teamType.description,
      memberIds: [],
      leadId: undefined,
      leadName: undefined
    }))

    defaultTeams.forEach(teamData => createTeam(teamData))
    console.log('Default QA teams initialized')
  }
}

// Get teams available for assignment (teams without a lead or led by current user)
export function getAssignableTeams(currentUserId: string, isAdmin: boolean): QATeam[] {
  const teams = getAllTeams()

  if (isAdmin) {
    return teams // Admins can assign to any team
  }

  // Leads can only manage their own teams
  return teams.filter(t => t.leadId === currentUserId)
}

// Get team statistics
export function getTeamStats(teamId: string) {
  const team = getTeamById(teamId)
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