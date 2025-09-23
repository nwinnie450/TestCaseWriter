'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TestCase } from '@/types/index'
import { 
  Edit, 
  X, 
  Plus, 
  Save,
  Users,
  Hash,
  Ticket,
  Tags,
  AlertTriangle,
  Flag,
  CheckCircle,
  Settings
} from 'lucide-react'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTestCases: TestCase[]
  onSave: (updates: Partial<TestCase>) => void
}

export function BulkEditModal({ isOpen, onClose, selectedTestCases, onSave }: BulkEditModalProps) {
  const [priority, setPriority] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [module, setModule] = useState<string>('')
  const [feature, setFeature] = useState<string>('')
  const [enhancement, setEnhancement] = useState<string>('')
  const [ticketId, setTicketId] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [tagAction, setTagAction] = useState<'add' | 'replace' | 'remove'>('add')

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPriority('')
      setStatus('')
      setModule('')
      setFeature('')
      setEnhancement('')
      setTicketId('')
      setTags([])
      setNewTag('')
      setShowAddTag(false)
      setTagAction('add')
    }
  }, [isOpen])

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
      setShowAddTag(false)
    }
  }

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const updates: Partial<TestCase> = {}

    // Only include fields that have been modified
    if (priority) updates.priority = priority as any
    if (status) updates.status = status as any
    if (module) updates.module = module
    if (feature) updates.feature = feature
    if (enhancement) updates.enhancement = enhancement
    if (ticketId) updates.ticketId = ticketId

    // Handle tags based on the selected action
    if (tags.length > 0) {
      (updates as any)._tagAction = tagAction
      updates.tags = tags
    }

    // Update timestamp
    updates.updatedAt = new Date()
    updates.lastModifiedBy = 'user' // In a real app, this would be the current user

    onSave(updates)
    onClose()
  }

  const getUniqueValues = (field: keyof TestCase) => {
    const values = selectedTestCases
      .map(tc => tc[field])
      .filter((value, index, arr) => value && arr.indexOf(value) === index)
    return values as string[]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'review': return 'bg-blue-100 text-blue-800'
      case 'deprecated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Edit className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Bulk Edit Test Cases</h2>
              <p className="text-sm text-gray-600">
                Editing {selectedTestCases.length} selected test case{selectedTestCases.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Values Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Current Values in Selection</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Priorities: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {getUniqueValues('priority').map(p => (
                  <Badge key={p} className={getPriorityColor(p)}>{p}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Statuses: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {getUniqueValues('status').map(s => (
                  <Badge key={s} className={getStatusColor(s)}>{s}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
          {/* Priority and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="inline h-4 w-4 mr-1" />
                Priority
              </label>
              <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="input w-full"
              >
                <option value="">Keep current values</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Status
              </label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="input w-full"
              >
                <option value="">Keep current values</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
          </div>

          {/* Module and Feature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="inline h-4 w-4 mr-1" />
                Module
              </label>
              <input
                type="text"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                placeholder="e.g., Usage Control Settings, API Key Controls"
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Feature
              </label>
              <input
                type="text"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="e.g., Token Per Minute Setting, API Key Creation"
                className="input w-full"
              />
            </div>
          </div>

          {/* Enhancement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Ticket className="inline h-4 w-4 mr-1" />
              Enhancement
            </label>
            <input
              type="text"
              value={enhancement}
              onChange={(e) => setEnhancement(e.target.value)}
              placeholder="e.g., Performance improvement, UI enhancement"
              className="input w-full"
            />
          </div>

          {/* Ticket ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline h-4 w-4 mr-1" />
              Ticket/Issue ID
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g., JIRA-123, GH-456, TASK-789"
              className="input w-full"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                <Tags className="inline h-4 w-4 mr-1" />
                Tags
              </label>
              <select 
                value={tagAction} 
                onChange={(e) => setTagAction(e.target.value as any)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="add">Add to existing tags</option>
                <option value="replace">Replace all tags</option>
                <option value="remove">Remove these tags</option>
              </select>
            </div>

            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(index)}
                      className="ml-1 h-3 w-3 rounded-full text-primary-600 hover:text-primary-800 hover:bg-primary-200"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Tag Input */}
            {showAddTag ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Enter tag name..."
                  className="input flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddTag}>
                  Add
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setShowAddTag(false)
                    setNewTag('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddTag(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            )}

            <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Tag Action: {tagAction === 'add' ? 'Add' : tagAction === 'replace' ? 'Replace' : 'Remove'}</p>
                  <p>
                    {tagAction === 'add' && 'New tags will be added to existing tags on each test case.'}
                    {tagAction === 'replace' && 'All existing tags will be replaced with the new tags.'}
                    {tagAction === 'remove' && 'Specified tags will be removed from test cases that have them.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Changes will be applied to {selectedTestCases.length} test case{selectedTestCases.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}