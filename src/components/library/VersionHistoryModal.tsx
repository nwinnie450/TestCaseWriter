'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TestCase, TestCaseVersion } from '@/types'
import { getVersionsForTestCase } from '@/lib/management-storage'
import { GitCommit } from 'lucide-react'

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  testCase: TestCase
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  testCase
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<TestCaseVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Utility function to clean up malformed version data
  const cleanupVersionData = (version: any): TestCaseVersion => {
    return {
      ...version,
      changelog: typeof version.changelog === 'string' ? version.changelog : 'Changes recorded',
      changedFields: Array.isArray(version.changedFields) ? version.changedFields : [],
      createdAt: version.createdAt ? new Date(version.createdAt) : new Date(),
      comments: Array.isArray(version.comments) ? version.comments : []
    }
  }

  useEffect(() => {
    if (isOpen && testCase) {
      loadVersions()
    }
  }, [isOpen, testCase])

  const loadVersions = async () => {
    try {
      setIsLoading(true)
      const testCaseVersions = getVersionsForTestCase(testCase.id)
      
      // Clean up and validate version data structure
      const validatedVersions = testCaseVersions.map(cleanupVersionData)
      
      setVersions(validatedVersions)
      console.log('✅ Loaded versions:', validatedVersions.length)
    } catch (error) {
      console.error('❌ Failed to load versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.warn('Error formatting date:', date, error)
      return 'Invalid date'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Version History - ${testCase.testCase || testCase.data?.title || 'Test Case'}`}>
      <div className="p-6">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading versions...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GitCommit className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No version history available</p>
              <p className="text-xs">This test case hasn't been modified yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => {
                try {
                  return (
                    <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          v{version.version || 1}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        by {version.createdBy || 'Unknown'}
                      </div>
                      
                      {version.changelog && (
                        <div className="text-sm text-gray-700">
                          <strong>Changes:</strong> {version.changelog}
                        </div>
                      )}
                      
                      {version.changedFields && version.changedFields.length > 0 && (
                        <div className="text-sm text-gray-700 mt-2">
                          <strong>Modified Fields:</strong> {version.changedFields.join(', ')}
                        </div>
                      )}
                      
                      {version.changeType && (
                        <div className="text-sm text-gray-600 mt-2">
                          <strong>Type:</strong> {version.changeType}
                        </div>
                      )}
                    </div>
                  )
                } catch (error) {
                  console.error('Error rendering version:', version.id, error)
                  return (
                    <div key={version.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <p className="text-sm text-red-600">Error displaying version {version.version || 'unknown'}</p>
                      <p className="text-xs text-red-500">Please check the console for details</p>
                    </div>
                  )
                }
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
} 