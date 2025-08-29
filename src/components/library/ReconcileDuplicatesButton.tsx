'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Merge, Eye, Trash2, RefreshCw } from 'lucide-react'

interface ReconcileStats {
  totalCases: number
  withSimhash: number
  potentialDuplicates: number
  estimatedSavings: number
}

interface ReconcileDuplicatesButtonProps {
  projectId?: string
  onComplete?: (result: { casesRemoved: number; casesMerged: number }) => void
  disabled?: boolean
}

export function ReconcileDuplicatesButton({
  projectId,
  onComplete,
  disabled = false
}: ReconcileDuplicatesButtonProps) {
  const [stats, setStats] = useState<ReconcileStats | null>(null)
  const [isReconciling, setIsReconciling] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Load stats on component mount
  useEffect(() => {
    loadStats()
  }, [projectId])

  const loadStats = async () => {
    try {
      const params = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
      const response = await fetch(`/api/v1/reconcile-duplicates${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load reconciliation stats')
      }
      
      const data = await response.json()
      setStats(data.stats)
      setError(null)
    } catch (err) {
      console.error('Failed to load reconciliation stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    }
  }

  const handlePreview = async () => {
    if (isPreviewing) return

    setIsPreviewing(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/reconcile-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          threshold: 4,
          preview: true
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Preview failed')
      }

      const result = await response.json()
      setPreviewData(result.preview)
      setShowPreview(true)

    } catch (err) {
      console.error('Preview failed:', err)
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleReconcile = async () => {
    if (isReconciling) return

    const confirmed = window.confirm(
      `This will remove approximately ${stats?.potentialDuplicates || 0} duplicate test cases. This action cannot be undone. Continue?`
    )

    if (!confirmed) return

    setIsReconciling(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/reconcile-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          threshold: 4,
          preview: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Reconciliation failed')
      }

      const result = await response.json()
      
      if (result.success && result.result) {
        const { casesRemoved, casesMerged } = result.result
        alert(`✅ Reconciliation complete!\n\n• ${casesMerged} duplicate groups found\n• ${casesRemoved} test cases removed\n• Saved ~${stats?.estimatedSavings || 0}% storage space`)
        
        onComplete?.(result.result)
        await loadStats() // Refresh stats
      } else {
        throw new Error(result.error || 'Reconciliation failed')
      }

    } catch (err) {
      console.error('Reconciliation failed:', err)
      setError(err instanceof Error ? err.message : 'Reconciliation failed')
    } finally {
      setIsReconciling(false)
    }
  }

  if (!stats) {
    return (
      <Button variant="secondary" disabled>
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (stats.potentialDuplicates === 0) {
    return (
      <Button variant="secondary" disabled>
        <Merge className="h-4 w-4 mr-2 text-green-600" />
        No Duplicates Found
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Button
          variant="secondary"
          onClick={handlePreview}
          disabled={disabled || isPreviewing}
        >
          {isPreviewing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Eye className="h-4 w-4 mr-2" />
          )}
          Preview Duplicates
        </Button>

        <Button
          variant="primary"
          onClick={handleReconcile}
          disabled={disabled || isReconciling || stats.potentialDuplicates === 0}
        >
          {isReconciling ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Merge className="h-4 w-4 mr-2" />
          )}
          Reconcile ({stats.potentialDuplicates})
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="text-sm text-gray-600">
        {stats.totalCases} total cases • {stats.potentialDuplicates} duplicates found • ~{stats.estimatedSavings}% savings
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Duplicate Preview</h3>
            
            <div className="mb-4 text-sm text-gray-600">
              Found {previewData.duplicateGroups.length} groups containing {previewData.totalWouldRemove} duplicates
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {previewData.duplicateGroups.map((group: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="font-medium text-green-700 mb-2">
                    ✅ Keeping: {group.duplicates.find((d: any) => d.id === group.keepId)?.testCase?.substring(0, 80)}...
                  </div>
                  <div className="text-sm text-red-600">
                    🗑️ Removing {group.wouldRemove} similar cases:
                    <ul className="ml-4 mt-1">
                      {group.duplicates
                        .filter((d: any) => d.id !== group.keepId)
                        .map((duplicate: any, i: number) => (
                          <li key={i} className="truncate">
                            • {duplicate.testCase?.substring(0, 60)}...
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => {
                setShowPreview(false)
                handleReconcile()
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove {previewData.totalWouldRemove} Duplicates
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}