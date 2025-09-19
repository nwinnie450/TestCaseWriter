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
  EyeOff
} from 'lucide-react'
import { AuthService, User as UserType } from '@/lib/auth-service'
import { registerUser, getAllUsers } from '@/lib/user-storage'
import EmailService from '@/lib/email-service'

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  const currentUser = AuthService.getCurrentUser()

  // Load users
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setLoading(true)
    const allUsers = getAllUsers() // Use the user-storage function instead
    setUsers(allUsers as UserType[])
    setLoading(false)
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'qa': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin': return <Shield className="w-4 h-4" />
      case 'lead': return <Users className="w-4 h-4" />
      case 'qa': return <User className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      // In production, this would call an API
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
  }

  if (!currentUser || currentUser.role !== 'super-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Super Admin access required for user management.</p>
        </div>
      </div>
    )
  }

  return (
    <Layout
      title="User Management"
      breadcrumbs={[
        { label: 'Admin Dashboard', href: '/admin' },
        { label: 'User Management' }
      ]}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600">Manage system users and their roles</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </Button>
      </div>

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
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-lg font-semibold text-gray-900">
                {users.filter(u => u.role === 'super-admin').length}
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
                {users.filter(u => u.role === 'qa').length}
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
              <option value="lead">Lead</option>
              <option value="qa">QA Tester</option>
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
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                        <span className="capitalize">{user.role.replace('-', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          className="flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="outline"
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
            try {
              if (editingUser) {
                // Update user - TODO: implement user update in user-storage
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u))
              } else {
                // Create new user using proper registration
                if (!userData.password) {
                  alert('Password is required for new users')
                  return
                }
                const newUser = registerUser(
                  userData.email || '',
                  userData.name || '',
                  userData.password,
                  userData.username
                )
                // Update the role after creation
                const allUsers = getAllUsers()
                const updatedUsers = allUsers.map(u =>
                  u.id === newUser.id ? { ...u, role: userData.role } : u
                )
                localStorage.setItem('testCaseWriter_users', JSON.stringify(updatedUsers))
                loadUsers() // Reload users from storage

                // Send welcome email with password reset link
                try {
                  const emailService = EmailService.getInstance()
                  const template = EmailService.getWelcomeEmailTemplate()
                  const resetUrl = EmailService.generatePasswordResetUrl(userData.email || '')

                  await emailService.sendEmail({
                    to: userData.email || '',
                    template,
                    variables: {
                      userName: userData.name || '',
                      userEmail: userData.email || '',
                      userRole: userData.role?.replace('-', ' ').toUpperCase() || 'USER',
                      tempPassword: userData.password,
                      resetPasswordUrl: resetUrl
                    }
                  })

                  alert(`✅ User created successfully!\n\n📧 Welcome email sent to: ${userData.email}\n\nThe user will receive:\n- Account details\n- Temporary password\n- Password reset link\n\nCheck the browser console to see the email content in development mode.`)
                } catch (emailError) {
                  console.error('Failed to send welcome email:', emailError)
                  alert(`✅ User created successfully!\n\n⚠️ Warning: Failed to send welcome email.\nUser has been created but needs to be notified manually.`)
                }
              }
              setShowCreateModal(false)
              setEditingUser(null)
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Failed to create user')
            }
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
  onSave: (userData: Partial<UserType>) => void
}

function UserModal({ user, isOpen, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || 'qa',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {user ? '(leave empty to keep current)' : ''}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                required={!user} // Required for new users, optional for editing
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder={user ? "Enter new password to change" : "Enter password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="qa">QA Tester</option>
              <option value="lead">Lead (QA Manager)</option>
              <option value="super-admin">Super Admin</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}