import { User } from '@/types'

export type UserRole = 'super-admin' | 'admin' | 'lead' | 'qa' | 'user' | 'guest'

export interface AccessPermissions {
  canViewLibrary: boolean
  canCreateTestCases: boolean
  canEditTestCases: boolean
  canDeleteTestCases: boolean
  canExport: boolean
  canManageTemplates: boolean
  canManageProjects: boolean
  canManageUsers: boolean
  canManageTeamMembers: boolean
  canAssignTeams: boolean
  canViewSettings: boolean
  canEditSettings: boolean
  canViewNotifications: boolean
  canAccessManagementPages: boolean
  canGenerateTestCases: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, AccessPermissions> = {
  'super-admin': {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: true,
    canExport: true,
    canManageTemplates: true,
    canManageProjects: true,
    canManageUsers: true,
    canManageTeamMembers: true,
    canAssignTeams: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewNotifications: true,
    canAccessManagementPages: true,
    canGenerateTestCases: true,
  },
  admin: {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: true,
    canExport: true,
    canManageTemplates: true,
    canManageProjects: true,
    canManageUsers: true,
    canManageTeamMembers: true,
    canAssignTeams: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewNotifications: true,
    canAccessManagementPages: true,
    canGenerateTestCases: true,
  },
  lead: {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: true,
    canExport: true,
    canManageTemplates: true,
    canManageProjects: true,
    canManageUsers: true,
    canManageTeamMembers: true,
    canAssignTeams: false,
    canViewSettings: true,
    canEditSettings: false,
    canViewNotifications: true,
    canAccessManagementPages: true,
    canGenerateTestCases: true,
  },
  qa: {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: false,
    canExport: true,
    canManageTemplates: false,
    canManageProjects: false,
    canManageUsers: false,
    canManageTeamMembers: false,
    canAssignTeams: false,
    canViewSettings: true,
    canEditSettings: false,
    canViewNotifications: true,
    canAccessManagementPages: false,
    canGenerateTestCases: true,
  },
  user: {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: true,
    canExport: true,
    canManageTemplates: true,
    canManageProjects: true,
    canManageUsers: false,
    canManageTeamMembers: false,
    canAssignTeams: false,
    canViewSettings: true,
    canEditSettings: true,
    canViewNotifications: true,
    canAccessManagementPages: true,
    canGenerateTestCases: true,
  },
  guest: {
    canViewLibrary: true,
    canCreateTestCases: false,
    canEditTestCases: false,
    canDeleteTestCases: false,
    canExport: false,
    canManageTemplates: false,
    canManageProjects: false,
    canManageUsers: false,
    canManageTeamMembers: false,
    canAssignTeams: false,
    canViewSettings: false,
    canEditSettings: false,
    canViewNotifications: false,
    canAccessManagementPages: false,
    canGenerateTestCases: false,
  },
}

export function getUserPermissions(user: User | null): AccessPermissions {
  if (!user) {
    return ROLE_PERMISSIONS.guest
  }

  const role = user.role || 'user'

  // Handle case where role might not exist in ROLE_PERMISSIONS
  if (role in ROLE_PERMISSIONS) {
    return ROLE_PERMISSIONS[role as UserRole]
  }

  // Fallback to 'user' role if role is not recognized
  console.warn(`Unknown user role: ${role}, falling back to 'user' permissions`)
  return ROLE_PERMISSIONS.user
}

export function hasPermission(user: User | null, permission: keyof AccessPermissions): boolean {
  const permissions = getUserPermissions(user)
  return permissions[permission]
}

export function isGuest(user: User | null): boolean {
  return user?.role === 'guest' || user?.id === 'guest_user'
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export function canAccessPage(user: User | null, page: string): boolean {
  const permissions = getUserPermissions(user)

  switch (page) {
    case '/library':
      return permissions.canViewLibrary
    case '/generate':
      return permissions.canGenerateTestCases
    case '/settings':
      return permissions.canViewSettings
    case '/projects':
      return permissions.canManageProjects
    case '/templates':
      return permissions.canManageTemplates
    case '/management':
      return permissions.canAccessManagementPages
    case '/users':
      return permissions.canManageUsers || permissions.canManageTeamMembers // Admins and Leads can manage users
    case '/export':
      return permissions.canExport
    case '/docs':
      return true // Docs are public
    case '/':
      return true // Dashboard is public
    default:
      return true // Allow access to public pages by default
  }
}

export function getRestrictedPagesForRole(role: UserRole): string[] {
  const permissions = ROLE_PERMISSIONS[role]
  const restrictedPages: string[] = []
  
  if (!permissions.canGenerateTestCases) restrictedPages.push('/generate')
  if (!permissions.canViewSettings) restrictedPages.push('/settings')
  if (!permissions.canManageProjects) restrictedPages.push('/projects')
  if (!permissions.canManageTemplates) restrictedPages.push('/templates')
  if (!permissions.canAccessManagementPages) {
    restrictedPages.push('/management', '/users')
  }
  
  return restrictedPages
}

export function shouldShowNotifications(user: User | null): boolean {
  return hasPermission(user, 'canViewNotifications')
}