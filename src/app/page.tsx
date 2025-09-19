'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { RecentProjects } from '@/components/dashboard/RecentProjects'
import { TokenUsageDashboard } from '@/components/dashboard/TokenUsageDashboard'
import { useTokenUsage } from '@/contexts/TokenUsageContext'
import { getCurrentUser } from '@/lib/user-storage'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  FolderOpen, 
  FileText, 
  Wand2, 
  Download, 
  TrendingUp,
  Clock,
  Zap,
  DollarSign
} from 'lucide-react'

// Aggressive localStorage cleaner - runs immediately
const clearAllMockData = () => {
  try {
    console.log('🚀 Starting aggressive production cleanup...')
    
    // Get essential data before clearing
    const currentUserData = localStorage.getItem('testCaseWriter_currentUser')
    const userData = localStorage.getItem('testCaseWriter_users')
    const teamsData = localStorage.getItem('testCaseWriter_qaTeams')
    const teamMembersData = localStorage.getItem('testCaseWriter_teamMembers')
    
    // List all keys before clearing
    const allKeys = Object.keys(localStorage)
    console.log('📋 All localStorage keys before clearing:', allKeys)
    
    // Clear ALL keys that start with our prefixes
    allKeys.forEach(key => {
      if (key.startsWith('testCaseWriter_') || key.startsWith('testCaseManager_')) {
        console.log(`🗑️ Removing: ${key}`)
        localStorage.removeItem(key)
      }
    })
    
    // Restore essential data
    if (currentUserData) {
      localStorage.setItem('testCaseWriter_currentUser', currentUserData)
      console.log('✅ Restored current user')
    }
    if (userData) {
      localStorage.setItem('testCaseWriter_users', userData)
      console.log('✅ Restored users')
    }
    if (teamsData) {
      localStorage.setItem('testCaseWriter_qaTeams', teamsData)
      console.log('✅ Restored teams')
    }
    if (teamMembersData) {
      localStorage.setItem('testCaseWriter_teamMembers', teamMembersData)
      console.log('✅ Restored team members')
    }
    
    // Set completely clean settings
    const cleanSettings = {
      profile: { name: "", email: "", title: "", department: "" },
      notifications: { emailNotifications: false, pushNotifications: false, testCaseUpdates: false, exportComplete: false, weeklyDigest: false },
      preferences: { theme: "light", language: "en", timezone: "UTC", defaultTemplate: "", pageSize: 25 },
      security: { twoFactorEnabled: false, sessionTimeout: 30, passwordLastChanged: new Date().toISOString() },
      ai: { providerId: "", provider: "", apiKey: "", model: "gpt-4o", maxTokens: 128000, temperature: 0.3, customPrompt: "", requireDocuments: true, documentFocused: true }
    }
    localStorage.setItem('testCaseWriterSettings', JSON.stringify(cleanSettings))
    localStorage.setItem('testCaseWriter_notifications', JSON.stringify([]))
    localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify([]))
    localStorage.setItem('testCaseWriter_projects', JSON.stringify([]))
    
    console.log('🧹 AGGRESSIVE CLEANUP COMPLETE - All mock data eliminated!')
    console.log('📋 Final localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('testCase')))
    
    return true
  } catch (error) {
    console.error('❌ Failed to clear production data:', error)
    return false
  }
}

// Disabled automatic cleaner - was interfering with normal operation
// Only run manually via the button if needed
// if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost')) {
//   clearAllMockData()
// }

export default function Dashboard() {
  const { stats } = useTokenUsage()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showClearButton, setShowClearButton] = useState(false)
  
  // Check if we're in production and show clear button if needed
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
      setShowClearButton(true)
    }
  }, [])
  
  // Manual clear function for production
  const handleManualClear = () => {
    if (confirm('🧹 This will clear ALL test data and reset the application to a clean state. Continue?')) {
      const success = clearAllMockData()
      if (success) {
        alert('✅ Production data cleared successfully! Please refresh the page.')
        window.location.reload()
      } else {
        alert('❌ Failed to clear production data. Please check console for details.')
      }
    }
  }

  // Check for current user and listen for changes
  useEffect(() => {
    const checkUser = () => {
      const user = getCurrentUser()
      setCurrentUser(user)
    }
    
    checkUser()
    
    // Listen for user changes (login/logout)
    window.addEventListener('userUpdated', checkUser)
    return () => window.removeEventListener('userUpdated', checkUser)
  }, [])
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  // Show different content based on authentication
  if (!currentUser) {
    return (
              <Layout title="Welcome to Test Case Manager">
        <div className="space-y-8">
          {/* Welcome Section for Non-Authenticated Users */}
          <div className="text-center py-12">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Test Case Manager
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                AI-powered test case generation and comprehensive management for modern QA teams. 
                Generate, import, export, and manage test cases with enterprise-grade tools.
              </p>
              <div className="flex justify-center">
                <Link href="/auth/login">
                  <Button variant="primary" size="lg" className="px-8">
                    Sign In to Get Started
                  </Button>
                </Link>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Need an account? Contact your administrator to get access.
                </p>
              </div>
            </div>
          </div>
          
          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <Wand2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">Generate test cases automatically from requirements documents using advanced AI</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import & Export</h3>
              <p className="text-gray-600">Import from CSV/JSON, export to Excel, CSV, Jira, TestRail with smart field mapping</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
              <FolderOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Enterprise Management</h3>
              <p className="text-gray-600">Organize test cases in projects, templates, and collaborate with your QA team</p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Dashboard">
      <div className="space-y-8">
        {/* Statistics Cards - Key Metrics Only */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Projects"
            value="0"
            description="No projects yet"
            icon={FolderOpen}
            color="primary"
          />

          <StatCard
            title="Test Cases"
            value="0"
            description="Ready to generate"
            icon={FileText}
            color="success"
          />

          <StatCard
            title="Tokens Used"
            value={formatNumber(stats.totalTokens)}
            description={`${formatNumber(stats.thisMonth.tokens)} this month`}
            icon={Zap}
            color="primary"
            trend={{ value: Math.round((stats.thisMonth.tokens / Math.max(stats.totalTokens - stats.thisMonth.tokens, 1)) * 100), label: 'vs previous', positive: true }}
          />

          <StatCard
            title="Total Cost"
            value={formatCost(stats.totalCost)}
            description={`${formatCost(stats.thisMonth.cost)} this month`}
            icon={DollarSign}
            color="warning"
            trend={{ value: Math.round((stats.thisMonth.cost / Math.max(stats.totalCost - stats.thisMonth.cost, 0.0001)) * 100), label: 'vs previous', positive: false }}
          />
        </div>

        {/* Production Clear Button */}
        {showClearButton && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-red-800">Production Environment</h3>
                <p className="text-xs text-red-600 mt-1">Clear all test data to ensure clean production environment</p>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleManualClear}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                🧹 Clear All Data
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>

          {/* Recent Activity */}
          <div>
            <RecentActivity />
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generation Stats</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1">
          <RecentProjects />
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <div className="h-3 w-3 bg-success-500 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Status</span>
                <span className="text-sm font-medium text-success-600">Operational</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">AI Service</span>
                <span className="text-sm font-medium text-success-600">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Export Services</span>
                <span className="text-sm font-medium text-success-600">Available</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Usage Stats</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. Generation Time</span>
                <span className="text-sm font-medium text-gray-900">2.3s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">98.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Monthly Exports</span>
                <span className="text-sm font-medium text-gray-900">1,432</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Tips</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">Use templates to standardize test case formats across your team</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">AI generation works best with detailed requirement documents</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="h-2 w-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600">Set up export profiles once and reuse them for consistent formatting</p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Usage Dashboard */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Token Usage & Costs</h2>
          <TokenUsageDashboard />
        </div>
      </div>
    </Layout>
  )
}