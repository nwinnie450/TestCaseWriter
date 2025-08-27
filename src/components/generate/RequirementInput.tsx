'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileUploadZone } from '@/components/upload/FileUploadZone'
import { FileUploadProgress } from '@/types'
import { 
  FileText, 
  Edit3, 
  Upload, 
  Type,
  BookOpen,
  FileUp,
  Plus,
  X,
  Copy,
  Clipboard,
  Info,
  DollarSign,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Hash,
  Ticket,
  Tags,
  FolderOpen
} from 'lucide-react'

interface RequirementInputProps {
  completedDocuments: { file: File; content: string }[]
  textRequirements: string[]
  onDocumentsChange: (documents: { file: File; content: string }[]) => void
  onTextRequirementsChange: (requirements: string[]) => void
  uploadProgress: FileUploadProgress[]
  onFileUpload: (files: File[]) => void
  // New metadata fields
  projectId?: string
  enhancement?: string
  ticketId?: string
  tags?: string[]
  onProjectChange?: (projectId: string) => void
  onEnhancementChange?: (enhancement: string) => void
  onTicketIdChange?: (ticketId: string) => void
  onTagsChange?: (tags: string[]) => void
}

export function RequirementInput({
  completedDocuments,
  textRequirements,
  onDocumentsChange,
  onTextRequirementsChange,
  uploadProgress,
  onFileUpload,
  projectId = '',
  enhancement = '',
  ticketId = '',
  tags = [],
  onProjectChange = () => {},
  onEnhancementChange = () => {},
  onTicketIdChange = () => {},
  onTagsChange = () => {}
}: RequirementInputProps) {
  const [inputMode, setInputMode] = useState<'upload' | 'text' | 'both'>('upload')
  const [newTextRequirement, setNewTextRequirement] = useState('')
  const [showAddText, setShowAddText] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showAddTag, setShowAddTag] = useState(false)
  const [projects, setProjects] = useState<Array<{id: string, name: string, status: string}>>([])

  // Load projects from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('testCaseWriter_projects')
      if (stored) {
        const parsedProjects = JSON.parse(stored)
        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active')
        setProjects(activeProjects)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }, [])

  const handleAddTextRequirement = () => {
    if (newTextRequirement.trim()) {
      onTextRequirementsChange([...textRequirements, newTextRequirement.trim()])
      setNewTextRequirement('')
      setShowAddText(false)
    }
  }

  const handleRemoveTextRequirement = (index: number) => {
    const updated = textRequirements.filter((_, i) => i !== index)
    onTextRequirementsChange(updated)
  }

  const handleEditTextRequirement = (index: number, newValue: string) => {
    const updated = [...textRequirements]
    updated[index] = newValue
    onTextRequirementsChange(updated)
  }

  const handleRemoveDocument = (index: number) => {
    const updated = completedDocuments.filter((_, i) => i !== index)
    onDocumentsChange(updated)
  }

  const handleAddTag = () => {
    console.log('🔍 RequirementInput - handleAddTag called with:', {
      newTag: newTag,
      newTagTrimmed: newTag.trim(),
      currentTags: tags,
      hasValidTag: newTag.trim() && !tags.includes(newTag.trim())
    })
    
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()]
      console.log('🔍 RequirementInput - Adding tag:', newTag.trim())
      console.log('🔍 RequirementInput - Updated tags array:', newTags)
      console.log('🔍 RequirementInput - Calling onTagsChange with:', newTags)
      onTagsChange(newTags)
      setNewTag('')
      setShowAddTag(false)
    } else {
      console.log('🔍 RequirementInput - Tag not added because:', {
        isEmpty: !newTag.trim(),
        alreadyExists: tags.includes(newTag.trim()),
        currentTags: tags
      })
    }
  }

  const handleRemoveTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index)
    console.log('🔍 RequirementInput - Removing tag at index:', index)
    console.log('🔍 RequirementInput - Updated tags array:', updatedTags)
    onTagsChange(updatedTags)
  }

  // Debug logging for props changes
  React.useEffect(() => {
    console.log('🔍 RequirementInput - Props changed:', {
      tags: tags,
      tagsLength: tags.length,
      onTagsChange: typeof onTagsChange
    })
  }, [tags, onTagsChange])

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        setNewTextRequirement(text.trim())
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  const getTotalContentPreview = () => {
    const docContent = completedDocuments.map(doc => doc.content).join('\n\n')
    const textContent = textRequirements.join('\n\n')
    const totalContent = [docContent, textContent].filter(c => c.trim()).join('\n\n')
    const charCount = totalContent.length
    const estimatedTokens = Math.ceil(charCount / 4) // Rough estimate: 4 chars per token
    
    return { charCount, estimatedTokens, hasContent: charCount > 0 }
  }

  const { charCount, estimatedTokens, hasContent } = getTotalContentPreview()

  return (
    <div className="space-y-6">
      {/* Cost Optimization Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <DollarSign className="h-5 w-5" />
            <span>💡 Cost Optimization Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <TrendingDown className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-1">Lowest Cost</h4>
                <p className="text-sm text-green-700 mb-2">Direct text input or plain .txt files</p>
                <div className="text-xs text-green-600 space-y-1">
                  <div>• Full control over content</div>
                  <div>• No extra formatting</div>
                  <div>• Only essential requirements</div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-1">Medium Cost</h4>
                <p className="text-sm text-yellow-700 mb-2">Clean PDFs, simple documents</p>
                <div className="text-xs text-yellow-600 space-y-1">
                  <div>• Some formatting overhead</div>
                  <div>• Minimal metadata</div>
                  <div>• Well-structured content</div>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <TrendingUp className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Higher Cost</h4>
                <p className="text-sm text-red-700 mb-2">Complex Word docs, formatted PDFs</p>
                <div className="text-xs text-red-600 space-y-1">
                  <div>• Lots of formatting</div>
                  <div>• Hidden metadata</div>
                  <div>• Track changes, comments</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>💰 Pro Tip:</strong> For the lowest cost, copy specific sections from your documents and paste them as text requirements instead of uploading entire files.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5" />
            <span>Project Metadata (Optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FolderOpen className="inline h-4 w-4 mr-1" />
                Project (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className="input w-full"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Link test cases to a specific project for better organization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enhancement Field */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ticket className="inline h-4 w-4 mr-1" />
                Enhancement/Feature
              </label>
              <input
                type="text"
                value={enhancement}
                onChange={(e) => onEnhancementChange(e.target.value)}
                placeholder="e.g., User Authentication, Payment Integration"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enhancement or feature name for grouping test cases
              </p>
            </div>

            {/* Ticket ID Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                Ticket/Issue ID
              </label>
              <input
                type="text"
                value={ticketId}
                onChange={(e) => onTicketIdChange(e.target.value)}
                placeholder="e.g., JIRA-123, GH-456, TASK-789"
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reference ticket, issue, or task ID
              </p>
            </div>
            </div>

            {/* Tags Section */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tags className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            
            {/* Existing Tags */}
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
            
            <p className="text-xs text-gray-500 mt-1">
              Add tags for easy filtering and organization (e.g., "frontend", "api", "security")
            </p>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5" />
            <span>How are your requirements documented?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputMode === 'upload'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setInputMode('upload')}
              title="File format affects cost: .txt files are cheapest, complex Word/PDF files cost more due to formatting"
            >
              <div className="absolute top-2 right-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 rounded-full">
                  <DollarSign className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-700">Variable</span>
                </div>
              </div>
              <div className="text-center">
                <FileUp className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Upload Documents</h3>
                <p className="text-sm text-gray-500 mb-2">
                  PDF files, Word docs, specifications
                </p>
                <div className="text-xs text-gray-400">
                  Cost varies by file format
                </div>
              </div>
            </div>

            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputMode === 'text'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setInputMode('text')}
              title="Lowest cost option: You control exactly what content is sent to the AI"
            >
              <div className="absolute top-2 right-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                  <TrendingDown className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-700">Lowest</span>
                </div>
              </div>
              <div className="text-center">
                <Type className="h-8 w-8 text-primary-500 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Type Requirements</h3>
                <p className="text-sm text-gray-500 mb-2">
                  User stories, acceptance criteria, features
                </p>
                <div className="text-xs text-green-600">
                  💰 Most cost-effective
                </div>
              </div>
            </div>

            <div
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                inputMode === 'both'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setInputMode('both')}
              title="Mixed cost: Upload documents for base content, add text for specific requirements to optimize balance"
            >
              <div className="absolute top-2 right-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-full">
                  <Zap className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-700">Balanced</span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex justify-center items-center space-x-1 mb-3">
                  <FileUp className="h-6 w-6 text-primary-500" />
                  <Plus className="h-4 w-4 text-gray-400" />
                  <Type className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Both Methods</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Upload docs + add specific requirements
                </p>
                <div className="text-xs text-blue-600">
                  ⚖️ Best of both worlds
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      {(inputMode === 'upload' || inputMode === 'both') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Requirements Documents</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Info className="h-4 w-4" />
                <span>💡 .txt files = lowest cost</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadZone
              onFilesAdded={onFileUpload}
              uploadProgress={uploadProgress}
              acceptedTypes={['.pdf', '.doc', '.docx', '.txt']}
              maxFiles={5}
            />
            
            {/* Uploaded Documents List */}
            {completedDocuments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Documents:</h4>
                {completedDocuments.map((doc, index) => {
                  const getFileCostInfo = (fileName: string) => {
                    const ext = fileName.toLowerCase().split('.').pop()
                    if (ext === 'txt' || ext === 'md') {
                      return { level: 'low', color: 'green', icon: TrendingDown, label: 'Low cost' }
                    } else if (ext === 'pdf') {
                      return { level: 'medium', color: 'yellow', icon: Zap, label: 'Medium cost' }
                    } else if (ext === 'doc' || ext === 'docx') {
                      return { level: 'high', color: 'red', icon: TrendingUp, label: 'Higher cost' }
                    }
                    return { level: 'unknown', color: 'gray', icon: AlertTriangle, label: 'Unknown cost' }
                  }

                  const costInfo = getFileCostInfo(doc.file.name)
                  const CostIcon = costInfo.icon

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-green-900">{doc.file.name}</p>
                            <div 
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${{
                                'low': 'bg-green-100 text-green-700',
                                'medium': 'bg-yellow-100 text-yellow-700',
                                'high': 'bg-red-100 text-red-700',
                                'unknown': 'bg-gray-100 text-gray-700'
                              }[costInfo.level]}`}
                              title={`${costInfo.label} due to file format`}
                            >
                              <CostIcon className="h-3 w-3" />
                              <span>{costInfo.label}</span>
                            </div>
                          </div>
                          <p className="text-xs text-green-700">
                            {doc.content.length} characters • ~{Math.ceil(doc.content.length / 4)} tokens
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDocument(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Text Requirements Section */}
      {(inputMode === 'text' || inputMode === 'both') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5" />
                <span>Text Requirements</span>
              </div>
              {!showAddText && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddText(true)}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Requirement</span>
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Text Requirement */}
            {showAddText && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-blue-900">
                      Add New Requirement
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={pasteFromClipboard}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Clipboard className="h-4 w-4 mr-1" />
                        Paste
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={newTextRequirement}
                    onChange={(e) => setNewTextRequirement(e.target.value)}
                    placeholder="Example:
• User Story: As a user, I want to login with email and password
• Acceptance Criteria: 
  - Valid credentials redirect to dashboard
  - Invalid credentials show error message
  - Password must be at least 8 characters
• Business Rules: Account locked after 3 failed attempts"
                    className="w-full min-h-[120px] p-3 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-blue-700">
                      {newTextRequirement.length} characters • ~{Math.ceil(newTextRequirement.length / 4)} tokens
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddText(false)
                          setNewTextRequirement('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddTextRequirement}
                        disabled={!newTextRequirement.trim()}
                      >
                        Add Requirement
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Text Requirements */}
            {textRequirements.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Your Requirements:</h4>
                {textRequirements.map((requirement, index) => (
                  <div key={index} className="group relative">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-900 whitespace-pre-wrap">
                            {requirement}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              {requirement.length} characters • ~{Math.ceil(requirement.length / 4)} tokens
                            </p>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(requirement)
                                }}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newValue = prompt('Edit requirement:', requirement)
                                  if (newValue !== null && newValue.trim()) {
                                    handleEditTextRequirement(index, newValue.trim())
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTextRequirement(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {textRequirements.length === 0 && !showAddText && (
              <div className="text-center py-8 text-gray-500">
                <Type className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Text Requirements</h3>
                <p className="text-gray-600 mb-4">Add your requirements, user stories, or acceptance criteria directly as text.</p>
                <Button
                  variant="primary"
                  onClick={() => setShowAddText(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Requirement</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Summary */}
      {hasContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Content Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{completedDocuments.length}</div>
                <div className="text-sm text-gray-500">Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{textRequirements.length}</div>
                <div className="text-sm text-gray-500">Text Requirements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{charCount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">~{estimatedTokens.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Est. Tokens</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">GPT-4o Cost</span>
                </div>
                <div className="text-lg font-bold text-blue-800">
                  ${(estimatedTokens * 0.005 / 1000).toFixed(4)}
                </div>
                <div className="text-xs text-blue-600">Input tokens only</div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Gemini 1.5 Flash</span>
                </div>
                <div className="text-lg font-bold text-green-800">
                  ${(estimatedTokens * 0.00035 / 1000).toFixed(4)}
                </div>
                <div className="text-xs text-green-600">Cheapest option</div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Claude 3 Opus</span>
                </div>
                <div className="text-lg font-bold text-purple-800">
                  ${(estimatedTokens * 0.015 / 1000).toFixed(4)}
                </div>
                <div className="text-xs text-purple-600">Premium option</div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <strong>Note:</strong> These are input token costs only. Output costs (generated test cases) will be added based on the length of generated content. Choose your AI provider in Settings to see exact pricing.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}