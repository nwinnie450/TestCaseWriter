'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { RunsService, RunCase, RunStep } from '@/lib/runs-service'
import { EvidencePanel } from '@/components/execution/EvidencePanel'
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Timer,
  FileText,
  User,
  Calendar,
  Target,
  Zap,
  SkipForward,
  Square,
  RotateCcw,
  Save,
  Keyboard
} from 'lucide-react'

interface FocusedRunnerProps {}

interface UndoAction {
  type: 'case_status' | 'step_result' | 'case_notes'
  runCaseId?: string
  runStepId?: string
  previousValue: any
  newValue: any
  timestamp: number
}

export default function FocusedRunner({}: FocusedRunnerProps) {
  const params = useParams()
  const router = useRouter()
  const runId = params.runId as string

  // Data state
  const [run, setRun] = useState<any>(null)
  const [runCases, setRunCases] = useState<RunCase[]>([])
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0)
  const [currentCase, setCurrentCase] = useState<RunCase | null>(null)
  const [loading, setLoading] = useState(true)

  // UI state
  const [sidebarFilter, setSidebarFilter] = useState('all') // all, my, failed, not-run
  const [searchTerm, setSearchTerm] = useState('')
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  // Execution state
  const [caseNotes, setCaseNotes] = useState('')
  const [stepResults, setStepResults] = useState<Record<string, string>>({})
  const [stepActual, setStepActual] = useState<Record<string, string>>({})
  const [executionTimer, setExecutionTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)

  // Undo functionality
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  const [showUndoToast, setShowUndoToast] = useState(false)

  // Load run data
  useEffect(() => {
    if (runId) {
      loadRunData()
    }
  }, [runId])

  // Load current case when index changes
  useEffect(() => {
    if (runCases.length > 0 && currentCaseIndex >= 0 && currentCaseIndex < runCases.length) {
      const newCase = runCases[currentCaseIndex]
      setCurrentCase(newCase)
      setCaseNotes(newCase.notes || '')

      // Load step results
      const stepResultsMap: Record<string, string> = {}
      const stepActualMap: Record<string, string> = {}

      newCase.runSteps.forEach(step => {
        stepResultsMap[step.id] = step.status
        stepActualMap[step.id] = step.actual || ''
      })

      setStepResults(stepResultsMap)
      setStepActual(stepActualMap)

      // Reset timer for new case
      if (newCase.status === 'Not Run') {
        setExecutionTimer(0)
        setTimerActive(true)
      } else {
        setTimerActive(false)
      }
    }
  }, [currentCaseIndex, runCases])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive) {
      interval = setInterval(() => {
        setExecutionTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'j':
          navigateCase('next')
          e.preventDefault()
          break
        case 'k':
          navigateCase('previous')
          e.preventDefault()
          break
        case '1':
          if (currentCase?.runSteps[0]) {
            handleStepResult(currentCase.runSteps[0].id, 'Pass')
          }
          e.preventDefault()
          break
        case '2':
          if (currentCase?.runSteps[0]) {
            handleStepResult(currentCase.runSteps[0].id, 'Fail')
          }
          e.preventDefault()
          break
        case '3':
          if (currentCase?.runSteps[0]) {
            handleStepResult(currentCase.runSteps[0].id, 'NA')
          }
          e.preventDefault()
          break
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            handleCaseComplete('Pass')
            e.preventDefault()
          }
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            handleCaseComplete('Fail')
            e.preventDefault()
          }
          break
        case 'b':
          if (e.ctrlKey || e.metaKey) {
            handleCaseComplete('Blocked')
            e.preventDefault()
          }
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            handleCaseComplete('Skipped')
            e.preventDefault()
          }
          break
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            navigateCase('next')
            e.preventDefault()
          }
          break
        case '?':
          setShowKeyboardHelp(!showKeyboardHelp)
          e.preventDefault()
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            handleUndo()
            e.preventDefault()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCase, currentCaseIndex])

  const loadRunData = async () => {
    try {
      setLoading(true)
      const result = await RunsService.getRun(runId)
      setRun(result.run)
      setRunCases(result.run.runCases || [])

      if (result.run.runCases && result.run.runCases.length > 0) {
        setCurrentCaseIndex(0)
      }
    } catch (error) {
      console.error('Failed to load run:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateCase = (direction: 'next' | 'previous') => {
    if (direction === 'next' && currentCaseIndex < runCases.length - 1) {
      setCurrentCaseIndex(currentCaseIndex + 1)
    } else if (direction === 'previous' && currentCaseIndex > 0) {
      setCurrentCaseIndex(currentCaseIndex - 1)
    }
  }

  const handleStepResult = async (stepId: string, status: 'Pass' | 'Fail' | 'NA' | 'Not Run') => {
    if (!currentCase) return

    const previousValue = stepResults[stepId]

    // Add to undo stack
    addToUndoStack({
      type: 'step_result',
      runStepId: stepId,
      previousValue,
      newValue: status,
      timestamp: Date.now()
    })

    // Update local state
    setStepResults(prev => ({ ...prev, [stepId]: status }))

    // Auto-save to API
    try {
      setIsAutoSaving(true)
      await RunsService.updateRunStepResult(stepId, {
        status,
        actual: stepActual[stepId],
        durationSec: Math.floor(executionTimer)
      })
    } catch (error) {
      console.error('Failed to save step result:', error)
      // Revert on error
      setStepResults(prev => ({ ...prev, [stepId]: previousValue }))
    } finally {
      setIsAutoSaving(false)
    }
  }

  const handleStepActual = async (stepId: string, actual: string) => {
    setStepActual(prev => ({ ...prev, [stepId]: actual }))

    // Debounced auto-save
    setTimeout(async () => {
      try {
        await RunsService.updateRunStepResult(stepId, {
          status: stepResults[stepId],
          actual,
          durationSec: Math.floor(executionTimer)
        })
      } catch (error) {
        console.error('Failed to save step actual:', error)
      }
    }, 1000)
  }

  const handleCaseComplete = async (status: 'Pass' | 'Fail' | 'Blocked' | 'Skipped') => {
    if (!currentCase) return

    const previousValue = currentCase.status

    // Add to undo stack
    addToUndoStack({
      type: 'case_status',
      runCaseId: currentCase.id,
      previousValue,
      newValue: status,
      timestamp: Date.now()
    })

    // Update local state
    setRunCases(prev => prev.map(rc =>
      rc.id === currentCase.id
        ? { ...rc, status, durationSec: Math.floor(executionTimer), notes: caseNotes }
        : rc
    ))

    // Stop timer
    setTimerActive(false)

    try {
      setIsAutoSaving(true)
      await RunsService.updateRunCase(currentCase.id, {
        status,
        notes: caseNotes,
        durationSec: Math.floor(executionTimer)
      })

      // Auto-navigate to next case if not the last one
      if (currentCaseIndex < runCases.length - 1) {
        setTimeout(() => navigateCase('next'), 500)
      }
    } catch (error) {
      console.error('Failed to save case result:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }

  const addToUndoStack = (action: UndoAction) => {
    setUndoStack(prev => [...prev.slice(-9), action]) // Keep last 10 actions
    setShowUndoToast(true)
    setTimeout(() => setShowUndoToast(false), 3000)
  }

  const handleUndo = async () => {
    const lastAction = undoStack[undoStack.length - 1]
    if (!lastAction) return

    setUndoStack(prev => prev.slice(0, -1))

    try {
      switch (lastAction.type) {
        case 'step_result':
          if (lastAction.runStepId) {
            setStepResults(prev => ({ ...prev, [lastAction.runStepId!]: lastAction.previousValue }))
            await RunsService.updateRunStepResult(lastAction.runStepId, {
              status: lastAction.previousValue,
              actual: stepActual[lastAction.runStepId],
              durationSec: Math.floor(executionTimer)
            })
          }
          break
        case 'case_status':
          if (lastAction.runCaseId && currentCase) {
            setRunCases(prev => prev.map(rc =>
              rc.id === lastAction.runCaseId
                ? { ...rc, status: lastAction.previousValue }
                : rc
            ))
            await RunsService.updateRunCase(lastAction.runCaseId, {
              status: lastAction.previousValue
            })
          }
          break
      }
    } catch (error) {
      console.error('Failed to undo action:', error)
    }
  }

  const getFilteredCases = () => {
    let filtered = runCases

    // Apply filter
    switch (sidebarFilter) {
      case 'my':
        // filtered = filtered.filter(rc => rc.assignee === currentUser?.id)
        break
      case 'failed':
        filtered = filtered.filter(rc => rc.status === 'Fail')
        break
      case 'not-run':
        filtered = filtered.filter(rc => rc.status === 'Not Run')
        break
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(rc =>
        rc.titleSnapshot.toLowerCase().includes(searchLower) ||
        rc.caseId.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'bg-green-100 text-green-800 border-green-200'
      case 'Fail': return 'bg-red-100 text-red-800 border-red-200'
      case 'Blocked': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Skipped': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Not Run': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading execution run...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!run || !currentCase) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Run not found</h2>
            <p className="text-gray-600 mb-4">The execution run could not be loaded.</p>
            <Button onClick={() => router.push('/execution')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Execution
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  const filteredCases = getFilteredCases()

  return (
    <Layout>
      <div className="h-screen flex bg-gray-50 overflow-hidden">
        {/* Left Sidebar - Case List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/execution')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              >
                <Keyboard className="w-4 h-4" />
              </Button>
            </div>

            <h1 className="text-lg font-semibold text-gray-900 mb-1">{run.name}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>{formatTime(executionTimer)}</span>
              {isAutoSaving && (
                <>
                  <Save className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">Saving...</span>
                </>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-3 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'my', label: 'My Cases' },
                { key: 'failed', label: 'Failed' },
                { key: 'not-run', label: 'Not Run' }
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={sidebarFilter === filter.key ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSidebarFilter(filter.key)}
                  className="text-xs"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Case List */}
          <div className="flex-1 overflow-y-auto">
            {filteredCases.map((runCase, index) => (
              <div
                key={runCase.id}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  runCase.id === currentCase?.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
                onClick={() => setCurrentCaseIndex(runCases.indexOf(runCase))}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-blue-600">{runCase.caseId}</span>
                  <Badge className={`text-xs ${getStatusColor(runCase.status)}`}>
                    {runCase.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate mb-1">
                  {runCase.titleSnapshot}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Target className="w-3 h-3" />
                  <span>{runCase.runSteps.length} steps</span>
                  {runCase.durationSec && (
                    <>
                      <Timer className="w-3 h-3" />
                      <span>{formatTime(runCase.durationSec)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600 mb-1">Progress</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-600">{runCases.filter(rc => rc.status === 'Pass').length} Pass</span>
              <span className="text-red-600">{runCases.filter(rc => rc.status === 'Fail').length} Fail</span>
              <span className="text-gray-600">{runCases.filter(rc => rc.status === 'Not Run').length} Remaining</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Case Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentCase.titleSnapshot}
                </h2>
                <Badge className={`${getStatusColor(currentCase.status)}`}>
                  {currentCase.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateCase('previous')}
                  disabled={currentCaseIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  {currentCaseIndex + 1} of {runCases.length}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigateCase('next')}
                  disabled={currentCaseIndex === runCases.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{currentCase.caseId}</span>
              </div>
              <div className="flex items-center gap-1">
                <Timer className="w-4 h-4" />
                <span>{formatTime(executionTimer)}</span>
              </div>
              {currentCase.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{currentCase.assignee}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{currentCase.runSteps.length} steps</span>
              </div>
            </div>
          </div>

          {/* Steps Execution Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {currentCase.runSteps.map((step, index) => (
                <Card key={step.id} className="border-2 border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Step {step.idx}: {step.description}
                      </h3>
                      <Badge className={`${getStatusColor(stepResults[step.id] || 'Not Run')}`}>
                        {stepResults[step.id] || 'Not Run'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expected Result
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {step.expected}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Result
                      </label>
                      <Textarea
                        placeholder="Describe what actually happened..."
                        value={stepActual[step.id] || ''}
                        onChange={(e) => handleStepActual(step.id, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={stepResults[step.id] === 'Pass' ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleStepResult(step.id, 'Pass')}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pass (1)
                      </Button>
                      <Button
                        variant={stepResults[step.id] === 'Fail' ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleStepResult(step.id, 'Fail')}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Fail (2)
                      </Button>
                      <Button
                        variant={stepResults[step.id] === 'NA' ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleStepResult(step.id, 'NA')}
                        className="flex-1"
                      >
                        <Square className="w-4 h-4 mr-1" />
                        N/A (3)
                      </Button>
                    </div>

                    {/* Evidence Panel - Show for failed steps or when user wants to add evidence */}
                    {(stepResults[step.id] === 'Fail' || stepResults[step.id] === 'Pass') && (
                      <div className="mt-4">
                        <EvidencePanel
                          runStepId={step.id}
                          className="border-t pt-4"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Case-level Evidence */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <h3 className="text-sm font-medium text-gray-900">Case Evidence</h3>
                </CardHeader>
                <CardContent>
                  <EvidencePanel runCaseId={currentCase.id} />
                </CardContent>
              </Card>

              {/* Case Notes */}
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <h3 className="text-sm font-medium text-gray-900">Case Notes</h3>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add notes about this test case execution..."
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                {undoStack.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleUndo}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Undo (Ctrl+Z)
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleCaseComplete('Pass')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Pass (Ctrl+P)
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleCaseComplete('Fail')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Fail (Ctrl+F)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleCaseComplete('Blocked')}
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Blocked (Ctrl+B)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleCaseComplete('Skipped')}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skipped (Ctrl+S)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigateCase('next')}
                  disabled={currentCaseIndex === runCases.length - 1}
                >
                  Next (Ctrl+N)
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowKeyboardHelp(false)}
                >
                  ×
                </Button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">J</kbd> Next case</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">K</kbd> Previous case</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">1</kbd> Step Pass</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">2</kbd> Step Fail</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">3</kbd> Step N/A</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd> Show help</div>
                </div>
                <div className="pt-2 border-t">
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+P</kbd> Case Pass</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+F</kbd> Case Fail</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+B</kbd> Case Blocked</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+S</kbd> Case Skipped</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+N</kbd> Next case</div>
                  <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Z</kbd> Undo</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Undo Toast */}
        {showUndoToast && (
          <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Action saved. Press Ctrl+Z to undo.</span>
          </div>
        )}
      </div>
    </Layout>
  )
}