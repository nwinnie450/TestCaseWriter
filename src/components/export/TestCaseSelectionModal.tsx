'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { TestCase } from '@/types'
import { getStoredTestCaseSessions, TestCaseSession } from '@/lib/test-case-storage'
import { 
  Search, 
  Filter, 
  CheckSquare, 
  Square, 
  FileText, 
  Calendar, 
  Tag, 
  AlertCircle,
  Download,
  X,
  ChevronRight,
  ChevronDown,
  Hash,
  Ticket
} from 'lucide-react'

interface TestCaseSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTestCases: (selectedTestCases: TestCase[]) => void
  preSelectedTestCases?: TestCase[]
}

interface GroupedTestCases {
  sessionId: string
  sessionInfo: TestCaseSession
  testCases: TestCase[]
  isExpanded: boolean
  selectedCount: number
}

export function TestCaseSelectionModal({
  isOpen,
  onClose,
  onSelectTestCases,
  preSelectedTestCases = []
}: TestCaseSelectionModalProps) {
  const [sessions, setSessions] = useState<TestCaseSession[]>([])
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [enhancementFilter, setEnhancementFilter] = useState<string>('')
  const [ticketFilter, setTicketFilter] = useState<string>('')
  const [groupedSessions, setGroupedSessions] = useState<GroupedTestCases[]>([])
  
  // Load test case sessions on mount
  useEffect(() => {
    if (isOpen) {
      const storedSessions = getStoredTestCaseSessions()
      setSessions(storedSessions)
      
      // Pre-select any passed test cases
      if (preSelectedTestCases.length > 0) {
        setSelectedTestCaseIds(new Set(preSelectedTestCases.map(tc => tc.id)))
      }
    }
  }, [isOpen, preSelectedTestCases])

  // Group sessions and apply filters
  useEffect(() => {
    const grouped = sessions.map(session => {
      let filteredTestCases = session.testCases

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        filteredTestCases = filteredTestCases.filter(tc => 
          tc.testCase?.toLowerCase().includes(query) ||
          tc.module?.toLowerCase().includes(query) ||
          tc.remarks?.toLowerCase().includes(query) ||
          tc.tags?.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // Apply priority filter
      if (priorityFilter) {
        filteredTestCases = filteredTestCases.filter(tc => tc.priority === priorityFilter)
      }

      // Apply status filter
      if (statusFilter) {
        filteredTestCases = filteredTestCases.filter(tc => tc.status === statusFilter)
      }

      // Apply enhancement filter
      if (enhancementFilter) {
        filteredTestCases = filteredTestCases.filter(tc => 
          tc.enhancement?.toLowerCase().includes(enhancementFilter.toLowerCase()) ||
          tc.feature?.toLowerCase().includes(enhancementFilter.toLowerCase())
        )
      }

      // Apply ticket filter
      if (ticketFilter) {
        filteredTestCases = filteredTestCases.filter(tc => 
          tc.ticketId?.toLowerCase().includes(ticketFilter.toLowerCase()) ||
          tc.epic?.toLowerCase().includes(ticketFilter.toLowerCase())
        )
      }

      const selectedCount = filteredTestCases.filter(tc => 
        selectedTestCaseIds.has(tc.id)
      ).length

      return {
        sessionId: session.id,
        sessionInfo: session,
        testCases: filteredTestCases,
        isExpanded: true, // Start expanded
        selectedCount
      }
    }).filter(group => group.testCases.length > 0)

    setGroupedSessions(grouped)
  }, [sessions, searchQuery, priorityFilter, statusFilter, enhancementFilter, ticketFilter, selectedTestCaseIds])

  const handleSelectTestCase = (testCaseId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedTestCaseIds)
    
    if (isSelected) {
      newSelected.add(testCaseId)
    } else {
      newSelected.delete(testCaseId)
    }
    
    setSelectedTestCaseIds(newSelected)
  }

  const handleSelectAllInSession = (sessionId: string, isSelected: boolean) => {
    const session = groupedSessions.find(g => g.sessionId === sessionId)
    if (!session) return

    const newSelected = new Set(selectedTestCaseIds)
    
    session.testCases.forEach(tc => {
      if (isSelected) {
        newSelected.add(tc.id)
      } else {
        newSelected.delete(tc.id)
      }
    })
    
    setSelectedTestCaseIds(newSelected)
  }

  const handleSelectAll = () => {
    const allTestCases = groupedSessions.flatMap(g => g.testCases)
    const allIds = new Set(allTestCases.map(tc => tc.id))
    setSelectedTestCaseIds(allIds)
  }

  const handleClearAll = () => {
    setSelectedTestCaseIds(new Set())
  }

  const handleConfirmSelection = () => {
    const selectedTestCases = sessions
      .flatMap(session => session.testCases)
      .filter(tc => selectedTestCaseIds.has(tc.id))
    
    onSelectTestCases(selectedTestCases)
    onClose()
  }

  const toggleSessionExpansion = (sessionId: string) => {
    setGroupedSessions(prev => 
      prev.map(group => 
        group.sessionId === sessionId 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    )
  }

  const totalTestCases = useMemo(() => 
    groupedSessions.reduce((sum, group) => sum + group.testCases.length, 0)
  , [groupedSessions])

  const selectedCount = selectedTestCaseIds.size

  const formatSessionDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'review': return 'bg-blue-100 text-blue-800'
      case 'deprecated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Select Test Cases to Export
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose which test cases you want to include in your export
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{totalTestCases}</span> total test cases
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{selectedCount}</span> selected
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{sessions.length}</span> generation sessions
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="space-y-4">
            {/* First Row - Search and Main Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Priority Filter */}
              <select 
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input"
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="review">Review</option>
                <option value="deprecated">Deprecated</option>
              </select>

              {/* Bulk Actions */}
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            </div>

            {/* Second Row - Enhancement and Ticket Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Enhancement Filter */}
              <div className="relative">
                <Input
                  placeholder="Filter by enhancement/feature..."
                  value={enhancementFilter}
                  onChange={(e) => setEnhancementFilter(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Ticket className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Ticket Filter */}
              <div className="relative">
                <Input
                  placeholder="Filter by ticket/issue ID..."
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Hash className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-center">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery('')
                    setPriorityFilter('')
                    setStatusFilter('')
                    setEnhancementFilter('')
                    setTicketFilter('')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {groupedSessions.length === 0 && sessions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Found</h3>
              <p className="text-gray-600">
                Generate some test cases first to see them here for export.
              </p>
            </div>
          )}

          {groupedSessions.length === 0 && sessions.length > 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Cases Match Filters</h3>
              <p className="text-gray-600">
                Try adjusting your search and filter criteria.
              </p>
            </div>
          )}

          {/* Session Groups */}
          <div className="space-y-4">
            {groupedSessions.map((group) => (
              <div key={group.sessionId} className="border border-gray-200 rounded-lg">
                {/* Session Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleSessionExpansion(group.sessionId)}
                >
                  <div className="flex items-center space-x-3">
                    {group.isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectAllInSession(group.sessionId, group.selectedCount < group.testCases.length)
                      }}
                      className="flex items-center space-x-2"
                    >
                      {group.selectedCount === group.testCases.length && group.testCases.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary-600" />
                      ) : group.selectedCount > 0 ? (
                        <div className="h-4 w-4 border-2 border-primary-600 bg-primary-100 rounded-sm flex items-center justify-center">
                          <div className="h-2 w-2 bg-primary-600 rounded-sm"></div>
                        </div>
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {formatSessionDate(group.sessionInfo.generatedAt)}
                        </span>
                        <Badge variant="secondary">
                          {group.sessionInfo.model}
                        </Badge>
                      </div>
                      {group.sessionInfo.documentNames.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          Documents: {group.sessionInfo.documentNames.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {group.selectedCount} / {group.testCases.length} selected
                    </div>
                    <Badge variant="outline">
                      {group.testCases.length} test cases
                    </Badge>
                  </div>
                </div>

                {/* Test Cases List */}
                {group.isExpanded && (
                  <div className="border-t border-gray-200">
                    {group.testCases.map((testCase) => (
                      <div 
                        key={testCase.id} 
                        className="flex items-start space-x-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                      >
                        <button
                          onClick={() => handleSelectTestCase(testCase.id, !selectedTestCaseIds.has(testCase.id))}
                          className="mt-1"
                        >
                          {selectedTestCaseIds.has(testCase.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {testCase.testCase || `Test Case ${testCase.id.slice(0, 8)}`}
                              </h4>
                              {testCase.module && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Module: {testCase.module}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-3">
                              <Badge className={getPriorityColor(testCase.priority)}>
                                {testCase.priority}
                              </Badge>
                              <Badge className={getStatusColor(testCase.status)}>
                                {testCase.status}
                              </Badge>
                            </div>
                          </div>

                          {testCase.tags && testCase.tags.length > 0 && (
                            <div className="flex items-center space-x-1 flex-wrap">
                              <Tag className="h-3 w-3 text-gray-400" />
                              {testCase.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedCount > 0 ? (
                <>
                  <span className="font-medium">{selectedCount}</span> test case{selectedCount !== 1 ? 's' : ''} selected for export
                </>
              ) : (
                'No test cases selected'
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleConfirmSelection}
                disabled={selectedCount === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}