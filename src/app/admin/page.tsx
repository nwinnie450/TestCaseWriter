'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Shield, Users, Settings, BarChart3, AlertTriangle, Mail } from 'lucide-react'
import { AuthService } from '@/lib/auth-service'
import Link from 'next/link'

export default function AdminDashboard() {
  const currentUser = AuthService.getCurrentUser()

  if (!currentUser || currentUser.role !== 'super-admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Super Admin access required.</p>
        </div>
      </div>
    )
  }

  return (
    <Layout
      title="Super Admin Dashboard"
      breadcrumbs={[{ label: 'Admin Dashboard' }]}
    >
      {/* Admin Welcome */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-blue-900">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-blue-700">Super Administrator Dashboard</p>
            <p className="text-sm text-blue-600">Full system access granted</p>
          </div>
        </div>
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* User Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">User Management</h3>
              <p className="text-sm text-gray-600">Manage all system users</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Users:</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span>Active Today:</span>
              <span className="font-medium text-green-600">6</span>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-600">Configure system-wide options</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span className="font-medium text-green-600">99.9%</span>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Configuration</h3>
              <p className="text-sm text-gray-600">Configure email notifications</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Provider:</span>
              <span className="font-medium">Development</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium text-yellow-600">Console Mode</span>
            </div>
          </div>
          <Link
            href="/admin/email-test"
            className="inline-block mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Configure Email Settings →
          </Link>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">System Analytics</h3>
              <p className="text-sm text-gray-600">Usage statistics and metrics</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Tests Executed:</span>
              <span className="font-medium">1,247</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="font-medium text-green-600">94.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/users" className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Manage Users</span>
          </Link>
          <Link href="/admin/email-test" className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Mail className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Email Config</span>
          </Link>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <BarChart3 className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">View Reports</span>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">System Config</span>
          </button>
        </div>
      </div>

      {/* Current Access Info */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Current Session Info</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">User:</span>
            <div className="font-medium">{currentUser.username}</div>
          </div>
          <div>
            <span className="text-gray-500">Role:</span>
            <div className="font-medium text-blue-600">{currentUser.role}</div>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <div className="font-medium">{currentUser.email}</div>
          </div>
          <div>
            <span className="text-gray-500">Permissions:</span>
            <div className="font-medium text-green-600">Full Access</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}