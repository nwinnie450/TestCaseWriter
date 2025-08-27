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
  Database
} from 'lucide-react'
import { VersionHistory } from '@/components/versioning/VersionHistory'
import { ChangeRequestModal } from '@/components/versioning/ChangeRequestModal'
import { ChangeRequestList } from '@/components/versioning/ChangeRequestList'
import { TestCase, TestCaseVersion, TestCaseChangeRequest } from '@/types'
import { createTestCaseVersion, applyChangeRequest } from '@/lib/versioning-utils'
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

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  
  // Real data from storage
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [versions, setVersions] = useState<TestCaseVersion[]>([])
  const [changeRequests, setChangeRequests] = useState<TestCaseChangeRequest[]>([])
  const [settings, setSettings] = useState<ManagementSettings>(getManagementSettings())
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configModalType, setConfigModalType] = useState<'version-control' | 'change-requests' | 'notifications'>('version-control')

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
        
        setTestCases(loadedTestCases)
        setVersions(loadedVersions)
        setChangeRequests(loadedChangeRequests)
        
        console.log('✅ Loaded management data:', {
          testCases: loadedTestCases.length,
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
      
      setTestCases(loadedTestCases)
      setVersions(loadedVersions)
      setChangeRequests(loadedChangeRequests)
      setIsLoading(false)
    }, 500)
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
          variant="outline"
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Versions</span>
          </TabsTrigger>
          <TabsTrigger value="change-requests" className="flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4" />
            <span>Change Requests</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {versions.length > 0 ? (
                    versions.slice(0, 3).map((version) => (
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
                        <Badge className={version.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {version.isApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                                         <div className="text-center py-8 text-gray-500">
                       <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                       <p>No version history available</p>
                       <p className="text-sm">Create test cases to see version history</p>
                       <p className="text-xs text-gray-400 mt-2" title="Version history tracks all changes made to test cases including who made changes, when they were made, and what was modified - This provides a complete audit trail">
                         Version history provides complete audit trail
                       </p>
                     </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testCases.length > 0 ? (
                    <Button
                      onClick={() => handleCreateChangeRequest(testCases[0])}
                      className="w-full justify-start"
                      variant="outline"
                      title="Create a new change request to propose modifications to test cases - Change requests go through review and approval process before creating new versions"
                    >
                      <GitPullRequest className="w-4 h-4 mr-2" />
                      Create Change Request
                    </Button>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No test cases available</p>
                      <p className="text-xs">Create test cases first to request changes</p>
                    </div>
                  )}
                                     <Button
                     onClick={() => setActiveTab('versions')}
                     className="w-full justify-start"
                     variant="outline"
                     title="View complete version history for all test cases - See how test cases have evolved over time with detailed change tracking"
                   >
                     <History className="w-4 h-4 mr-2" />
                     View Version History
                   </Button>
                                     <Button
                     onClick={() => setActiveTab('change-requests')}
                     className="w-full justify-start"
                     variant="outline"
                     title="Review and approve/reject proposed changes to test cases - Manage the change request workflow and ensure quality control"
                   >
                     <GitPullRequest className="w-4 h-4 mr-2" />
                     Review Change Requests
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Test Case Versions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testCases.length > 0 ? (
                testCases.map((testCase) => (
                  <div key={testCase.id} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{testCase.module}</h3>
                        <p className="text-sm text-gray-600">{testCase.testCase}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          v{testCase.version || 1}
                        </Badge>
                                                 <Button
                           onClick={() => handleCreateChangeRequest(testCase)}
                           size="sm"
                           className="flex items-center space-x-1"
                           title="Submit a change request for this test case - Propose modifications that will be reviewed before creating a new version"
                         >
                           <GitPullRequest className="w-4 h-4" />
                           <span>Request Changes</span>
                         </Button>
                      </div>
                    </div>
                    
                    <VersionHistory
                      versions={versions.filter(v => v.testCaseId === testCase.id)}
                      currentVersion={testCase.version || 1}
                      onRevert={handleRevertVersion}
                      onViewVersion={handleViewVersion}
                    />
                  </div>
                ))
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

        {/* Change Requests Tab */}
        <TabsContent value="change-requests" className="space-y-6">
          <ChangeRequestList
            changeRequests={changeRequests}
            onApprove={handleApproveChangeRequest}
            onReject={handleRejectChangeRequest}
            onView={handleViewChangeRequest}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Management Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Version Control Settings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenConfigModal('version-control')}
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="space-y-4">
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Auto-version on changes</p>
                         <p className="text-sm text-gray-600">Automatically create new versions when test cases are modified</p>
                         <p className="text-xs text-gray-400 mt-1" title="When enabled, every modification to a test case automatically creates a new version with change tracking - This ensures complete audit trail of all changes">
                           Creates version history automatically
                         </p>
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
                    
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Require approval for changes</p>
                         <p className="text-sm text-gray-600">All changes must be reviewed and approved before applying</p>
                         <p className="text-xs text-gray-400 mt-1" title="When enabled, all test case modifications require review and approval before creating new versions - This ensures quality control and prevents unauthorized changes">
                           Ensures quality control through review process
                         </p>
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
                    
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Version retention period</p>
                         <p className="text-sm text-gray-600">Keep versions for {settings.versionRetentionDays} days before archiving</p>
                         <p className="text-xs text-gray-400 mt-1" title="Defines how long to keep version history before archiving old versions - Helps manage storage while maintaining important historical data">
                           Balances storage and historical preservation
                         </p>
                       </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenConfigModal('version-control')}
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Change Request Settings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenConfigModal('change-requests')}
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="space-y-4">
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Auto-assign reviewers</p>
                         <p className="text-sm text-gray-600">Automatically assign change requests to project leads</p>
                         <p className="text-xs text-gray-400 mt-1" title="Automatically assigns change requests to appropriate reviewers based on project roles - Streamlines the review process and ensures timely feedback">
                           Streamlines review assignment process
                         </p>
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
                    
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Email notifications</p>
                         <p className="text-sm text-gray-600">Send email notifications for pending reviews</p>
                         <p className="text-xs text-gray-400 mt-1" title="Sends email alerts when change requests need review or when versions are created - Keeps team members informed of important changes">
                           Keeps team informed of pending actions
                         </p>
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
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Notification Settings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenConfigModal('notifications')}
                    >
                      Configure
                    </Button>
                  </div>
                  <div className="space-y-4">
                                         <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                       <div>
                         <p className="font-medium text-gray-900">Notify on change request</p>
                         <p className="text-sm text-gray-600">Send notifications when new change requests are created</p>
                         <p className="text-xs text-gray-400 mt-1" title="Immediately notifies relevant team members when new change requests are submitted - Ensures quick response to proposed modifications">
                           Ensures quick response to proposed changes
                         </p>
                       </div>
                      <button
                        onClick={() => handleToggleSetting('notifyOnChangeRequest')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          settings.notifyOnChangeRequest ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.notifyOnChangeRequest ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reset all settings to defaults</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetSettings}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
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