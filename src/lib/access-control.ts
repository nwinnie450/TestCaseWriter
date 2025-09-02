import { User } from '@/types'

export type UserRole = 'admin' | 'user' | 'guest'

export interface AccessPermissions {
  canViewLibrary: boolean
  canCreateTestCases: boolean
  canEditTestCases: boolean
  canDeleteTestCases: boolean
  canExport: boolean
  canManageTemplates: boolean
  canManageProjects: boolean
  canManageUsers: boolean
  canViewSettings: boolean
  canEditSettings: boolean
  canViewNotifications: boolean
  canAccessManagementPages: boolean
  canGenerateTestCases: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, AccessPermissions> = {
  admin: {
    canViewLibrary: true,
    canCreateTestCases: true,
    canEditTestCases: true,
    canDeleteTestCases: true,
    canExport: true,
    canManageTemplates: true,
    canManageProjects: true,
    canManageUsers: true,
    canViewSettings: true,
    canEditSettings: true,
    canViewNotifications: true,
    canAccessManagementPages: true,
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
    canViewSettings: true,
    canEditSettings: true,
    canViewNotifications: true,
    canAccessManagementPages: false,
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
  return ROLE_PERMISSIONS[role]
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
    case '/users':
      return permissions.canAccessManagementPages
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