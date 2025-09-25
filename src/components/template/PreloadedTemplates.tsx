'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FileText, Download, Copy, Eye } from 'lucide-react'

interface PreloadedTemplate {
  id: string
  name: string
  description: string
  fieldCount: number
  category: string
  isDefault: boolean
}

const preloadedTemplates: PreloadedTemplate[] = [
  {
    id: 'custom_qa_template_v1',
    name: 'Your Custom QA Template',
    description: 'Custom test case template matching your exact format: Test Case ID, Module, Test Case, Test Steps, Test Result, QA, Remarks',
    fieldCount: 7,
    category: 'QA Standard',
    isDefault: true
  },
  {
    id: 'basic_template',
    name: 'Basic Test Case Template',
    description: 'Simple template with essential fields for quick test case creation',
    fieldCount: 5,
    category: 'General',
    isDefault: false
  },
  {
    id: 'api_testing_template',
    name: 'API Testing Template', 
    description: 'Specialized template for API endpoint testing with request/response validation',
    fieldCount: 8,
    category: 'API Testing',
    isDefault: false
  }
]

interface PreloadedTemplatesProps {
  onLoadTemplate: (templateId: string) => void
  onCreateNew: () => void
}

export function PreloadedTemplates({ onLoadTemplate, onCreateNew }: PreloadedTemplatesProps) {
  const [customTemplates, setCustomTemplates] = React.useState<PreloadedTemplate[]>([])

  React.useEffect(() => {
    // Load custom templates from localStorage
    const stored = localStorage.getItem('customTemplates')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setCustomTemplates(parsed.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          fieldCount: t.fields?.length || 0,
          category: t.category || 'Custom',
          isDefault: false
        })))
      } catch (error) {
        console.error('Error loading custom templates:', error)
      }
    }
  }, [])

  const allTemplates = [...preloadedTemplates, ...customTemplates]

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Choose a Template</h2>
        <p className="text-gray-600 mb-8">
          Start with a pre-built template or create your own from scratch
        </p>

        <Button
          variant="primary"
          onClick={onCreateNew}
          className="mb-8"
        >
          Create New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        Your Format
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-content">
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{template.fieldCount} fields</span>
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{template.category}</span>
              </div>
            </div>
            
            <div className="card-footer">
              <div className="flex items-center space-x-2 w-full">
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => onLoadTemplate(template.id)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Use Template
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(template.id)
                    alert('Template ID copied to clipboard!')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Your Custom Template is Ready!
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              We've pre-configured a template that exactly matches your format:
              <br />
              <strong>Test Case ID | Module | Test Case | *Test Steps | Test Result | QA | Remarks</strong>
            </p>
            <div className="flex items-center space-x-3">
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => onLoadTemplate('custom_qa_template_v1')}
              >
                Load Your Template
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  const templateJson = JSON.stringify({
                    name: 'Your Custom QA Template',
                    fields: ['Test Case ID', 'Module', 'Test Case', '*Test Steps', 'Test Result', 'QA', 'Remarks']
                  }, null, 2)
                  navigator.clipboard.writeText(templateJson)
                  alert('Template configuration copied!')
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Export Config
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}