'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { TemplateField, TemplateFieldOption } from '@/types'
import { Plus, Trash2, Settings } from 'lucide-react'

interface PropertyPanelProps {
  field: TemplateField | null
  onUpdateField: (field: TemplateField) => void
}

export function PropertyPanel({ field, onUpdateField }: PropertyPanelProps) {
  const [localField, setLocalField] = useState<TemplateField | null>(field)

  useEffect(() => {
    setLocalField(field)
  }, [field])

  const handleFieldChange = (updates: Partial<TemplateField>) => {
    if (!localField) return
    
    const updatedField = { ...localField, ...updates }
    setLocalField(updatedField)
    onUpdateField(updatedField)
  }

  const handleOptionAdd = () => {
    if (!localField) return
    
    const newOption: TemplateFieldOption = {
      label: `Option ${(localField.options?.length || 0) + 1}`,
      value: `opt${(localField.options?.length || 0) + 1}`
    }
    
    const updatedOptions = [...(localField.options || []), newOption]
    handleFieldChange({ options: updatedOptions })
  }

  const handleOptionUpdate = (index: number, updates: Partial<TemplateFieldOption>) => {
    if (!localField?.options) return
    
    const updatedOptions = localField.options.map((option, i) => 
      i === index ? { ...option, ...updates } : option
    )
    
    handleFieldChange({ options: updatedOptions })
  }

  const handleOptionDelete = (index: number) => {
    if (!localField?.options) return
    
    const updatedOptions = localField.options.filter((_, i) => i !== index)
    handleFieldChange({ options: updatedOptions })
  }

  if (!localField) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Properties</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Settings className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Field Selected
            </h3>
            <p className="text-gray-500">
              Select a field from the canvas to edit its properties.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Field Properties</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Properties */}
        <div>
          <Input
            label="Field Label"
            value={localField.label}
            onChange={(e) => handleFieldChange({ label: e.target.value })}
            placeholder="Enter field label"
            required
          />
        </div>

        {(localField.type === 'text' || localField.type === 'textarea') && (
          <div>
            <Input
              label="Placeholder"
              value={localField.placeholder || ''}
              onChange={(e) => handleFieldChange({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
            />
          </div>
        )}

        {(localField.type === 'text' || localField.type === 'textarea') && (
          <div>
            <Input
              label="Max Length"
              type="number"
              value={localField.maxLength?.toString() || ''}
              onChange={(e) => handleFieldChange({ 
                maxLength: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Maximum character limit"
            />
          </div>
        )}

        {(localField.type === 'text' || localField.type === 'textarea') && (
          <div>
            <Input
              label="Validation Pattern (Regex)"
              value={localField.validation || ''}
              onChange={(e) => handleFieldChange({ validation: e.target.value })}
              placeholder="^[A-Za-z0-9]+$"
              helperText="Regular expression for validation"
            />
          </div>
        )}

        {(localField.type === 'text' || localField.type === 'textarea' || localField.type === 'number') && (
          <div>
            <Input
              label="Default Value"
              value={localField.defaultValue?.toString() || ''}
              onChange={(e) => handleFieldChange({ defaultValue: e.target.value })}
              placeholder="Default value"
            />
          </div>
        )}

        {localField.type === 'boolean' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="defaultBoolean"
              checked={localField.defaultValue || false}
              onChange={(e) => handleFieldChange({ defaultValue: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="defaultBoolean" className="text-sm font-medium text-gray-700">
              Default to checked
            </label>
          </div>
        )}

        {/* Options for select/multiselect fields */}
        {(localField.type === 'select' || localField.type === 'multiselect') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Options</label>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleOptionAdd}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {localField.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) => handleOptionUpdate(index, { label: e.target.value })}
                    />
                    <Input
                      placeholder="Value"
                      value={option.value}
                      onChange={(e) => handleOptionUpdate(index, { value: e.target.value })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOptionDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {(!localField.options || localField.options.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No options added yet</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleOptionAdd}
                  className="mt-2"
                >
                  Add First Option
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Width setting */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field Width
          </label>
          <select
            value={localField.width || 100}
            onChange={(e) => handleFieldChange({ width: parseInt(e.target.value) })}
            className="input"
          >
            <option value={25}>25% (Quarter)</option>
            <option value={33}>33% (Third)</option>
            <option value={50}>50% (Half)</option>
            <option value={66}>66% (Two Thirds)</option>
            <option value={75}>75% (Three Quarters)</option>
            <option value={100}>100% (Full Width)</option>
          </select>
        </div>

        {/* Required field toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="required"
            checked={localField.required}
            onChange={(e) => handleFieldChange({ required: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="required" className="text-sm font-medium text-gray-700">
            Required field
          </label>
        </div>

        {/* Field type display */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Type
          </label>
          <p className="text-sm text-gray-500 capitalize bg-gray-50 px-3 py-2 rounded">
            {localField.type.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
        </div>

        {/* Field ID for reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field ID
          </label>
          <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded font-mono">
            {localField.id}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}