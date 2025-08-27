'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Type, 
  AlignLeft, 
  ChevronDown, 
  CheckSquare, 
  Hash, 
  Calendar, 
  Upload,
  Table,
  ToggleLeft
} from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { TemplateField } from '@/types'
import { generateId } from '@/lib/utils'

interface FieldTypeConfig {
  type: TemplateField['type']
  label: string
  icon: React.ComponentType<any>
  description: string
  defaultConfig: Partial<TemplateField>
}

const fieldTypes: FieldTypeConfig[] = [
  {
    type: 'text',
    label: 'Text Field',
    icon: Type,
    description: 'Single line text input',
    defaultConfig: {
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
      maxLength: 100
    }
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: AlignLeft,
    description: 'Multi-line text input',
    defaultConfig: {
      label: 'Text Area',
      placeholder: 'Enter description...',
      required: false,
      maxLength: 500
    }
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: ChevronDown,
    description: 'Single selection dropdown',
    defaultConfig: {
      label: 'Dropdown',
      required: false,
      options: [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
        { label: 'Option 3', value: 'opt3' }
      ]
    }
  },
  {
    type: 'multiselect',
    label: 'Multi-Select',
    icon: CheckSquare,
    description: 'Multiple selection dropdown',
    defaultConfig: {
      label: 'Multi-Select',
      required: false,
      options: [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2' },
        { label: 'Option 3', value: 'opt3' }
      ]
    }
  },
  {
    type: 'number',
    label: 'Number',
    icon: Hash,
    description: 'Numeric input field',
    defaultConfig: {
      label: 'Number',
      placeholder: '0',
      required: false
    }
  },
  {
    type: 'date',
    label: 'Date',
    icon: Calendar,
    description: 'Date picker input',
    defaultConfig: {
      label: 'Date',
      required: false
    }
  },
  {
    type: 'boolean',
    label: 'Toggle',
    icon: ToggleLeft,
    description: 'Boolean toggle switch',
    defaultConfig: {
      label: 'Toggle',
      required: false,
      defaultValue: false
    }
  },
  {
    type: 'file',
    label: 'File Upload',
    icon: Upload,
    description: 'File upload field',
    defaultConfig: {
      label: 'File Upload',
      required: false
    }
  },
  {
    type: 'table',
    label: 'Table',
    icon: Table,
    description: 'Data table with rows/columns',
    defaultConfig: {
      label: 'Table',
      required: false
    }
  }
]

interface DraggableFieldTypeProps {
  fieldType: FieldTypeConfig
}

function DraggableFieldType({ fieldType }: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-type-${fieldType.type}`,
    data: {
      type: 'field-type',
      fieldType: fieldType
    }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const Icon = fieldType.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 border border-gray-200 rounded-lg bg-white hover:border-primary-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-primary-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{fieldType.label}</p>
          <p className="text-xs text-gray-500 truncate">{fieldType.description}</p>
        </div>
      </div>
    </div>
  )
}

export function FieldPalette() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Field Types</CardTitle>
        <p className="text-sm text-gray-600">Drag fields to the template canvas</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fieldTypes.map((fieldType) => (
            <DraggableFieldType 
              key={fieldType.type} 
              fieldType={fieldType} 
            />
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Tips</h4>
          <ul className="space-y-2 text-xs text-gray-600">
            <li>• Drag fields onto the canvas to add them</li>
            <li>• Use the properties panel to configure fields</li>
            <li>• Text fields support validation patterns</li>
            <li>• Tables can have custom column definitions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}