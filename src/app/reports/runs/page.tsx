'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Download,
  Calendar,
  Filter,
  Target,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface RunsReportData {
  summary: {
    totalRuns: number
    averagePassRate: number
    totalTests: number
    dateRange: string
  }
  trends: Array<{
    runId: string
    name: string
    passRate: number
    createdAt: string
    totalTests: number
  }>
  topFailingComponents: Array<{
    component: string
    failureCount: number
    totalTests: number
    failureRate: number
  }>
  topFailingCases: Array<{
    caseId: string
    title: string
    failureCount: number
    lastFailure: string
    component: string
  }>
}

export default function RunsReportPage() {
  const router = useRouter()
  const [data, setData] = useState<RunsReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableRuns, setAvailableRuns] = useState<Array<{id: string, name: string}>>([])
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    projectId: 'default',
    suite: '',
    runName: ''
  })

  const breadcrumbs = [
    { label: 'Reports' },
    { label: 'Runs Analysis' }
  ]

  useEffect(() => {
    // Set default date range (last 30 days)
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)

    setFilters(prev => ({
      ...prev,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    }))

    // Fetch available runs for dropdown
    fetchAvailableRuns()
  }, [])

  const fetchAvailableRuns = async () => {
    try {
      const response = await fetch('/api/runs')
      if (response.ok) {
        const data = await response.json()
        const runs = data.runs || []
        setAvailableRuns(runs.map((run: any) => ({
          id: run.id,
          name: run.name
        })))
      }
    } catch (err) {
      console.error('Failed to fetch available runs:', err)
    }
  }

  const fetchData = async () => {
    if (!filters.fromDate || !filters.toDate) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        from: filters.fromDate,
        to: filters.toDate,
        projectId: filters.projectId
      })

      if (filters.suite) params.append('suite', filters.suite)
      if (filters.runName) params.append('runName', filters.runName)

      const response = await fetch(`/api/reports/runs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch report data')

      const reportData = await response.json()
      setData(reportData)
    } catch (err) {
      console.error('Failed to fetch report:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'markdown') => {
    if (!data) return

    try {
      const params = new URLSearchParams({
        from: filters.fromDate,
        to: filters.toDate,
        projectId: filters.projectId,
        format
      })

      if (filters.suite) params.append('suite', filters.suite)
      if (filters.runName) params.append('runName', filters.runName)

      const response = await fetch(`/api/reports/runs/export?${params}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `runs-report-${filters.fromDate}-to-${filters.toDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const navigateToRun = (runId: string) => {
    router.push(`/runs/${runId}/summary`)
  }

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      title="Runs Analysis Report"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suite (Optional)</label>
                <Input
                  placeholder="Suite name"
                  value={filters.suite}
                  onChange={(e) => setFilters(prev => ({ ...prev, suite: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Run (Optional)</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  value={filters.runName}
                  onChange={(e) => setFilters(prev => ({ ...prev, runName: e.target.value }))}
                >
                  <option value="">All runs</option>
                  {availableRuns.map((run) => (
                    <option key={run.id} value={run.name}>
                      {run.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchData} disabled={loading} className="w-full">
                  {loading ? 'Loading...' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Runs</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalRuns}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Pass Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{Math.round(data.summary.averagePassRate)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tests</p>
                      <p className="text-2xl font-bold text-gray-900">{data.summary.totalTests}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-space-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Period</p>
                      <p className="text-sm font-bold text-gray-900">{data.summary.dateRange}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => exportReport('csv')}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => exportReport('markdown')}>
                        <Download className="h-4 w-4 mr-1" />
                        MD
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pass Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Pass Rate Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.trends.map((run, index) => {
                    const passRate = Math.round(run.passRate * 100)
                    const trend = index > 0 ? run.passRate - data.trends[index - 1].passRate : 0
                    const trendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : null

                    return (
                      <div key={run.runId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`w-3 h-3 rounded-full ${passRate >= 90 ? 'bg-green-500' : passRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                          <div className="flex-1">
                            <button
                              onClick={() => navigateToRun(run.runId)}
                              className="font-medium text-left text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              {run.name}
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <p className="text-sm text-gray-600">{new Date(run.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <div>
                            <div className="font-bold">{passRate}%</div>
                            <div className="text-sm text-gray-600">{run.totalTests} tests</div>
                          </div>
                          {trendIcon && (
                            <trendIcon className={`h-4 w-4 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Failing Components */}
            {data.topFailingComponents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Failing Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.topFailingComponents.slice(0, 10).map((comp, index) => (
                      <div key={comp.component} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                            #{index + 1}
                          </div>
                          <span className="font-medium">{comp.component}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{comp.failureCount} failures</div>
                          <div className="text-sm text-gray-600">{Math.round(comp.failureRate * 100)}% failure rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Failing Cases */}
            {data.topFailingCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Most Frequently Failing Test Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failures</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Failure</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.topFailingCases.slice(0, 15).map((testCase) => (
                          <tr key={testCase.caseId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{testCase.caseId}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{testCase.title}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {testCase.component}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="destructive">{testCase.failureCount}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(testCase.lastFailure).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!data && !loading && (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Your Report</h3>
              <p className="text-gray-600">
                Select a date range and click "Generate Report" to analyze your test run trends and identify failing patterns.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}