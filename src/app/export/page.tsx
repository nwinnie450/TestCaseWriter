'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ExportProfileList } from '@/components/export/ExportProfileList'
import { NewProfileModal } from '@/components/export/NewProfileModal'
import { EditProfileModal } from '@/components/export/EditProfileModal'
import { TestCaseSelectionModal } from '@/components/export/TestCaseSelectionModal'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ExportProfile, FieldMapping, TestCase } from '@/types'
import { exportTestCases } from '@/lib/export-utils'
import { getStorageStats } from '@/lib/test-case-storage'
import { 
  Download, 
  Plus, 
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Database
} from 'lucide-react'


// No mock export history for production - start clean
const mockExportHistory: any[] = []

// Default profiles
const defaultProfiles: ExportProfile[] = [
  {
    id: 'profile-1',
    name: 'TestRail Integration',
    description: 'Export test cases to TestRail project suite',
    format: 'testrail',
    fieldMappings: [
      { sourceField: 'id', targetField: 'custom_case_id', required: true },
      { sourceField: 'title', targetField: 'title', required: true },
      { sourceField: 'priority', targetField: 'priority_id', required: false }
    ],
    isDefault: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'profile-2',
    name: 'Excel Export - Standard',
    description: 'Standard Excel format for test case documentation',
    format: 'excel',
    fieldMappings: [
      { sourceField: 'id', targetField: 'Test case ID', required: true },
      { sourceField: 'title', targetField: 'Test Title', required: true },
      { sourceField: 'description', targetField: 'Description', required: false },
      { sourceField: 'priority', targetField: 'Priority', required: false },
      { sourceField: 'status', targetField: 'Status', required: false }
    ],
    isDefault: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'profile-3',
    name: 'Jira Xray Integration',
    description: 'Export test cases to Jira Xray for execution',
    format: 'jira',
    fieldMappings: [
      { sourceField: 'id', targetField: 'testKey', required: true },
      { sourceField: 'title', targetField: 'summary', required: true },
      { sourceField: 'description', targetField: 'description', required: false }
    ],
    isDefault: false,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22')
  }
]

export default function ExportCenter() {
  const [profiles, setProfiles] = useState<ExportProfile[]>(defaultProfiles)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('profile-1')
  const [selectedProfile, setSelectedProfile] = useState<ExportProfile | null>(null)
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [view, setView] = useState<'profiles' | 'history'>('profiles')
  const [isClient, setIsClient] = useState(false)
  const [showNewProfileModal, setShowNewProfileModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showTestCaseSelectionModal, setShowTestCaseSelectionModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ExportProfile | null>(null)
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([])
  const [storageStats, setStorageStats] = useState({ sessions: 0, totalTestCases: 0, storageSize: '0 KB' })

  React.useEffect(() => {
    setIsClient(true)
    // Load storage stats
    setStorageStats(getStorageStats())
  }, [])

  React.useEffect(() => {
    // Find the selected profile from the profiles array
    if (selectedProfileId) {
      const profile = profiles.find(p => p.id === selectedProfileId)
      if (profile) {
        setSelectedProfile(profile)
        setMappings(profile.fieldMappings)
      }
    }
  }, [selectedProfileId, profiles])

  const handleCreateProfile = () => {
    setShowNewProfileModal(true)
  }

  const handleSaveNewProfile = (profileData: Partial<ExportProfile>) => {
    // Create the new profile
    const newProfile: ExportProfile = {
      id: `profile-${Date.now()}`,
      name: profileData.name!,
      description: profileData.description,
      format: profileData.format!,
      fieldMappings: [],
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Add to profiles list
    setProfiles(prevProfiles => [...prevProfiles, newProfile])
    
    // Auto-select the new profile
    setSelectedProfileId(newProfile.id)
    
    console.log('New profile created:', newProfile)
    alert(`✅ Profile "${newProfile.name}" created successfully!\n\nFormat: ${newProfile.format.toUpperCase()}\n\nThe profile has been added to your list and selected.`) // Corrected escaping for alert string
    setShowNewProfileModal(false)
  }

  const handleEditProfile = (profile: ExportProfile) => {
    setEditingProfile(profile)
    setShowEditProfileModal(true)
  }

  const handleSaveEditedProfile = (updatedProfile: ExportProfile) => {
    setProfiles(profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p))
    setShowEditProfileModal(false)
    alert(`✅ Profile "${updatedProfile.name}" updated successfully!`) // Corrected escaping for alert string
  }

  const handleDeleteProfile = (profileId: string) => {
    setProfiles(profiles.filter(p => p.id !== profileId))
    alert(`🗑️ Profile deleted successfully!`) // Corrected escaping for alert string
  }

  const handleDuplicateProfile = (profileId: string) => {
    const profileToDuplicate = profiles.find(p => p.id === profileId)
    if (profileToDuplicate) {
      const newProfile: ExportProfile = {
        ...profileToDuplicate,
        id: `profile-${Date.now()}`,
        name: `${profileToDuplicate.name} (Copy)`,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setProfiles([...profiles, newProfile])
      alert(`👯 Profile "${profileToDuplicate.name}" duplicated successfully!`) // Corrected escaping for alert string
    }
  }

  const handleTestConnection = (profileId: string) => {
    console.log('Test connection for profile:', profileId)
    alert('Testing connection... This would validate API credentials in a real app.')
  }

  const handleStartExport = async () => {
    if (!selectedProfile) {
      alert('Please select an export profile first.')
      return
    }

    // Show test case selection modal
    setShowTestCaseSelectionModal(true)
  }

  const handleTestCasesSelected = async (testCases: TestCase[]) => {
    if (!selectedProfile || testCases.length === 0) {
      alert('No test cases selected for export.')
      return
    }

    try {
      console.log('🚀 Starting export...', { profileFormat: selectedProfile.format, testCasesCount: testCases.length })
      
      // Use the export utility to actually download the file
      exportTestCases(testCases, {
        format: selectedProfile.format as any,
        filename: `${selectedProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`
      })

      // Add to export history (mock for now)
      const newExportRecord = {
        id: `export-${Date.now()}`,
        profileName: selectedProfile.name,
        format: selectedProfile.format,
        testCaseCount: testCases.length,
        status: 'completed' as const,
        createdAt: new Date(),
        duration: 2500
      }
      
      mockExportHistory.unshift(newExportRecord)
      
      alert(`✅ Export completed successfully!\n\n📁 Format: ${selectedProfile.format.toUpperCase()}\n📊 Test Cases: ${testCases.length}\n💾 File has been downloaded to your computer.`)
      
    } catch (error) {
      console.error('❌ Export failed:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the console for more details and try again.`)
    }
  }

  const breadcrumbs = [
    { label: 'Export Center' }
  ]

  const actions = (
    <div className="flex items-center space-x-3">
      <Button variant="secondary" onClick={() => setView('history')}> 
        <History className="h-4 w-4 mr-2" />
        Export History
      </Button>
      
      <Button variant="primary" onClick={handleCreateProfile}>
        <Plus className="h-4 w-4 mr-2" />
        New Profile
      </Button>
    </div>
  )

  const renderContent = () => {
    switch (view) {
      case 'profiles':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ExportProfileList
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={setSelectedProfileId}
                onCreateProfile={handleCreateProfile}
                onEditProfile={handleEditProfile}
                onDeleteProfile={handleDeleteProfile}
                onTestConnection={handleTestConnection}
              />
            </div>
            
            <div className="space-y-4">
              {selectedProfile && (
                <>
                  {/* Profile Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-gray-900">{selectedProfile.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{selectedProfile.format} Export Profile</p>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {selectedProfile.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Test Case Library Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>Test Case Library</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary-600">{storageStats.totalTestCases}</div>
                          <div className="text-sm text-gray-500">Test Cases</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{storageStats.sessions}</div>
                          <div className="text-sm text-gray-500">Sessions</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 text-center">
                          Storage used: {storageStats.storageSize}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Export Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Export Test Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Select which test cases to export using this profile.
                        </p>
                        
                        <Button 
                          variant="primary" 
                          className="w-full" 
                          onClick={handleStartExport}
                          disabled={storageStats.totalTestCases === 0}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Select Test Cases to Export
                        </Button>
                        
                        {storageStats.totalTestCases === 0 && (
                          <p className="text-xs text-gray-500 text-center">
                            Generate some test cases first to enable export
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              
              {!selectedProfile && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Select an export profile to start exporting
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Export History</h2>
                <p className="text-gray-600">View past export operations and their status</p>
              </div>
              
              <Button variant="secondary" onClick={() => setView('profiles')}> 
                Back to Profiles
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Export Profile
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Test Cases
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {mockExportHistory.map((export_) => (
                        <tr key={export_.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {export_.profileName}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">
                                {export_.format} export
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {export_.testCaseCount} cases
                          </td>
                          <td className="px-6 py-4">
                            {export_.status === 'completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {export_.status === 'failed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                            {export_.status === 'running' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Running
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {export_.createdAt.toLocaleDateString()} {export_.createdAt.toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {export_.duration ? `${(export_.duration / 1000).toFixed(1)}s` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Export Center" 
      actions={actions}
    >
      <div className="space-y-6">
        {/* Simple Tab Navigation */}
        {isClient && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setView('profiles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${ 
                  view === 'profiles'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Export Profiles
              </button>
              <button
                onClick={() => setView('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${ 
                  view === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Export History
              </button>
            </nav>
          </div>
        )}

        {renderContent()}
      </div>

      {/* New Profile Modal */}
      <NewProfileModal
        isOpen={showNewProfileModal}
        onClose={() => setShowNewProfileModal(false)}
        onSave={handleSaveNewProfile}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onSave={handleSaveEditedProfile}
        profile={editingProfile}
      />

      {/* Test Case Selection Modal */}
      <TestCaseSelectionModal
        isOpen={showTestCaseSelectionModal}
        onClose={() => setShowTestCaseSelectionModal(false)}
        onSelectTestCases={handleTestCasesSelected}
      />
    </Layout>
  )
}