'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
// import { getAllStoredTestCases } from '@/lib/test-case-storage'
import { RunsService, CreateRunRequest } from '@/lib/runs-service'
import { TestCase } from '@/types/index'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Search,
  Filter,
  Users,
  Monitor,
  Settings,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  Target,
  Zap,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface RunCreateWizardProps {
  isOpen: boolean
  onClose: () => void
  onRunCreated: (runId: string) => void
  selectedProjectId?: string
}

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: WizardStep[] = [
  {
    id: 1,
    title: 'Scope',
    description: 'Select test cases',
    icon: <Target className="w-4 h-4" />
  },
  {
    id: 2,
    title: 'People & Environment',
    description: 'Assign testers and environments',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 3,
    title: 'Options',
    description: 'Final settings and create',
    icon: <Settings className="w-4 h-4" />
  }
]

export function RunCreateWizard({
  isOpen,
  onClose,
  onRunCreated,
  selectedProjectId
}: RunCreateWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  // Step 1: Test Case Selection
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [availableProjects, setAvailableProjects] = useState<string[]>([])

  // Step 2: People & Environment
  const [assignees, setAssignees] = useState<string[]>([])
  const [environments, setEnvironments] = useState<string[]>([])
  const [newAssignee, setNewAssignee] = useState('')
  const [newEnvironment, setNewEnvironment] = useState('')

  // Step 3: Options
  const [runName, setRunName] = useState('')
  const [build, setBuild] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Common assignees and environments
  const commonAssignees = [
    'John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez', 'David Wilson'
  ]

  const commonEnvironments = [
    'SIT',
    'UAT',
    'Production'
  ]

  // Load test cases when wizard opens
  useEffect(() => {
    if (isOpen) {
      loadTestCases()
      // Reset wizard state
      setCurrentStep(1)
      setSelectedTestCases(new Set())
      setSearchTerm('')
      setFilterStatus('all')
      setFilterPriority('all')
      setFilterProject('all')
      setAssignees([])
      setEnvironments(['SIT']) // Default to SIT environment
      setRunName('')
      setBuild('')
      setDueDate('')
      setNotes('')
    }
  }, [isOpen])

  // Filter test cases
  useEffect(() => {
    filterTestCases()
  }, [testCases, searchTerm, filterStatus, filterPriority, filterProject])

  const loadTestCases = async () => {
    try {
      console.log('🔄 Loading test cases from API...')
      const response = await fetch('/api/test-cases')
      if (!response.ok) {
        throw new Error('Failed to fetch test cases')
      }

      const allTestCases = await response.json()
      console.log('📊 Raw API response:', allTestCases.length, 'test cases')
      let filtered = allTestCases

      // No automatic project filtering - users can filter manually using the dropdown
      console.log('📊 Loading all test cases - users can filter by project using the dropdown')

      // Extract available projects from test cases
      const projects = new Set<string>()
      allTestCases.forEach((tc: any) => {
        const category = tc.category || 'Uncategorized'
        projects.add(category)
      })
      setAvailableProjects(Array.from(projects).sort())
      console.log('📊 Available projects/categories:', Array.from(projects))

      // Transform the API data structure to match the expected TestCase format
      const transformedTestCases = filtered.map((tc: any) => ({
        id: tc.id,
        testCase: tc.title,
        status: 'active', // Default status for library test cases
        priority: tc.priority?.toLowerCase() || 'medium',
        tags: tc.tags || [],
        projectId: tc.projectId || 'default',
        data: {
          testCase: tc.title,
          module: tc.category,
          description: tc.description,
          steps: tc.steps || [],
          expectedResult: tc.expectedResult
        },
        createdAt: new Date(tc.createdDate || new Date()),
        updatedAt: new Date(tc.lastModified || new Date())
      }))

      console.log('✅ Transformed test cases:', transformedTestCases.length)
      console.log('📋 Sample test case:', transformedTestCases[0])
      setTestCases(transformedTestCases)
    } catch (error) {
      console.error('❌ Failed to load test cases:', error)
    }
  }

  const filterTestCases = () => {
    let filtered = testCases
    console.log('🔍 Filtering test cases. Input:', testCases.length, 'cases')

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      console.log('🔍 Applying search filter:', searchTerm)
      filtered = filtered.filter(tc =>
        tc.id.toLowerCase().includes(searchLower) ||
        (tc.testCase && tc.testCase.toLowerCase().includes(searchLower)) ||
        (tc.data?.testCase && tc.data.testCase.toLowerCase().includes(searchLower)) ||
        (tc.data?.module && tc.data.module.toLowerCase().includes(searchLower)) ||
        tc.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
      console.log('🔍 After search filter:', filtered.length, 'cases')
    }

    // Status filter
    if (filterStatus !== 'all') {
      console.log('🔍 Applying status filter:', filterStatus)
      const beforeLength = filtered.length
      filtered = filtered.filter(tc => tc.status === filterStatus)
      console.log('🔍 After status filter:', filtered.length, 'cases (was', beforeLength, ')')
    }

    // Priority filter
    if (filterPriority !== 'all') {
      console.log('🔍 Applying priority filter:', filterPriority)
      const beforeLength = filtered.length
      filtered = filtered.filter(tc => tc.priority === filterPriority)
      console.log('🔍 After priority filter:', filtered.length, 'cases (was', beforeLength, ')')
    }

    // Project filter
    if (filterProject !== 'all') {
      console.log('🔍 Applying project filter:', filterProject)
      const beforeLength = filtered.length
      filtered = filtered.filter(tc => (tc.data?.module || 'Uncategorized') === filterProject)
      console.log('🔍 After project filter:', filtered.length, 'cases (was', beforeLength, ')')
    }

    console.log('✅ Final filtered result:', filtered.length, 'cases')
    setFilteredTestCases(filtered)
  }

  const handleTestCaseToggle = (testCaseId: string) => {
    const newSelection = new Set(selectedTestCases)
    if (newSelection.has(testCaseId)) {
      newSelection.delete(testCaseId)
    } else {
      newSelection.add(testCaseId)
    }
    setSelectedTestCases(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedTestCases.size === filteredTestCases.length) {
      setSelectedTestCases(new Set())
    } else {
      setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.id)))
    }
  }

  const addAssignee = (assignee: string) => {
    if (assignee && !assignees.includes(assignee)) {
      setAssignees([...assignees, assignee])
      setNewAssignee('')
    }
  }

  const removeAssignee = (assignee: string) => {
    setAssignees(assignees.filter(a => a !== assignee))
  }

  const addEnvironment = (environment: string) => {
    if (environment && !environments.includes(environment)) {
      setEnvironments([...environments, environment])
      setNewEnvironment('')
    }
  }

  const removeEnvironment = (environment: string) => {
    setEnvironments(environments.filter(e => e !== environment))
  }

  const canProceedFromStep1 = selectedTestCases.size > 0
  const canProceedFromStep2 = true // Optional fields
  const canCreateRun = runName.trim().length > 0

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateRun = async () => {
    if (!canCreateRun) return

    setIsCreating(true)
    try {
      const createRequest: CreateRunRequest = {
        name: runName,
        projectId: selectedProjectId || 'default',
        selectedTestCaseIds: Array.from(selectedTestCases),
        assignees,
        environments,
        build: build || undefined,
        dueAt: dueDate || undefined,
        notes: notes || undefined
      }

      const result = await RunsService.createRun(createRequest)
      onRunCreated(result.runId)
      onClose()
    } catch (error) {
      console.error('Failed to create run:', error)
      alert(error instanceof Error ? error.message : 'Failed to create run')
    } finally {
      setIsCreating(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search test cases by ID, title, module, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {availableProjects.map(project => (
                    <option key={project} value={project}>{project}</option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredTestCases.length === 0}
                >
                  {selectedTestCases.size === filteredTestCases.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                {filteredTestCases.length} test cases found • {selectedTestCases.size} selected
              </div>
            </div>

            {/* Test Cases List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredTestCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No test cases found</p>
                </div>
              ) : (
                filteredTestCases.map((testCase) => (
                  <Card
                    key={testCase.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedTestCases.has(testCase.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTestCaseToggle(testCase.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {selectedTestCases.has(testCase.id) ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-medium text-blue-600">
                              {testCase.id}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {testCase.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {testCase.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {testCase.testCase || testCase.data?.testCase || 'Untitled Test Case'}
                          </p>
                          {testCase.data?.module && (
                            <p className="text-xs text-gray-600">
                              Category: {testCase.data.module}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Assignees */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Assignees (Optional)</h4>

              {/* Common Assignees */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Quick Select:</p>
                <div className="flex flex-wrap gap-2">
                  {commonAssignees.map((assignee) => (
                    <Button
                      key={assignee}
                      variant={assignees.includes(assignee) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        if (assignees.includes(assignee)) {
                          removeAssignee(assignee)
                        } else {
                          addAssignee(assignee)
                        }
                      }}
                      className="text-xs"
                    >
                      {assignee}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Assignee */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add custom assignee"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addAssignee(newAssignee)
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => addAssignee(newAssignee)}
                  disabled={!newAssignee.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Selected Assignees */}
              {assignees.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {assignees.map((assignee) => (
                      <Badge
                        key={assignee}
                        variant="primary"
                        className="flex items-center gap-1"
                      >
                        {assignee}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeAssignee(assignee)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Environments */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Test Environments (Optional)</h4>

              {/* Common Environments */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Quick Select:</p>
                <div className="flex gap-2">
                  {commonEnvironments.map((env) => (
                    <Button
                      key={env}
                      variant={environments.includes(env) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        if (environments.includes(env)) {
                          removeEnvironment(env)
                        } else {
                          addEnvironment(env)
                        }
                      }}
                      className="text-xs"
                    >
                      {env}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Environment */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add custom environment"
                  value={newEnvironment}
                  onChange={(e) => setNewEnvironment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addEnvironment(newEnvironment)
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => addEnvironment(newEnvironment)}
                  disabled={!newEnvironment.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Selected Environments */}
              {environments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Selected:</p>
                  <div className="space-y-2">
                    {environments.map((env) => (
                      <Badge
                        key={env}
                        variant="primary"
                        className="flex items-center justify-between p-2"
                      >
                        <span>{env}</span>
                        <X
                          className="w-3 h-3 cursor-pointer ml-2"
                          onClick={() => removeEnvironment(env)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Run Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Run Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Sprint 24.3 Regression Test"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                className={!runName.trim() ? 'border-red-300' : ''}
              />
              {!runName.trim() && (
                <p className="text-xs text-red-600 mt-1">Run name is required</p>
              )}
            </div>

            {/* Build */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Build/Version (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., v2.4.1, build-1234"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <Textarea
                placeholder="Additional notes about this test run..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Run Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test Cases:</span>
                  <span className="font-medium">{selectedTestCases.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Assignees:</span>
                  <span className="font-medium">{assignees.length || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environments:</span>
                  <span className="font-medium">{environments.length || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium">{selectedProjectId || 'Default'}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Create Test Run</h2>
                <p className="text-blue-100">Set up a new execution run</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="mx-8 h-px bg-gray-300 flex-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={currentStep === 1 ? onClose : handleBack}
              >
                {currentStep === 1 ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </>
                )}
              </Button>

              {currentStep < 3 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !canProceedFromStep1) ||
                    (currentStep === 2 && !canProceedFromStep2)
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleCreateRun}
                  disabled={!canCreateRun || isCreating}
                  icon={isCreating ? undefined : Play}
                >
                  {isCreating ? 'Creating...' : 'Create Run'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}