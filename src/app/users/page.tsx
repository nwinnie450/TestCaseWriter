'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  User,
  Mail,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  Crown,
  Settings,
  Send,
  AlertTriangle
} from 'lucide-react'
import { AuthService } from '@/lib/auth-service'
import { EmailService, type EmailConfig } from '@/lib/email-service'
import { User as UserType } from '@/types'
import { hasPermission } from '@/lib/access-control'
import { TeamAssignment, UserTeamsSummary } from '@/components/user-management/TeamAssignment'
import { TeamManagement } from '@/components/admin/TeamManagement'
import { getAllTeams, initializeDefaultTeams } from '@/lib/team-management'

const DEFAULT_EMAIL_CONFIG: EmailConfig = {
  provider: 'development',
  fromEmail: 'noreply@testcasewriter.com',
  fromName: 'Test Case Writer',
  gmailUser: '',
  gmailPassword: ''
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'teams' | 'email'>('users')

  // Email configuration states
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [emailLoading, setEmailLoading] = useState(true)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => ({
    ...DEFAULT_EMAIL_CONFIG
  }))
  const [savingConfig, setSavingConfig] = useState(false)

  const normalizeEmailConfig = (config: EmailConfig): EmailConfig => {
    const provider = config.provider ?? 'development'
    const trimmedFromName = (config.fromName ?? '').trim() || 'Test Case Writer'
    const trimmedFromEmail = (config.fromEmail ?? '').trim()
    const trimmedGmailUser = (config.gmailUser ?? '').trim()

    const defaultFromEmail =
      provider === 'gmail'
        ? trimmedFromEmail || trimmedGmailUser || 'noreply@testcasewriter.com'
        : trimmedFromEmail || 'noreply@testcasewriter.com'

    return {
      provider,
      apiKey: config.apiKey,
      fromName: trimmedFromName,
      fromEmail: defaultFromEmail,
      gmailUser: trimmedGmailUser,
      gmailPassword: config.gmailPassword ?? ''
    }
  }

  const applyEmailConfigToService = (
    config: EmailConfig,
    options: { persist?: boolean } = {}
  ) => {
    const normalized = normalizeEmailConfig(config)
    const service = EmailService.getInstance()
    service.applyConfig(normalized, options)
    return { normalized, service }
  }

  const currentUser = AuthService.getCurrentUser()

  // Debug user access
  useEffect(() => {
    console.log('🔍 Debug: Current user from getCurrentUser():', currentUser)
    console.log('🔍 Debug: User role:', currentUser?.role)
    console.log('🔍 Debug: hasPermission canManageUsers:', hasPermission(currentUser, 'canManageUsers'))
  }, [currentUser])

  // Load users and teams
  useEffect(() => {
    loadUsers()
    loadTeams()
    initializeDefaultTeams()

    // Auto-login admin if no user is currently logged in
    if (!currentUser) {
      const adminUser = AuthService.getAllUsers().find(u => u.email === 'admin@yopmail.com')
      if (adminUser) {
        // Set user using AuthService instead of direct localStorage manipulation
        AuthService['setCurrentUser'](adminUser)
        console.log('Auto-logged in admin user')
        window.location.reload() // Refresh to update current user state
      }
    }

    // Load email configuration if on email tab
    if (activeTab === 'email') {
      const normalized = loadEmailConfig()
      void testEmailConfig(normalized)
    }
  }, [activeTab])

  // Load saved email configuration
  const loadEmailConfig = (): EmailConfig => {
    let normalizedConfig = emailConfig

    try {
      const saved = localStorage.getItem('emailConfiguration')
      if (saved) {
        const raw = JSON.parse(saved)
        const { normalized } = applyEmailConfigToService({
          ...DEFAULT_EMAIL_CONFIG,
          ...raw
        })
        setEmailConfig(normalized)
        normalizedConfig = normalized
      } else {
        const { normalized } = applyEmailConfigToService(emailConfig)
        setEmailConfig(normalized)
        normalizedConfig = normalized
      }
    } catch (error) {
      console.error('Failed to load email config:', error)
      const { normalized } = applyEmailConfigToService(emailConfig)
      setEmailConfig(normalized)
      normalizedConfig = normalized
    }

    return normalizedConfig
  }

  // Save email configuration
  const saveEmailConfig = async () => {
    setSavingConfig(true)
    try {
      if (emailConfig.provider === 'gmail') {
        if (!emailConfig.gmailUser || !emailConfig.gmailPassword) {
          alert('Gmail credentials are required')
          setSavingConfig(false)
          return
        }
      }

      if (!emailConfig.fromName) {
        alert('From name is required')
        setSavingConfig(false)
        return
      }

      const { normalized } = applyEmailConfigToService(emailConfig, { persist: true })
      setEmailConfig(normalized)

      await testEmailConfig(normalized)

      alert('Email configuration saved successfully!')
      setShowConfigForm(false)
    } catch (error) {
      console.error('Failed to save email config:', error)
      alert('Failed to save email configuration')
    } finally {
      setSavingConfig(false)
    }
  }

  // Email configuration functions
  const testEmailConfig = async (configOverride?: EmailConfig) => {
    setEmailLoading(true)
    try {
      const targetConfig = configOverride ?? emailConfig
      const { normalized, service } = applyEmailConfigToService(targetConfig)
      setEmailConfig(normalized)
      const result = await service.testEmailConfiguration()
      setTestResult(result)
    } catch (error) {
      console.error('Failed to test email configuration:', error)
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      setTestResult({
        success: false,
        message: `Failed to test email configuration: ${message}`
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }

    setSendingTest(true)
    try {
      const { normalized, service } = applyEmailConfigToService(emailConfig)
      setEmailConfig(normalized)
      const template = EmailService.getWelcomeEmailTemplate()

      const success = await service.sendEmail({
        to: testEmail,
        template,
        variables: {
          userName: 'Test User',
          userEmail: testEmail,
          userRole: 'QA Tester',
          tempPassword: 'TestPassword123!',
          resetPasswordUrl: 'http://localhost:3009/reset-password?token=test-token'
        }
      })

      if (success) {
        alert('Test email sent successfully! Check your console logs (Development mode) or email inbox (Production mode)')
      } else {
        alert('Failed to send test email. Check console for errors.')
      }
    } catch (error) {
      console.error('Test email error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Error sending test email: ' + message)
    } finally {
      setSendingTest(false)
    }
  }

  const loadTeams = () => {
    const allTeams = getAllTeams()
    setTeams(allTeams)
  }

  const loadUsers = () => {
    setLoading(true)
    const allUsers = AuthService.getAllUsers()
    setUsers(allUsers)
    setLoading(false)
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'qa': return 'bg-green-100 text-green-800 border-green-200'
      case 'user': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin': return <Shield className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      case 'lead': return <Users className="w-4 h-4" />
      case 'qa': return <User className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super-admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'lead': return 'Lead'
      case 'qa': return 'QA Tester'
      case 'user': return 'QA Tester'
      default: return role
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) {
      alert('User not found')
      return
    }

    // Prevent deleting admin users
    if (userToDelete.email === 'admin@merquri.io' || userToDelete.role === 'super-admin') {
      alert('Cannot delete admin user')
      return
    }

    if (confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)) {
      try {
        const success = await AuthService.deleteUser(userId)
        if (success) {
          // Reload the users list to reflect the deletion
          loadUsers()
          console.log('User deleted successfully')
        } else {
          alert('Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error deleting user: ' + (error as Error).message)
      }
    }
  }

  // Allow access if user is admin or super-admin
  const hasAccess = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.role === 'super-admin' ||
    hasPermission(currentUser, 'canManageUsers')
  )

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required for user management.</p>
          <p className="text-xs text-gray-400 mt-2">Current role: {currentUser?.role || 'none'}</p>
        </div>
      </div>
    )
  }

  return (
    <Layout
      title="User & Team Management"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'User & Team Management' }
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">User & Team Management</h1>
            <p className="text-sm text-gray-600">Manage system users, teams, and access control</p>
          </div>
        </div>

        {/* Add User button - only show on Users tab */}
        {activeTab === 'users' && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Users</span>
            </div>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'super-admin') && (
            <>
              <button
                onClick={() => setActiveTab('teams')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Teams</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Config</span>
                </div>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-lg font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => ['admin', 'super-admin'].includes(u.role)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Leads</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.role === 'lead').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">QA Testers</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => ['qa', 'user'].includes(u.role)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Roles</option>
              <option value="super-admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="lead">Lead</option>
              <option value="qa">QA Tester</option>
              <option value="user">QA Tester</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">Team:</span>
            </div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teams
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span>{getRoleDisplayName(user.role)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UserTeamsSummary userId={user.id} maxDisplay={2} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {(user.role === 'user' || user.role === 'qa' || user.role === 'lead') && (
                          <TeamAssignment
                            userId={user.id}
                            userName={user.name}
                            userRole={user.role}
                            onAssignmentChange={loadTeams}
                          />
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="pt-6">
          <TeamManagement onTeamsChange={loadTeams} />
        </div>
      )}

      {/* Email Configuration Tab */}
      {activeTab === 'email' && (
        <div className="pt-6">
          <EmailConfigurationTab
            testResult={testResult}
            testEmail={testEmail}
            setTestEmail={setTestEmail}
            sendingTest={sendingTest}
            emailLoading={emailLoading}
            onTestConfig={testEmailConfig}
            onSendTest={sendTestEmail}
            emailConfig={emailConfig}
            setEmailConfig={setEmailConfig}
            showConfigForm={showConfigForm}
            setShowConfigForm={setShowConfigForm}
            onSaveConfig={saveEmailConfig}
            savingConfig={savingConfig}
          />
        </div>
      )}

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          isOpen={showCreateModal || !!editingUser}
          onClose={() => {
            setShowCreateModal(false)
            setEditingUser(null)
          }}
          onSave={async (userData) => {
            if (editingUser) {
              // Update user - implement update logic
              console.log('Update user:', userData)
              // For now, just update local state
              setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u))
            } else {
              // Create new user
              try {
                const newUser = await AuthService.createUser({
                  email: userData.email || '',
                  name: userData.name || '',
                  password: userData.password || 'defaultPassword123',
                  username: userData.username || undefined,
                  role: userData.role || 'user'
                })

                if (!newUser) {
                  throw new Error('Failed to create user')
                }

                // Send welcome email if requested
                if (userData.sendEmail) {
                  const emailService = EmailService.getInstance()
                  const template = EmailService.getWelcomeEmailTemplate()
                  const resetUrl = EmailService.generatePasswordResetUrl(userData.email || '')

                  const success = await emailService.sendEmail({
                    to: userData.email || '',
                    template,
                    variables: {
                      userName: userData.name || '',
                      userEmail: userData.email || '',
                      userRole: userData.role || 'user',
                      tempPassword: userData.password || '',
                      resetPasswordUrl: resetUrl
                    }
                  })

                  if (success) {
                    alert(`User created successfully! Welcome email sent to ${userData.email}`)
                  } else {
                    alert('User created but failed to send welcome email')
                  }
                } else {
                  alert('User created successfully!')
                }

                loadUsers() // Reload users list
              } catch (error) {
                console.error('Failed to create user:', error)
                alert('Failed to create user: ' + (error as Error).message)
              }
            }
            setShowCreateModal(false)
            setEditingUser(null)
          }}
        />
      )}

    </Layout>
  )
}

// User Modal Component
interface UserModalProps {
  user: UserType | null
  isOpen: boolean
  onClose: () => void
  onSave: (userData: Partial<UserType>) => void | Promise<void>
}

function UserModal({ user, isOpen, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'user', // Default to 'user' (QA Tester) for new registrations
    password: '',
    sendEmail: true
  })
  const [showPassword, setShowPassword] = useState(false)

  // Generate random password function
  const generateRandomPassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  // Auto-generate password for new users
  useEffect(() => {
    if (!user && !formData.password) {
      setFormData(prev => ({ ...prev, password: generateRandomPassword() }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {user ? 'Edit User' : 'Create New User'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="user">QA Tester (Default)</option>
              <option value="lead">Lead (Can assign users to projects)</option>
              <option value="admin">Admin (Can manage users)</option>
              <option value="super-admin">Super Admin (Full access)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {!user && "New users default to QA Tester role"}
              {user && formData.role === 'user' && "QA Tester: Basic test case management"}
              {user && formData.role === 'lead' && "Lead: Can assign users to projects and execution runs"}
              {user && formData.role === 'admin' && "Admin: Can manage users and promote roles"}
              {user && formData.role === 'super-admin' && "Super Admin: Full system access"}
            </p>
          </div>

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Temporary password"
                    className="pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, password: generateRandomPassword() }))}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      title="Generate random password"
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  User will be asked to change this password on first login
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Send welcome email with login instructions</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Email will include login credentials and password reset link
                </p>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1">
              {user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Email Configuration Tab Component
interface EmailConfigurationTabProps {
  testResult: { success: boolean; message: string } | null
  testEmail: string
  setTestEmail: (email: string) => void
  sendingTest: boolean
  emailLoading: boolean
  onTestConfig: () => Promise<void>
  onSendTest: () => Promise<void>
  emailConfig: EmailConfig
  setEmailConfig: React.Dispatch<React.SetStateAction<EmailConfig>>
  showConfigForm: boolean
  setShowConfigForm: (show: boolean) => void
  onSaveConfig: () => Promise<void>
  savingConfig: boolean
}

function EmailConfigurationTab({
  testResult,
  testEmail,
  setTestEmail,
  sendingTest,
  emailLoading,
  onTestConfig,
  onSendTest,
  emailConfig,
  setEmailConfig,
  showConfigForm,
  setShowConfigForm,
  onSaveConfig,
  savingConfig
}: EmailConfigurationTabProps) {
  const getStatusIcon = () => {
    if (emailLoading) return <Settings className="w-5 h-5 text-gray-500 animate-spin" />
    if (!testResult) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return testResult.success ?
      <CheckCircle className="w-5 h-5 text-green-500" /> :
      <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = () => {
    if (emailLoading) return 'bg-gray-50 border-gray-200'
    if (!testResult) return 'bg-yellow-50 border-yellow-200'
    return testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Email Configuration</h2>
          <p className="text-sm text-gray-600">Test and configure email service for user notifications</p>
        </div>
      </div>

      {/* Configuration Status */}
      <div className={`rounded-lg border p-6 mb-6 ${getStatusColor()}`}>
        <div className="flex items-center space-x-3 mb-4">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Email Service Status</h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onTestConfig()}
            disabled={emailLoading}
            className="ml-auto"
          >
            <Settings className="w-4 h-4 mr-2" />
            Retest Configuration
          </Button>
        </div>

        {testResult && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">{testResult.message}</p>
            {testResult.success && (
              <div className="text-xs text-gray-600">
                {testResult.message.includes('Development') ? (
                  <span>✓ Ready for development testing (emails logged to console)</span>
                ) : (
                  <span>✓ Ready for production use (emails will be sent)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Email Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Email</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to test..."
              className="max-w-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will send a welcome email template to test the email service
            </p>
          </div>

          <Button
            onClick={() => onSendTest()}
            disabled={!testEmail || sendingTest || !testResult?.success}
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{sendingTest ? 'Sending...' : 'Send Test Email'}</span>
          </Button>
        </div>
      </div>

      {/* Gmail Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Gmail Configuration</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>{showConfigForm ? 'Cancel' : 'Configure Gmail'}</span>
          </Button>
        </div>

        {!showConfigForm ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Current Configuration</h4>
              </div>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Provider:</strong> {emailConfig.provider === 'gmail' ? 'Gmail' : 'Development Mode'}</p>
                <p><strong>From Name:</strong> {emailConfig.fromName}</p>
                <p><strong>From Email:</strong> {emailConfig.fromEmail || 'Not configured'}</p>
                {emailConfig.provider === 'gmail' && (
                  <>
                    <p><strong>Gmail Account:</strong> {emailConfig.gmailUser || 'Not configured'}</p>
                    <p><strong>Password:</strong> {emailConfig.gmailPassword ? '****************' : 'Not configured'}</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Setup Instructions:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Click "Configure Gmail" above</li>
                    <li>Enter your Gmail email and app password</li>
                    <li>Save configuration and test</li>
                    <li>Real emails will be sent in production!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmailConfigForm
            emailConfig={emailConfig}
            setEmailConfig={setEmailConfig}
            onSave={onSaveConfig}
            onCancel={() => setShowConfigForm(false)}
            saving={savingConfig}
          />
        )}
      </div>
    </div>
  )
}

// Email Configuration Form Component
interface EmailConfigFormProps {
  emailConfig: EmailConfig
  setEmailConfig: React.Dispatch<React.SetStateAction<EmailConfig>>
  onSave: () => Promise<void>
  onCancel: () => void
  saving: boolean
}

function EmailConfigForm({ emailConfig, setEmailConfig, onSave, onCancel, saving }: EmailConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
        <select
          value={emailConfig.provider}
          onChange={(e) =>
            setEmailConfig(prev => ({
              ...prev,
              provider: e.target.value as EmailConfig['provider']
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="development">Development (Console Only)</option>
          <option value="gmail">Gmail SMTP</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Choose Gmail for real email sending in production
        </p>
      </div>

      {/* Gmail Configuration */}
      {emailConfig.provider === 'gmail' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
          <h4 className="font-medium text-blue-900">Gmail SMTP Settings</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gmail Email Address</label>
            <Input
              type="email"
              value={emailConfig.gmailUser}
              onChange={(e) => {
                const value = e.target.value
                setEmailConfig(prev => ({
                  ...prev,
                  gmailUser: value,
                  fromEmail:
                    prev.provider === 'gmail' && (!prev.fromEmail || prev.fromEmail === prev.gmailUser)
                      ? value
                      : prev.fromEmail
                }))
              }}
              placeholder="your.email@gmail.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Gmail email address that will send emails
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gmail App Password</label>
            <Input
              type="password"
              value={emailConfig.gmailPassword}
              onChange={(e) =>
                setEmailConfig(prev => ({
                  ...prev,
                  gmailPassword: e.target.value
                }))
              }
              placeholder="Enter 16-character app password"
              required
            />
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <p><strong>How to get Gmail App Password:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to your Google Account -&gt; Security</li>
                <li>Enable 2-Factor Authentication (required)</li>
                <li>Go to Security -&gt; App passwords</li>
                <li>Generate new app password for "Mail"</li>
                <li>Copy the 16-character password here</li>
              </ol>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                <strong>Security Note:</strong> App passwords are safer than your main Gmail password.
                They can be revoked anytime from your Google Account settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* From Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
        <Input
          type="text"
          value={emailConfig.fromName}
          onChange={(e) =>
            setEmailConfig(prev => ({
              ...prev,
              fromName: e.target.value
            }))
          }
          placeholder="Test Case Writer"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          The name that appears as the sender in emails
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
        <Input
          type="email"
          value={emailConfig.fromEmail}
          onChange={(e) =>
            setEmailConfig(prev => ({
              ...prev,
              fromEmail: e.target.value
            }))
          }
          placeholder={
            emailConfig.provider === 'gmail'
              ? emailConfig.gmailUser || 'your.email@gmail.com'
              : 'noreply@testcasewriter.com'
          }
          required={emailConfig.provider === 'gmail'}
        />
        <p className="text-xs text-gray-500 mt-1">
          {emailConfig.provider === 'gmail'
            ? 'Use the Gmail address (or alias) authenticated above.'
            : 'This address is shown as the sender for notification emails.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave()}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Settings className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </div>
    </div>
  )
}

