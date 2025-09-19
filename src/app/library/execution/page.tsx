'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataGrid } from '@/components/library/DataGrid'
import {
  Target,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Download
} from 'lucide-react'

interface ExecutionRun {
  id: string
  name: string
  project: string
  status: 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Blocked'
  assignedTester: string
  environment: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  progress: {
    total: number
    executed: number
    passed: number
    failed: number
    blocked: number
  }
  testCases: Array<{
    id: string
    title: string
    status: 'Not Started' | 'In Progress' | 'Passed' | 'Failed' | 'Blocked'
    executedAt?: Date
    notes?: string
  }>
}

export default function LibraryExecutionPage() {
  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sample data - in production this would come from API
  useEffect(() => {
    // Simulate API call
    const sampleRuns: ExecutionRun[] = [
      {
        id: 'run-1',
        name: 'Sprint 24 - Login Tests',
        project: 'E-commerce Platform',
        status: 'Active',
        assignedTester: 'john.doe@company.com',
        environment: 'Staging',
        createdAt: new Date('2024-01-15'),
        startedAt: new Date('2024-01-15'),
        progress: {
          total: 25,
          executed: 18,
          passed: 15,
          failed: 2,
          blocked: 1
        },
        testCases: []
      },
      {
        id: 'run-2',
        name: 'Payment Gateway Testing',
        project: 'E-commerce Platform',
        status: 'Completed',
        assignedTester: 'jane.smith@company.com',
        environment: 'Production',
        createdAt: new Date('2024-01-10'),
        startedAt: new Date('2024-01-10'),
        completedAt: new Date('2024-01-14'),
        progress: {
          total: 32,
          executed: 32,
          passed: 30,
          failed: 2,
          blocked: 0
        },
        testCases: []
      },
      {
        id: 'run-3',
        name: 'Mobile App - User Registration',
        project: 'Mobile App',
        status: 'Draft',
        assignedTester: 'mike.wilson@company.com',
        environment: 'Development',
        createdAt: new Date('2024-01-16'),
        progress: {
          total: 0,
          executed: 0,
          passed: 0,
          failed: 0,
          blocked: 0
        },
        testCases: []
      }
    ]
    setExecutionRuns(sampleRuns)
  }, [])

  const getStatusColor = (status: ExecutionRun['status']) => {
    switch (status) {
      case 'Active': return 'success'
      case 'Completed': return 'success'
      case 'Draft': return 'secondary'
      case 'Paused': return 'warning'
      case 'Blocked': return 'error'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: ExecutionRun['status']) => {
    switch (status) {
      case 'Active': return Play
      case 'Completed': return CheckCircle
      case 'Draft': return Clock
      case 'Paused': return Pause
      case 'Blocked': return AlertTriangle
      default: return Clock
    }
  }

  const calculatePassRate = (progress: ExecutionRun['progress']) => {
    if (progress.executed === 0) return 0
    return Math.round((progress.passed / progress.executed) * 100)
  }

  const breadcrumbs = [
    { label: 'Library', href: '/library' },
    { label: 'Execution Management' }
  ]

  const actions = (
    <div className="flex items-center space-x-3">
      <Button variant="secondary" size="sm">
        <Filter className="h-4 w-4 mr-2" />
        Filter
      </Button>
      <Button variant="secondary" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => window.location.href = '/execution'}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Execution Run
      </Button>
    </div>
  )

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      title="Execution Management"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Execution Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Runs</p>
                  <p className="text-2xl font-bold">{executionRuns.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Runs</p>
                  <p className="text-2xl font-bold text-green-600">
                    {executionRuns.filter(r => r.status === 'Active').length}
                  </p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {executionRuns.filter(r => r.status === 'Completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Pass Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(
                      executionRuns
                        .filter(r => r.progress.executed > 0)
                        .reduce((sum, r) => sum + calculatePassRate(r.progress), 0) /
                      Math.max(1, executionRuns.filter(r => r.progress.executed > 0).length)
                    )}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Execution Runs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {executionRuns.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Execution Runs</h3>
                <p className="text-gray-500 mb-4">
                  Create your first execution run to start tracking test case execution.
                </p>
                <Button
                  variant="primary"
                  onClick={() => window.location.href = '/execution'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Execution Run
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {executionRuns.map((run) => {
                  const StatusIcon = getStatusIcon(run.status)
                  const passRate = calculatePassRate(run.progress)

                  return (
                    <div
                      key={run.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedRunId === run.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedRunId(run.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <StatusIcon className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-medium text-gray-900">{run.name}</h4>
                            <p className="text-sm text-gray-500">{run.project} • {run.environment}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <Badge variant={getStatusColor(run.status) as any}>
                            {run.status}
                          </Badge>

                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {run.progress.executed}/{run.progress.total} executed
                            </p>
                            {run.progress.executed > 0 && (
                              <p className="text-xs text-gray-500">
                                {passRate}% pass rate
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-600">{run.assignedTester}</p>
                            <p className="text-xs text-gray-500">
                              {run.createdAt.toLocaleDateString()}
                            </p>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/execution?runId=${run.id}`
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {run.progress.total > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{run.progress.executed}/{run.progress.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(run.progress.executed / run.progress.total) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}