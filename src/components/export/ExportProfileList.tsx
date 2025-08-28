'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { ExportProfile } from '@/types'
import { 
  FileText,
  Database,
  Pencil,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Plus,
  Download,
  Copy,
  Trash2,
  Play
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface ExportProfileListProps {
  profiles: ExportProfile[]
  selectedProfileId?: string
  onSelectProfile: (profileId: string) => void
  onCreateProfile: () => void
  onEditProfile: (profile: ExportProfile) => void
  onDeleteProfile: (profileId: string) => void
  onTestConnection?: (profileId: string) => void
}

const formatIcons = {
  excel: FileText,
  csv: FileText,
  testrail: Database,
  jira: Database,
  confluence: Database,
  json: FileText
}

const formatLabels = {
  excel: 'Microsoft Excel',
  csv: 'CSV File',
  testrail: 'TestRail',
  jira: 'Jira Xray',
  confluence: 'Confluence',
  json: 'JSON File'
}

// Mock data for demonstration
const mockProfiles: ExportProfile[] = [
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
    connectionConfig: {
      type: 'testrail',
      baseUrl: 'https://company.testrail.io',
      username: 'testuser@company.com',
      apiKey: '***hidden***',
      projectKey: 'PROJ1',
      suiteId: '123'
    },
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
    connectionConfig: {
      type: 'jira',
      baseUrl: 'https://company.atlassian.net',
      username: 'testuser@company.com',
      apiKey: '***hidden***',
      projectKey: 'TEST'
    },
    isDefault: false,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-22')
  }
]

export function ExportProfileList({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
  onTestConnection
}: ExportProfileListProps) {
  // Use provided profiles or fall back to mock profiles
  const displayProfiles = profiles || mockProfiles
  const getConnectionStatus = (profile: ExportProfile) => {
    if (!profile.connectionConfig) {
      return { status: 'none', label: 'File Export', color: 'text-gray-600' }
    }

    // In a real app, this would check actual connection status
    const isConnected = Math.random() > 0.3 // Mock connection status
    
    return {
      status: isConnected ? 'connected' : 'error',
      label: isConnected ? 'Connected' : 'Connection Error',
      color: isConnected ? 'text-success-600' : 'text-error-600'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Export Profiles</h3>
          <p className="text-sm text-gray-500">
            Configure export formats and integrations
          </p>
        </div>
        
        <Button onClick={onCreateProfile}>
          <Plus className="h-4 w-4 mr-2" />
          New Profile
        </Button>
      </div>

      {/* Profile Cards */}
      <div className="space-y-3">
        {displayProfiles.map((profile) => {
          const FormatIcon = formatIcons[profile.format]
          const connectionStatus = getConnectionStatus(profile)
          const isSelected = selectedProfileId === profile.id
          
          return (
            <Card
              key={profile.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/30'
              )}
              onClick={() => onSelectProfile(profile.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isSelected ? 'bg-primary-100' : 'bg-gray-100'
                    )}>
                      <FormatIcon className={cn(
                        'h-5 w-5',
                        isSelected ? 'text-primary-600' : 'text-gray-600'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{profile.name}</h4>
                        {profile.isDefault && (
                          <Tooltip content="Default Profile">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          </Tooltip>
                        )}
                        {isSelected && (
                          <Tooltip content="Selected Profile">
                            <CheckCircle className="h-4 w-4 text-primary-600" />
                          </Tooltip>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {profile.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FormatIcon className="h-3 w-3" />
                          <span>{formatLabels[profile.format]}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Database className="h-3 w-3" />
                          <span>{profile.fieldMappings.length} mappings</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Updated {formatDate(profile.updatedAt)}</span>
                        </div>
                      </div>
                      
                      {/* Connection Status */}
                      <div className="flex items-center space-x-2 mt-2">
                        <div className={cn(
                          'flex items-center space-x-1 text-xs',
                          connectionStatus.color
                        )}>
                          {connectionStatus.status === 'connected' && (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          {connectionStatus.status === 'error' && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span>{connectionStatus.label}</span>
                        </div>
                        
                        {profile.connectionConfig && onTestConnection && (
                          <Tooltip content="Test API Connection">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-xs px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTestConnection(profile.id)
                              }}
                            >
                              Test Connection
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    <Tooltip content="Edit Profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditProfile(profile)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Tooltip>
                    
                    <Dropdown
                      trigger={
                        <Tooltip content="More Options">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      }
                    >
                      <DropdownItem onClick={() => onDuplicateProfile(profile.id)}>
                        Duplicate
                      </DropdownItem>
                      <DropdownItem onClick={() => onDeleteProfile(profile.id)}>
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {displayProfiles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Download className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Export Profiles
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first export profile to start exporting test cases.
            </p>
            <Button onClick={onCreateProfile}>
              <Plus className="h-4 w-4 mr-2" />
              Create Export Profile
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {displayProfiles.length}
            </div>
            <div className="text-sm text-gray-500">Total Profiles</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {displayProfiles.filter(p => p.connectionConfig).length}
            </div>
            <div className="text-sm text-gray-500">Integrations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {displayProfiles.filter(p => p.isDefault).length}
            </div>
            <div className="text-sm text-gray-500">Default Profile</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}