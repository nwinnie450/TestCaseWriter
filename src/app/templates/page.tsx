'use client'

import React, { useState } from 'react'
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Layout } from '@/components/layout/Layout'
import { FieldPalette } from '@/components/template/FieldPalette'
import { TemplateCanvas } from '@/components/template/TemplateCanvas'
import { PropertyPanel } from '@/components/template/PropertyPanel'
import { PreloadedTemplates } from '@/components/template/PreloadedTemplates'
import { Button } from '@/components/ui/Button'
import { TemplateField } from '@/types'
import { generateId } from '@/lib/utils'
import { Save, Eye, EyeOff, Settings, ArrowLeft, HelpCircle, Lightbulb, X } from 'lucide-react'
import { withAuth } from '@/components/auth/withAuth'

// Load custom template data
const loadCustomTemplate = () => {
  const customTemplateFields: TemplateField[] = [
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
  ]
  
  return customTemplateFields
}

function TemplateEditor() {
  const [showTemplateSelection, setShowTemplateSelection] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [fields, setFields] = useState<TemplateField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [templateName, setTemplateName] = useState('New Template')
  const [showGuidance, setShowGuidance] = useState(true)
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'testCaseId', 'module', 'title', 'steps', 'expectedResult', 'priority', 'status'
  ])

  const selectedField = fields.find(field => field.id === selectedFieldId) || null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    // Handle field reordering within canvas
    if (active.data.current?.type === 'field' && over.data.current?.type === 'field') {
      const oldIndex = fields.findIndex(field => field.id === active.id)
      const newIndex = fields.findIndex(field => field.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        setFields(arrayMove(fields, oldIndex, newIndex))
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    // Handle adding new field from palette to canvas
    if (
      active.data.current?.type === 'field-type' && 
      (over.data.current?.type === 'canvas' || over.data.current?.type === 'field')
    ) {
      const fieldType = active.data.current.fieldType
      
      const newField: TemplateField = {
        id: generateId(),
        type: fieldType.type,
        label: fieldType.defaultConfig.label || fieldType.label,
        placeholder: fieldType.defaultConfig.placeholder,
        required: fieldType.defaultConfig.required || false,
        maxLength: fieldType.defaultConfig.maxLength,
        validation: fieldType.defaultConfig.validation,
        defaultValue: fieldType.defaultConfig.defaultValue,
        options: fieldType.defaultConfig.options,
        width: fieldType.defaultConfig.width || 100,
        order: fields.length
      }

      // Insert at the end or at specific position
      if (over.data.current?.type === 'field') {
        const targetIndex = fields.findIndex(field => field.id === over.id)
        const newFields = [...fields]
        newFields.splice(targetIndex + 1, 0, newField)
        setFields(newFields)
      } else {
        setFields([...fields, newField])
      }
      
      setSelectedFieldId(newField.id)
    }
  }

  const handleUpdateField = (updatedField: TemplateField) => {
    setFields(fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    ))
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  const handleLoadTemplate = (templateId: string) => {
    if (templateId === 'custom_qa_template_v1') {
      const customFields = loadCustomTemplate()
      setFields(customFields)
      setTemplateName('Your Custom QA Template')
      setShowTemplateSelection(false)
    } else {
      // Check if it's a custom template from localStorage
      const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]')
      const customTemplate = customTemplates.find((t: any) => t.id === templateId)

      if (customTemplate) {
        setFields(customTemplate.fields)
        setTemplateName(customTemplate.name)
        setShowTemplateSelection(false)
      } else {
        // Handle other built-in templates
        setShowTemplateSelection(false)
      }
    }
  }

  const handleCreateNew = () => {
    setShowWizard(true)
    setWizardStep(1)
    setShowTemplateSelection(false)
  }

  const handleCreateFromWizard = () => {
    // Build fields from selected checkboxes
    const availableFields = {
      testCaseId: {
        id: generateId(),
        type: 'text' as const,
        label: 'Test Case ID',
        placeholder: 'TC-0001',
        required: true,
        width: 100,
        order: 0
      },
      module: {
        id: generateId(),
        type: 'select' as const,
        label: 'Module',
        required: true,
        options: ['Authentication', 'User Management', 'Dashboard', 'Reports', 'Settings', 'API'],
        width: 100,
        order: 1
      },
      title: {
        id: generateId(),
        type: 'text' as const,
        label: 'Test Case Title',
        placeholder: 'Enter test case title',
        required: true,
        maxLength: 200,
        width: 100,
        order: 2
      },
      preconditions: {
        id: generateId(),
        type: 'textarea' as const,
        label: 'Preconditions',
        placeholder: 'Enter preconditions',
        required: false,
        width: 100,
        order: 3
      },
      steps: {
        id: generateId(),
        type: 'textarea' as const,
        label: 'Test Steps',
        placeholder: 'Step 1: ...\nStep 2: ...',
        required: true,
        width: 100,
        order: 4
      },
      testData: {
        id: generateId(),
        type: 'text' as const,
        label: 'Test Data',
        placeholder: 'Enter test data',
        required: false,
        width: 100,
        order: 5
      },
      expectedResult: {
        id: generateId(),
        type: 'textarea' as const,
        label: 'Expected Result',
        placeholder: 'Enter expected result',
        required: true,
        width: 100,
        order: 6
      },
      priority: {
        id: generateId(),
        type: 'select' as const,
        label: 'Priority',
        required: true,
        options: ['Critical', 'High', 'Medium', 'Low'],
        defaultValue: 'Medium',
        width: 100,
        order: 7
      },
      status: {
        id: generateId(),
        type: 'select' as const,
        label: 'Status',
        required: false,
        options: ['Not Run', 'Pass', 'Fail', 'Blocked', 'Skip'],
        defaultValue: 'Not Run',
        width: 100,
        order: 8
      },
      assignee: {
        id: generateId(),
        type: 'text' as const,
        label: 'Assigned To',
        placeholder: 'QA Engineer name',
        required: false,
        width: 100,
        order: 9
      },
      remarks: {
        id: generateId(),
        type: 'textarea' as const,
        label: 'Remarks',
        placeholder: 'Additional notes',
        required: false,
        maxLength: 1000,
        width: 100,
        order: 10
      }
    }

    const newFields = selectedFields
      .map(fieldKey => availableFields[fieldKey as keyof typeof availableFields])
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)

    // Save template directly from wizard
    const newTemplate = {
      id: generateId(),
      name: templateName,
      description: `Custom template with ${newFields.length} fields`,
      fields: newFields,
      category: 'Custom',
      isDefault: false,
      createdAt: new Date().toISOString(),
    }

    try {
      // Get existing templates from localStorage
      const existingTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]')

      // Add new template
      existingTemplates.push(newTemplate)

      // Save back to localStorage
      localStorage.setItem('customTemplates', JSON.stringify(existingTemplates))

      alert(`Template "${templateName}" created successfully!`)

      // Reset and go back to template selection
      setShowWizard(false)
      setShowTemplateSelection(true)
      setFields([])
      setTemplateName('New Template')
      setSelectedFields(['testCaseId', 'module', 'title', 'steps', 'expectedResult', 'priority', 'status'])
      setWizardStep(1)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template.')
    }
  }

  const handleBackToTemplates = () => {
    setShowTemplateSelection(true)
    setSelectedFieldId(null)
  }

  const handleSaveAsDraft = async () => {
    const newTemplate = {
      id: generateId(),
      name: templateName,
      description: `Custom template with ${fields.length} fields`,
      fields: fields,
      category: 'Custom',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    try {
      // Get existing templates from localStorage
      const existingTemplates = JSON.parse(localStorage.getItem('customTemplates') || '[]')

      // Add new template
      existingTemplates.push(newTemplate)

      // Save back to localStorage
      localStorage.setItem('customTemplates', JSON.stringify(existingTemplates))

      alert(`Template "${templateName}" saved successfully!`);

      // Go back to template selection
      setShowTemplateSelection(true)
      setFields([])
      setTemplateName('New Template')
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template.');
    }
  };

  const handlePublishTemplate = () => {
    // In a real app, this would save to a backend with a 'published' status
    console.log('Publishing template:', { name: templateName, fields });
    alert('Template has been published and is now available to all team members.');
  };

  const breadcrumbs = showTemplateSelection 
    ? [{ label: 'Templates' }]
    : [
        { label: 'Templates', href: '/templates', onClick: handleBackToTemplates },
        { label: templateName }
      ]

  const actions = showTemplateSelection ? null : (
    <div className="flex items-center space-x-3">
      <Button
        variant="secondary"
        onClick={handleBackToTemplates}
        icon={ArrowLeft}
      >
        Back
      </Button>

      <Button
        variant="ghost"
        onClick={() => setShowGuidance(!showGuidance)}
        icon={HelpCircle}
      >
        {showGuidance ? 'Hide Guide' : 'Show Guide'}
      </Button>

      <Button
        variant="secondary"
        onClick={() => setPreviewMode(!previewMode)}
        icon={previewMode ? EyeOff : Eye}
      >
        {previewMode ? 'Edit Mode' : 'Preview'}
      </Button>

      <Button
        variant="primary"
        onClick={handleSaveAsDraft}
        icon={Save}
      >
        Save Template
      </Button>
    </div>
  )

  if (showTemplateSelection) {
    return (
      <Layout
        breadcrumbs={breadcrumbs}
        title="Templates"
        actions={actions}
      >
        <PreloadedTemplates
          onLoadTemplate={handleLoadTemplate}
          onCreateNew={handleCreateNew}
        />
      </Layout>
    )
  }

  if (showWizard) {
    return (
      <Layout
        breadcrumbs={[
          { label: 'Templates', href: '/templates', onClick: () => { setShowWizard(false); setShowTemplateSelection(true) } },
          { label: 'Create Template Wizard' }
        ]}
        title="Create Template - Simple Wizard"
        actions={null}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Steps */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${wizardStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                <span className={wizardStep >= 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}>Choose Fields</span>
              </div>
              <div className="flex-1 h-1 mx-4 bg-gray-200">
                <div className={`h-full ${wizardStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} style={{ width: wizardStep >= 2 ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${wizardStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                <span className={wizardStep >= 2 ? 'text-gray-900 font-medium' : 'text-gray-500'}>Name & Save</span>
              </div>
            </div>

            {/* Step 1: Choose Fields */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Fields for Your Template</h3>
                  <p className="text-sm text-gray-600">Choose which fields you want in your test case template. Essential fields are pre-selected.</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: 'testCaseId', label: 'Test Case ID', recommended: true },
                      { id: 'module', label: 'Module/Component', recommended: true },
                      { id: 'title', label: 'Test Case Title', recommended: true },
                      { id: 'preconditions', label: 'Preconditions', recommended: false },
                      { id: 'steps', label: 'Test Steps', recommended: true },
                      { id: 'testData', label: 'Test Data', recommended: false },
                      { id: 'expectedResult', label: 'Expected Result', recommended: true },
                      { id: 'priority', label: 'Priority', recommended: true },
                      { id: 'status', label: 'Status', recommended: true },
                      { id: 'assignee', label: 'Assigned To', recommended: false },
                      { id: 'remarks', label: 'Remarks/Notes', recommended: false }
                    ].map(field => (
                      <label key={field.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFields([...selectedFields, field.id])
                            } else {
                              setSelectedFields(selectedFields.filter(f => f !== field.id))
                            }
                          }}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <span className="flex-1 text-sm text-gray-700">{field.label}</span>
                        {field.recommended && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">Recommended</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => { setShowWizard(false); setShowTemplateSelection(true) }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setWizardStep(2)} disabled={selectedFields.length === 0}>
                    Next: Name Template
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Name & Save */}
            {wizardStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Name Your Template</h3>
                  <p className="text-sm text-gray-600">Give your template a descriptive name.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Standard Test Case Template"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Template Preview</h4>
                  <p className="text-sm text-gray-600 mb-3">Your template will include {selectedFields.length} fields:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFields.map(fieldId => {
                      const fieldNames: Record<string, string> = {
                        testCaseId: 'Test Case ID',
                        module: 'Module',
                        title: 'Title',
                        preconditions: 'Preconditions',
                        steps: 'Test Steps',
                        testData: 'Test Data',
                        expectedResult: 'Expected Result',
                        priority: 'Priority',
                        status: 'Status',
                        assignee: 'Assigned To',
                        remarks: 'Remarks'
                      }
                      return (
                        <span key={fieldId} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                          {fieldNames[fieldId]}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setWizardStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" onClick={handleCreateFromWizard} disabled={!templateName.trim()}>
                    Create Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      <Layout 
        breadcrumbs={breadcrumbs}
        title="Template Editor"
        actions={actions}
      >
        <div className="space-y-4">
          {/* Template Name */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="text-xl font-semibold bg-transparent border-none outline-none w-full"
                  placeholder="Template Name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {fields.length} fields • Last saved 2 minutes ago
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Settings className="h-4 w-4" />
                <span>Draft</span>
              </div>
            </div>
          </div>

          {/* Quick Start Guidance */}
          {showGuidance && fields.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Lightbulb className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Quick Start Guide
                    </h3>
                    <div className="space-y-3 text-sm text-blue-800">
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                        <p><strong>Drag fields from the left panel</strong> to build your template (e.g., Test Case ID, Title, Steps)</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                        <p><strong>Click on a field</strong> to customize it in the right panel (change label, make required, etc.)</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                        <p><strong>Preview your template</strong> using the Preview button, then save when ready</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>💡 Tip:</strong> Start with a pre-built template from the Templates page, then customize it to your needs!
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowGuidance(false)}
                  className="text-blue-600 hover:text-blue-800 ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Editor Layout */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-400px)]">
            {/* Field Palette - Left Sidebar */}
            <div className="col-span-12 md:col-span-3 lg:col-span-2">
              <FieldPalette />
            </div>

            {/* Template Canvas - Center */}
            <div className="col-span-12 md:col-span-6 lg:col-span-7">
              <TemplateCanvas
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={setSelectedFieldId}
                onDeleteField={handleDeleteField}
                previewMode={previewMode}
              />
            </div>

            {/* Properties Panel - Right Sidebar */}
            <div className="col-span-12 md:col-span-3">
              <PropertyPanel
                field={selectedField}
                onUpdateField={handleUpdateField}
              />
            </div>
          </div>

          {/* Template Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Ready to publish?</h3>
                <p className="text-sm text-gray-600">
                  Publishing will make this template available to all team members.
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button variant="secondary" onClick={handleSaveAsDraft}>
                  Save as Draft
                </Button>
                <Button variant="primary" onClick={handlePublishTemplate}>
                  Publish Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </DndContext>
  )
}

export default withAuth(TemplateEditor)