'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { RunsService } from '@/lib/runs-service'
import {
  X,
  Save,
  Calendar,
  FileText,
  Users,
  Monitor,
  Settings,
  AlertCircle
} from 'lucide-react'

interface RunEditDialogProps {
  isOpen: boolean
  onClose: () => void
  onRunUpdated: () => void
  run: any // The run object to edit
}

export function RunEditDialog({
  isOpen,
  onClose,
  onRunUpdated,
  run
}: RunEditDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [runName, setRunName] = useState('')
  const [build, setBuild] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('draft')
  const [environments, setEnvironments] = useState<string[]>([])
  const [newEnvironment, setNewEnvironment] = useState('')

  // Common environments
  const commonEnvironments = [
    'SIT',
    'UAT',
    'Production'
  ]

  // Load run data when dialog opens
  useEffect(() => {
    if (isOpen && run) {
      setRunName(run.name || '')
      setBuild(run.build || '')
      setDueDate(run.dueAt ? new Date(run.dueAt).toISOString().slice(0, 16) : '')
      setNotes(run.notes || '')
      setStatus(run.status || 'draft')
      setEnvironments(Array.isArray(run.environments) ? run.environments : [])
      setError('')
    }
  }, [isOpen, run])

  const addEnvironment = (environment: string) => {
    if (environment && !environments.includes(environment)) {
      setEnvironments([...environments, environment])
      setNewEnvironment('')
    }
  }

  const removeEnvironment = (environment: string) => {
    setEnvironments(environments.filter(e => e !== environment))
  }

  const handleUpdate = async () => {
    if (!runName.trim()) {
      setError('Run name is required')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      await RunsService.updateRun(run.id, {
        name: runName.trim(),
        build: build.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        environments: environments.length > 0 ? environments : undefined,
        dueAt: dueDate || undefined
      })

      onRunUpdated()
      onClose()
    } catch (error) {
      console.error('Failed to update run:', error)
      setError(error instanceof Error ? error.message : 'Failed to update run')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">Edit Test Run</h2>
                <p className="text-blue-100">Update run properties and settings</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Run Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Run Name *
              </label>
              <Input
                type="text"
                placeholder="e.g., Sprint 24.3 Regression Test"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                className={!runName.trim() ? 'border-red-300' : ''}
              />
            </div>

            {/* Build */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Build/Version
              </label>
              <Input
                type="text"
                placeholder="e.g., v2.4.1, build-1234"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Environments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Monitor className="w-4 h-4 inline mr-2" />
                Test Environments
              </label>

              {/* Quick Select */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Quick Select:</p>
                <div className="flex gap-2">
                  {commonEnvironments.map((env) => (
                    <Button
                      key={env}
                      variant={environments.includes(env) ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        if (environments.includes(env)) {
                          removeEnvironment(env)
                        } else {
                          addEnvironment(env)
                        }
                      }}
                      className="text-xs"
                    >
                      {env}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Environment */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add custom environment"
                  value={newEnvironment}
                  onChange={(e) => setNewEnvironment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addEnvironment(newEnvironment)
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => addEnvironment(newEnvironment)}
                  disabled={!newEnvironment.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Selected Environments */}
              {environments.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-600 mb-2">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {environments.map((env) => (
                      <Badge
                        key={env}
                        variant="primary"
                        className="flex items-center gap-1"
                      >
                        {env}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeEnvironment(env)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Due Date
              </label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <Textarea
                placeholder="Additional notes about this test run..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Run Info (Read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Run Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Test Cases:</span>
                  <span className="font-medium ml-2">{run?.stats?.totalCases || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium ml-2">
                    {run?.createdAt ? new Date(run.createdAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Project:</span>
                  <span className="font-medium ml-2">{run?.projectId || 'Default'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created By:</span>
                  <span className="font-medium ml-2">{run?.createdBy || 'Admin'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdate}
              disabled={!runName.trim() || isUpdating}
              icon={isUpdating ? undefined : Save}
            >
              {isUpdating ? 'Updating...' : 'Update Run'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}