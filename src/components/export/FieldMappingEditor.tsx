'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FieldMapping } from '@/types'
import { 
  ArrowRight, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Link,
  Unlink
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldMappingEditorProps {
  sourceFields: { id: string; label: string; type: string }[]
  targetFields: { id: string; label: string; type: string; required?: boolean }[]
  mappings: FieldMapping[]
  onMappingsChange: (mappings: FieldMapping[]) => void
  format: string
}

const TRANSFORMATION_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim whitespace' },
  { value: 'custom', label: 'Custom function' }
]

export function FieldMappingEditor({
  sourceFields,
  targetFields,
  mappings,
  onMappingsChange,
  format
}: FieldMappingEditorProps) {
  const [selectedMapping, setSelectedMapping] = useState<number | null>(null)
  const [autoMappingEnabled, setAutoMappingEnabled] = useState(true)

  const handleAddMapping = () => {
    const newMapping: FieldMapping = {
      sourceField: '',
      targetField: '',
      transformation: undefined,
      customTransformation: undefined,
      defaultValue: '',
      required: false
    }
    
    onMappingsChange([...mappings, newMapping])
    setSelectedMapping(mappings.length)
  }

  const handleUpdateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const updatedMappings = mappings.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    )
    onMappingsChange(updatedMappings)
  }

  const handleDeleteMapping = (index: number) => {
    const updatedMappings = mappings.filter((_, i) => i !== index)
    onMappingsChange(updatedMappings)
    if (selectedMapping === index) {
      setSelectedMapping(null)
    }
  }

  const handleAutoMapping = () => {
    const autoMappings: FieldMapping[] = []
    
    sourceFields.forEach(sourceField => {
      // Try to find exact match first
      let targetField = targetFields.find(tf => 
        tf.label.toLowerCase() === sourceField.label.toLowerCase() ||
        tf.id.toLowerCase() === sourceField.id.toLowerCase()
      )
      
      // If no exact match, try partial match
      if (!targetField) {
        targetField = targetFields.find(tf => 
          tf.label.toLowerCase().includes(sourceField.label.toLowerCase()) ||
          sourceField.label.toLowerCase().includes(tf.label.toLowerCase())
        )
      }
      
      if (targetField && !mappings.find(m => m.sourceField === sourceField.id)) {
        autoMappings.push({
          sourceField: sourceField.id,
          targetField: targetField.id,
          transformation: undefined,
          defaultValue: '',
          required: targetField.required || false
        })
      }
    })
    
    onMappingsChange([...mappings, ...autoMappings])
  }

  const getMappingStatus = (mapping: FieldMapping) => {
    if (!mapping.sourceField || !mapping.targetField) {
      return { status: 'incomplete', message: 'Incomplete mapping' }
    }
    
    const sourceField = sourceFields.find(f => f.id === mapping.sourceField)
    const targetField = targetFields.find(f => f.id === mapping.targetField)
    
    if (!sourceField || !targetField) {
      return { status: 'error', message: 'Invalid field reference' }
    }
    
    if (targetField.required && !mapping.sourceField && !mapping.defaultValue) {
      return { status: 'warning', message: 'Required field needs source or default value' }
    }
    
    return { status: 'valid', message: 'Mapping configured correctly' }
  }

  const unmappedSourceFields = sourceFields.filter(sf => 
    !mappings.some(m => m.sourceField === sf.id)
  )
  
  const unmappedTargetFields = targetFields.filter(tf => 
    !mappings.some(m => m.targetField === tf.id)
  )
  
  const requiredTargetFields = targetFields.filter(tf => tf.required)
  const unmappedRequiredFields = requiredTargetFields.filter(tf => 
    !mappings.some(m => m.targetField === tf.id)
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Field Mapping</h3>
          <p className="text-sm text-gray-500">
            Map source fields to {format} format fields
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleAutoMapping}
            disabled={unmappedSourceFields.length === 0}
          >
            <Link className="h-4 w-4 mr-2" />
            Auto Map
          </Button>
          
          <Button variant="secondary" size="sm" onClick={handleAddMapping}>
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
      </div>

      {/* Mapping Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <div>
                <p className="font-medium text-gray-900">{mappings.length} Mappings</p>
                <p className="text-sm text-gray-500">Total configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={unmappedRequiredFields.length > 0 ? 'border-warning-200' : 'border-gray-200'}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className={`h-5 w-5 ${unmappedRequiredFields.length > 0 ? 'text-warning-600' : 'text-success-600'}`} />
              <div>
                <p className="font-medium text-gray-900">{unmappedRequiredFields.length} Required</p>
                <p className="text-sm text-gray-500">Fields unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{unmappedSourceFields.length} Available</p>
                <p className="text-sm text-gray-500">Source fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapping Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Field Mappings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {mappings.map((mapping, index) => {
              const sourceField = sourceFields.find(f => f.id === mapping.sourceField)
              const targetField = targetFields.find(f => f.id === mapping.targetField)
              const status = getMappingStatus(mapping)
              
              return (
                <div
                  key={index}
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition-all',
                    selectedMapping === index 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => setSelectedMapping(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {sourceField?.label || 'Select source...'}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {targetField?.label || 'Select target...'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {status.status === 'valid' && (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      )}
                      {status.status === 'warning' && (
                        <AlertCircle className="h-4 w-4 text-warning-600" />
                      )}
                      {status.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-error-600" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMapping(index)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">{status.message}</div>
                  
                  {mapping.transformation && (
                    <div className="text-xs text-primary-600 mt-1">
                      Transform: {mapping.transformation}
                    </div>
                  )}
                </div>
              )
            })}
            
            {mappings.length === 0 && (
              <div className="text-center py-8">
                <Unlink className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No field mappings configured</p>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleAddMapping}
                  className="mt-2"
                >
                  Add First Mapping
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mapping Details */}
        <Card>
          <CardHeader>
            <CardTitle>Mapping Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMapping !== null && selectedMapping < mappings.length ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Field
                  </label>
                  <select
                    value={mappings[selectedMapping].sourceField}
                    onChange={(e) => handleUpdateMapping(selectedMapping, { sourceField: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select source field...</option>
                    {sourceFields.map(field => (
                      <option key={field.id} value={field.id}>
                        {field.label} ({field.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Field
                  </label>
                  <select
                    value={mappings[selectedMapping].targetField}
                    onChange={(e) => handleUpdateMapping(selectedMapping, { targetField: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select target field...</option>
                    {targetFields.map(field => (
                      <option key={field.id} value={field.id}>
                        {field.label} ({field.type}) {field.required ? '*' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transformation
                  </label>
                  <select
                    value={mappings[selectedMapping].transformation || ''}
                    onChange={(e) => handleUpdateMapping(selectedMapping, { 
                      transformation: e.target.value as any || undefined 
                    })}
                    className="input w-full"
                  >
                    {TRANSFORMATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {mappings[selectedMapping].transformation === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Function
                    </label>
                    <textarea
                      value={mappings[selectedMapping].customTransformation || ''}
                      onChange={(e) => handleUpdateMapping(selectedMapping, { 
                        customTransformation: e.target.value 
                      })}
                      className="input min-h-[80px] font-mono text-sm"
                      placeholder="function transform(value) {&#10;  return value.toUpperCase();&#10;}"
                    />
                  </div>
                )}

                <div>
                  <Input
                    label="Default Value"
                    value={mappings[selectedMapping].defaultValue || ''}
                    onChange={(e) => handleUpdateMapping(selectedMapping, { 
                      defaultValue: e.target.value 
                    })}
                    placeholder="Used when source field is empty"
                    helperText="Optional fallback value"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={mappings[selectedMapping].required}
                    onChange={(e) => handleUpdateMapping(selectedMapping, { 
                      required: e.target.checked 
                    })}
                    className="rounded"
                  />
                  <label htmlFor="required" className="text-sm font-medium text-gray-700">
                    Required mapping
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Select a mapping to configure details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unmapped Fields Warning */}
      {unmappedRequiredFields.length > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-800">
                  Required fields not mapped
                </h4>
                <p className="text-sm text-warning-700 mt-1">
                  The following required fields need to be mapped or have default values:
                </p>
                <ul className="text-sm text-warning-700 mt-2 space-y-1">
                  {unmappedRequiredFields.map(field => (
                    <li key={field.id} className="flex items-center space-x-2">
                      <span>•</span>
                      <span className="font-medium">{field.label}</span>
                      <span className="text-warning-600">({field.type})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}