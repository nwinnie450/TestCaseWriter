'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { RunsService, RunCase } from '@/lib/runs-service'
import { EvidencePanel } from '@/components/execution/EvidencePanel'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Users,
  Target,
  Zap,
  SkipForward,
  Square,
  FileText,
  ChevronDown,
  CheckSquare,
  User,
  Timer,
  RefreshCw,
  Download,
  Eye,
  Maximize,
  Paperclip
} from 'lucide-react'

interface BurstRunnerProps {}

interface BulkUpdateData {
  status?: string
  assignee?: string
  notes?: string
}

export default function BurstRunner({}: BurstRunnerProps) {
  const params = useParams()
  const router = useRouter()
  const runId = params.runId as string

  // Data state
  const [run, setRun] = useState<any>(null)
  const [runCases, setRunCases] = useState<RunCase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Quick update state
  const [hoverCase, setHoverCase] = useState<string | null>(null)
  const [expandedCase, setExpandedCase] = useState<string | null>(null)

  // Bulk update
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkAssignee, setBulkAssignee] = useState('')

  // Common assignees for quick selection
  const commonAssignees = [
    'John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez', 'David Wilson'
  ]

  // Load run data
  useEffect(() => {
    if (runId) {
      loadRunData()
    }
  }, [runId])

  const loadRunData = async () => {
    try {
      setLoading(true)
      const result = await RunsService.getRun(runId)
      setRun(result.run)
      setRunCases(result.run.runCases || [])
    } catch (error) {
      console.error('Failed to load run:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredCases = () => {
    let filtered = runCases

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(rc =>
        rc.titleSnapshot.toLowerCase().includes(searchLower) ||
        rc.caseId.toLowerCase().includes(searchLower) ||
        (rc.component && rc.component.toLowerCase().includes(searchLower))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rc => rc.status === statusFilter)
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(rc => !rc.assignee)
      } else {
        filtered = filtered.filter(rc => rc.assignee === assigneeFilter)
      }
    }

    return filtered
  }

  const handleQuickStatusUpdate = async (caseId: string, status: string) => {
    setSaving(prev => new Set(prev).add(caseId))

    try {
      // Update local state immediately
      setRunCases(prev => prev.map(rc =>
        rc.id === caseId ? { ...rc, status } : rc
      ))

      // Save to API
      await RunsService.updateRunCase(caseId, { status })
    } catch (error) {
      console.error('Failed to update case status:', error)
      // Revert on error
      loadRunData()
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev)
        newSet.delete(caseId)
        return newSet
      })
    }
  }

  const handleQuickAssigneeUpdate = async (caseId: string, assignee: string) => {
    setSaving(prev => new Set(prev).add(caseId))

    try {
      // Update local state immediately
      setRunCases(prev => prev.map(rc =>
        rc.id === caseId ? { ...rc, assignee } : rc
      ))

      // Save to API
      await RunsService.updateRunCase(caseId, { assignee })
    } catch (error) {
      console.error('Failed to update case assignee:', error)
      // Revert on error
      loadRunData()
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev)
        newSet.delete(caseId)
        return newSet
      })
    }
  }

  const handleCaseSelection = (caseId: string) => {
    const newSelection = new Set(selectedCases)
    if (newSelection.has(caseId)) {
      newSelection.delete(caseId)
    } else {
      newSelection.add(caseId)
    }
    setSelectedCases(newSelection)
    setShowBulkActions(newSelection.size > 0)
  }

  const handleSelectAll = () => {
    const filteredCases = getFilteredCases()
    if (selectedCases.size === filteredCases.length) {
      setSelectedCases(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedCases(new Set(filteredCases.map(rc => rc.id)))
      setShowBulkActions(true)
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedCases.size === 0) return

    const updates: BulkUpdateData = {}
    if (bulkStatus) updates.status = bulkStatus
    if (bulkAssignee) updates.assignee = bulkAssignee

    if (Object.keys(updates).length === 0) return

    try {
      // Update all selected cases
      const updatePromises = Array.from(selectedCases).map(caseId =>
        RunsService.updateRunCase(caseId, updates)
      )

      await Promise.all(updatePromises)

      // Update local state
      setRunCases(prev => prev.map(rc =>
        selectedCases.has(rc.id) ? { ...rc, ...updates } : rc
      ))

      // Clear selections
      setSelectedCases(new Set())
      setShowBulkActions(false)
      setBulkStatus('')
      setBulkAssignee('')
    } catch (error) {
      console.error('Failed to bulk update cases:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
      case 'Fail': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
      case 'Blocked': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200'
      case 'Skipped': return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
      case 'Not Run': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return <CheckCircle className="w-3 h-3" />
      case 'Fail': return <XCircle className="w-3 h-3" />
      case 'Blocked': return <AlertTriangle className="w-3 h-3" />
      case 'Skipped': return <SkipForward className="w-3 h-3" />
      case 'Not Run': return <Clock className="w-3 h-3" />
      default: return <Square className="w-3 h-3" />
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading burst mode...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!run) {
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
  const totalCases = runCases.length
  const passedCases = runCases.filter(rc => rc.status === 'Pass').length
  const failedCases = runCases.filter(rc => rc.status === 'Fail').length
  const notRunCases = runCases.filter(rc => rc.status === 'Not Run').length

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/execution')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{run.name}</h1>
                  <p className="text-sm text-gray-600">Burst Mode - Quick Execution</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/runs/${runId}/execute`)}
                >
                  <Maximize className="w-4 h-4 mr-2" />
                  Focused Mode
                </Button>

                <div className="text-sm text-gray-600">
                  {passedCases}/{totalCases} passed • {failedCases} failed • {notRunCases} remaining
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Not Run">Not Run</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Blocked">Blocked</option>
                <option value="Skipped">Skipped</option>
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {commonAssignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCases.size === filteredCases.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <Card className="mb-4 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedCases.size} cases selected
                    </span>

                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="px-3 py-1 border border-blue-300 rounded-md text-sm"
                    >
                      <option value="">Update status...</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Skipped">Skipped</option>
                    </select>

                    <select
                      value={bulkAssignee}
                      onChange={(e) => setBulkAssignee(e.target.value)}
                      className="px-3 py-1 border border-blue-300 rounded-md text-sm"
                    >
                      <option value="">Assign to...</option>
                      {commonAssignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkUpdate}
                      disabled={!bulkStatus && !bulkAssignee}
                    >
                      Update Selected
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedCases(new Set())
                        setShowBulkActions(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Cases Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <CheckSquare className="w-4 h-4" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test Case
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evidence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCases.map((runCase) => (
                    <React.Fragment key={runCase.id}>
                      <tr
                        className={`hover:bg-gray-50 ${selectedCases.has(runCase.id) ? 'bg-blue-50' : ''}`}
                        onMouseEnter={() => setHoverCase(runCase.id)}
                        onMouseLeave={() => setHoverCase(null)}
                      >
                      {/* Selection Checkbox */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCases.has(runCase.id)}
                          onChange={() => handleCaseSelection(runCase.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Test Case Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {saving.has(runCase.id) && (
                            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-blue-600">{runCase.caseId}</span>
                              {runCase.component && (
                                <Badge variant="outline" className="text-xs">
                                  {runCase.component}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {runCase.titleSnapshot}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Target className="w-3 h-3" />
                              <span>{runCase.runSteps.length} steps</span>
                              {runCase.priority && (
                                <>
                                  <span>•</span>
                                  <span>{runCase.priority} priority</span>
                                </>
                              )}
                              {/* Evidence indicator */}
                              {runCase.evidence && runCase.evidence.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <Paperclip className="w-3 h-3" />
                                    <span>{runCase.evidence.length}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          {['Pass', 'Fail', 'Blocked', 'Skipped'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleQuickStatusUpdate(runCase.id, status)}
                              className={`px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                                runCase.status === status
                                  ? getStatusColor(status)
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                              }`}
                              disabled={saving.has(runCase.id)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(status)}
                                <span>{status}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="relative">
                          <select
                            value={runCase.assignee || ''}
                            onChange={(e) => handleQuickAssigneeUpdate(runCase.id, e.target.value)}
                            className="text-sm border-0 bg-transparent focus:ring-0 focus:border-0 text-gray-900"
                            disabled={saving.has(runCase.id)}
                          >
                            <option value="">Unassigned</option>
                            {commonAssignees.map(assignee => (
                              <option key={assignee} value={assignee}>{assignee}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {runCase.durationSec ? (
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <span>{formatDuration(runCase.durationSec)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Evidence */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {runCase.evidence && runCase.evidence.length > 0 ? (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Paperclip className="w-4 h-4" />
                            <span className="font-medium">{runCase.evidence.length}</span>
                            <span className="text-xs text-gray-500">
                              file{runCase.evidence.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/runs/${runId}/execute`)}
                            className="text-xs px-2 py-1"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>

                          {expandedCase === runCase.id ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setExpandedCase(null)}
                              className="text-xs px-2 py-1"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setExpandedCase(runCase.id)}
                              className="text-xs px-2 py-1"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row - Steps */}
                    {expandedCase === runCase.id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Test Steps</h4>
                            {runCase.runSteps.map((step, index) => (
                              <div key={step.id} className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                                  {step.idx}
                                </span>
                                <div className="flex-1">
                                  <p className="text-gray-900">{step.description}</p>
                                  <p className="text-gray-600 text-xs">Expected: {step.expected}</p>
                                  {step.actual && (
                                    <p className="text-gray-600 text-xs">Actual: {step.actual}</p>
                                  )}
                                </div>
                                <Badge className={getStatusColor(step.status)}>
                                  {step.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {filteredCases.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' || assigneeFilter !== 'all'
                      ? 'Try adjusting your filters.'
                      : 'No test cases available in this run.'
                    }
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}