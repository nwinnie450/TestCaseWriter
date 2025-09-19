'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TestCase } from '@/types'
import { calculateCaseSimilarity } from '@/lib/dedupe/similarity'
import { mergeTestCases } from '@/lib/dedupe/merge'
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, Eye, GitMerge } from 'lucide-react'

interface MergeConflict {
  incomingCase: TestCase
  existingCase: TestCase
  similarityScore: number
  conflicts: any[]
}

interface MergeReviewModalProps {
  conflicts: MergeConflict[]
  onResolve: (resolutions: Array<{
    conflict: MergeConflict
    action: 'merge' | 'keep_both' | 'skip'
    mergedCase?: TestCase
  }>) => void
  onClose: () => void
}

export function MergeReviewModal({ conflicts, onResolve, onClose }: MergeReviewModalProps) {
  const [resolutions, setResolutions] = useState<Map<number, {
    action: 'merge' | 'keep_both' | 'skip'
    mergedCase?: TestCase
  }>>(new Map())

  const [expandedConflict, setExpandedConflict] = useState<number | null>(null)

  const handleActionSelect = (conflictIndex: number, action: 'merge' | 'keep_both' | 'skip') => {
    const conflict = conflicts[conflictIndex]
    let mergedCase: TestCase | undefined

    if (action === 'merge') {
      const mergeResult = mergeTestCases(conflict.existingCase, conflict.incomingCase)
      mergedCase = mergeResult.mergedCase
    }

    setResolutions(prev => new Map(prev.set(conflictIndex, { action, mergedCase })))
  }

  const handleResolveAll = () => {
    const finalResolutions = conflicts.map((conflict, index) => ({
      conflict,
      action: resolutions.get(index)?.action || 'skip',
      mergedCase: resolutions.get(index)?.mergedCase
    }))

    onResolve(finalResolutions)
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 0.95) return 'text-red-600 bg-red-100'
    if (score >= 0.88) return 'text-orange-600 bg-orange-100'
    if (score >= 0.75) return 'text-yellow-600 bg-yellow-100'
    return 'text-blue-600 bg-blue-100'
  }

  const renderTestCasePreview = (testCase: TestCase, label: string) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h4 className="font-medium text-sm text-gray-700 mb-2">{label}</h4>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium">Title:</span> {testCase.testCase || testCase.title}</div>
        <div><span className="font-medium">Module:</span> {testCase.module || testCase.category}</div>
        <div><span className="font-medium">Priority:</span> {testCase.priority}</div>
        <div><span className="font-medium">Steps:</span> {(testCase.testSteps || []).length}</div>
        {testCase.qa && <div><span className="font-medium">QA:</span> {testCase.qa}</div>}
        {testCase.remarks && <div><span className="font-medium">Remarks:</span> {testCase.remarks}</div>}
      </div>
    </div>
  )

  const renderMergedPreview = (mergedCase: TestCase) => (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center">
        <GitMerge className="w-4 h-4 mr-1" />
        Merged Result
      </h4>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium">Title:</span> {mergedCase.testCase || mergedCase.title}</div>
        <div><span className="font-medium">Module:</span> {mergedCase.module || mergedCase.category}</div>
        <div><span className="font-medium">Priority:</span> {mergedCase.priority}</div>
        <div><span className="font-medium">Steps:</span> {(mergedCase.testSteps || []).length}</div>
        <div><span className="font-medium">Version:</span> {mergedCase.version}</div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              🔄 Merge Review Required
            </h2>
            <p className="text-sm text-gray-600">
              Found {conflicts.length} similar test case{conflicts.length !== 1 ? 's' : ''} that need review
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <XCircle className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] p-6">
          <div className="space-y-6">
            {conflicts.map((conflict, index) => {
              const resolution = resolutions.get(index)
              const isExpanded = expandedConflict === index

              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(conflict.similarityScore)}`}>
                        {Math.round(conflict.similarityScore * 100)}% Similar
                      </span>
                    </div>
                    <Button
                      onClick={() => setExpandedConflict(isExpanded ? null : index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {conflict.incomingCase.testCase || conflict.incomingCase.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Similar to existing case: {conflict.existingCase.testCase || conflict.existingCase.title}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      {renderTestCasePreview(conflict.existingCase, 'Existing Case')}
                      {renderTestCasePreview(conflict.incomingCase, 'New Case')}
                      {resolution?.action === 'merge' && resolution.mergedCase && (
                        <div className="lg:col-span-2">
                          {renderMergedPreview(resolution.mergedCase)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleActionSelect(index, 'merge')}
                      variant={resolution?.action === 'merge' ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex items-center"
                    >
                      <GitMerge className="w-4 h-4 mr-1" />
                      Merge Cases
                    </Button>
                    <Button
                      onClick={() => handleActionSelect(index, 'keep_both')}
                      variant={resolution?.action === 'keep_both' ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Keep Both
                    </Button>
                    <Button
                      onClick={() => handleActionSelect(index, 'skip')}
                      variant={resolution?.action === 'skip' ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Skip New
                    </Button>
                  </div>

                  {resolution && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium">
                          Action selected: {
                            resolution.action === 'merge' ? 'Merge cases' :
                            resolution.action === 'keep_both' ? 'Keep both cases' :
                            'Skip new case'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {resolutions.size} of {conflicts.length} conflicts resolved
          </div>
          <div className="flex space-x-3">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleResolveAll}
              variant="primary"
              disabled={resolutions.size === 0}
              className="flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Apply Resolutions ({resolutions.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}