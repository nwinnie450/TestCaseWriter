'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { 
  GitPullRequest, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Eye,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react'
import { TestCaseChangeRequest } from '@/types'

interface ChangeRequestListProps {
  changeRequests: TestCaseChangeRequest[]
  onApprove?: (changeRequest: TestCaseChangeRequest) => void
  onReject?: (changeRequest: TestCaseChangeRequest) => void
  onView?: (changeRequest: TestCaseChangeRequest) => void
  className?: string
}

export function ChangeRequestList({
  changeRequests,
  onApprove,
  onReject,
  onView,
  className = ''
}: ChangeRequestListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'merged', label: 'Merged' }
  ]

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'merged': return 'bg-blue-100 text-blue-800'
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredChangeRequests = changeRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    const matchesSearch = searchQuery === '' || 
      request.testCaseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.proposedChanges.some(change => 
        change.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
        change.reason.toLowerCase().includes(searchQuery.toLowerCase())
      )
    
    return matchesStatus && matchesPriority && matchesSearch
  })

  const pendingCount = changeRequests.filter(r => r.status === 'pending').length
  const approvedCount = changeRequests.filter(r => r.status === 'approved').length
  const rejectedCount = changeRequests.filter(r => r.status === 'rejected').length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitPullRequest className="w-5 h-5" />
            <span>Change Requests</span>
            <Badge className="bg-gray-100 text-gray-700">
              {changeRequests.length} total
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-yellow-100 text-yellow-800">
              {pendingCount} pending
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {approvedCount} approved
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              {rejectedCount} rejected
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-40"
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={priorityOptions}
              className="w-40"
            />
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search change requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Change Requests List */}
        {filteredChangeRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitPullRequest className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No change requests found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChangeRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          Change Request #{request.id.slice(0, 8)}
                        </h4>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Test Case:</span> {request.testCaseId}
                        </div>
                        <div>
                          <span className="font-medium">Requested by:</span> {request.requestedBy}
                        </div>
                        <div>
                          <span className="font-medium">Current Version:</span> v{request.currentVersion}
                        </div>
                        <div>
                          <span className="font-medium">Requested:</span> {formatDate(request.requestedAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onView(request)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </Button>
                      )}
                      
                      {request.status === 'pending' && onApprove && (
                        <Button
                          size="sm"
                          onClick={() => onApprove(request)}
                          className="bg-green-600 hover:bg-green-700 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </Button>
                      )}
                      
                      {request.status === 'pending' && onReject && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReject(request)}
                          className="text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Proposed Changes Summary */}
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Proposed Changes ({request.proposedChanges.length})
                    </h5>
                    <div className="space-y-2">
                      {request.proposedChanges.slice(0, 3).map((change, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">•</span>
                          <span className="font-medium">{change.field}:</span>
                          <span className="text-gray-600">{change.reason}</span>
                        </div>
                      ))}
                      {request.proposedChanges.length > 3 && (
                        <div className="text-sm text-gray-500 italic">
                          +{request.proposedChanges.length - 3} more changes...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Info */}
                  {request.reviewedBy && (
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            Reviewed by: {request.reviewedBy}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">
                            {formatDate(request.reviewedAt!)}
                          </span>
                        </div>
                      </div>
                      {request.reviewComments && (
                        <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                          {request.reviewComments}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 