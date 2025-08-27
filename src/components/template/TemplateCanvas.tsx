'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TemplateField } from '@/types'
import { 
  Type, 
  AlignLeft, 
  ChevronDown, 
  CheckSquare, 
  Hash, 
  Calendar, 
  Upload,
  Table,
  ToggleLeft,
  GripVertical,
  Settings,
  Trash2,
  Eye,
  Plus
} from 'lucide-react'

const fieldIcons = {
  text: Type,
  textarea: AlignLeft,
  select: ChevronDown,
  multiselect: CheckSquare,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
  file: Upload,
  table: Table
}

interface SortableFieldProps {
  field: TemplateField
  isSelected: boolean
  onSelect: (fieldId: string) => void
  onDelete: (fieldId: string) => void
  previewMode: boolean
}

function SortableField({ field, isSelected, onSelect, onDelete, previewMode }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = fieldIcons[field.type]

  if (previewMode) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <FieldPreview field={field} />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg bg-white transition-all ${
        isSelected 
          ? 'border-primary-500 ring-2 ring-primary-100' 
          : 'border-gray-200 hover:border-gray-300'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={() => onSelect(field.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          <Icon className="h-5 w-5 text-primary-600" />
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{field.label}</p>
            <p className="text-xs text-gray-500 capitalize">{field.type} field</p>
            {field.required && (
              <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-error-700 bg-error-50 rounded">
                Required
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(field.id)
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(field.id)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface FieldPreviewProps {
  field: TemplateField
}

function FieldPreview({ field }: FieldPreviewProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className="input"
            disabled
          />
        )
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            className="input min-h-[80px] resize-none"
            disabled
          />
        )
      
      case 'select':
        return (
          <select className="input" disabled>
            <option>Select an option...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.slice(0, 3).map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" disabled />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )
      
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className="input"
            disabled
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            className="input"
            disabled
          />
        )
      
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded" disabled />
            <span className="text-sm">{field.label}</span>
          </label>
        )
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Upload file</p>
          </div>
        )
      
      case 'table':
        return (
          <div className="border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Column 1</th>
                  <th className="px-3 py-2 text-left">Column 2</th>
                  <th className="px-3 py-2 text-left">Column 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border-t">Sample data</td>
                  <td className="px-3 py-2 border-t">Sample data</td>
                  <td className="px-3 py-2 border-t">Sample data</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      
      default:
        return <div className="text-sm text-gray-500">Unknown field type</div>
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-error-500 ml-1">*</span>}
      </label>
      {renderField()}
    </div>
  )
}

interface TemplateCanvasProps {
  fields: TemplateField[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string | null) => void
  onDeleteField: (fieldId: string) => void
  previewMode: boolean
}

export function TemplateCanvas({ 
  fields, 
  selectedFieldId, 
  onSelectField, 
  onDeleteField, 
  previewMode 
}: TemplateCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'template-canvas',
    data: {
      type: 'canvas'
    }
  })

  const fieldIds = fields.map(field => field.id)

  return (
    <Card className="h-full min-h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Template Canvas</CardTitle>
          <p className="text-sm text-gray-600">
            {previewMode ? 'Preview your template' : 'Build your test case template'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div
          ref={setNodeRef}
          className={`min-h-[400px] space-y-4 p-4 border-2 border-dashed rounded-lg transition-colors ${
            isOver 
              ? 'border-primary-400 bg-primary-50' 
              : fields.length === 0 
                ? 'border-gray-300 bg-gray-50' 
                : 'border-transparent bg-transparent'
          }`}
          onClick={() => onSelectField(null)}
        >
          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Plus className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Building Your Template
              </h3>
              <p className="text-gray-500 mb-4">
                Drag field types from the palette to begin creating your test case template.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>• Text fields for test case titles and descriptions</p>
                <p>• Dropdowns for priority and status selection</p>
                <p>• Tables for test steps and expected results</p>
              </div>
            </div>
          ) : (
            <SortableContext 
              items={fieldIds}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={onSelectField}
                  onDelete={onDeleteField}
                  previewMode={previewMode}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </CardContent>
    </Card>
  )
}