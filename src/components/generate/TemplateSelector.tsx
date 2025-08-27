'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Template } from '@/types'
import { 
  FileText, 
  Search, 
  Star, 
  Clock, 
  Users,
  Check,
  Filter
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TemplateSelectorProps {
  templates: Template[]
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
  onNext: () => void
  onBack?: () => void
}

// Available templates including your custom template
const availableTemplates: Template[] = [
  {
    id: 'custom_qa_template_v1',
    name: 'Your Custom QA Template',
    description: 'Your exact format: Test Case ID | Module | Test Case | *Test Steps | Test Result | QA | Remarks',
    fields: [
      {
        id: 'field_1',
        type: 'text',
        label: 'Test Case ID',
        placeholder: 'TC-0001',
        required: true,
        validation: { pattern: '^TC-[0-9]{4}$' },
        width: 100,
        order: 0
      },
      {
        id: 'field_2',
        type: 'select',
        label: 'Module',
        required: true,
        options: ['Authentication', 'User Management', 'Dashboard', 'Reports', 'Settings', 'API', 'Integration', 'Security', 'Performance'],
        width: 100,
        order: 1
      },
      {
        id: 'field_3',
        type: 'text',
        label: 'Test Case',
        placeholder: 'Test case title/name',
        required: true,
        maxLength: 200,
        width: 100,
        order: 2
      },
      {
        id: 'field_4',
        type: 'table',
        label: '*Test Steps',
        required: true,
        width: 100,
        order: 3,
        tableConfig: {
          columns: [
            { key: 'step_number', label: 'Step #', type: 'number', width: '60px' },
            { key: 'description', label: 'Test Step Description', type: 'text', width: '300px' },
            { key: 'test_data', label: 'Test Data', type: 'text', width: '200px' },
            { key: 'expected_result', label: 'Expected Result', type: 'text', width: '250px' }
          ]
        }
      },
      {
        id: 'field_5',
        type: 'select',
        label: 'Test Result',
        required: false,
        options: ['Not Executed', 'Pass', 'Fail', 'Blocked', 'Skip'],
        defaultValue: 'Not Executed',
        width: 100,
        order: 4
      },
      {
        id: 'field_6',
        type: 'text',
        label: 'QA',
        placeholder: 'QA Engineer name',
        required: false,
        width: 100,
        order: 5
      },
      {
        id: 'field_7',
        type: 'textarea',
        label: 'Remarks',
        placeholder: 'Additional notes, observations, or comments',
        required: false,
        maxLength: 1000,
        width: 100,
        order: 6
      }
    ],
    version: 1,
    isPublished: true,
    createdAt: new Date('2025-08-25'),
    updatedAt: new Date('2025-08-25'),
    createdBy: 'System'
  },
  {
    id: 'template-1',
    name: 'Basic Test Case Template',
    description: 'Simple template with essential fields for quick test case creation',
    fields: [],
    version: 1,
    isPublished: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'user1'
  },
  {
    id: 'template-2',
    name: 'API Testing Template',
    description: 'Specialized template for API endpoint testing with request/response validation',
    fields: [],
    version: 2,
    isPublished: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'user2'
  },
  {
    id: 'template-3',
    name: 'Security Testing Template',
    description: 'Security-focused template for vulnerability assessments and penetration testing',
    fields: [],
    version: 3,
    isPublished: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-22'),
    createdBy: 'user3'
  }
]

export function TemplateSelector({
  templates = availableTemplates,
  selectedTemplateId,
  onSelectTemplate,
  onNext,
  onBack
}: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'popular'>('all')

  const filteredTemplates = templates.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return template.name.toLowerCase().includes(query) ||
             template.description?.toLowerCase().includes(query)
    }
    return true
  }).sort((a, b) => {
    if (filterBy === 'recent') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
    if (filterBy === 'popular') {
      // For demo purposes, just use template name length as a proxy for popularity
      return b.name.length - a.name.length
    }
    return 0
  })

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="input w-auto"
              >
                <option value="all">All Templates</option>
                <option value="recent">Recently Updated</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplateId === template.id
                ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/30'
                : 'hover:border-primary-300'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {template.name}
                      </h3>
                      {template.id === 'custom_qa_template_v1' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800">
                          Your Format
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>
                
                {selectedTemplateId === template.id && (
                  <div className="flex-shrink-0 p-1 bg-primary-600 rounded-full">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>v{template.version}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>Team</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(template.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 
                `No templates match "${searchQuery}"` : 
                'No templates available'
              }
            </p>
            {searchQuery && (
              <Button
                variant="secondary"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selected Template Summary */}
      {selectedTemplate && (
        <Card className="border-primary-200 bg-primary-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Check className="h-5 w-5 text-primary-600" />
              <span>Selected Template</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Version {selectedTemplate.version}</span>
                <span>•</span>
                <span>Updated {formatDate(selectedTemplate.updatedAt)}</span>
                <span>•</span>
                <span className="text-primary-600 font-medium">Published</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6">
        <div>
          {onBack && (
            <Button variant="secondary" onClick={onBack}>
              Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <p className="text-sm text-gray-600">
            {selectedTemplate ? `Template "${selectedTemplate.name}" selected` : 'Select a template to continue'}
          </p>
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!selectedTemplateId}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}