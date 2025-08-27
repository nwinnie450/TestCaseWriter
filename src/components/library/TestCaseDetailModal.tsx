'use client'

import React from 'react'
import { TestCase } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  X, 
  Edit, 
  Copy, 
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  List,
  MessageSquare,
  Tag
} from 'lucide-react'

interface TestCaseDetailModalProps {
  testCase: TestCase | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (testCase: TestCase) => void
  onExport?: (testCaseIds: string[]) => void
}

export function TestCaseDetailModal({ 
  testCase, 
  isOpen, 
  onClose, 
  onEdit, 
  onExport 
}: TestCaseDetailModalProps) {
  if (!isOpen || !testCase) {
    return null
  }

  const getResultIcon = (result: string) => {
    switch (result.toLowerCase()) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getResultColor = (result: string) => {
    switch (result.toLowerCase()) {
      case 'pass':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'fail':
        return 'bg-red-50 text-red-800 border-red-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleExportSingle = () => {
    onExport?.([testCase.id])
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-primary-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                  Test Case Details
                </h3>
                <p className="text-sm text-gray-500">
                  {testCase.id} • {testCase.module}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyToClipboard(testCase.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleExportSingle}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onEdit?.(testCase)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Test Case Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Test Case Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Case Description
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {testCase.testCase}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Module
                    </label>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {testCase.module}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Test Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <List className="h-5 w-5" />
                    <span>Test Steps</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testCase.testSteps && testCase.testSteps.length > 0 ? (
                    <div className="space-y-3">
                      {testCase.testSteps.map((step, index) => (
                        <div key={index} className="border-l-4 border-primary-200 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-medium">
                                  {step.step}
                                </span>
                                <span className="font-medium text-gray-900">Step {step.step}</span>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-2">
                                {step.description}
                              </p>
                              
                              {step.testData && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium text-gray-500">Test Data:</span>
                                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                                    {step.testData}
                                  </p>
                                </div>
                              )}
                              
                              <div>
                                <span className="text-xs font-medium text-gray-500">Expected Result:</span>
                                <p className="text-xs text-gray-600 bg-green-50 p-2 rounded mt-1">
                                  {step.expectedResult}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No test steps defined</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center space-x-2 p-3 rounded-lg border ${getResultColor(testCase.testResult)}`}>
                    {getResultIcon(testCase.testResult)}
                    <span className="font-medium">{testCase.testResult}</span>
                  </div>
                </CardContent>
              </Card>

              {/* QA Notes */}
              {testCase.qa && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <MessageSquare className="h-4 w-4" />
                      <span>QA Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg">
                      {testCase.qa}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Remarks */}
              {testCase.remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <FileText className="h-4 w-4" />
                      <span>Remarks</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">
                      {testCase.remarks}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => onEdit?.(testCase)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Test Case
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleExportSingle}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export This Test Case
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}