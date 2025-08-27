'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { DataGrid } from '@/components/library/DataGrid'
import { DemoDataLoader } from '@/components/library/DemoDataLoader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TestCase } from '@/types'
import { getAllStoredTestCases, getStorageStats } from '@/lib/test-case-storage'
import { exportTestCases, quickExportCSV, quickExportJSON } from '@/lib/export-utils'
import { TestCaseDetailModal } from '@/components/library/TestCaseDetailModal'
import { TestCaseEditModal } from '@/components/library/TestCaseEditModal'
import { BulkEditModal } from '@/components/library/BulkEditModal'
import { 
  Plus, 
  Upload, 
  Download, 
  FileText,
  Filter,
  BarChart3,
  Zap,
  Trash2
} from 'lucide-react'

export default function TestCaseLibrary() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [storageStats, setStorageStats] = useState({ sessions: 0, totalTestCases: 0, storageSize: '0 KB' })
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null)
  const [groupBy, setGroupBy] = useState<string>('none')
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('')
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])

  // Load test cases from localStorage on component mount
  useEffect(() => {
    const loadTestCases = async () => {
      try {
        console.log('📚 Loading test cases from localStorage...')
        
        // Import and run cleanup for duplicate IDs
        const { cleanupDuplicateTestCaseIds, getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
        
        // Clean up any existing duplicate IDs first
        cleanupDuplicateTestCaseIds()
        
        const storedTestCases = getAllStoredTestCases()
        const stats = getStorageStats()
        
        setTestCases(storedTestCases)
        setStorageStats(stats)
        setLoading(false)
        
        console.log('✅ Loaded test cases:', { count: storedTestCases.length, stats })
      } catch (error) {
        console.error('❌ Failed to load test cases:', error)
        setLoading(false)
      }
    }
    
    loadTestCases()
  }, [])

  // Check for project parameter in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const projectParam = urlParams.get('project')
      if (projectParam) {
        setSelectedProjectFilter(projectParam)
      }
    }
  }, [])

  // Load projects from localStorage
  useEffect(() => {
    try {
      console.log('🔍 Projects Debug - Loading projects from localStorage...')
      const stored = localStorage.getItem('testCaseWriter_projects')
      console.log('🔍 Projects Debug - Raw stored data:', stored)
      
      if (stored) {
        const parsedProjects = JSON.parse(stored)
        console.log('🔍 Projects Debug - Parsed projects:', parsedProjects)
        
        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active')
        console.log('🔍 Projects Debug - Active projects:', activeProjects)
        
        setProjects(activeProjects)
      } else {
        console.log('🔍 Projects Debug - No projects found in localStorage')
        setProjects([])
      }
    } catch (error) {
      console.error('🔍 Projects Debug - Failed to load projects:', error)
      setProjects([])
    }
  }, [])

  // Filter test cases by project
  useEffect(() => {
    console.log('🔍 Filter Debug - Project filter changed:', { selectedProjectFilter, testCasesCount: testCases.length })
    
    if (selectedProjectFilter === '') {
      console.log('🔍 Filter Debug - No project filter, showing all test cases')
      setFilteredTestCases(testCases)
    } else {
      const filtered = testCases.filter(tc => tc.projectId === selectedProjectFilter)
      console.log('🔍 Filter Debug - Filtered by project:', { 
        projectId: selectedProjectFilter, 
        filteredCount: filtered.length,
        totalCount: testCases.length 
      })
      setFilteredTestCases(filtered)
    }
  }, [testCases, selectedProjectFilter])

  // Debug logging for groupBy changes
  useEffect(() => {
    console.log('🔍 Group Debug - Group by changed:', { 
      groupBy, 
      filteredTestCasesCount: filteredTestCases.length,
      testCasesCount: testCases.length,
      isDataGridVisible: groupBy === 'none'
    })
  }, [groupBy, filteredTestCases])

  // Debug logging for filter state changes
  useEffect(() => {
    console.log('🔍 Filter State Debug:', {
      selectedProjectFilter,
      groupBy,
      testCasesCount: testCases.length,
      filteredTestCasesCount: filteredTestCases.length,
      projectsCount: projects.length
    })
  }, [selectedProjectFilter, groupBy, testCases, filteredTestCases, projects])

  const handleEdit = (testCase: TestCase) => {
    console.log('Edit test case:', testCase.id)
    setEditingTestCase(testCase)
    setShowEditModal(true)
  }

  const handleView = (testCase: TestCase) => {
    console.log('View test case:', testCase.id)
    setSelectedTestCase(testCase)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedTestCase(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingTestCase(null)
  }

  const handleSaveTestCase = async (updatedTestCase: TestCase) => {
    try {
      // Update the test case in localStorage
      const { getAllStoredTestCases, getStoredTestCaseSessions, getStorageStats } = await import('@/lib/test-case-storage')
      
      // Get all sessions and update the specific test case
      const sessions = getStoredTestCaseSessions()
      const updatedSessions = sessions.map(session => ({
        ...session,
        testCases: session.testCases.map(tc => 
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        )
      }))
      
      // Save updated sessions back to localStorage
      localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(updatedSessions))
      
      // Refresh the UI
      const updatedTestCases = getAllStoredTestCases()
      const updatedStats = getStorageStats()
      
      setTestCases(updatedTestCases)
      setStorageStats(updatedStats)
      
      // Close the edit modal
      setShowEditModal(false)
      setEditingTestCase(null)
      
      alert(`✅ Test case "${updatedTestCase.data?.title || updatedTestCase.testCase}" has been updated successfully!`)
      
    } catch (error) {
      console.error('Failed to save test case:', error)
      alert('❌ Failed to save test case changes. Please try again.')
    }
  }

  const handleDelete = async (testCaseIds: string[]) => {
    console.log('🔍 Delete Debug - Received IDs:', testCaseIds)
    console.log('🔍 Delete Debug - Current selectedIds state:', selectedIds)
    console.log('🔍 Delete Debug - Total test cases:', testCases.length)
    
    if (testCaseIds.length === 0) {
      alert('Please select test cases to delete')
      return
    }
    
    // Validate that we're not accidentally deleting all test cases
    if (testCaseIds.length === testCases.length) {
      const confirmed = confirm(`⚠️ WARNING: You're about to delete ALL ${testCaseIds.length} test cases! This will remove everything. Are you absolutely sure?`)
      if (!confirmed) {
        console.log('🚫 Bulk delete cancelled by user')
        return
      }
    }
    
    // Additional safety check for large deletions
    if (testCaseIds.length > testCases.length * 0.8) {
      const confirmed = confirm(`⚠️ CAUTION: You're about to delete ${testCaseIds.length} out of ${testCases.length} test cases (${Math.round(testCaseIds.length/testCases.length*100)}%). This will remove most of your test cases. Are you sure?`)
      if (!confirmed) {
        console.log('🚫 Large deletion cancelled by user')
        return
      }
    }
    
    if (confirm(`Are you sure you want to delete ${testCaseIds.length} test case(s)? This action cannot be undone.`)) {
      try {
        // Import the delete function and delete from storage
        const { deleteTestCasesByIds, getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
        
        console.log('🗑️ Deleting test cases with IDs:', testCaseIds)
        
        // Delete the test cases
        deleteTestCasesByIds(testCaseIds)
        
        // Refresh the UI by reloading test cases from storage
        const updatedTestCases = getAllStoredTestCases()
        const updatedStats = getStorageStats()
        
        console.log('✅ After deletion - Remaining test cases:', updatedTestCases.length)
        
        setTestCases(updatedTestCases)
        setStorageStats(updatedStats)
        setSelectedIds([]) // Clear selection
        
        alert(`✅ Successfully deleted ${testCaseIds.length} test case(s)!`)
        
      } catch (error) {
        console.error('Failed to delete test cases:', error)
        alert('❌ Failed to delete test cases. Please try again.')
      }
    }
  }

  const handleBulkEdit = (testCaseIds: string[]) => {
    if (testCaseIds.length === 0) {
      alert('Please select test cases to edit')
      return
    }
    setShowBulkEditModal(true)
  }

  const handleBulkSave = async (updates: Partial<TestCase>) => {
    try {
      console.log('Bulk updating test cases:', selectedIds, updates)
      
      // Import storage functions
      const { getStoredTestCaseSessions, getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
      
      // Get all sessions
      const sessions = getStoredTestCaseSessions()
      
      // Update selected test cases in all sessions
      const updatedSessions = sessions.map(session => ({
        ...session,
        testCases: session.testCases.map(tc => {
          if (selectedIds.includes(tc.id)) {
            const updatedTestCase = { ...tc, ...updates }
            
            // Handle special tag actions
            if ((updates as any)._tagAction && updates.tags) {
              const existingTags = tc.tags || []
              const newTags = updates.tags as string[]
              
              switch ((updates as any)._tagAction) {
                case 'add':
                  updatedTestCase.tags = [...existingTags, ...newTags].filter((tag, index, arr) => arr.indexOf(tag) === index)
                  break
                case 'replace':
                  updatedTestCase.tags = newTags
                  break
                case 'remove':
                  updatedTestCase.tags = existingTags.filter(tag => !newTags.includes(tag))
                  break
              }
              
              // Remove the special action field
              delete (updatedTestCase as any)._tagAction
            }
            
            return updatedTestCase
          }
          return tc
        })
      }))
      
      // Save updated sessions back to localStorage
      localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(updatedSessions))
      
      // Refresh the UI
      const updatedTestCases = getAllStoredTestCases()
      const updatedStats = getStorageStats()
      
      setTestCases(updatedTestCases)
      setStorageStats(updatedStats)
      setShowBulkEditModal(false)
      
      alert(`✅ Successfully updated ${selectedIds.length} test case${selectedIds.length !== 1 ? 's' : ''}!`)
      
    } catch (error) {
      console.error('Failed to bulk update test cases:', error)
      alert('❌ Failed to update test cases. Please try again.')
    }
  }

  const handleExport = async (testCaseIds: string[]) => {
    console.log('Export test cases:', testCaseIds)
    if (testCaseIds.length === 0) {
      alert('Please select test cases to export')
      return
    }
    
    try {
      // Get the selected test cases
      const selectedTestCases = testCases.filter(tc => testCaseIds.includes(tc.id))
      
      if (selectedTestCases.length === 0) {
        alert('No matching test cases found for export')
        return
      }
      
      // Show format selection dialog
      const format = prompt(
        `Export ${selectedTestCases.length} test cases in which format?\n\n` +
        'Options:\n' +
        '• csv - Comma-separated values (Excel compatible)\n' +
        '• json - JSON format with full data\n' +
        '• excel - Excel-compatible CSV format\n\n' +
        'Enter format (csv/json/excel):',
        'csv'
      )?.toLowerCase().trim()
      
      if (!format) {
        return // User cancelled
      }
      
      if (!['csv', 'json', 'excel'].includes(format)) {
        alert('Invalid format. Please use: csv, json, or excel')
        return
      }
      
      // Export the test cases
      await exportTestCases(selectedTestCases, { 
        format: format as 'csv' | 'json' | 'excel',
        filename: `selected-test-cases-${new Date().toISOString().split('T')[0]}`
      })
      
      alert(`✅ Successfully exported ${selectedTestCases.length} test cases as ${format.toUpperCase()}!`)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleBulkImport = () => {
    console.log('Bulk import test cases')
    alert('Bulk import feature coming soon!')
  }

  const handleGenerateAI = () => {
    console.log('Generate with AI')
    // Navigate to generate page
    window.location.href = '/generate'
  }

  const handleLoadMockData = async () => {
    try {
      console.log('🎭 Loading mock test cases...')
      const { loadMockTestCases, getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
      
      // Load mock data
      const sessionId = loadMockTestCases()
      
      // Refresh the UI
      const updatedTestCases = getAllStoredTestCases()
      const updatedStats = getStorageStats()
      
      setTestCases(updatedTestCases)
      setStorageStats(updatedStats)
      
      console.log('✅ Mock test cases loaded successfully!')
      alert(`✅ Loaded 3 mock test cases with 8-10 steps each for testing expand/collapse functionality!`)
    } catch (error) {
      console.error('❌ Failed to load mock data:', error)
      alert('❌ Failed to load mock data. Please try again.')
    }
  }

  // Group test cases by selected field
  const groupTestCases = (testCases: TestCase[], groupField: string) => {
    if (groupField === 'none') return { 'All Test Cases': testCases }
    
    const grouped = testCases.reduce((acc, testCase) => {
      let groupValue: string
      
      switch (groupField) {
        case 'enhancement':
          groupValue = testCase.enhancement || 'No Enhancement'
          break
        case 'ticket':
          groupValue = testCase.ticketId || 'No Ticket'
          break
        case 'feature':
          groupValue = testCase.feature || testCase.module || 'General'
          break
        case 'priority':
          groupValue = testCase.priority || 'medium'
          break
        case 'status':
          groupValue = testCase.status || 'draft'
          break
        default:
          groupValue = 'Ungrouped'
      }
      
      if (!acc[groupValue]) {
        acc[groupValue] = []
      }
      acc[groupValue].push(testCase)
      return acc
    }, {} as Record<string, TestCase[]>)
    
    return grouped
  }

  const groupedTestCases = groupTestCases(filteredTestCases, groupBy)

  const breadcrumbs = [
    { label: 'Library' }
  ]

  const handleExportAll = async () => {
    if (testCases.length === 0) {
      alert('No test cases available for export')
      return
    }

    try {
      const format = prompt(
        `Export all ${testCases.length} test cases in which format?\n\n` +
        'Options:\n' +
        '• csv - Comma-separated values (Excel compatible)\n' +
        '• json - JSON format with full data\n' +
        '• excel - Excel-compatible CSV format\n\n' +
        'Enter format (csv/json/excel):',
        'csv'
      )?.toLowerCase().trim()
      
      if (!format) return
      
      if (!['csv', 'json', 'excel'].includes(format)) {
        alert('Invalid format. Please use: csv, json, or excel')
        return
      }
      
      await exportTestCases(testCases, { 
        format: format as 'csv' | 'json' | 'excel',
        filename: `all-test-cases-${new Date().toISOString().split('T')[0]}`
      })
      
      alert(`✅ Successfully exported all ${testCases.length} test cases as ${format.toUpperCase()}!`)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClearStorage = async () => {
    if (confirm('Are you sure you want to clear all stored test cases? This action cannot be undone.')) {
      try {
        const { clearStoredTestCases } = await import('@/lib/test-case-storage')
        clearStoredTestCases()
        
        // Refresh UI
        setTestCases([])
        setSelectedIds([])
        setStorageStats({ sessions: 0, totalTestCases: 0, storageSize: '0 KB' })
        
        alert('✅ All stored test cases have been cleared!')
      } catch (error) {
        console.error('Failed to clear storage:', error)
        alert('❌ Failed to clear stored test cases')
      }
    }
  }

  const actions = (
    <div className="flex items-center space-x-3">
      {testCases.length > 0 && (
        <>
          <Button variant="secondary" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All ({testCases.length})
          </Button>
          
          <Button variant="secondary" onClick={handleClearStorage} className="text-red-600 hover:text-red-700">
            Clear All
          </Button>
        </>
      )}
      
      <Button variant="secondary" onClick={handleBulkImport}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>

      <Button variant="secondary" onClick={handleLoadMockData} className="border-blue-300 text-blue-600 hover:bg-blue-50">
        <FileText className="h-4 w-4 mr-2" />
        Load Test Data
      </Button>
      
      <Button variant="secondary" onClick={handleGenerateAI}>
        <Zap className="h-4 w-4 mr-2" />
        Generate with AI
      </Button>
      
      <Button variant="primary">
        <Plus className="h-4 w-4 mr-2" />
        New Test Case
      </Button>
    </div>
  )

  const stats = {
    total: filteredTestCases.length,
    active: filteredTestCases.filter(tc => tc.testResult === 'Pass').length,
    draft: filteredTestCases.filter(tc => tc.testResult === 'Not Executed').length,
    review: filteredTestCases.filter(tc => tc.testResult === 'Fail').length
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Test Case Library" 
      actions={actions}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cases</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Review</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.review}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo Data Loader */}
        <DemoDataLoader />

        {/* Filtering Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Project
                </label>
                <select
                  value={selectedProjectFilter}
                  onChange={(e) => {
                    console.log('🟡 Project Filter Clicked/Changed:', { 
                      oldValue: selectedProjectFilter, 
                      newValue: e.target.value,
                      projectsCount: projects.length,
                      projects: projects.map(p => ({ id: p.id, name: p.name }))
                    })
                    setSelectedProjectFilter(e.target.value)
                  }}
                  onClick={() => console.log('🟡 Project Filter Select Clicked')}
                  className="input w-full md:w-64"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {selectedProjectFilter ? (
                    <>Showing <span className="font-medium">{filteredTestCases.length}</span> of <span className="font-medium">{testCases.length}</span> test cases</>
                  ) : (
                    <>Showing all <span className="font-medium">{testCases.length}</span> test cases</>
                  )}
                </div>
                
                {selectedProjectFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedProjectFilter('')}
                    className="text-primary-600"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions for Selected Items */}
        {selectedIds.length > 0 && (
          <Card className="border-primary-200 bg-primary-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {selectedIds.length}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {selectedIds.length} test case{selectedIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleExport(selectedIds)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected
                  </Button>
                  
                  <Button variant="secondary" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Bulk Edit
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDelete(selectedIds)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedIds.length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Data Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span>Test Cases</span>
                {storageStats.sessions > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                    {storageStats.sessions} sessions, {storageStats.storageSize} stored
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Group by:</label>
                  <select 
                    value={groupBy} 
                    onChange={(e) => {
                      console.log('🟡 Group By Clicked/Changed:', { 
                        oldValue: groupBy, 
                        newValue: e.target.value,
                        currentFilteredCount: filteredTestCases.length
                      })
                      setGroupBy(e.target.value)
                    }}
                    onClick={() => console.log('🟡 Group By Select Clicked')}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="feature">Feature</option>
                    <option value="enhancement">Enhancement</option>
                    <option value="ticket">Ticket</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupBy === 'none' ? (
              <DataGrid
                data={filteredTestCases}
                onSelectionChange={setSelectedIds}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onExport={handleExport}
                onBulkEdit={handleBulkEdit}
                loading={loading}
                projects={projects.reduce((acc, project) => {
                  acc[project.id] = project.name
                  return acc
                }, {} as Record<string, string>)}
              />
            ) : (
              <div className="space-y-6 p-6">
                {Object.entries(groupedTestCases).map(([groupName, groupTestCases]) => (
                  <div key={groupName} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h3 className="text-lg font-medium text-gray-900 capitalize">
                        {groupName} <span className="text-sm text-gray-500">({groupTestCases.length} test cases)</span>
                      </h3>
                    </div>
                    <DataGrid
                      data={groupTestCases}
                      onSelectionChange={setSelectedIds}
                      onEdit={handleEdit}
                      onView={handleView}
                      onDelete={handleDelete}
                      onExport={handleExport}
                      onBulkEdit={handleBulkEdit}
                      loading={false}
                      projects={projects.reduce((acc, project) => {
                        acc[project.id] = project.name
                        return acc
                      }, {} as Record<string, string>)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testCases.length > 0 ? testCases
                  .slice(0, 5)
                  .map((testCase) => (
                    <div key={testCase.id} className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></div>
                      <span className="font-mono text-primary-600">{testCase.id}</span>
                      <span className="truncate">{testCase.testCase}</span>
                      <span className="text-gray-500 text-xs">
                        Recently generated
                      </span>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm">No test cases generated yet. <a href="/generate" className="text-primary-600 hover:underline">Generate some test cases</a> to see them here.</p>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Coverage by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(['critical', 'high', 'medium', 'low'] as const).map(priority => {
                  const count = filteredTestCases.filter(tc => tc.module?.toLowerCase().includes(priority)).length
                  const percentage = filteredTestCases.length > 0 ? Math.round((count / filteredTestCases.length) * 100) : 0
                  
                  return (
                    <div key={priority} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize font-medium">{priority}</span>
                        <span className="text-gray-500">{count} cases ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            priority === 'critical' ? 'bg-red-500' :
                            priority === 'high' ? 'bg-orange-500' :
                            priority === 'medium' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Case Detail Modal */}
      <TestCaseDetailModal
        testCase={selectedTestCase}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        onEdit={handleEdit}
        onExport={handleExport}
      />

      {/* Test Case Edit Modal */}
      <TestCaseEditModal
        testCase={editingTestCase}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveTestCase}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedTestCases={filteredTestCases.filter(tc => selectedIds.includes(tc.id))}
        onSave={handleBulkSave}
      />
    </Layout>
  )
}