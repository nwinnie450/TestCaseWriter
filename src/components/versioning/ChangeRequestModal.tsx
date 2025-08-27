'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { 
  GitPullRequest, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { TestCase, TestCaseChangeRequest } from '@/types'
import { createChangeRequest } from '@/lib/versioning-utils'

interface ChangeRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (changeRequest: TestCaseChangeRequest) => void
  testCase: TestCase
  className?: string
}

interface ProposedChange {
  field: string
  newValue: any
  reason: string
}

export function ChangeRequestModal({
  isOpen,
  onClose,
  onSubmit,
  testCase,
  className = ''
}: ChangeRequestModalProps) {
  const [proposedChanges, setProposedChanges] = useState<ProposedChange[]>([])
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableFields = [
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'tags', label: 'Tags' },
    { value: 'testSteps', label: 'Test Steps' },
    { value: 'testResult', label: 'Test Result' },
    { value: 'estimatedTime', label: 'Estimated Time' },
    { value: 'module', label: 'Module' },
    { value: 'enhancement', label: 'Enhancement' },
    { value: 'ticketId', label: 'Ticket ID' },
    { value: 'epic', label: 'Epic' },
    { value: 'feature', label: 'Feature' },
    { value: 'qa', label: 'QA Notes' },
    { value: 'remarks', label: 'Remarks' }
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'review', label: 'Review' },
    { value: 'deprecated', label: 'Deprecated' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ]

  const getCurrentValue = (field: string): any => {
    if (field in testCase.data) {
      return testCase.data[field]
    }
    return (testCase as any)[field]
  }

  const getFieldType = (field: string): 'text' | 'select' | 'multiselect' | 'number' | 'textarea' => {
    switch (field) {
      case 'status': return 'select'
      case 'priority': return 'select'
      case 'tags': return 'multiselect'
      case 'estimatedTime': return 'number'
      case 'testSteps': return 'textarea'
      case 'testResult': return 'textarea'
      case 'qa': return 'textarea'
      case 'remarks': return 'textarea'
      default: return 'text'
    }
  }

  const addChange = () => {
    setProposedChanges([
      ...proposedChanges,
      { field: '', newValue: '', reason: '' }
    ])
  }

  const removeChange = (index: number) => {
    setProposedChanges(proposedChanges.filter((_, i) => i !== index))
  }

  const updateChange = (index: number, field: keyof ProposedChange, value: any) => {
    const updated = [...proposedChanges]
    updated[index] = { ...updated[index], [field]: value }
    setProposedChanges(updated)
  }

  const handleSubmit = async () => {
    if (proposedChanges.length === 0) return

    setIsSubmitting(true)
    try {
      const changeRequest = createChangeRequest(
        testCase,
        proposedChanges,
        'current-user-id', // This should come from auth context
        priority
      )
      
      await onSubmit(changeRequest)
      handleClose()
    } catch (error) {
      console.error('Error creating change request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setProposedChanges([])
    setPriority('medium')
    setIsSubmitting(false)
    onClose()
  }

  const renderFieldInput = (field: string, value: any, onChange: (value: any) => void) => {
    const fieldType = getFieldType(field)
    const currentValue = getCurrentValue(field)

    switch (fieldType) {
      case 'select':
        const options = field === 'status' ? statusOptions : priorityOptions
        return (
          <Select
            value={value}
            onChange={onChange}
            options={options}
            placeholder={`Select ${field}...`}
          />
        )
      
      case 'multiselect':
        if (field === 'tags') {
          return (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter tags separated by commas"
              className="w-full"
            />
          )
        }
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field}...`}
            className="w-full"
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            placeholder={`Enter ${field}...`}
            className="w-full"
          />
        )
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        )
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${field}...`}
            className="w-full"
          />
        )
    }
  }

  const isValid = proposedChanges.length > 0 && 
    proposedChanges.every(change => 
      change.field && change.newValue !== undefined && change.newValue !== '' && change.reason
    )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="extra-large"
      className={className}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <GitPullRequest className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Create Change Request
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Test Case Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Test Case: {testCase.module || 'Untitled'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Current Version:</span>
                <Badge className="ml-2 bg-blue-100 text-blue-800">
                  v{testCase.version || 1}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <Badge className={`ml-2 ${
                  testCase.status === 'active' ? 'bg-green-100 text-green-800' :
                  testCase.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  testCase.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {testCase.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-700">Priority:</span>
                <Badge className={`ml-2 ${
                  testCase.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  testCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {testCase.priority}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Modified:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(testCase.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change Request Priority
          </label>
          <Select
            value={priority}
            onChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' }
            ]}
            placeholder="Select priority..."
          />
        </div>

        {/* Proposed Changes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Proposed Changes</h3>
            <Button
              onClick={addChange}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Change</span>
            </Button>
          </div>

          {proposedChanges.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <GitPullRequest className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No changes proposed yet</p>
              <p className="text-sm">Click "Add Change" to start</p>
            </div>
          ) : (
            <div className="space-y-4">
              {proposedChanges.map((change, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Change #{index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChange(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {/* Field Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field to Change
                        </label>
                        <Select
                          value={change.field}
                          onChange={(value) => updateChange(index, 'field', value)}
                          options={availableFields}
                          placeholder="Select field..."
                        />
                      </div>

                      {/* Current Value Display */}
                      {change.field && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Value
                          </label>
                          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                            {change.field === 'tags' && Array.isArray(getCurrentValue(change.field)) 
                              ? getCurrentValue(change.field).join(', ')
                              : String(getCurrentValue(change.field) || 'Not set')
                            }
                          </div>
                        </div>
                      )}

                      {/* New Value Input */}
                      {change.field && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Value
                          </label>
                          {renderFieldInput(
                            change.field,
                            change.newValue,
                            (value) => updateChange(index, 'newValue', value)
                          )}
                        </div>
                      )}

                      {/* Reason */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reason for Change
                        </label>
                        <textarea
                          value={change.reason}
                          onChange={(e) => updateChange(index, 'reason', e.target.value)}
                          placeholder="Explain why this change is needed..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Change Request'}
          </Button>
        </div>
      </div>
    </Modal>
  )
} 