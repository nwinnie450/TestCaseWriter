'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { DataGrid } from '@/components/library/DataGrid'
import { ReconcileDuplicatesButton } from '@/components/library/ReconcileDuplicatesButton'
import { CoverageDashboard } from '@/components/coverage/CoverageDashboard'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
  RefreshCw,
  Trash2,
  Play,
  Upload
} from 'lucide-react'



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
    steps: [{ step: '' }],
    testData: '',
    module: '',
    feature: '',
    requirements: '',
    tags: '',
    enhancement: '',
    ticketId: '',
    projectId: '',
  })

  // Helper functions for step management
  const addStep = () => {
    setNewTestCase(prev => ({
      ...prev,
      steps: [...prev.steps, { step: '' }]
    }))
  }

  const removeStep = (index: number) => {
    if (newTestCase.steps.length > 1) {
      setNewTestCase(prev => ({
        ...prev,
        steps: prev.steps.filter((_, i) => i !== index)
      }))
    }
  }

  const updateStep = (index: number, field: 'step', value: string) => {
    setNewTestCase(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }))
  }

  // Get current user (memoized to prevent infinite re-renders)
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser())

  // Function to refresh test cases
  const refreshTestCases = async () => {
    setLoading(true)
    try {
      console.log('🔄 Refreshing test cases from MongoDB API...')

      // Use the existing loadTestCases function which already handles API fallback to localStorage
      await loadTestCases()

      console.log('✅ Successfully refreshed test cases')
    } catch (error) {
      console.error('❌ Failed to refresh test cases:', error)
    } finally {
      setLoading(false)
    }
  }

  // Memoize projects object to prevent DataGrid re-renders
  const projectsLookup = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = project.name
      return acc
    }, {} as Record<string, string>)
  }, [projects])

  // Initialize current user
  useEffect(() => {
    const user = AuthService.getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  // Define loadTestCases function that can be reused
  const loadTestCases = async () => {
    try {
      console.log('📚 Loading test cases from MongoDB API (primary)...')

      // Try MongoDB API first
      const response = await fetch('/api/test-cases')
      if (response.ok) {
        const apiResponse = await response.json()
        const apiTestCases = apiResponse.testCases || []

        setTestCases(apiTestCases)
        setStorageStats({
          sessions: 1,
          totalTestCases: apiTestCases.length,
          storageSize: `${Math.round(JSON.stringify(apiTestCases).length / 1024)} KB`
        })
        setLoading(false)
        console.log('✅ Successfully loaded test cases from MongoDB API:', apiTestCases.length)
        return
      }

      // Fallback to localStorage if no API data
      console.log('⚠️ No MongoDB data, trying localStorage...')
      const { getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')
      const storedTestCases = getAllStoredTestCases()
      const stats = getStorageStats()

      if (storedTestCases.length > 0) {
        setTestCases(storedTestCases)
        setStorageStats(stats)
        setLoading(false)
        console.log('✅ Successfully loaded test cases from localStorage fallback:', storedTestCases.length)
        return
      }

      // No data found anywhere
      console.log('⚠️ No test cases found in MongoDB or localStorage')
      setTestCases([])
      setStorageStats({ sessions: 0, totalTestCases: 0, storageSize: '0 KB' })
      setLoading(false)

    } catch (error) {
      console.error('❌ Failed to load test cases:', error)
      setLoading(false)
    }
  }

  // Load test cases on component mount
  useEffect(() => {
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

  // Load projects from MongoDB API (with localStorage fallback)
  useEffect(() => {
    const loadProjects = async () => {
      console.log('📚 Loading projects...')

      try {
        // Direct API call to test
        console.log('🔍 Making direct API call...')
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 Direct API response:', data)

          if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
            const activeProjects = data.projects.filter((p: any) => p.status === 'active')
            console.log('🔍 Active projects from direct call:', activeProjects)

            if (activeProjects.length > 0) {
              const mappedProjects = activeProjects.map(p => ({ id: p.id, name: p.name }))
              console.log('🔍 Setting projects to:', mappedProjects)
              setProjects(mappedProjects)
              console.log('✅ Successfully loaded projects directly from API:', activeProjects.length)
              return
            }
          }
        }

        // Fallback projects
        console.log('⚠️ Using fallback projects')
        setProjects([
          { id: 'litellm', name: 'LiteLLM' },
          { id: 'default', name: 'Default Project' }
        ])

      } catch (error) {
        console.error('❌ Error loading projects:', error)
        setProjects([
          { id: 'litellm', name: 'LiteLLM' },
          { id: 'default', name: 'Default Project' }
        ])
      }
    }

    loadProjects()
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
      console.log('🔄 Saving test case updates:', updatedTestCase.id)

      // Prepare update payload for API
      const updateData = {
        id: updatedTestCase.id,
        title: updatedTestCase.data?.title || updatedTestCase.testCase,
        description: updatedTestCase.data?.description || '',
        steps: updatedTestCase.testSteps || updatedTestCase.steps || [],
        priority: updatedTestCase.priority || 'medium',
        type: updatedTestCase.type || 'manual',
        tags: updatedTestCase.tags || [],
        projectId: updatedTestCase.projectId || null,
        // Include additional fields
        module: updatedTestCase.module || updatedTestCase.data?.module,
        feature: updatedTestCase.feature || updatedTestCase.data?.feature,
        enhancement: updatedTestCase.enhancement,
        ticketId: updatedTestCase.ticketId,
        qa: updatedTestCase.qa,
        remarks: updatedTestCase.remarks
      }

      // Update via API
      const response = await fetch('/api/test-cases', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API update successful:', result)

        // Refresh test cases from API
        await loadTestCases()

        alert(`✅ Test case "${updatedTestCase.data?.title || updatedTestCase.testCase}" has been updated successfully!`)
      } else {
        const errorData = await response.json()
        console.error('❌ API update failed:', errorData)
        alert(`❌ Failed to save test case: ${errorData.error || 'Unknown error'}`)
        return
      }

      // Close the edit modal
      setShowEditModal(false)
      setEditingTestCase(null)

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

    // Check if any test cases are in active execution runs
    try {
      const response = await fetch('/api/test-cases/check-run-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testCaseIds }),
      })

      if (response.ok) {
        const runUsageInfo = await response.json()
        const blockedIds: string[] = []
        const warningIds: string[] = []
        const runDetails: { [testCaseId: string]: any[] } = {}

        testCaseIds.forEach(id => {
          const runsInUse = runUsageInfo.testCasesInRuns[id] || []
          const canDelete = runUsageInfo.canDelete[id]

          if (runsInUse.length > 0) {
            runDetails[id] = runsInUse
            if (!canDelete) {
              blockedIds.push(id)
            } else {
              warningIds.push(id)
            }
          }
        })

        // Block deletion if any test cases are in active runs
        if (blockedIds.length > 0) {
          const blockedTestCases = testCases.filter(tc => blockedIds.includes(tc.id))
          const testCaseNames = blockedTestCases.map(tc => `"${tc.data?.title || tc.testCase || tc.id}"`).join(', ')
          alert(
            `🚫 Cannot Delete Test Cases\n\nThe following test case(s) are part of active execution runs and cannot be deleted:\n\n${testCaseNames}\n\nPlease complete or cancel the execution runs first, then try again.`
          )
          return
        }

        // Warn about test cases in draft runs
        if (warningIds.length > 0) {
          const warningTestCases = testCases.filter(tc => warningIds.includes(tc.id))
          const runsList = warningTestCases.map(tc => {
            const runs = runDetails[tc.id]
            const runNames = runs.map(run => `"${run.runName}" (${run.runStatus})`).join(', ')
            return `• ${tc.data?.title || tc.testCase || tc.id}: ${runNames}`
          }).join('\n')

          const shouldProceed = confirm(
            `⚠️ Warning: Some test cases are part of execution runs:\n\n${runsList}\n\nDeleting these test cases will remove them from their respective runs. Do you want to proceed?`
          )

          if (!shouldProceed) {
            return
          }
        }
      }
    } catch (error) {
      console.error('Failed to check run usage:', error)
      // Continue with deletion if check fails (non-critical)
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
        console.log('🗑️ Deleting test cases with IDs:', testCaseIds)

        // Try API delete first (production)
        const response = await fetch('/api/test-cases', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: testCaseIds })
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ API delete successful:', result)

          // Refresh from API
          const refreshResponse = await fetch('/api/test-cases')
          if (refreshResponse.ok) {
            const updatedTestCases = await refreshResponse.json()
            setTestCases(updatedTestCases)
            setStorageStats({
              sessions: 1,
              totalTestCases: updatedTestCases.length,
              storageSize: `${Math.round(JSON.stringify(updatedTestCases).length / 1024)} KB`
            })
          }
        } else {
          // Fallback to localStorage if API fails
          console.log('⚠️ API delete failed, falling back to localStorage...')
          const { deleteTestCasesByIds, getAllStoredTestCases, getStorageStats } = await import('@/lib/test-case-storage')

          deleteTestCasesByIds(testCaseIds)

          const updatedTestCases = getAllStoredTestCases()
          const updatedStats = getStorageStats()

          setTestCases(updatedTestCases)
          setStorageStats(updatedStats)
        }

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
      console.log('🔄 Bulk updating test cases via MongoDB API:', selectedIds, updates)

      // Process updates for each selected test case
      const updatePromises = selectedIds.map(async (testCaseId) => {
        const testCase = testCases.find(tc => tc.id === testCaseId)
        if (!testCase) return null

        let finalUpdates = { ...updates }

        // Handle special tag actions
        if ((updates as any)._tagAction && updates.tags) {
          const existingTags = testCase.tags || []
          const newTags = updates.tags as string[]

          switch ((updates as any)._tagAction) {
            case 'add':
              finalUpdates.tags = [...existingTags, ...newTags].filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index)
              break
            case 'replace':
              finalUpdates.tags = newTags
              break
            case 'remove':
              finalUpdates.tags = existingTags.filter((tag: string) => !newTags.includes(tag))
              break
          }

          // Remove the special action field
          delete (finalUpdates as any)._tagAction
        }

        // Prepare update payload
        const updateData = {
          ...finalUpdates,
          id: testCaseId,
          title: testCase.data?.title || testCase.testCase,
          description: testCase.data?.description || testCase.qa || '',
          steps: testCase.testSteps || testCase.steps || []
        }

        // Send update to API
        const response = await fetch('/api/test-cases', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to update ${testCaseId}: ${errorData.error}`)
        }

        return response.json()
      })

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises)
      const successCount = results.filter(r => r !== null).length

      // Refresh the UI data from API
      await loadTestCases()

      setShowBulkEditModal(false)
      setSelectedIds([]) // Clear selection

      alert(`✅ Successfully updated ${successCount} test case${successCount !== 1 ? 's' : ''}!`)

    } catch (error) {
      console.error('Failed to bulk update test cases:', error)
      alert(`❌ Failed to update test cases: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.log('🔄 Importing test cases to MongoDB API...')

      // If a project is selected (either from import options or filter), assign it to all imported test cases
      const projectToAssign = options.defaultProject || selectedProjectFilter
      const testCasesToSave = projectToAssign
        ? importedTestCases.map(tc => ({ ...tc, projectId: projectToAssign }))
        : importedTestCases

      console.log('🔍 Project assignment:', {
        defaultProject: options.defaultProject,
        selectedProjectFilter,
        projectToAssign,
        testCasesCount: testCasesToSave.length
      })

      // Save directly to MongoDB using the API
      const response = await fetch('/api/test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCasesToSave)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Successfully imported test cases to MongoDB:', result.count)

        setShowImportModal(false)

        // Refresh the page data from API
        await loadTestCases()

        alert(`Successfully imported ${result.count} test cases!`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import test cases')
      }

    } catch (error) {
      console.error('❌ Error importing test cases:', error)
      alert(`Failed to import test cases: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Manual test case creation
  const handleCreateTestCase = async () => {
    try {
      // Save directly to MongoDB only (skip localStorage)
      try {
        // Ensure we have valid steps data
        const validSteps = newTestCase.steps.filter(s => s.step.trim())
        if (validSteps.length === 0) {
          validSteps.push({ step: 'Default step' })
        }

        // Generate running number for test case ID
        const modulePrefix = (newTestCase.module || 'General').replace(/\s+/g, '').toLowerCase()
        const runningNumber = Date.now().toString().slice(-6) // Use last 6 digits of timestamp as running number
        const testCaseId = `tc_${modulePrefix}_${runningNumber}`

        const apiPayload = {
          id: testCaseId,
          title: newTestCase.title?.trim() || 'Untitled Test Case',
          description: newTestCase.description?.trim() || '',
          steps: validSteps.map((stepData, index) => ({
            id: `step_${index + 1}`,
            step: stepData.step?.trim() || `Step ${index + 1}`,
            expected: ''
          })),
          priority: (newTestCase.priority || 'medium').toLowerCase(),
          type: 'manual',
          tags: newTestCase.tags ? newTestCase.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          projectId: newTestCase.projectId || selectedProjectFilter || null,
          enhancement: newTestCase.enhancement || '',
          ticketId: newTestCase.ticketId || '',
          testData: newTestCase.testData || '',
          module: newTestCase.module || '',
          feature: newTestCase.feature || '',
          requirements: newTestCase.requirements || ''
        }

        console.log('📤 Sending API payload:', JSON.stringify(apiPayload, null, 2))

        const response = await fetch('/api/test-cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiPayload)
        })

        if (response.ok) {
          console.log('✅ Test case saved to MongoDB successfully')

          // Refresh test cases from MongoDB API
          await loadTestCases()

          setShowCreateModal(false)
          alert(`✅ Test case "${newTestCase.title}" created successfully!`)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save test case')
        }
      } catch (error) {
        console.error('❌ Failed to save test case to MongoDB:', error)
        alert(`❌ Failed to create test case: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return
      }

      // Reset form
      setNewTestCase({
        title: '',
        description: '',
        category: 'Functional',
        priority: 'Medium',
        steps: [{ step: '' }],
        testData: '',
        module: '',
        feature: '',
        requirements: '',
        tags: '',
        enhancement: '',
        ticketId: '',
        projectId: '',
          })

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
      steps: [{ step: '' }],
      testData: '',
      module: '',
      feature: '',
      requirements: '',
      tags: '',
      enhancement: '',
      ticketId: '',
      projectId: '',
      })
    setShowCreateModal(false)
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

  const memoizedFilteredTestCases = useMemo(() => {
    return Array.isArray(filteredTestCases) ? filteredTestCases : []
  }, [filteredTestCases])

  const groupedTestCases = useMemo(() => {
    return groupTestCases(memoizedFilteredTestCases, groupBy)
  }, [memoizedFilteredTestCases, groupBy])


  const breadcrumbs = [
    { label: 'Test Library' }
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
        // Preserve current projects before clearing
        const currentProjects = [...projects]
        const currentProjectFilter = selectedProjectFilter

        // Clear both API (MongoDB) and localStorage
        const response = await fetch('/api/test-cases/clear', {
          method: 'DELETE'
        })

        if (response.ok) {
          const result = await response.json()
          console.log('✅ API clear successful:', result)
        } else {
          console.log('⚠️ API clear failed')
        }

        // Always clear localStorage
        const { clearStoredTestCases } = await import('@/lib/test-case-storage')
        clearStoredTestCases()
        console.log('✅ localStorage cleared')

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
      {/* Execute button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => window.location.href = '/execution'}
      >
        <Play className="h-4 w-4 mr-2" />
        Execute Tests
      </Button>

      {/* Generate More button when coming from generate page */}
      {isFromGenerate && (
        <Button variant="primary" size="md" onClick={handleBackToGenerate} className="mr-4">
          <Zap className="h-4 w-4 mr-2" />
          Continue Generating
        </Button>
      )}

      {testCases.length > 0 && (
        <>
          <ReconcileDuplicatesButton
            projectId={selectedProjectFilter || undefined}
            onComplete={async (result) => {
              // Refresh test cases after reconciliation from MongoDB API
              await loadTestCases()
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
      {!isFromGenerate && (
        <div className="flex space-x-3">
          <Button variant="primary" size="md" onClick={handleGenerateAI}>
            <Zap className="h-4 w-4 mr-2" />
            Generate Test Cases
          </Button>
          <Button variant="secondary" size="md" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Test Cases
          </Button>
          <Button variant="secondary" size="md" onClick={refreshTestCases} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      )}

      <Button variant="secondary" size="md" onClick={() => setShowCreateModal(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Test Case
      </Button>
    </div>
  )

  const stats = useMemo(() => ({
    total: memoizedFilteredTestCases.length,
    active: memoizedFilteredTestCases.filter(tc => tc.testResult === 'Pass').length,
    draft: memoizedFilteredTestCases.filter(tc => tc.testResult === 'Not Executed').length,
    review: memoizedFilteredTestCases.filter(tc => tc.testResult === 'Fail').length
  }), [memoizedFilteredTestCases])

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


        {/* Demo Data Loader */}


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
                  data={memoizedFilteredTestCases}
                  onSelectionChange={setSelectedIds}
                  onEdit={handleEdit}
                  onView={handleView}
                  onDelete={handleDelete}
                  onExport={handleExport}
                  onBulkEdit={handleBulkEdit}
                  onVersionHistory={handleOpenVersionHistory}
                  loading={loading}
                  projects={projectsLookup}
                  customActions={undefined}
                />
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
                  const count = memoizedFilteredTestCases.filter(tc => tc.module?.toLowerCase().includes(priority)).length
                  const percentage = memoizedFilteredTestCases.length > 0 ? Math.round((count / memoizedFilteredTestCases.length) * 100) : 0
                  
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
        projects={projects}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedTestCases={memoizedFilteredTestCases.filter(tc => selectedIds.includes(tc.id))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select
                      value={newTestCase.projectId}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                    <input
                      type="text"
                      value={newTestCase.module}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, module: e.target.value }))}
                      placeholder="e.g., User Management, Payment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Feature</label>
                    <input
                      type="text"
                      value={newTestCase.feature}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, feature: e.target.value }))}
                      placeholder="e.g., Login, Checkout Process"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                </div>

                {/* Test Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Test Details</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Test Data</label>
                    <textarea
                      value={newTestCase.testData}
                      onChange={(e) => setNewTestCase(prev => ({ ...prev, testData: e.target.value }))}
                      rows={2}
                      placeholder="Username: testuser@example.com&#10;Password: ValidPass123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Test Steps <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addStep}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                      >
                        <span>+</span> Add Step
                      </button>
                    </div>

                    {newTestCase.steps.map((stepData, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Step {index + 1}</h4>
                          {newTestCase.steps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Action/Description</label>
                          <textarea
                            value={stepData.step}
                            onChange={(e) => updateStep(index, 'step', e.target.value)}
                            rows={3}
                            placeholder="Describe what action to perform (e.g., Navigate to login page)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    ))}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket</label>
                    <input
                      type="text"
                      value={newTestCase.enhancement || newTestCase.ticketId}
                      onChange={(e) => {
                        // Store in both fields for backward compatibility
                        setNewTestCase(prev => ({
                          ...prev,
                          enhancement: e.target.value,
                          ticketId: e.target.value
                        }))
                      }}
                      placeholder="e.g., JIRA-1234, Enhancement request, Feature story"
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
                disabled={!newTestCase.title || !newTestCase.description || !newTestCase.steps.some(step => step.step.trim())}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Test Case
              </Button>
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