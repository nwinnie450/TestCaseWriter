import { User } from '@/types'

const USERS_STORAGE_KEY = 'testCaseWriter_users'
const CURRENT_USER_KEY = 'testCaseWriter_currentUser'

export interface ProjectUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'owner' | 'member'
  joinedAt: Date
  invitedBy?: string
}

export interface ProjectMembership {
  projectId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: Date
  invitedBy?: string
}

// Simple password hashing (for development - use proper hashing in production)
function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  return btoa(password) // Base64 encoding for demo purposes
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return btoa(password) === hashedPassword
}

// User Management
export function registerUser(email: string, name: string, password: string): User {
  const users = getAllUsers()
  console.log('registerUser called with:', email, name)
  console.log('Current users before registration:', users)
  
  // Check if user already exists
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (existingUser) {
    throw new Error('User with this email already exists')
  }
  
  const newUser: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    password: hashPassword(password),
    role: 'user',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
  }
  
  console.log('Created new user:', newUser)
  users.push(newUser)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  console.log('Users after registration:', getAllUsers())
  
  return newUser
}

export function loginUser(email: string, password: string): User | null {
  console.log('loginUser called with:', email)
  const users = getAllUsers()
  console.log('All users:', users)
  console.log('User emails:', users.map(u => u.email))
  console.log('Searching for email (lowercase):', email.toLowerCase())
  
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  console.log('Found user:', user)
  
  if (user && verifyPassword(password, user.password)) {
    console.log('Password verified successfully')
    // Set current user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    console.log('User logged in and stored in localStorage')
    
    // Dispatch user update event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('userUpdated'))
    }
    
    return user
  } else if (user) {
    console.log('Password verification failed')
  } else {
    console.log('User not found')
  }
  
  return null
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('userUpdated'))
  }
}

export function getAllUsers(): User[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getUserByEmail(email: string): User | null {
  const users = getAllUsers()
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

export function getUserById(userId: string): User | null {
  const users = getAllUsers()
  return users.find(u => u.id === userId) || null
}

// Project Membership Management
const PROJECT_MEMBERS_KEY = 'testCaseWriter_projectMembers'

export function getProjectMembers(projectId: string): ProjectUser[] {
  try {
    const stored = localStorage.getItem(PROJECT_MEMBERS_KEY)
    const allMemberships: ProjectMembership[] = stored ? JSON.parse(stored) : []
    
    const projectMemberships = allMemberships.filter(m => m.projectId === projectId)
    
    // Get user details for each membership
    const users = getAllUsers()
    return projectMemberships.map(membership => {
      const user = users.find(u => u.id === membership.userId)
      if (!user) {
        throw new Error(`User not found: ${membership.userId}`)
      }
      
      return {
        ...user,
        role: membership.role,
        joinedAt: new Date(membership.joinedAt),
        invitedBy: membership.invitedBy
      }
    }).sort((a, b) => {
      // Sort by role (owners first), then by join date
      if (a.role !== b.role) {
        return a.role === 'owner' ? -1 : 1
      }
      return a.joinedAt.getTime() - b.joinedAt.getTime()
    })
  } catch (error) {
    console.error('Failed to get project members:', error)
    return []
  }
}

export function addUserToProject(projectId: string, email: string, role: 'member' | 'owner' = 'member', invitedBy?: string): boolean {
  try {
    const users = getAllUsers()
    const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!targetUser) {
      throw new Error('User not found with this email address')
    }
    
    const stored = localStorage.getItem(PROJECT_MEMBERS_KEY)
    const allMemberships: ProjectMembership[] = stored ? JSON.parse(stored) : []
    
    // Check if user is already a member
    const existingMembership = allMemberships.find(m => 
      m.projectId === projectId && m.userId === targetUser.id
    )
    
    if (existingMembership) {
      throw new Error('User is already a member of this project')
    }
    
    // Add new membership
    const newMembership: ProjectMembership = {
      projectId,
      userId: targetUser.id,
      role,
      joinedAt: new Date(),
      invitedBy
    }
    
    allMemberships.push(newMembership)
    localStorage.setItem(PROJECT_MEMBERS_KEY, JSON.stringify(allMemberships))
    
    return true
  } catch (error) {
    console.error('Failed to add user to project:', error)
    throw error
  }
}

export function removeUserFromProject(projectId: string, userId: string): boolean {
  try {
    const stored = localStorage.getItem(PROJECT_MEMBERS_KEY)
    const allMemberships: ProjectMembership[] = stored ? JSON.parse(stored) : []
    
    const updatedMemberships = allMemberships.filter(m => 
      !(m.projectId === projectId && m.userId === userId)
    )
    
    localStorage.setItem(PROJECT_MEMBERS_KEY, JSON.stringify(updatedMemberships))
    return true
  } catch (error) {
    console.error('Failed to remove user from project:', error)
    return false
  }
}

export function getUserProjects(userId: string): string[] {
  try {
    const stored = localStorage.getItem(PROJECT_MEMBERS_KEY)
    const allMemberships: ProjectMembership[] = stored ? JSON.parse(stored) : []
    
    return allMemberships
      .filter(m => m.userId === userId)
      .map(m => m.projectId)
  } catch (error) {
    console.error('Failed to get user projects:', error)
    return []
  }
}

export function isProjectOwner(projectId: string, userId: string): boolean {
  try {
    const stored = localStorage.getItem(PROJECT_MEMBERS_KEY)
    const allMemberships: ProjectMembership[] = stored ? JSON.parse(stored) : []
    
    const membership = allMemberships.find(m => 
      m.projectId === projectId && m.userId === userId
    )
    
    return membership?.role === 'owner' || false
  } catch (error) {
    console.error('Failed to check project ownership:', error)
    return false
  }
}

export function getProjectOwner(projectId: string): ProjectUser | null {
  const members = getProjectMembers(projectId)
  return members.find(m => m.role === 'owner') || null
}

// Reset user storage to migrate to password-based authentication
export function resetUserStorage(): void {
  localStorage.removeItem(USERS_STORAGE_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.removeItem(PROJECT_MEMBERS_KEY)
}

// Initialize with some default users for testing
export function initializeDefaultUsers(): void {
  const users = getAllUsers()
  
  // Check if users exist but don't have password field - migrate to new structure
  if (users.length > 0 && users.some(u => !u.password)) {
    console.log('Migrating user storage to password-based authentication')
    resetUserStorage()
  }
  
  if (getAllUsers().length === 0) {
    const defaultUsers = [
      {
        id: 'user_1',
        email: 'john.doe@example.com',
        name: 'John Doe',
        password: hashPassword('password123'),
        role: 'user',
        avatar: 'https://ui-avatars.com/api/?name=John%20Doe&background=6366f1&color=fff'
      },
      {
        id: 'user_2', 
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        password: hashPassword('password123'),
        role: 'user',
        avatar: 'https://ui-avatars.com/api/?name=Jane%20Smith&background=10b981&color=fff'
      },
      {
        id: 'user_3',
        email: 'admin@testcasewriter.com',
        name: 'Admin User',
        password: hashPassword('admin123'),
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin%20User&background=f59e0b&color=fff'
      },
      {
        id: 'user_4',
        email: 'admin',
        name: 'Administrator',
        password: hashPassword('Orion888!'),
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Administrator&background=dc2626&color=fff'
      }
    ]
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
  }
}