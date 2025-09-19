'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { DataGrid } from '@/components/library/DataGrid'
import { ReconcileDuplicatesButton } from '@/components/library/ReconcileDuplicatesButton'
import { UserAssignment, AssignedUsersSummary } from '@/components/user-management/UserAssignment'
import { CoverageDashboard } from '@/components/coverage/CoverageDashboard'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { TestCase } from '@/types/index'
import { getAllStoredTestCases, getStorageStats } from '@/lib/test-case-storage'
import { getTestCaseSignature } from '@/lib/caseSignature'
import { exportTestCases, quickExportCSV, quickExportJSON } from '@/lib/export-utils'
import { TestCaseDetailModal } from '@/components/library/TestCaseDetailModal'
import { TestCaseEditModal } from '@/components/library/TestCaseEditModal'
import { BulkEditModal } from '@/components/library/BulkEditModal'
import { VersionHistoryModal } from '@/components/library/VersionHistoryModal'
import { TestCaseImporter } from '@/components/import/TestCaseImporter'
import { AuthService } from '@/lib/auth-service'
import {
  Plus,
  Download,
  FileText,
  Filter,
  BarChart3,
  Zap,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Timer,
  MessageSquare,
  Activity,
  List,
  Grid,
  Upload,
  X
} from 'lucide-react'

// Test execution interfaces
interface ExecutionRun {
  id: string
  name: string
  description: string
  testCases: TestCase[]
  assignedTester: string
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked'
  createdAt: Date
  updatedAt: Date
  progress: {
    total: number
    executed: number
    passed: number
    failed: number
    blocked: number
    skipped: number
  }
}

// Available users for test assignment
const AVAILABLE_USERS = [
  { id: '1', name: 'System Administrator', username: 'admin', role: 'super-admin' },
  { id: '2', name: 'Sarah Johnson', username: 'sarah', role: 'lead' },
  { id: '3', name: 'Mike Chen', username: 'mike', role: 'qa' },
  { id: '4', name: 'Lisa Rodriguez', username: 'lisa', role: 'qa' }
]

export default function TestCaseManagement() {
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
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false)
  const [selectedVersionTestCase, setSelectedVersionTestCase] = useState<TestCase | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('')
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [templates, setTemplates] = useState<Array<{id: string, name: string, fields: any[]}>>([])
  const [showCoverage, setShowCoverage] = useState(false)
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [isFromGenerate, setIsFromGenerate] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTestCase, setNewTestCase] = useState({
    title: '',
    description: '',
    category: 'Functional',
    priority: 'Medium',
    testSteps: '',
    expectedResult: '',
    module: '',
    testData: '',
    requirements: '',
    tags: '',
    complexity: 'Medium'
  })

  // Execution Management State
  const [viewMode, setViewMode] = useState<'library' | 'execution'>('library')
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<string[]>([])
  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [executingTestCase, setExecutingTestCase] = useState<TestCase | null>(null)
  const [executionData, setExecutionData] = useState({
    status: 'Not Executed' as 'Pass' | 'Fail' | 'Blocked' | 'Skip' | 'Not Executed',
    tester: '',
    environment: 'Production',
    duration: '',
    notes: '',
    jiraTicket: ''
  })

  // Get current user (memoized to prevent infinite re-renders)
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser())

  // Memoize projects object to prevent DataGrid re-renders
  const projectsLookup = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project.name
      return acc
    }, {} as Record<string, string>)
  }, [projects])

  // Initialize execution data with current user (only once)
  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
      setExecutionData(prev => ({
        ...prev,
        tester: user.name
      }))
    }
  }, [])

  // Load execution runs from localStorage
  useEffect(() => {
    try {
      const storedRuns = localStorage.getItem('testCaseWriter_executionRuns')
      if (storedRuns) {
        const parsedRuns = JSON.parse(storedRuns).map((run: any) => ({
          ...run,
          createdAt: new Date(run.createdAt),
          updatedAt: new Date(run.updatedAt)
        }))
        setExecutionRuns(parsedRuns)
      }
    } catch (error) {
      console.error('Failed to load execution runs:', error)
      setExecutionRuns([])
    }
  }, [])

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
      const viewParam = urlParams.get('view')

      if (projectParam) {
        setSelectedProjectFilter(projectParam)
      }
      
      // Check if coming from generate page
      if (viewParam === 'generated') {
        setIsFromGenerate(true)
      }
    }
  }, [])

  // Load projects from localStorage
  useEffect(() => {
    try {
      
      const stored = localStorage.getItem('testCaseWriter_projects')

      if (stored) {
        const parsedProjects = JSON.parse(stored)

        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active')

        setProjects(activeProjects)
      } else {
        
        setProjects([])
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      setProjects([])
    }
  }, [])

  // Load templates from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('testCaseWriter_templates')
      if (stored) {
        const parsedTemplates = JSON.parse(stored)
        setTemplates(parsedTemplates)
      } else {
        // Create default template if none exist
        const defaultTemplate = {
          id: 'default-template',
          name: 'Standard Test Case Template',
          description: 'Standard template: Test Case | Module | Test Step | Test Step Description | Test Data | Expected Result | Test Result | QA | Remarks',
          fields: [
            { id: 'testCase', label: 'Test Case', type: 'text', required: true, order: 1, placeholder: 'TC_001 (unique ID)' },
            { id: 'module', label: 'Module', type: 'text', required: true, order: 2, placeholder: 'Transaction "Cancel" Feature' },
            { id: 'testStep', label: 'Test Step', type: 'number', required: false, order: 3, placeholder: '1', defaultValue: 1 },
            { id: 'testStepDescription', label: 'Test Step Description', type: 'textarea', required: true, order: 4, placeholder: 'Detailed numbered list of actions:\n1. Navigate to...\n2. Click on...\n3. Verify...' },
            { id: 'testData', label: 'Test Data', type: 'textarea', required: false, order: 5, placeholder: 'Input values or parameters\n(can be blank if not applicable)' },
            { id: 'expectedResult', label: 'Expected Result', type: 'textarea', required: true, order: 6, placeholder: 'Clear outcome criteria:\n- System should...\n- User should see...' },
            { 
              id: 'testResult', 
              label: 'Test Result', 
              type: 'select', 
              required: false, 
              order: 7,
              options: [
                { label: 'Not Executed', value: 'Not Executed' },
                { label: 'Passed', value: 'Passed' },
                { label: 'Failed', value: 'Failed' },
                { label: 'Blocked', value: 'Blocked' },
                { label: 'Skipped', value: 'Skipped' }
              ],
              defaultValue: 'Not Executed'
            },
            { id: 'qa', label: 'QA', type: 'text', required: false, order: 8, placeholder: 'Tester name or team (e.g., Ops)' },
            { id: 'remarks', label: 'Remarks', type: 'textarea', required: false, order: 9, placeholder: 'Additional notes, links to Jira/Confluence, improvement references' }
          ],
          version: 1,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system'
        }
        setTemplates([defaultTemplate])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
      setTemplates([])
    }
  }, [])

  // Filter test cases by project
  useEffect(() => {
    if (selectedProjectFilter === '') {
      setFilteredTestCases(testCases)
    } else {
      const filtered = testCases.filter(tc => tc.projectId === selectedProjectFilter)
      setFilteredTestCases(filtered)
    }
  }, [testCases, selectedProjectFilter])

  useEffect(() => {
    
  }, [groupBy, filteredTestCases])

  useEffect(() => {
    
  }, [selectedProjectFilter, groupBy, testCases, filteredTestCases, projects])

  // Check if there are chunks available for coverage analysis
  useEffect(() => {
    try {
      // Check if we have any chunks with associated test cases
      const chunksWithCases = testCases.filter(tc => tc.data?.chunkId && tc.data?.docId)
      if (chunksWithCases.length > 0) {
        // Get the most recent docId for coverage analysis
        const latestCase = chunksWithCases.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        if (latestCase.data?.docId && latestCase.data.docId !== activeDocId) {
          setActiveDocId(latestCase.data.docId)
        }
      }
    } catch (error) {
      console.log('Could not detect chunks for coverage:', error)
    }
  }, [testCases, activeDocId])

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

    if (testCaseIds.length === 0) {
      alert('Please select test cases to delete')
      return
    }
    
    // Validate that we're not accidentally deleting all test cases
    if (testCaseIds.length === testCases.length) {
      const confirmed = confirm(`⚠️ WARNING: You're about to delete ALL ${testCaseIds.length} test cases! This will remove everything. Are you absolutely sure?`)
      if (!confirmed) {
        
        return
      }
    }
    
    // Additional safety check for large deletions
    if (testCaseIds.length > testCases.length * 0.8) {
      const confirmed = confirm(`⚠️ CAUTION: You're about to delete ${testCaseIds.length} out of ${testCases.length} test cases (${Math.round(testCaseIds.length/testCases.length*100)}%). This will remove most of your test cases. Are you sure?`)
      if (!confirmed) {
        
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

  const handleOpenVersionHistory = (testCase: TestCase) => {
    setSelectedVersionTestCase(testCase)
    setShowVersionHistoryModal(true)
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
                  updatedTestCase.tags = [...existingTags, ...newTags].filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index)
                  break
                case 'replace':
                  updatedTestCase.tags = newTags
                  break
                case 'remove':
                  updatedTestCase.tags = existingTags.filter((tag: string) => !newTags.includes(tag))
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
      
      // Generate filename with project name + timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) // YYYY-MM-DDTHH-mm-ss
      const projectName = selectedProjectFilter ? 
        (projects.find(p => p.id === selectedProjectFilter)?.name || 'Unknown-Project') : 
        'All-Projects'
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-') // Make filename safe
      
      // Export the test cases
      await exportTestCases(selectedTestCases, { 
        format: format as 'csv' | 'json' | 'excel',
        filename: `${safeProjectName}_Selected_${selectedTestCases.length}Cases_${timestamp}`
      })
      
      alert(`✅ Successfully exported ${selectedTestCases.length} test cases as ${format.toUpperCase()}!`)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleGenerateAI = () => {
    console.log('Generate with AI')
    // Navigate to generate page and continue with existing session if available
    const projectParam = selectedProjectFilter ? `project=${selectedProjectFilter}&` : ''
    window.location.href = `/generate?${projectParam}continue=true`
  }

  const handleBackToGenerate = () => {
    // Navigate back to generate and continue with existing session
    const projectParam = selectedProjectFilter ? `project=${selectedProjectFilter}&` : ''
    window.location.href = `/generate?${projectParam}continue=true`
  }

  const handleImportTestCases = async (importedTestCases: TestCase[], options: any) => {
    try {

      // If a project is selected, assign it to all imported test cases
      const testCasesToSave = selectedProjectFilter
        ? importedTestCases.map(tc => ({ ...tc, projectId: selectedProjectFilter }))
        : importedTestCases

      // Use the proper storage system to save imported test cases
      const { saveGeneratedTestCases } = await import('@/lib/test-case-storage')

      const saveResult = saveGeneratedTestCases(
        testCasesToSave,
        ['imported-data'], // document names
        'imported', // model
        selectedProjectFilter || undefined, // project ID
        selectedProjectFilter ? 'Imported Project' : undefined, // project name
        undefined, // continueSessionId
        options.skipDuplicates !== false // skipDuplicates (default to true if not specified)
      )

      setShowImportModal(false)

      // Refresh the page data
      const { getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
      const refreshedTestCases = getAllStoredTestCases()
      const refreshedStats = getStorageStats()

      setTestCases(refreshedTestCases)
      setStorageStats(refreshedStats)

      alert(`Successfully imported ${saveResult.saved} test cases! (${saveResult.skipped} skipped as duplicates)`)
    } catch (error) {
      console.error('❌ Error importing test cases:', error)
      alert(`Failed to import test cases: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Manual test case creation
  const handleCreateTestCase = () => {
    try {
      const testCaseId = `TC_MANUAL_${Date.now().toString(36).toUpperCase()}`

      const newTC: TestCase = {
        id: testCaseId,
        templateId: 'default-template',
        projectId: selectedProjectFilter || 'default',
        status: 'draft',
        testCase: newTestCase.title,
        module: newTestCase.module || 'General',
        testSteps: newTestCase.testSteps ? newTestCase.testSteps.split('\n').map((step, index) => ({
          step: index + 1,
          description: step.trim(),
          expectedResult: '',
          testData: ''
        })) : [],
        testData: newTestCase.testData || 'N/A',
        testResult: 'Not Executed',
        qa: 'Manual Creator',
        remarks: '',
        priority: newTestCase.priority as 'low' | 'medium' | 'high' | 'critical',
        tags: newTestCase.tags ? newTestCase.tags.split(',').map(tag => tag.trim()) : [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.id || 'system',
        version: 1,
        data: {
          expectedResult: newTestCase.expectedResult,
          testData: newTestCase.testData || 'N/A',
          category: newTestCase.category,
          complexity: newTestCase.complexity,
          requirements: newTestCase.requirements ? newTestCase.requirements.split(',').map(req => req.trim()) : [],
          isManuallyCreated: true,
          source: 'Manual Creation'
        }
      }

      // Save to localStorage
      const currentSessionId = `manual-session-${Date.now()}`
      const existingData = JSON.parse(localStorage.getItem('testCases') || '{}')

      if (!existingData[currentSessionId]) {
        existingData[currentSessionId] = {
          testCases: [],
          metadata: {
            sessionId: currentSessionId,
            source: 'Manual Creation',
            createdAt: new Date().toISOString(),
            totalTestCases: 0
          }
        }
      }

      existingData[currentSessionId].testCases.push(newTC)
      existingData[currentSessionId].metadata.totalTestCases = existingData[currentSessionId].testCases.length
      existingData[currentSessionId].metadata.updatedAt = new Date().toISOString()

      localStorage.setItem('testCases', JSON.stringify(existingData))

      // Update UI
      setTestCases(prev => [...prev, newTC])
      setShowCreateModal(false)

      // Reset form
      setNewTestCase({
        title: '',
        description: '',
        category: 'Functional',
        priority: 'Medium',
        testSteps: '',
        expectedResult: '',
        module: '',
        testData: '',
        requirements: '',
        tags: '',
        complexity: 'Medium'
      })

      alert(`✅ Test case "${newTC.testCase}" created successfully!`)

    } catch (error) {
      console.error('Failed to create test case:', error)
      alert('❌ Failed to create test case. Please try again.')
    }
  }

  const resetCreateForm = () => {
    setNewTestCase({
      title: '',
      description: '',
      category: 'Functional',
      priority: 'Medium',
      testSteps: '',
      expectedResult: '',
      module: '',
      testData: '',
      requirements: '',
      tags: '',
      complexity: 'Medium'
    })
    setShowCreateModal(false)
  }

  // Execution Management Functions
  const createExecutionRun = () => {
    if (selectedIds.length === 0) {
      alert('Please select test cases to create an execution run')
      return
    }

    const selectedTestCases = testCases.filter(tc => selectedIds.includes(tc.id))
    const runName = prompt('Enter execution run name:', `Test Run ${executionRuns.length + 1}`)

    if (!runName) return

    const newRun: ExecutionRun = {
      id: `run_${Date.now()}`,
      name: runName,
      description: `Execution run for ${selectedTestCases.length} test cases`,
      testCases: selectedTestCases,
      assignedTester: currentUser?.name || 'Unassigned',
      status: 'Not Started',
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        total: selectedTestCases.length,
        executed: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        skipped: 0
      }
    }

    const updatedRuns = [...executionRuns, newRun]
    setExecutionRuns(updatedRuns)
    localStorage.setItem('testCaseWriter_executionRuns', JSON.stringify(updatedRuns))
    setActiveRunId(newRun.id)
    setViewMode('execution')
    setSelectedIds([])

    alert(`✅ Execution run "${runName}" created with ${selectedTestCases.length} test cases!`)
  }

  const executeTestCase = (testCase: TestCase) => {
    setExecutingTestCase(testCase)
    setShowExecutionPanel(true)
    setExecutionData(prev => ({
      ...prev,
      status: testCase.testResult as any || 'Not Executed',
      notes: testCase.remarks || ''
    }))
  }

  const saveExecutionResult = () => {
    if (!executingTestCase || !activeRunId) return

    const runIndex = executionRuns.findIndex(run => run.id === activeRunId)
    if (runIndex === -1) return

    const updatedRuns = [...executionRuns]
    const run = updatedRuns[runIndex]

    // Update test case in the run
    const testCaseIndex = run.testCases.findIndex(tc => tc.id === executingTestCase.id)
    if (testCaseIndex !== -1) {
      run.testCases[testCaseIndex] = {
        ...run.testCases[testCaseIndex],
        testResult: executionData.status,
        remarks: executionData.notes
      }

      // Update progress
      const executed = run.testCases.filter(tc => tc.testResult && tc.testResult !== 'Not Executed').length
      const passed = run.testCases.filter(tc => tc.testResult === 'Pass').length
      const failed = run.testCases.filter(tc => tc.testResult === 'Fail').length
      const blocked = run.testCases.filter(tc => tc.testResult === 'Blocked').length
      const skipped = run.testCases.filter(tc => tc.testResult === 'Skip').length

      run.progress = {
        total: run.testCases.length,
        executed,
        passed,
        failed,
        blocked,
        skipped
      }

      run.updatedAt = new Date()

      // Update run status
      if (executed === run.testCases.length) {
        run.status = 'Completed'
      } else if (executed > 0) {
        run.status = 'In Progress'
      }
    }

    setExecutionRuns(updatedRuns)
    localStorage.setItem('testCaseWriter_executionRuns', JSON.stringify(updatedRuns))
    setShowExecutionPanel(false)
    setExecutingTestCase(null)

    // Reset execution data
    setExecutionData({
      status: 'Not Executed',
      tester: currentUser?.name || '',
      environment: 'Production',
      duration: '',
      notes: '',
      jiraTicket: ''
    })

    alert('✅ Execution result saved successfully!')
  }

  const getActiveRun = () => {
    return executionRuns.find(run => run.id === activeRunId)
  }

  const getActiveRunTestCases = () => {
    const activeRun = getActiveRun()
    return activeRun ? activeRun.testCases : []
  }

  // Removed mock data loading function for production

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
    { label: viewMode === 'execution' ? 'Test Management' : 'Test Library' }
  ]

  // Get display data based on view mode
  const displayTestCases = viewMode === 'execution' && activeRunId
    ? getActiveRunTestCases()
    : filteredTestCases

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
      
      // Generate filename with project name + timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) // YYYY-MM-DDTHH-mm-ss
      const projectName = selectedProjectFilter ? 
        (projects.find(p => p.id === selectedProjectFilter)?.name || 'Unknown-Project') : 
        'All-Projects'
      const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-') // Make filename safe
      
      await exportTestCases(testCases, { 
        format: format as 'csv' | 'json' | 'excel',
        filename: `${safeProjectName}_TestCases_${timestamp}`
      })
      
      alert(`✅ Successfully exported all ${testCases.length} test cases as ${format.toUpperCase()}!`)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClearStorage = async () => {
    if (confirm('Are you sure you want to clear all stored test cases? This action cannot be undone. (Projects will be preserved)')) {
      try {
        const { clearStoredTestCases } = await import('@/lib/test-case-storage')

        // Preserve current projects before clearing
        const currentProjects = [...projects]
        const currentProjectFilter = selectedProjectFilter

        clearStoredTestCases()

        // Refresh UI but preserve projects
        setTestCases([])
        setFilteredTestCases([])
        setSelectedIds([])
        setStorageStats({ sessions: 0, totalTestCases: 0, storageSize: '0 KB' })

        // Ensure projects are not lost
        setProjects(currentProjects)
        setSelectedProjectFilter(currentProjectFilter)

        alert('✅ All stored test cases have been cleared! Projects are preserved.')
      } catch (error) {
        console.error('Failed to clear storage:', error)
        alert('❌ Failed to clear stored test cases')
      }
    }
  }

  const actions = (
    <div className="flex items-center space-x-3">
      {/* View Mode Toggle */}
      <div className="flex items-center border rounded-lg">
        <Button
          variant={viewMode === 'library' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('library')}
          className="rounded-r-none border-r"
        >
          <Grid className="h-4 w-4 mr-2" />
          Library
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/library/execution'}
          className="rounded-l-none"
        >
          <Play className="h-4 w-4 mr-2" />
          Execution
        </Button>
      </div>

      {/* Execution Actions */}
      {viewMode === 'execution' && (
        <div className="flex items-center space-x-3">
          {/* Always visible: New Execution Run button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.href = '/execution'}
          >
            <Target className="h-4 w-4 mr-2" />
            New Execution Run
          </Button>

          {/* Create Run with selected test cases */}
          {selectedIds.length > 0 && (
            <Button variant="secondary" size="md" onClick={createExecutionRun}>
              <Target className="h-4 w-4 mr-2" />
              Create Run with Selected ({selectedIds.length})
            </Button>
          )}

          {/* Execution Run Selector */}
          {executionRuns.length > 0 && (
            <select
              value={activeRunId || ''}
              onChange={(e) => setActiveRunId(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[200px]"
            >
              <option value="">Select Execution Run</option>
              {executionRuns.map(run => (
                <option key={run.id} value={run.id}>
                  {run.name} ({run.progress.executed}/{run.progress.total})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Generate More button when coming from generate page */}
      {isFromGenerate && (
        <Button variant="primary" size="md" onClick={handleBackToGenerate} className="mr-4">
          <Zap className="h-4 w-4 mr-2" />
          Continue Generating
        </Button>
      )}

      {testCases.length > 0 && viewMode === 'library' && (
        <>
          <ReconcileDuplicatesButton
            projectId={selectedProjectFilter || undefined}
            onComplete={(result) => {
              // Refresh test cases after reconciliation
              const { getAllStoredTestCases, getStorageStats } = require('@/lib/test-case-storage')
              const updatedTestCases = getAllStoredTestCases()
              const updatedStats = getStorageStats()
              setTestCases(updatedTestCases)
              setStorageStats(updatedStats)
              setSelectedIds([]) // Clear selection after reconciliation
            }}
          />

          <Button variant="secondary" size="md" onClick={handleExportAll}>
            <Download className="h-4 w-4 mr-2" />
            Export All ({testCases.length})
          </Button>

          <Button variant="danger" size="sm" onClick={handleClearStorage}>
            Clear Test Cases
          </Button>
        </>
      )}

      {/* Only show generate button if NOT coming from generate page */}
      {!isFromGenerate && viewMode === 'library' && (
        <div className="flex space-x-3">
          <Button variant="primary" size="md" onClick={handleGenerateAI}>
            <Zap className="h-4 w-4 mr-2" />
            Generate Test Cases
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Test Cases
          </Button>
        </div>
      )}

      {viewMode === 'library' && (
        <Button variant="secondary" size="md" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Test Case
        </Button>
      )}
    </div>
  )

  const stats = {
    total: filteredTestCases.length,
    active: filteredTestCases.filter(tc => tc.testResult === 'Pass').length,
    draft: filteredTestCases.filter(tc => tc.testResult === 'Not Executed').length,
    review: filteredTestCases.filter(tc => tc.testResult === 'Fail').length
  }

  // Show loading state if data is still loading
  if (loading && testCases.length === 0) {
    return (
      <Layout 
        breadcrumbs={breadcrumbs}
        title="Test Case Library"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test cases...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      title={viewMode === 'execution' ? 'Test Case Management' : 'Test Case Library'}
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
                  <p className="text-2xl font-bold text-success">{stats.active}</p>
                </div>
                <div className="h-8 w-8 bg-success-light rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-success rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Review</p>
                  <p className="text-2xl font-bold text-info">{stats.review}</p>
                </div>
                <div className="h-8 w-8 bg-info-light rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-info rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Draft</p>
                  <p className="text-2xl font-bold text-neutral">{stats.draft}</p>
                </div>
                <div className="h-8 w-8 bg-neutral-light rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-neutral rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Execution Dashboard */}
        {viewMode === 'execution' && (
          <div className="space-y-6">
            {/* No Execution Runs Info */}
            {executionRuns.length === 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Start Managing Test Executions</h3>
                  <p className="text-blue-700 mb-4">
                    Create execution runs to track test case execution progress and results.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <Button
                      variant="primary"
                      onClick={() => window.location.href = '/execution'}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create New Execution Run
                    </Button>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    You can create empty runs first, then add test cases later, or select test cases below to create a run with them.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Active Run Status */}
            {activeRunId && getActiveRun() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-primary-600" />
                      <span>Active Execution Run</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Assigned to: {getActiveRun()?.assignedTester}
                      </span>
                      <Badge variant={
                        getActiveRun()?.status === 'Completed' ? 'success' :
                        getActiveRun()?.status === 'In Progress' ? 'warning' :
                        getActiveRun()?.status === 'Blocked' ? 'error' : 'secondary'
                      }>
                        {getActiveRun()?.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getActiveRun()?.progress.total}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {getActiveRun()?.progress.executed}
                      </div>
                      <div className="text-sm text-gray-500">Executed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {getActiveRun()?.progress.passed}
                      </div>
                      <div className="text-sm text-gray-500">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {getActiveRun()?.progress.failed}
                      </div>
                      <div className="text-sm text-gray-500">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {getActiveRun()?.progress.blocked}
                      </div>
                      <div className="text-sm text-gray-500">Blocked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-400">
                        {getActiveRun()?.progress.skipped}
                      </div>
                      <div className="text-sm text-gray-500">Skipped</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>
                        {getActiveRun()?.progress.executed}/{getActiveRun()?.progress.total}
                        ({Math.round((getActiveRun()?.progress.executed || 0) / (getActiveRun()?.progress.total || 1) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((getActiveRun()?.progress.executed || 0) / (getActiveRun()?.progress.total || 1) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execution Runs List */}
            {executionRuns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Execution Runs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {executionRuns.map(run => (
                      <div
                        key={run.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          activeRunId === run.id
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveRunId(run.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{run.name}</h4>
                            <p className="text-sm text-gray-500">{run.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>Assigned to: {run.assignedTester}</span>
                              <span>Updated: {run.updatedAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {run.progress.executed}/{run.progress.total}
                              </div>
                              <div className="text-xs text-gray-500">Progress</div>
                            </div>
                            <Badge variant={
                              run.status === 'Completed' ? 'success' :
                              run.status === 'In Progress' ? 'warning' :
                              run.status === 'Blocked' ? 'error' : 'secondary'
                            }>
                              {run.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Demo Data Loader */}

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
                    setSelectedProjectFilter(e.target.value)
                  }}
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
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Dashboard */}
        {showCoverage && activeDocId && (
          <CoverageDashboard
            docId={activeDocId}
            projectId={selectedProjectFilter || undefined}
            onGenerateMore={async (chunkId) => {
              console.log('🎯 Coverage - Generate More requested for chunk:', chunkId)
              // TODO: Implement single-chunk generation
              // For now, redirect to generate page
              window.location.href = '/generate'
            }}
          />
        )}

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
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleBulkEdit(selectedIds)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Bulk Edit
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(selectedIds)}
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
                
                {activeDocId && (
                  <Button 
                    variant={showCoverage ? "primary" : "ghost"} 
                    size="sm"
                    onClick={() => setShowCoverage(!showCoverage)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {showCoverage ? 'Hide Coverage' : 'Show Coverage'}
                  </Button>
                )}
                
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {groupBy === 'none' ? (
              <div className="relative">
                <DataGrid
                  data={displayTestCases}
                  onSelectionChange={setSelectedIds}
                  onEdit={handleEdit}
                  onView={handleView}
                  onDelete={viewMode === 'library' ? handleDelete : undefined}
                  onExport={handleExport}
                  onBulkEdit={handleBulkEdit}
                  onVersionHistory={handleOpenVersionHistory}
                  loading={loading}
                  projects={projectsLookup}
                  customActions={viewMode === 'execution' && activeRunId ? [
                    {
                      label: 'Execute',
                      icon: Play,
                      onClick: (testCase: TestCase) => executeTestCase(testCase),
                      condition: (testCase: TestCase) => testCase.testResult !== 'Pass'
                    }
                  ] : undefined}
                />
                {viewMode === 'execution' && !activeRunId && (
                  <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Execution Run</h3>
                      <p className="text-gray-500 mb-4">
                        Select test cases and create an execution run to start testing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
                      onVersionHistory={handleOpenVersionHistory}
                      loading={false}
                      projects={projectsLookup}
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
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm mb-4">No test cases generated yet.</p>
                      <Button variant="primary" onClick={() => window.location.href = '/generate?step=upload'}>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Your First Test Cases
                      </Button>
                    </div>
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
                            priority === 'critical' ? 'bg-danger' :
                            priority === 'high' ? 'bg-warning' :
                            priority === 'medium' ? 'bg-info' :
                            'bg-neutral'
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

      {/* Version History Modal */}
      {selectedVersionTestCase && (
        <VersionHistoryModal
          isOpen={showVersionHistoryModal}
          onClose={() => {
            setShowVersionHistoryModal(false)
            setSelectedVersionTestCase(null)
          }}
          testCase={selectedVersionTestCase}
        />
      )}

      {/* Manual Test Case Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create New Test Case</h2>
                <button
                  onClick={resetCreateForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Case Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTestCase.title}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., User Login with Valid Credentials"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newTestCase.description}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      placeholder="Brief description of what this test case verifies"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newTestCase.category}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Functional">Functional</option>
                        <option value="UI/UX">UI/UX</option>
                        <option value="API">API</option>
                        <option value="Security">Security</option>
                        <option value="Performance">Performance</option>
                        <option value="Integration">Integration</option>
                        <option value="Regression">Regression</option>
                        <option value="Smoke">Smoke</option>
                        <option value="Authentication">Authentication</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={newTestCase.priority}
                        onChange={(e) => setNewTestCase(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module/Feature</label>
                    <input
                      type="text"
                      value={newTestCase.module}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, module: e.target.value }))}
                      placeholder="e.g., User Authentication, Shopping Cart"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complexity</label>
                    <select
                      value={newTestCase.complexity}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, complexity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Test Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Test Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Steps <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newTestCase.testSteps}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, testSteps: e.target.value }))}
                      rows={4}
                      placeholder="1. Navigate to login page&#10;2. Enter valid username&#10;3. Enter valid password&#10;4. Click login button"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Result <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newTestCase.expectedResult}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, expectedResult: e.target.value }))}
                      rows={3}
                      placeholder="User should be successfully logged in and redirected to dashboard"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Data</label>
                    <textarea
                      value={newTestCase.testData}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, testData: e.target.value }))}
                      rows={2}
                      placeholder="Username: testuser@example.com&#10;Password: ValidPass123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <input
                      type="text"
                      value={newTestCase.requirements}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder="REQ_AUTH_001, REQ_LOGIN_002 (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input
                      type="text"
                      value={newTestCase.tags}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="login, authentication, smoke (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={resetCreateForm}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTestCase}
                disabled={!newTestCase.title || !newTestCase.description || !newTestCase.testSteps || !newTestCase.expectedResult}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Test Case
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Execution Panel */}
      {showExecutionPanel && executingTestCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Play className="h-5 w-5 text-primary-600" />
                  <span>Execute Test Case</span>
                </h2>
                <button
                  onClick={() => setShowExecutionPanel(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Test Case Details */}
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Test Case Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">ID:</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                          {executingTestCase.id}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Title:</label>
                        <p className="text-sm text-gray-900">{executingTestCase.testCase}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Steps:</label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                          {executingTestCase.testSteps?.map(step => `${step.step}. ${step.description}`).join('\n') || 'No test steps defined'}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Expected Result:</label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                          {executingTestCase.data?.expectedResult || 'No expected result defined'}
                        </div>
                      </div>
                      {executingTestCase.testData && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Test Data:</label>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                            {executingTestCase.testData}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Execution Form */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Execution Results</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Test Result <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={executionData.status}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            status: e.target.value as any
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Not Executed">Not Executed</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Skip">Skip</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tester</label>
                        <select
                          value={executionData.tester}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            tester: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                        >
                          {AVAILABLE_USERS.map(user => (
                            <option key={user.id} value={user.name}>
                              {user.name} ({user.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                        <select
                          value={executionData.environment}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            environment: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Development">Development</option>
                          <option value="Staging">Staging</option>
                          <option value="Production">Production</option>
                          <option value="UAT">UAT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                        <Input
                          type="text"
                          placeholder="e.g., 5 minutes"
                          value={executionData.duration}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            duration: e.target.value
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket (optional)</label>
                        <Input
                          type="text"
                          placeholder="e.g., PROJ-123"
                          value={executionData.jiraTicket}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            jiraTicket: e.target.value
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <Textarea
                          rows={4}
                          placeholder="Add execution notes, observations, or issues..."
                          value={executionData.notes}
                          onChange={(e) => setExecutionData(prev => ({
                            ...prev,
                            notes: e.target.value
                          }))}
                        />
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button
                          variant="secondary"
                          onClick={() => setShowExecutionPanel(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={saveExecutionResult}
                          className="flex-1"
                          disabled={!executionData.status || executionData.status === 'Not Executed'}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Result
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Test Cases Modal */}
      {showImportModal && (
        <TestCaseImporter
          onImport={handleImportTestCases}
          onClose={() => setShowImportModal(false)}
          defaultProject={selectedProjectFilter}
        />
      )}
    </Layout>
  )
}