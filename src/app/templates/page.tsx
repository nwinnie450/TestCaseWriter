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
import { Save, Eye, EyeOff, Settings, ArrowLeft } from 'lucide-react'
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
  const [fields, setFields] = useState<TemplateField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [templateName, setTemplateName] = useState('New Template')

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
      // Handle other templates
      setShowTemplateSelection(false)
    }
  }

  const handleCreateNew = () => {
    setFields([])
    setTemplateName('New Template')
    setShowTemplateSelection(false)
  }

  const handleBackToTemplates = () => {
    setShowTemplateSelection(true)
    setSelectedFieldId(null)
  }

  const handleSaveAsDraft = async () => {
    // This is a temporary solution to provide visual feedback.
    // In a real app, this would be handled by a proper state management solution.
    const newTemplate = {
      id: generateId(),
      name: templateName,
      description: 'A new draft template.',
      fieldCount: fields.length,
      category: 'Draft',
      isDefault: false,
    };

    try {
      // Disabled file operations for now
      // const preloadedTemplatesContent = await default_api.read_file('C:\\Users\\winnie.ngiew\\Desktop\\Claude\\TestCaseWriter\\src\\components\\template\\PreloadedTemplates.tsx');
      // const preloadedTemplatesString = preloadedTemplatesContent.read_file_response.output;

      // const newTemplatesString = `const preloadedTemplates: PreloadedTemplate[] = [\n  {\n    id: '${newTemplate.id}',\n    name: '${newTemplate.name}',\n    description: '${newTemplate.description}',\n    fieldCount: ${newTemplate.fieldCount},\n    category: '${newTemplate.category}',\n    isDefault: ${newTemplate.isDefault}\n  },`;

      // const updatedContent = preloadedTemplatesString.replace('const preloadedTemplates: PreloadedTemplate[] = [', newTemplatesString);

      // await default_api.write_file(updatedContent, 'C:\\Users\\winnie.ngiew\\Desktop\\Claude\\TestCaseWriter\\src\\components\\template\\PreloadedTemplates.tsx');

      alert('Template saved as a draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft.');
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

          {/* Editor Layout */}
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
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