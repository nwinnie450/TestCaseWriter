'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Download,
  Share,
  BarChart3,
  Timer,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  ExternalLink,
  Copy,
  FileDown
} from 'lucide-react'

interface RunSummaryProps {
  runId: string
  onRerunFailed?: (runId: string) => void
  onNavigateToRun?: (runId: string) => void
}

interface RunSummaryData {
  meta: {
    name: string
    build: string
    configs: string[]
    startedAt: string | null
    closedAt: string | null
    status: string
    notes: string | null
  }
  counts: {
    total: number
    pass: number
    fail: number
    blocked: number
    skipped: number
    notRun: number
  }
  passRate: number
  duration: {
    total: number
    average: number
    fastest: number
    slowest: number
    executed: number
  }
  byComponent: Array<{
    key: string
    pass: number
    fail: number
    total: number
    passRate: number
  }>
  byAssignee: Array<{
    key: string
    done: number
    pending: number
    total: number
    completionRate: number
  }>
  failures: Array<{
    caseId: string
    title: string
    status: string
    component: string
    priority: string
    assignee: string
    notes: string
    defect: string | null
  }>
}

export function RunSummary({ runId, onRerunFailed, onNavigateToRun }: RunSummaryProps) {
  const [summary, setSummary] = useState<RunSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
  }, [runId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/runs/${runId}/summary`)
      if (!response.ok) throw new Error('Failed to fetch summary')

      const data = await response.json()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'markdown' | 'junit') => {
    try {
      const response = await fetch(`/api/runs/${runId}/export?format=${format}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `run-${runId}-summary.${format === 'junit' ? 'xml' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/runs/${runId}/summary`
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could show a toast notification here
      alert('Share link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleRerunFailed = async () => {
    if (!summary || summary.counts.fail === 0) return

    try {
      const response = await fetch(`/api/runs/${runId}/rerun?failedOnly=true`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Rerun failed')

      const data = await response.json()
      onNavigateToRun?.(data.runId)
    } catch (err) {
      console.error('Rerun failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error: {error || 'Failed to load summary'}</p>
        <Button onClick={fetchSummary} className="mt-4">Retry</Button>
      </div>
    )
  }

  const passRatePercent = Math.round(summary.passRate * 100)
  const statusColor = passRatePercent >= 95 ? 'green' : passRatePercent >= 80 ? 'yellow' : 'red'
  const statusIcon = passRatePercent >= 95 ? '🟢' : passRatePercent >= 80 ? '🟡' : '🔴'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{summary.meta.name}</h1>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
            <span>Build: {summary.meta.build}</span>
            {summary.meta.configs.length > 0 && (
              <span>Configs: {summary.meta.configs.join(', ')}</span>
            )}
            {summary.meta.startedAt && (
              <span>Started: {new Date(summary.meta.startedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleShare} variant="secondary" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={() => handleExport('csv')} variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={() => handleExport('markdown')} variant="secondary" size="sm">
            <FileDown className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          {summary.counts.fail > 0 && (
            <Button onClick={handleRerunFailed} variant="primary" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Rerun Failed ({summary.counts.fail})
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-gray-900">{passRatePercent}%</p>
                <p className="text-xs text-gray-500">{summary.counts.pass}/{summary.counts.total} passed</p>
              </div>
              <div className={`p-3 rounded-full ${statusColor === 'green' ? 'bg-green-100' : statusColor === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <Target className={`h-6 w-6 ${statusColor === 'green' ? 'text-green-600' : statusColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Execution Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execution</p>
                <p className="text-2xl font-bold text-gray-900">{summary.counts.total - summary.counts.notRun}</p>
                <p className="text-xs text-gray-500">{summary.counts.total} total cases</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failures */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Failures</p>
                <p className="text-2xl font-bold text-gray-900">{summary.counts.fail + summary.counts.blocked}</p>
                <p className="text-xs text-gray-500">{summary.counts.fail} failed, {summary.counts.blocked} blocked</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(summary.duration.total)}</p>
                <p className="text-xs text-gray-500">avg: {formatDuration(summary.duration.average)}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Test Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.counts.pass}</p>
              <p className="text-sm text-gray-600">Passed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{summary.counts.fail}</p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{summary.counts.blocked}</p>
              <p className="text-sm text-gray-600">Blocked</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-gray-600" />
              </div>
              <p className="text-2xl font-bold text-gray-600">{summary.counts.notRun}</p>
              <p className="text-sm text-gray-600">Not Run</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.counts.skipped}</p>
              <p className="text-sm text-gray-600">Skipped</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Breakdown */}
      {summary.byComponent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Component Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.byComponent.slice(0, 8).map((comp) => {
                const compPassRate = Math.round(comp.passRate * 100)
                const compStatus = compPassRate >= 90 ? 'green' : compPassRate >= 70 ? 'yellow' : 'red'

                return (
                  <div key={comp.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${compStatus === 'green' ? 'bg-green-500' : compStatus === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{comp.key}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{compPassRate}%</div>
                      <div className="text-sm text-gray-600">{comp.pass}/{comp.total}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failures Table */}
      {summary.failures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed & Blocked Cases ({summary.failures.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.failures.slice(0, 20).map((failure, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{failure.caseId}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{failure.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={failure.status === 'Fail' ? 'destructive' : 'secondary'}>
                          {failure.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {failure.component || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={failure.priority === 'critical' ? 'destructive' : failure.priority === 'high' ? 'secondary' : 'outline'}>
                          {failure.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {failure.assignee || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs truncate">{failure.notes || 'No notes'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}