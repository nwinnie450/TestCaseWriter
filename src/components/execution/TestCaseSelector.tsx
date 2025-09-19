'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getAllStoredTestCases } from '@/lib/test-case-storage'
import { TestCase } from '@/types/index'
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  Target,
  Clock,
  AlertTriangle,
  Plus,
  X,
  FileText,
  Tag,
  Calendar
} from 'lucide-react'

interface TestCaseSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectTestCases: (testCases: TestCase[]) => void
  selectedProjectId?: string
  runId?: string
}

export function TestCaseSelector({
  isOpen,
  onClose,
  onSelectTestCases,
  selectedProjectId,
  runId
}: TestCaseSelectorProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [filteredTestCases, setFilteredTestCases] = useState<TestCase[]>([])
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // Load test cases when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTestCases()
    }
  }, [isOpen, selectedProjectId])

  // Filter test cases when search term or filters change
  useEffect(() => {
    filterTestCases()
  }, [testCases, searchTerm, statusFilter, priorityFilter])

  const loadTestCases = async () => {
    setLoading(true)
    try {
      const allTestCases = getAllStoredTestCases()

      // Filter by project if specified
      let filtered = allTestCases
      if (selectedProjectId) {
        filtered = allTestCases.filter(tc => tc.projectId === selectedProjectId)
      }

      setTestCases(filtered)
    } catch (error) {
      console.error('Failed to load test cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTestCases = () => {
    let filtered = testCases

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(tc =>
        tc.id.toLowerCase().includes(searchLower) ||
        (tc.data?.testCase && tc.data.testCase.toLowerCase().includes(searchLower)) ||
        (tc.data?.module && tc.data.module.toLowerCase().includes(searchLower)) ||
        tc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tc => tc.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(tc => tc.priority === priorityFilter)
    }

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

  const handleAddToExecution = () => {
    const selectedTestCaseObjects = testCases.filter(tc => selectedTestCases.has(tc.id))
    onSelectTestCases(selectedTestCaseObjects)
    onClose()
    setSelectedTestCases(new Set())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'deprecated': return 'bg-red-100 text-red-800'
      case 'archived': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Select Test Cases for Execution</h2>
                <p className="text-blue-100">
                  Choose test cases from your library to add to the execution run
                </p>
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

        {/* Filters and Search */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
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
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredTestCases.length} test cases found
                {selectedProjectId && <span className="ml-2 text-blue-600">(filtered by project)</span>}
              </span>
              {selectedTestCases.size > 0 && (
                <Badge variant="secondary">
                  {selectedTestCases.size} selected
                </Badge>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredTestCases.length === 0}
            >
              {selectedTestCases.size === filteredTestCases.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        {/* Test Cases List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading test cases...</p>
            </div>
          ) : filteredTestCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search filters.'
                  : 'No test cases available in your library.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTestCases.map((testCase) => (
                <Card
                  key={testCase.id}
                  className={`transition-all cursor-pointer border-2 ${
                    selectedTestCases.has(testCase.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTestCaseToggle(testCase.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {selectedTestCases.has(testCase.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm font-medium text-blue-600">
                                {testCase.id}
                              </span>
                              <Badge className={getStatusColor(testCase.status)}>
                                {testCase.status}
                              </Badge>
                              <Badge className={getPriorityColor(testCase.priority)}>
                                {testCase.priority}
                              </Badge>
                            </div>

                            <h4 className="font-medium text-gray-900 mb-1">
                              {testCase.data?.testCase || 'Untitled Test Case'}
                            </h4>

                            {testCase.data?.module && (
                              <p className="text-sm text-gray-600 mb-2">
                                Module: {testCase.data.module}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {testCase.createdAt && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(testCase.createdAt).toLocaleDateString()}</span>
                                </div>
                              )}
                              {testCase.tags && testCase.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  <span>{testCase.tags.slice(0, 2).join(', ')}</span>
                                  {testCase.tags.length > 2 && (
                                    <span>+{testCase.tags.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedTestCases.size > 0 && (
                <span>{selectedTestCases.size} test case{selectedTestCases.size !== 1 ? 's' : ''} selected</span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddToExecution}
                disabled={selectedTestCases.size === 0}
                icon={Plus}
              >
                Add {selectedTestCases.size} Test Case{selectedTestCases.size !== 1 ? 's' : ''} to Execution
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}