'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  History, 
  GitBranch, 
  CheckCircle, 
  Clock, 
  User, 
  MessageSquare,
  Eye,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'
import { TestCaseVersion, VersionComment } from '@/types'
import { canRevertToVersion, compareVersions } from '@/lib/versioning-utils'

interface VersionHistoryProps {
  versions: TestCaseVersion[]
  currentVersion: number
  onRevert?: (version: TestCaseVersion) => void
  onViewVersion?: (version: TestCaseVersion) => void
  className?: string
}

export function VersionHistory({
  versions,
  currentVersion,
  onRevert,
  onViewVersion,
  className = ''
}: VersionHistoryProps) {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)
  const [showComments, setShowComments] = useState<string | null>(null)

  const sortedVersions = versions.sort((a, b) => b.version - a.version)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'deprecated': return 'bg-red-100 text-red-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'create': return <GitBranch className="w-4 h-4" />
      case 'update': return <History className="w-4 h-4" />
      case 'revert': return <RotateCcw className="w-4 h-4" />
      case 'status_change': return <CheckCircle className="w-4 h-4" />
      case 'priority_change': return <AlertTriangle className="w-4 h-4" />
      default: return <History className="w-4 h-4" />
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

  const renderVersionComments = (comments: VersionComment[]) => {
    if (comments.length === 0) {
      return <p className="text-gray-500 text-sm italic">No comments</p>
    }

    return (
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {comment.userName}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              {comment.isResolved && (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  Resolved
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{comment.comment}</p>
            {comment.resolvedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Resolved by {comment.resolvedBy} on {formatDate(comment.resolvedAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderVersionDetails = (version: TestCaseVersion) => {
    const isCurrentVersion = version.version === currentVersion
    const canRevert = onRevert && canRevertToVersion(
      { version: currentVersion } as TestCaseVersion,
      version
    )

    return (
      <div className="space-y-4">
        {/* Version Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {getChangeTypeIcon(version.changeType)}
              <span className="text-lg font-semibold">v{version.version}</span>
              {isCurrentVersion && (
                <Badge className="bg-blue-100 text-blue-800">Current</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(version.status)}>
                {version.status}
              </Badge>
              <Badge className={getPriorityColor(version.priority)}>
                {version.priority}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {onViewVersion && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewVersion(version)}
                className="flex items-center space-x-1"
              >
                <Eye className="w-4 h-4" />
                <span>View</span>
              </Button>
            )}
            {canRevert && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRevert(version)}
                className="flex items-center space-x-1 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Revert</span>
              </Button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Created by: {version.createdBy}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{formatDate(version.createdAt)}</span>
          </div>
          {version.approvedBy && (
            <>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Approved by: {version.approvedBy}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{formatDate(version.approvalDate!)}</span>
              </div>
            </>
          )}
        </div>

        {/* Changelog */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Changes</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            {version.changelog}
          </p>
        </div>

        {/* Changed Fields */}
        {version.changedFields.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Modified Fields</h4>
            <div className="flex flex-wrap gap-2">
              {version.changedFields.map((field) => (
                <Badge key={field} className="bg-blue-100 text-blue-800 text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {version.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {version.tags.map((tag) => (
                <Badge key={tag} className="bg-gray-100 text-gray-700 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Comments</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(showComments === version.id ? null : version.id)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{version.comments?.length || 0}</span>
            </Button>
          </div>
          
          {showComments === version.id && (
            <div className="mt-2">
              {renderVersionComments(version.comments || [])}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="w-5 h-5" />
          <span>Version History</span>
          <Badge className="bg-gray-100 text-gray-700">
            {versions.length} versions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No version history available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedVersions.map((version) => (
              <div key={version.id} className="border border-gray-200 rounded-lg">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getChangeTypeIcon(version.changeType)}
                        <span className="font-medium">v{version.version}</span>
                        {version.version === currentVersion && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(version.status)}>
                          {version.status}
                        </Badge>
                        <Badge className={getPriorityColor(version.priority)}>
                          {version.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(version.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedVersion(
                          expandedVersion === version.id ? null : version.id
                        )}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {expandedVersion === version.id ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {version.changelog}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {version.createdBy}</span>
                    {version.isApproved && (
                      <span className="flex items-center space-x-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Approved</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {expandedVersion === version.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {renderVersionDetails(version)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 