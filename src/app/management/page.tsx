'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  GitPullRequest, 
  History, 
  Settings, 
  BarChart3, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Database,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react'
import { VersionHistory } from '@/components/versioning/VersionHistory'
import { ChangeRequestModal } from '@/components/versioning/ChangeRequestModal'
import { ChangeRequestList } from '@/components/versioning/ChangeRequestList'
import { TestCase, TestCaseVersion, TestCaseChangeRequest } from '@/types/index'
import { createTestCaseVersion, applyChangeRequest } from '@/lib/versioning-utils'
import { withAuth } from '@/components/auth/withAuth'
import { 
  getAllStoredTestCases, 
  getTestCasesByProjectId 
} from '@/lib/test-case-storage'
import { 
  getTestCaseVersions,
  getChangeRequests,
  saveChangeRequest,
  updateChangeRequestStatus,
  getManagementStats,
  initializeTestCasesWithVersioning
} from '@/lib/management-storage'
import { 
  getManagementSettings, 
  updateManagementSetting,
  resetManagementSettings,
  ManagementSettings 
} from '@/lib/management-settings'
import { ConfigurationModal } from '@/components/versioning/ConfigurationModal'

function ManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  
  // Real data from storage
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [versions, setVersions] = useState<TestCaseVersion[]>([])
  const [changeRequests, setChangeRequests] = useState<TestCaseChangeRequest[]>([])
  const [settings, setSettings] = useState<ManagementSettings>(getManagementSettings())
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configModalType, setConfigModalType] = useState<'version-control' | 'change-requests' | 'notifications'>('version-control')
  
  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterModule, setFilterModule] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFeature, setFilterFeature] = useState('')
  const [groupByFeature, setGroupByFeature] = useState(false)
  const [sortBy, setSortBy] = useState('module') // module, testCase, version, status, feature
  const [sortOrder, setSortOrder] = useState('asc') // asc, desc
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())

  // Load real data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Initialize test cases with versioning if needed
        initializeTestCasesWithVersioning()
        
        // Load test cases, versions, and change requests
        const loadedTestCases = getAllStoredTestCases()
        const loadedVersions = getTestCaseVersions()
        const loadedChangeRequests = getChangeRequests()
        
        // Load projects from localStorage
        const storedProjects = localStorage.getItem('testCaseWriter_projects')
        let loadedProjects: Array<{id: string, name: string}> = []
        
        if (storedProjects) {
          try {
            const parsedProjects = JSON.parse(storedProjects)
            loadedProjects = parsedProjects.map((p: any) => ({
              id: p.id,
              name: p.name
            }))
          } catch (error) {
            console.warn('Failed to parse projects:', error)
          }
        }
        
        setTestCases(loadedTestCases)
        setProjects(loadedProjects)
        setVersions(loadedVersions)
        setChangeRequests(loadedChangeRequests)
        
        console.log('✅ Loaded management data:', {
          testCases: loadedTestCases.length,
          projects: loadedProjects.length,
          versions: loadedVersions.length,
          changeRequests: loadedChangeRequests.length
        })
      } catch (error) {
        console.error('❌ Failed to load management data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Calculate statistics from real data
  const stats = {
    totalTestCases: testCases.length,
    totalVersions: versions.length,
    pendingChangeRequests: changeRequests.filter(cr => cr.status === 'pending').length,
    approvedChangeRequests: changeRequests.filter(cr => cr.status === 'approved').length,
    rejectedChangeRequests: changeRequests.filter(cr => cr.status === 'rejected').length,
    activeTestCases: testCases.filter(tc => tc.status === 'active').length,
    draftTestCases: testCases.filter(tc => tc.status === 'draft').length
  }

  // Filter and pagination logic
  const filteredTestCases = testCases.filter(testCase => {
    const matchesSearch = !searchTerm || 
      testCase.testCase?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testCase.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testCase.feature?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesModule = !filterModule || (testCase.data?.module || testCase.module) === filterModule
    const matchesProject = !filterProject || testCase.projectId === filterProject
    const matchesStatus = !filterStatus || testCase.status === filterStatus
    const matchesFeature = !filterFeature || (testCase.feature || testCase.module) === filterFeature
    
    return matchesSearch && matchesModule && matchesProject && matchesStatus && matchesFeature
  }).sort((a, b) => {
    let aValue, bValue
    
    switch (sortBy) {
      case 'module':
        aValue = a.module || ''
        bValue = b.module || ''
        break
      case 'testCase':
        aValue = a.testCase || ''
        bValue = b.testCase || ''
        break
      case 'version':
        aValue = a.version || 1
        bValue = b.version || 1
        break
      case 'status':
        aValue = a.status || ''
        bValue = b.status || ''
        break
      case 'feature':
        aValue = a.feature || ''
        bValue = b.feature || ''
        break
      default:
        aValue = a.module || ''
        bValue = b.module || ''
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const totalPages = Math.ceil(filteredTestCases.length / itemsPerPage)
  const paginatedTestCases = filteredTestCases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique values for filter dropdowns
  const uniqueModules = Array.from(new Set(testCases.map(tc => tc.data?.module || tc.module).filter(Boolean)))
  const uniqueStatuses = Array.from(new Set(testCases.map(tc => tc.status).filter(Boolean)))
  
  // Get features based on selected module (cascading filter)
  const availableFeatures = filterModule 
    ? Array.from(new Set(testCases
        .filter(tc => (tc.data?.module || tc.module) === filterModule)
        .map(tc => tc.feature || tc.data?.module || tc.module)
        .filter(Boolean)
      ))
    : Array.from(new Set(testCases.map(tc => tc.feature || tc.module).filter(Boolean)))
  
  // Get projects that have test cases
  const projectsWithTestCases = projects.filter(project => 
    testCases.some(tc => tc.projectId === project.id)
  )

  // Group test cases by feature for grouped view
  const groupedTestCases = groupByFeature ? 
    filteredTestCases.reduce((groups, testCase) => {
      const feature = testCase.feature || testCase.module || 'Uncategorized'
      if (!groups[feature]) {
        groups[feature] = []
      }
      groups[feature].push(testCase)
      return groups
    }, {} as Record<string, typeof filteredTestCases>) : {}

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterModule, filterProject, filterStatus, filterFeature, sortBy, sortOrder])

  // Reset feature filter when module changes
  useEffect(() => {
    if (filterModule && !availableFeatures.includes(filterFeature)) {
      setFilterFeature('')
    }
  }, [filterModule, availableFeatures, filterFeature])

  const handleCreateChangeRequest = (testCase: TestCase) => {
    setSelectedTestCase(testCase)
    setShowChangeRequestModal(true)
  }

  const handleSubmitChangeRequest = async (changeRequest: TestCaseChangeRequest) => {
    try {
      // Save the change request to storage
      saveChangeRequest(changeRequest)
      
      // Update local state
      setChangeRequests(prev => [...prev, changeRequest])
      
      console.log('✅ Change request submitted:', changeRequest)
    } catch (error) {
      console.error('❌ Failed to submit change request:', error)
      throw error
    }
  }

  const handleApproveChangeRequest = async (changeRequest: TestCaseChangeRequest) => {
    const testCase = testCases.find(tc => tc.id === changeRequest.testCaseId)
    if (!testCase) return

    try {
      // Update change request status
      updateChangeRequestStatus(changeRequest.id, 'approved', 'current-user-id', 'Approved')
      
      // Create new version
      const newVersion = applyChangeRequest(testCase, changeRequest, 'current-user-id')
      
      // Save new version to storage
      const { saveTestCaseVersion } = await import('@/lib/management-storage')
      saveTestCaseVersion(newVersion)
      
      // Update local state
      setChangeRequests(prev => 
        prev.map(cr => 
          cr.id === changeRequest.id 
            ? { ...cr, status: 'approved', reviewedBy: 'current-user-id', reviewedAt: new Date() }
            : cr
        )
      )
      setVersions(prev => [...prev, newVersion])
      
      console.log('✅ Change request approved, new version created:', newVersion)
    } catch (error) {
      console.error('❌ Error approving change request:', error)
    }
  }

  const handleRejectChangeRequest = async (changeRequest: TestCaseChangeRequest) => {
    try {
      // Update change request status
      updateChangeRequestStatus(changeRequest.id, 'rejected', 'current-user-id', 'Rejected')
      
      // Update local state
      setChangeRequests(prev => 
        prev.map(cr => 
          cr.id === changeRequest.id 
            ? { ...cr, status: 'rejected', reviewedBy: 'current-user-id', reviewedAt: new Date() }
            : cr
        )
      )
      
      console.log('✅ Change request rejected:', changeRequest)
    } catch (error) {
      console.error('❌ Error rejecting change request:', error)
    }
  }

  const handleViewChangeRequest = (changeRequest: TestCaseChangeRequest) => {
    console.log('Viewing change request:', changeRequest)
    // In real app, this would open a detailed view modal
  }

  const handleRevertVersion = async (version: TestCaseVersion) => {
    console.log('Reverting to version:', version)
    // In real app, this would create a new version with the old data
  }

  const handleViewVersion = (version: TestCaseVersion) => {
    console.log('Viewing version:', version)
    // In real app, this would open a detailed view modal
  }

  const handleToggleSetting = async (setting: keyof ManagementSettings) => {
    try {
      const newValue = !settings[setting]
      await updateManagementSetting(setting, newValue)
      setSettings(prev => ({ ...prev, [setting]: newValue }))
      console.log(`✅ Toggled ${setting}:`, newValue)
    } catch (error) {
      console.error(`❌ Failed to toggle ${setting}:`, error)
    }
  }

  const handleOpenConfigModal = (type: 'version-control' | 'change-requests' | 'notifications') => {
    setConfigModalType(type)
    setShowConfigModal(true)
  }

  const handleSettingsUpdate = () => {
    setSettings(getManagementSettings())
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      const loadedTestCases = getAllStoredTestCases()
      const loadedVersions = getTestCaseVersions()
      const loadedChangeRequests = getChangeRequests()
      
      // Reload projects
      const storedProjects = localStorage.getItem('testCaseWriter_projects')
      let loadedProjects: Array<{id: string, name: string}> = []
      
      if (storedProjects) {
        try {
          const parsedProjects = JSON.parse(storedProjects)
          loadedProjects = parsedProjects.map((p: any) => ({
            id: p.id,
            name: p.name
          }))
        } catch (error) {
          console.warn('Failed to parse projects:', error)
        }
      }
      
      setTestCases(loadedTestCases)
      setProjects(loadedProjects)
      setVersions(loadedVersions)
      setChangeRequests(loadedChangeRequests)
      setIsLoading(false)
    }, 500)
  }

  const toggleExpanded = (testCaseId: string) => {
    setExpandedTestCases(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId)
      } else {
        newSet.add(testCaseId)
      }
      return newSet
    })
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : projectId
  }

  const toggleFeatureExpanded = (feature: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(feature)) {
        newSet.delete(feature)
      } else {
        newSet.add(feature)
      }
      return newSet
    })
  }

  const handleResetSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        await resetManagementSettings()
        setSettings(getManagementSettings())
        console.log('✅ Settings reset to defaults')
      } catch (error) {
        console.error('❌ Failed to reset settings:', error)
      }
    }
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Management' }
  ]

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Test Case Management"
      actions={
        <Button
          onClick={handleRefresh}
          variant="secondary"
          className="flex items-center space-x-2"
          disabled={isLoading}
        >
          <Activity className="w-4 h-4" />
          <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
        </Button>
      }
    >
      <div className="mb-8">
        <div className="text-center">
          <p className="text-gray-600">
            Manage test case versions, change requests, and track the evolution of your test suite.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="col-span-full text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading management data...</p>
        </div>
      )}

      {/* Statistics Overview */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Test Cases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTestCases}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <History className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Versions</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVersions}</p>
                  <p className="text-xs text-gray-500 mt-1" title="Number of version snapshots created when test cases are modified - Each version tracks changes, author, and timestamp">
                    Version snapshots of test case changes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <GitPullRequest className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingChangeRequests}</p>
                  <p className="text-xs text-gray-500 mt-1" title="Change requests waiting for review and approval - These are proposed modifications to test cases that need to be reviewed before creating new versions">
                    Change requests awaiting review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Test Cases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeTestCases}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Version History</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Test Cases</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalTestCases}</p>
                    <p className="text-xs text-blue-600 mt-1">{stats.activeTestCases} active</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Versions</p>
                    <p className="text-3xl font-bold text-green-900">{stats.totalVersions}</p>
                    <p className="text-xs text-green-600 mt-1">version history</p>
                  </div>
                  <History className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Changes</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.pendingChangeRequests}</p>
                    <p className="text-xs text-purple-600 mt-1">pending review</p>
                  </div>
                  <GitPullRequest className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Simplified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                  {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.slice(0, 5).map((version) => (
                      <div key={version.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <History className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Version {version.version} created
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      <Badge variant={version.isApproved ? 'success' : 'warning'}>
                          {version.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                  ))}
                </div>
                  ) : (
                                         <div className="text-center py-8 text-gray-500">
                       <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No version history yet</p>
                  <p className="text-sm">Create test cases to start tracking changes</p>
                     </div>
                  )}
              </CardContent>
            </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Test Case Versions</span>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredTestCases.length} of {testCases.length} test cases
                </div>
              </CardTitle>
              
              {/* Enhanced Search and Filter Controls */}
              <div className="space-y-4 mt-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search test cases by title or module..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Filter Row 1 */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 font-medium">
                    Filter Order: Project → Module → Feature → Status → Items
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* 1. Project Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <select
                        value={filterProject}
                        onChange={(e) => setFilterProject(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Projects</option>
                        {projectsWithTestCases.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Module Filter */}
                    <div className="relative">
                      <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Modules</option>
                        {uniqueModules.map(module => (
                          <option key={module} value={module}>{module}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Feature Filter */}
                    <div className="relative">
                      <select
                        value={filterFeature}
                        onChange={(e) => setFilterFeature(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          !filterModule 
                            ? 'border-gray-200 bg-gray-50 text-gray-400' 
                            : 'border-gray-300'
                        }`}
                        disabled={!filterModule}
                      >
                        <option value="">
                          {!filterModule 
                            ? 'Select Module First' 
                            : availableFeatures.length === 0 
                              ? 'No features found in this module'
                              : `All Features in ${filterModule} (${availableFeatures.length})`
                          }
                        </option>
                        {availableFeatures.map(feature => (
                          <option key={feature} value={feature}>{feature}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. Status Filter */}
                    <div className="relative">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        {uniqueStatuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Items Per Page */}
                    <div className="relative">
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value))
                          setCurrentPage(1)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sort Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="module">Module</option>
                    <option value="testCase">Test Case</option>
                    <option value="version">Version</option>
                    <option value="status">Status</option>
                    <option value="feature">Feature</option>
                  </select>
                  
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                  </button>

                  {/* Group by Feature Toggle */}
                  <button
                    onClick={() => setGroupByFeature(!groupByFeature)}
                    className={`flex items-center space-x-1 px-3 py-1 border rounded-lg text-sm transition-colors ${
                      groupByFeature 
                        ? 'bg-blue-100 border-blue-300 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>📁</span>
                    <span>{groupByFeature ? 'Grouped' : 'List'}</span>
                  </button>

                  {/* Clear Filters Button */}
                  {(searchTerm || filterModule || filterProject || filterStatus || filterFeature) && (
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setFilterModule('')
                        setFilterProject('')
                        setFilterStatus('')
                        setFilterFeature('')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear all filters
                    </button>
                  )}

                  {/* Debug Info */}
                  <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    Debug: {uniqueModules.length} modules, {availableFeatures.length} features, {testCases.length} test cases
                  </div>

                  {/* Module-Feature Relationship Info */}
                  {filterModule && (
                    <div className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded">
                      Showing {availableFeatures.length} features for {filterModule}
                    </div>
                  )}
                </div>

                {/* Quick Stats Bar */}
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {stats.activeTestCases} Active
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      {stats.draftTestCases} Draft
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {stats.totalVersions} Versions
                    </span>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Export filtered test cases
                        const dataStr = JSON.stringify(paginatedTestCases, null, 2)
                        const dataBlob = new Blob([dataStr], {type: 'application/json'})
                        const url = URL.createObjectURL(dataBlob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `test-cases-${new Date().toISOString().split('T')[0]}.json`
                        link.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Refresh data
                        handleRefresh()
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Activity className="w-4 h-4" />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {testCases.length > 0 ? (
                <>
                  {paginatedTestCases.length > 0 ? (
                    <>
                      {groupByFeature ? (
                        // Grouped View
                        Object.entries(groupedTestCases).map(([feature, testCases]) => {
                          const isFeatureExpanded = expandedFeatures.has(feature)
                          return (
                            <div key={feature} className="mb-6">
                              <div 
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                                onClick={() => toggleFeatureExpanded(feature)}
                              >
                                <div className="flex items-center space-x-3">
                                  <ChevronRight className={`w-5 h-5 transition-transform ${isFeatureExpanded ? 'rotate-90' : ''}`} />
                                  <h2 className="text-xl font-semibold text-gray-900">{feature}</h2>
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {testCases.length} test cases
                                  </Badge>
                            </div>
                                <div className="text-sm text-gray-600">
                                  {testCases.filter(tc => tc.status === 'active').length} active
                                </div>
                              </div>
                              
                              {isFeatureExpanded && (
                                <div className="mt-4 space-y-3">
                                  {testCases.map((testCase) => {
                                    const testCaseVersions = versions.filter(v => v.testCaseId === testCase.id)
                                    const isExpanded = expandedTestCases.has(testCase.id)
                                    
                                    return (
                                      <div key={testCase.id} className="border border-gray-200 rounded-lg ml-4">
                                        <div className="p-4">
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-medium text-gray-900 truncate">{testCase.module}</h3>
                                                <Badge variant="secondary">
                                v{testCase.version || 1}
                              </Badge>
                                                {testCase.status && (
                                                  <Badge variant={testCase.status === 'active' ? 'success' : 'warning'}>
                                                    {testCase.status}
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-sm text-gray-600 line-clamp-2">{testCase.testCase}</p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2 ml-4">
                                              <Button
                                                onClick={() => toggleExpanded(testCase.id)}
                                                size="sm"
                                                variant="secondary"
                                                className="flex items-center space-x-1"
                                              >
                                                <History className="w-4 h-4" />
                                                <span>{testCaseVersions.length} versions</span>
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                              </Button>
                                              
                              <Button
                                onClick={() => handleCreateChangeRequest(testCase)}
                                size="sm"
                                                variant="secondary"
                                className="flex items-center space-x-1"
                              >
                                <GitPullRequest className="w-4 h-4" />
                                <span>Request Changes</span>
                              </Button>
                                            </div>
                            </div>
                          </div>
                          
                                        {isExpanded && testCaseVersions.length > 0 && (
                                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <VersionHistory
                                              versions={testCaseVersions}
                            currentVersion={testCase.version || 1}
                            onRevert={handleRevertVersion}
                            onViewVersion={handleViewVersion}
                          />
                        </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        // List View
                        paginatedTestCases.map((testCase) => {
                          const testCaseVersions = versions.filter(v => v.testCaseId === testCase.id)
                          const isExpanded = expandedTestCases.has(testCase.id)
                          
                          return (
                            <div key={testCase.id} className="border border-gray-200 rounded-lg mb-4 last:mb-0">
                              <div className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="text-lg font-medium text-gray-900 truncate">{testCase.module}</h3>
                                      <Badge variant="secondary">
                                        v{testCase.version || 1}
                                      </Badge>
                                      {testCase.status && (
                                        <Badge variant={testCase.status === 'active' ? 'success' : 'warning'}>
                                          {testCase.status}
                                        </Badge>
                                      )}
                                      {testCase.feature && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                          {testCase.feature}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">{testCase.testCase}</p>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2 ml-4">
                                    <Button
                                      onClick={() => toggleExpanded(testCase.id)}
                                      size="sm"
                                      variant="secondary"
                                      className="flex items-center space-x-1"
                                    >
                                      <History className="w-4 h-4" />
                                      <span>{testCaseVersions.length} versions</span>
                                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                    </Button>
                                    
                                    <Button
                                      onClick={() => handleCreateChangeRequest(testCase)}
                                      size="sm"
                                      variant="secondary"
                                      className="flex items-center space-x-1"
                                    >
                                      <GitPullRequest className="w-4 h-4" />
                                      <span>Request Changes</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {isExpanded && testCaseVersions.length > 0 && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                  <VersionHistory
                                    versions={testCaseVersions}
                                    currentVersion={testCase.version || 1}
                                    onRevert={handleRevertVersion}
                                    onViewVersion={handleViewVersion}
                                  />
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, filteredTestCases.length)} of{' '}
                            {filteredTestCases.length} results
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="flex items-center space-x-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Previous</span>
                            </Button>
                            
                            <span className="text-sm text-gray-600">
                              Page {currentPage} of {totalPages}
                            </span>
                            
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="flex items-center space-x-1"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No test cases found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('')
                          setFilterModule('')
                        }}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                                 <div className="text-center py-12 text-gray-500">
                   <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                   <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Found</h3>
                   <p className="text-gray-600 mb-4">
                     You don't have any test cases yet. Create some test cases to start using the versioning system.
                   </p>
                   <p className="text-xs text-gray-400 mb-4" title="The versioning system tracks all changes made to test cases, creating a complete history of modifications, approvals, and updates - This ensures traceability and quality control">
                     Versioning system provides complete change tracking and audit trail
                   </p>
                   <Button
                     onClick={() => window.location.href = '/library'}
                     className="bg-blue-600 hover:bg-blue-700"
                   >
                     Go to Test Case Library
                   </Button>
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Version Control Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Version Control</span>
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Auto-version on changes</p>
                    <p className="text-sm text-gray-600">Create versions automatically when test cases are modified</p>
                       </div>
                      <button
                        onClick={() => handleToggleSetting('autoVersionOnChanges')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.autoVersionOnChanges ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.autoVersionOnChanges ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                       <div>
                    <p className="font-medium text-gray-900">Require approval</p>
                    <p className="text-sm text-gray-600">All changes must be reviewed before applying</p>
                       </div>
                      <button
                        onClick={() => handleToggleSetting('requireApprovalForChanges')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.requireApprovalForChanges ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requireApprovalForChanges ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Email notifications</p>
                    <p className="text-sm text-gray-600">Send email alerts for pending reviews</p>
                       </div>
                      <button
                        onClick={() => handleToggleSetting('emailNotifications')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="font-medium text-gray-900">Auto-assign reviewers</p>
                    <p className="text-sm text-gray-600">Automatically assign change requests to project leads</p>
                       </div>
                      <button
                    onClick={() => handleToggleSetting('autoAssignReviewers')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      settings.autoAssignReviewers ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.autoAssignReviewers ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
              </CardContent>
            </Card>
                </div>

          {/* Reset Settings */}
          <Card>
            <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                  <p className="font-medium text-gray-900">Reset Settings</p>
                  <p className="text-sm text-gray-600">Reset all settings to their default values</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={handleResetSettings}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reset to Defaults
                    </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Request Modal */}
      {selectedTestCase && (
        <ChangeRequestModal
          isOpen={showChangeRequestModal}
          onClose={() => setShowChangeRequestModal(false)}
          onSubmit={handleSubmitChangeRequest}
          testCase={selectedTestCase}
        />
      )}

      {/* Configuration Modal */}
      <ConfigurationModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        settingType={configModalType}
        currentSettings={settings}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </Layout>
  )
}

export default withAuth(ManagementPage) 