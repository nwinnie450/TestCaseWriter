'use client'

import React from 'react'
import { TestCase } from '@/types/index'
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
                  {testCase.id} • {testCase.module || testCase.data?.module || 'General'}
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
          <div className="space-y-6">
            {/* Test Case Title */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Test Case Title</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {testCase.data?.title || testCase.testCase || 'Untitled Test Case'}
                </p>
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
                      <div key={index} className="border-l-4 border-primary-200 pl-4 py-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-800 text-xs font-medium">
                            {step.step}
                          </span>
                          <span className="font-medium text-gray-900">Step {step.step}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No test steps defined</p>
                )}
              </CardContent>
            </Card>


            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="primary"
                onClick={() => onEdit?.(testCase)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Test Case</span>
              </Button>

              <Button
                variant="secondary"
                onClick={handleExportSingle}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}