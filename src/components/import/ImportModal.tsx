'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import {
  Upload,
  FileText,
  X,
  Download,
  Map,
  Eye,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react'
import {
  parseImportFile,
  generateImportPreview,
  transformImportData,
  createTestCaseFromImport,
  generateCSVTemplate,
  generateJSONTemplate,
  validateImportData,
  type ImportPreview,
  type FieldMapping,
  type ImportOptions
} from '@/lib/import-utils'
import { Template, Project } from '@/types'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (testCases: any[]) => void
  templates: Template[]
  projects: Project[]
  currentProjectId?: string
}

export function ImportModal({
  isOpen,
  onClose,
  onImport,
  templates,
  projects,
  currentProjectId
}: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileFormat, setFileFormat] = useState<'csv' | 'json'>('csv')
  const [selectedProject, setSelectedProject] = useState<string>(currentProjectId || '')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [importData, setImportData] = useState<Record<string, any>[]>([])
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'csv',
    projectId: currentProjectId || '',
    skipDuplicates: true,
    validateData: true
  })
  const [importResult, setImportResult] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setErrors([])
    }
  }

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setErrors([])
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleNext = async () => {
    if (step === 'upload') {
      console.log('🔍 Import Debug - Starting file upload step')
      console.log('🔍 Import Debug - File:', file?.name, file?.size, file?.type)
      console.log('🔍 Import Debug - Selected project:', selectedProject)
      console.log('🔍 Import Debug - Selected template:', selectedTemplate)
      console.log('🔍 Import Debug - File format:', fileFormat)
      
      if (!file) {
        console.error('❌ Import Debug - No file selected')
        setErrors(['Please select a file to import'])
        return
      }
      if (!selectedProject) {
        console.error('❌ Import Debug - No project selected')
        setErrors(['Please select a project'])
        return
      }
      if (!selectedTemplate) {
        console.error('❌ Import Debug - No template selected')
        setErrors(['Please select a template'])
        return
      }

      try {
        console.log('🔍 Import Debug - Parsing file...')
        const data = await parseImportFile(file, fileFormat)
        console.log('🔍 Import Debug - Parsed data:', {
          totalRows: data.length,
          sampleRow: data[0],
          availableFields: Object.keys(data[0] || {}),
          allRows: data
        })
        setImportData(data)
        
        const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
        console.log('🔍 Import Debug - Selected template object:', selectedTemplateObj)
        
        if (selectedTemplateObj) {
          console.log('🔍 Import Debug - Generating preview...')
          const previewData = generateImportPreview(data, selectedTemplateObj)
          console.log('🔍 Import Debug - Preview data:', {
            totalRows: previewData.totalRows,
            availableFields: previewData.availableFields,
            suggestedMappings: previewData.suggestedMappings,
            validationErrors: previewData.validationErrors,
            sampleData: previewData.sampleData
          })
          setPreview(previewData)
          setFieldMappings(previewData.suggestedMappings)
          console.log('🔍 Import Debug - Field mappings set:', previewData.suggestedMappings)
        }
        
        setStep('mapping')
        setErrors([])
        console.log('✅ Import Debug - Successfully moved to mapping step')
      } catch (error) {
        console.error('❌ Import Debug - Parse error:', error)
        console.error('❌ Import Debug - Error stack:', error.stack)
        setErrors([`Failed to parse file: ${error.message || error}`])
      }
    } else if (step === 'mapping') {
      console.log('🔍 Import Debug - Moving to preview step')
      console.log('🔍 Import Debug - Current field mappings:', fieldMappings)
      setStep('preview')
    }
  }

  const handleBack = () => {
    if (step === 'mapping') {
      setStep('upload')
    } else if (step === 'preview') {
      setStep('mapping')
    }
  }

  const handleImport = async () => {
    console.log('🔍 Import Debug - Starting import process')
    console.log('🔍 Import Debug - Import data length:', importData.length)
    console.log('🔍 Import Debug - Field mappings:', fieldMappings)
    console.log('🔍 Import Debug - Selected template:', selectedTemplate)
    console.log('🔍 Import Debug - Selected project:', selectedProject)
    
    setStep('importing')
    
    try {
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
      console.log('🔍 Import Debug - Template object:', selectedTemplateObj)
      
      if (!selectedTemplateObj) throw new Error('Template not found')
      
      const testCases = []
      let importedCount = 0
      let skippedCount = 0
      let errorCount = 0
      const errors: string[] = []
      
      console.log('🔍 Import Debug - Processing rows...')
      
      for (let i = 0; i < importData.length; i++) {
        try {
          const row = importData[i]
          console.log(`🔍 Import Debug - Processing row ${i + 1}:`, row)
          
          const transformedData = transformImportData(row, fieldMappings)
          console.log(`🔍 Import Debug - Transformed data for row ${i + 1}:`, transformedData)
          
          const testCase = createTestCaseFromImport(
            transformedData,
            selectedTemplate,
            selectedProject,
            'current-user' // TODO: Get from auth context
          )
          console.log(`🔍 Import Debug - Created test case for row ${i + 1}:`, testCase)
          
          testCases.push(testCase)
          importedCount++
          console.log(`✅ Import Debug - Row ${i + 1} processed successfully`)
        } catch (error) {
          console.error(`❌ Import Debug - Error processing row ${i + 1}:`, error)
          console.error(`❌ Import Debug - Row ${i + 1} data:`, importData[i])
          console.error(`❌ Import Debug - Error stack:`, error.stack)
          errorCount++
          errors.push(`Row ${i + 1}: ${error.message || error}`)
        }
      }
      
      console.log('🔍 Import Debug - Import summary:', {
        importedCount,
        skippedCount,
        errorCount,
        errors,
        totalTestCases: testCases.length
      })
      
      setImportResult({
        success: errorCount === 0,
        importedCount,
        skippedCount,
        errorCount,
        errors
      })
      
      if (testCases.length > 0) {
        console.log('✅ Import Debug - Calling onImport with test cases:', testCases)
        onImport(testCases)
      } else {
        console.warn('⚠️ Import Debug - No test cases to import')
      }
      
      // Wait a moment to show the result, then close
      setTimeout(() => {
        console.log('🔍 Import Debug - Cleaning up and closing modal')
        onClose()
        setStep('upload')
        setFile(null)
        setImportData([])
        setPreview(null)
        setFieldMappings([])
        setImportResult(null)
      }, 2000)
      
    } catch (error) {
      console.error('❌ Import Debug - Import process failed:', error)
      console.error('❌ Import Debug - Error stack:', error.stack)
      setErrors([`Import failed: ${error.message || error}`])
      setStep('preview')
    }
  }

  const updateFieldMapping = (index: number, updates: Partial<FieldMapping>) => {
    const newMappings = [...fieldMappings]
    newMappings[index] = { ...newMappings[index], ...updates }
    setFieldMappings(newMappings)
    
    // Re-validate with updated mappings
    if (preview && importData.length > 0) {
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
      if (selectedTemplateObj) {
        const validationErrors = validateImportData(importData, selectedTemplateObj, newMappings)
        setPreview({...preview, validationErrors})
      }
    }
  }

  const addFieldMapping = () => {
    setFieldMappings([
      ...fieldMappings,
      {
        sourceField: '',
        targetField: '',
        required: false,
        isSystemField: false
      }
    ])
  }

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index))
  }

  // Helper functions for field mapping analysis
  const getUnmappedSourceFields = () => {
    if (!preview) return []
    const mappedSources = fieldMappings.map(m => m.sourceField).filter(Boolean)
    return preview.availableFields.filter(field => !mappedSources.includes(field))
  }

  const getUnmappedTargetFields = () => {
    const systemOptions = getSystemFieldOptions()
    const templateOptions = templates.find(t => t.id === selectedTemplate)?.fields.map(f => ({
      value: f.id,
      label: `${f.label} (Template)`
    })) || []
    
    // Combine and ensure unique values
    const allTargetOptions = [...systemOptions, ...templateOptions]
    const uniqueOptions = allTargetOptions.filter((option, index, array) => 
      array.findIndex(opt => opt.value === option.value) === index
    )
    
    const mappedTargets = fieldMappings.map(m => m.targetField).filter(Boolean)
    return uniqueOptions.filter(option => !mappedTargets.includes(option.value))
  }

  const getRequiredFieldStatus = () => {
    const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
    if (!selectedTemplateObj) return { missing: [], satisfied: [] }
    
    const requiredFields = selectedTemplateObj.fields.filter(f => f.required)
    const systemRequiredFields = ['testCase', 'module'] // Basic required system fields
    
    const mappedTargets = fieldMappings.map(m => m.targetField).filter(Boolean)
    
    const allRequired = [
      ...requiredFields.map(f => ({ id: f.id, label: f.label, type: 'template' })),
      ...systemRequiredFields.map(f => ({ id: f, label: f, type: 'system' }))
    ]
    
    const missing = allRequired.filter(req => !mappedTargets.includes(req.id))
    const satisfied = allRequired.filter(req => mappedTargets.includes(req.id))
    
    return { missing, satisfied }
  }

  const autoMapUnmappedFields = () => {
    const unmappedSources = getUnmappedSourceFields()
    const unmappedTargets = getUnmappedTargetFields()
    
    if (unmappedSources.length === 0 || unmappedTargets.length === 0) return
    
    const newMappings = [...fieldMappings]
    
    // Try to create intelligent mappings based on field names
    unmappedSources.forEach(sourceField => {
      const bestTarget = findBestTargetMatch(sourceField, unmappedTargets)
      if (bestTarget) {
        newMappings.push({
          sourceField,
          targetField: bestTarget.value,
          required: false,
          isSystemField: !bestTarget.label.includes('Template')
        })
        // Remove from unmapped targets
        const targetIndex = unmappedTargets.findIndex(t => t.value === bestTarget.value)
        if (targetIndex > -1) unmappedTargets.splice(targetIndex, 1)
      }
    })
    
    setFieldMappings(newMappings)
    
    // Re-validate with new mappings
    if (preview && importData.length > 0) {
      const selectedTemplateObj = templates.find(t => t.id === selectedTemplate)
      if (selectedTemplateObj) {
        const validationErrors = validateImportData(importData, selectedTemplateObj, newMappings)
        setPreview({...preview, validationErrors})
      }
    }
  }

  const findBestTargetMatch = (sourceField: string, availableTargets: any[]) => {
    const normalizedSource = sourceField.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Direct matches first
    const directMatch = availableTargets.find(target => {
      const normalizedTarget = target.label.toLowerCase().replace(/[^a-z0-9]/g, '')
      return normalizedTarget === normalizedSource || 
             normalizedTarget.includes(normalizedSource) ||
             normalizedSource.includes(normalizedTarget)
    })
    
    if (directMatch) return directMatch
    
    // Partial matches
    const partialMatch = availableTargets.find(target => {
      const normalizedTarget = target.label.toLowerCase().replace(/[^a-z0-9]/g, '')
      const sourceWords = normalizedSource.split(/[^a-z0-9]+/).filter(Boolean)
      const targetWords = normalizedTarget.split(/[^a-z0-9]+/).filter(Boolean)
      
      return sourceWords.some(word => targetWords.some(targetWord => 
        word.includes(targetWord) || targetWord.includes(word)
      ))
    })
    
    return partialMatch || null
  }

  const getSystemFieldOptions = () => [
    { value: 'testCase', label: 'Test Case (ID)' },
    { value: 'module', label: 'Module' },
    { value: 'testStep', label: 'Test Step' },
    { value: 'testStepDescription', label: 'Test Step Description' },
    { value: 'testData', label: 'Test Data' },
    { value: 'expectedResult', label: 'Expected Result' },
    { value: 'testResult', label: 'Test Result' },
    { value: 'qa', label: 'QA' },
    { value: 'remarks', label: 'Remarks' },
    { value: 'testSteps', label: 'Test Steps (Legacy)' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'tags', label: 'Tags' },
    { value: 'ticketId', label: 'Ticket ID' },
    { value: 'enhancement', label: 'Enhancement' },
    { value: 'epic', label: 'Epic' },
    { value: 'feature', label: 'Feature' }
  ]

  const getTransformationOptions = () => [
    { value: '', label: 'No transformation' },
    { value: 'uppercase', label: 'Uppercase' },
    { value: 'lowercase', label: 'Lowercase' },
    { value: 'trim', label: 'Trim whitespace' },
    { value: 'parseSteps', label: 'Parse as test steps' },
    { value: 'parseTags', label: 'Parse as tags' }
  ]

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Import Test Cases
        </h3>
        <p className="text-sm text-gray-600">
          Upload a file to import test cases into your project
        </p>
      </div>

      {/* Project and Template Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project
          </label>
          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects.map(p => ({ value: p.id, label: p.name }))}
            placeholder="Select project"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template
          </label>
          <Select
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={templates.map(t => ({ value: t.id, label: t.name }))}
            placeholder="Select template"
          />
        </div>
      </div>

      {/* File Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File Format
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={fileFormat === 'csv'}
              onChange={(e) => setFileFormat(e.target.value as 'csv' | 'json')}
              className="mr-2"
            />
            CSV
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="json"
              checked={fileFormat === 'json'}
              onChange={(e) => setFileFormat(e.target.value as 'csv' | 'json')}
              className="mr-2"
            />
            JSON
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={fileFormat === 'csv' ? '.csv' : '.json'}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {!file ? (
          <div>
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your {fileFormat.toUpperCase()} file here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse files
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: {fileFormat === 'csv' ? 'CSV' : 'JSON'}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <FileText className="h-8 w-8 text-green-500" />
            <span className="text-sm font-medium text-gray-900">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Download Template */}
      <div className="text-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const template = fileFormat === 'csv' ? generateCSVTemplate() : generateJSONTemplate()
            const filename = `test-case-template.${fileFormat === 'csv' ? 'csv' : 'json'}`
            const mimeType = fileFormat === 'json' ? 'application/json' : 'text/csv'
            
            const blob = new Blob([template], { type: mimeType })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.click()
            window.URL.revokeObjectURL(url)
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Download {fileFormat.toUpperCase()} Template
        </Button>
      </div>
    </div>
  )

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Field Mapping
        </h3>
        <p className="text-sm text-gray-600">
          Map your file columns to test case fields
        </p>
      </div>

      {/* Preview Info */}
      {preview && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Total Rows:</span>
                <span className="ml-2 text-gray-900">{preview.totalRows}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Available Fields:</span>
                <span className="ml-2 text-gray-900">{preview.availableFields.length}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Validation Errors:</span>
                <span className="ml-2 text-gray-900">{preview.validationErrors.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Fields Analysis */}
      {preview && fieldMappings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Unmapped Source Fields */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <h5 className="text-sm font-medium text-orange-800">
                  Unmapped File Columns ({getUnmappedSourceFields().length})
                </h5>
              </div>
              {getUnmappedSourceFields().length > 0 ? (
                <div className="space-y-1">
                  {getUnmappedSourceFields().map((field, index) => (
                    <div key={index} className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-700">
                      {field}
                    </div>
                  ))}
                  <p className="text-xs text-orange-600 mt-2">
                    These columns from your file aren't mapped to any target field yet.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-orange-600">All file columns are mapped!</p>
              )}
            </CardContent>
          </Card>

          {/* Required Fields Status */}
          <Card className={getRequiredFieldStatus().missing.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getRequiredFieldStatus().missing.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <h5 className={`text-sm font-medium ${getRequiredFieldStatus().missing.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                  Required Fields ({getRequiredFieldStatus().missing.length} missing)
                </h5>
              </div>
              {getRequiredFieldStatus().missing.length > 0 ? (
                <div className="space-y-1">
                  {getRequiredFieldStatus().missing.map((field, index) => (
                    <div key={index} className="text-xs bg-red-100 px-2 py-1 rounded text-red-700">
                      {field.label} ({field.type})
                    </div>
                  ))}
                  <p className="text-xs text-red-600 mt-2">
                    These required fields need to be mapped before import.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-green-600">All required fields are mapped!</p>
              )}
            </CardContent>
          </Card>

          {/* Available Target Fields */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <h5 className="text-sm font-medium text-blue-800">
                  Available Target Fields ({getUnmappedTargetFields().length})
                </h5>
              </div>
              {getUnmappedTargetFields().length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {getUnmappedTargetFields().slice(0, 8).map((field, index) => (
                    <div key={index} className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
                      {field.label}
                    </div>
                  ))}
                  {getUnmappedTargetFields().length > 8 && (
                    <p className="text-xs text-blue-600">...and {getUnmappedTargetFields().length - 8} more</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-blue-600">All target fields are in use!</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Field Mappings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-medium text-gray-900">Field Mappings</h4>
          <div className="flex space-x-2">
            {preview && getUnmappedSourceFields().length > 0 && getUnmappedTargetFields().length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={autoMapUnmappedFields}
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto Map
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={addFieldMapping}
            >
              <Map className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {fieldMappings.map((mapping, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Source Field (File Column)
                </label>
                <Select
                  value={mapping.sourceField}
                  onChange={(value) => updateFieldMapping(index, { sourceField: value })}
                  options={preview?.availableFields.map(f => ({ value: f, label: f })) || []}
                  placeholder="Select source field"
                />
              </div>
              
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target Field
                </label>
                <Select
                  value={mapping.targetField}
                  onChange={(value) => updateFieldMapping(index, { targetField: value })}
                  options={(() => {
                    const systemOptions = getSystemFieldOptions()
                    const templateOptions = templates.find(t => t.id === selectedTemplate)?.fields.map(f => ({
                      value: f.id,
                      label: `${f.label} (Template)`
                    })) || []
                    
                    // Combine and ensure unique values
                    const allOptions = [...systemOptions, ...templateOptions]
                    const uniqueOptions = allOptions.filter((option, index, array) => 
                      array.findIndex(opt => opt.value === option.value) === index
                    )
                    
                    return uniqueOptions
                  })()}
                  placeholder="Select target field"
                />
              </div>
              
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Transformation
                </label>
                <Select
                  value={mapping.transformation || ''}
                  onChange={(value) => updateFieldMapping(index, { transformation: value as any || undefined })}
                  options={getTransformationOptions()}
                  placeholder="Transform"
                />
              </div>
              
              <div className="w-20">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Required
                </label>
                <input
                  type="checkbox"
                  checked={mapping.required}
                  onChange={(e) => updateFieldMapping(index, { required: e.target.checked })}
                  className="rounded border-gray-300"
                />
              </div>
              
              <button
                type="button"
                onClick={() => removeFieldMapping(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {preview && preview.validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h4 className="text-sm font-medium text-red-800">Validation Issues</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {preview.validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Import Preview
        </h3>
        <p className="text-sm text-gray-600">
          Review the data before importing
        </p>
      </div>

      {/* Sample Data Preview */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sample Data (First 3 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {preview.availableFields.map(field => (
                      <th key={field} className="text-left py-2 px-3 font-medium text-gray-700">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleData.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {preview.availableFields.map(field => (
                        <td key={field} className="py-2 px-3 text-gray-600">
                          <div className="max-w-xs truncate" title={String(row[field] || '')}>
                            {String(row[field] || '')}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Import Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={importOptions.skipDuplicates}
              onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
              className="rounded border-gray-300 mr-2"
            />
            Skip duplicate test cases
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={importOptions.validateData}
              onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
              className="rounded border-gray-300 mr-2"
            />
            Validate data before import
          </label>
        </CardContent>
      </Card>
    </div>
  )

  const renderImportingStep = () => (
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <h3 className="text-lg font-semibold text-gray-900">
        Importing Test Cases...
      </h3>
      <p className="text-sm text-gray-600">
        Please wait while we process your data
      </p>
    </div>
  )

  const renderSteps = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep()
      case 'mapping':
        return renderMappingStep()
      case 'preview':
        return renderPreviewStep()
      case 'importing':
        return renderImportingStep()
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'upload':
        return file && selectedProject && selectedTemplate
      case 'mapping':
        return fieldMappings.length > 0 && fieldMappings.every(m => m.sourceField && m.targetField)
      case 'preview':
        return true
      default:
        return false
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="extra-large">
      <div className="p-6">
        {renderSteps()}
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h4 className="text-sm font-medium text-red-800">Import Errors</h4>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        {step !== 'importing' && (
          <div className="flex justify-between mt-6">
            <Button
              variant="secondary"
              onClick={step === 'upload' ? onClose : handleBack}
              disabled={step === 'upload'}
            >
              {step === 'upload' ? 'Cancel' : 'Back'}
            </Button>
            
            <div className="flex space-x-3">
              {step === 'preview' && (
                <Button
                  variant="secondary"
                  onClick={handleBack}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Mapping
                </Button>
              )}
              
              <Button
                onClick={step === 'preview' ? handleImport : handleNext}
                disabled={!canProceed()}
                className="min-w-[100px]"
              >
                {step === 'preview' ? 'Import' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}