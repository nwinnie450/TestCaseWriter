'use client'

import React, { useState, useEffect } from 'react'
import { TestCase, TestStep } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  X, 
  Save, 
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface TestCaseEditModalProps {
  testCase: TestCase | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTestCase: TestCase) => void
}

export function TestCaseEditModal({ 
  testCase, 
  isOpen, 
  onClose, 
  onSave 
}: TestCaseEditModalProps) {
  const [editedTestCase, setEditedTestCase] = useState<TestCase | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (testCase) {
      setEditedTestCase({ ...testCase })
      setHasChanges(false)
    }
  }, [testCase])

  if (!isOpen || !editedTestCase) {
    return null
  }

  const handleSave = () => {
    if (editedTestCase) {
      const updatedTestCase = {
        ...editedTestCase,
        updatedAt: new Date(),
        lastModifiedBy: 'user'
      }
      onSave(updatedTestCase)
      setHasChanges(false)
      onClose()
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      const shouldClose = confirm('You have unsaved changes. Are you sure you want to close without saving?')
      if (shouldClose) {
        onClose()
        setHasChanges(false)
      }
    } else {
      onClose()
    }
  }

  const updateField = (field: string, value: any) => {
    if (editedTestCase) {
      setEditedTestCase(prev => ({ ...prev!, [field]: value }))
      setHasChanges(true)
    }
  }

  const updateDataField = (field: string, value: any) => {
    if (editedTestCase) {
      setEditedTestCase(prev => ({
        ...prev!,
        data: { ...prev!.data, [field]: value }
      }))
      setHasChanges(true)
    }
  }

  const addTestStep = () => {
    if (editedTestCase) {
      const newStep: TestStep = {
        step: (editedTestCase.testSteps?.length || 0) + 1,
        description: '',
        testData: '',
        expectedResult: ''
      }
      const updatedSteps = [...(editedTestCase.testSteps || []), newStep]
      updateField('testSteps', updatedSteps)
    }
  }

  const removeTestStep = (index: number) => {
    if (editedTestCase?.testSteps) {
      const updatedSteps = editedTestCase.testSteps.filter((_, i) => i !== index)
      // Renumber steps
      const renumberedSteps = updatedSteps.map((step, i) => ({ ...step, step: i + 1 }))
      updateField('testSteps', renumberedSteps)
    }
  }

  const updateTestStep = (index: number, field: keyof TestStep, value: string) => {
    if (editedTestCase?.testSteps) {
      const updatedSteps = editedTestCase.testSteps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
      updateField('testSteps', updatedSteps)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 flex items-center" id="modal-title">
                Edit Test Case
                {hasChanges && <AlertCircle className="h-4 w-4 text-orange-500 ml-2" title="Unsaved changes" />}
              </h3>
              <p className="text-sm text-gray-500">{editedTestCase.id}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Case Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editedTestCase.data?.title || editedTestCase.testCase || ''}
                    onChange={(e) => {
                      updateDataField('title', e.target.value)
                      updateField('testCase', e.target.value)
                    }}
                    placeholder="Enter test case title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editedTestCase.data?.description || ''}
                    onChange={(e) => updateDataField('description', e.target.value)}
                    placeholder="Enter test case description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedTestCase.priority || 'medium'}
                      onChange={(e) => updateField('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedTestCase.status || 'draft'}
                      onChange={(e) => updateField('status', e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="review">Review</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feature/Module
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedTestCase.feature || editedTestCase.module || ''}
                      onChange={(e) => {
                        updateField('feature', e.target.value)
                        updateField('module', e.target.value)
                      }}
                      placeholder="e.g., User Management"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enhancement
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedTestCase.enhancement || ''}
                      onChange={(e) => updateField('enhancement', e.target.value)}
                      placeholder="e.g., Performance improvement"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ticket ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editedTestCase.ticketId || ''}
                      onChange={(e) => updateField('ticketId', e.target.value)}
                      placeholder="e.g., JIRA-123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editedTestCase.tags ? editedTestCase.tags.join(', ') : ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                      updateField('tags', tags)
                    }}
                    placeholder="e.g., critical, api, security (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter tags separated by commas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Steps */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Test Steps</CardTitle>
                <Button variant="secondary" size="sm" onClick={addTestStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {editedTestCase.testSteps?.map((step, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Step {step.step}</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeTestStep(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action/Description *
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            value={step.description}
                            onChange={(e) => updateTestStep(index, 'description', e.target.value)}
                            placeholder="Describe what action to perform"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Data
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            value={step.testData || ''}
                            onChange={(e) => updateTestStep(index, 'testData', e.target.value)}
                            placeholder="Enter test data (e.g., username, values to enter)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expected Result *
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            rows={2}
                            value={step.expectedResult}
                            onChange={(e) => updateTestStep(index, 'expectedResult', e.target.value)}
                            placeholder="Describe the expected outcome"
                          />
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <p>No test steps defined.</p>
                      <Button variant="secondary" onClick={addTestStep} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Step
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QA Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editedTestCase.qa || ''}
                    onChange={(e) => updateField('qa', e.target.value)}
                    placeholder="Add any QA notes or special instructions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editedTestCase.remarks || ''}
                    onChange={(e) => updateField('remarks', e.target.value)}
                    placeholder="Add any additional remarks or comments"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}