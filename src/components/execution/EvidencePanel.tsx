'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Upload,
  Image,
  Video,
  FileText,
  File,
  X,
  Eye,
  Download,
  Paperclip,
  Camera,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'

interface Evidence {
  id: string
  filename: string
  url: string
  type: string
  size: number
  mimeType: string
  description?: string
  createdAt: string
  createdBy: string
}

interface EvidencePanelProps {
  runCaseId?: string
  runStepId?: string
  onEvidenceAdded?: (evidence: Evidence) => void
  className?: string
}

export function EvidencePanel({
  runCaseId,
  runStepId,
  onEvidenceAdded,
  className = ''
}: EvidencePanelProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [previewFile, setPreviewFile] = useState<Evidence | null>(null)
  const [description, setDescription] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropzoneRef = useRef<HTMLDivElement>(null)

  // Load existing evidence
  useEffect(() => {
    if (runCaseId || runStepId) {
      loadEvidence()
    }
  }, [runCaseId, runStepId])

  const loadEvidence = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (runCaseId) params.append('runCaseId', runCaseId)
      if (runStepId) params.append('runStepId', runStepId)

      const response = await fetch(`/api/evidence?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEvidence(data.evidence || [])
      }
    } catch (error) {
      console.error('Failed to load evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return

    setUploading(true)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (runCaseId) formData.append('runCaseId', runCaseId)
        if (runStepId) formData.append('runStepId', runStepId)
        if (description) formData.append('description', description)

        const response = await fetch('/api/evidence', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        return response.json()
      })

      const uploadedEvidence = await Promise.all(uploadPromises)

      // Add to evidence list
      setEvidence(prev => [...uploadedEvidence, ...prev])

      // Clear description
      setDescription('')

      // Notify parent
      uploadedEvidence.forEach(ev => {
        onEvidenceAdded?.(ev)
      })

    } catch (error) {
      console.error('Failed to upload evidence:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('Are you sure you want to delete this evidence?')) return

    try {
      const response = await fetch(`/api/evidence?id=${evidenceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEvidence(prev => prev.filter(ev => ev.id !== evidenceId))
      } else {
        throw new Error('Failed to delete evidence')
      }
    } catch (error) {
      console.error('Failed to delete evidence:', error)
      alert('Failed to delete evidence')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
    // Reset input
    e.target.value = ''
  }

  const getFileIcon = (type: string, mimeType: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'log':
        return <FileText className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-green-100 text-green-800'
      case 'video':
        return 'bg-purple-100 text-purple-800'
      case 'log':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith('image/') ||
           mimeType.startsWith('video/') ||
           mimeType === 'application/pdf' ||
           mimeType.startsWith('text/')
  }

  return (
    <div className={className}>
      <Card className="border-2 border-dashed border-gray-300">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Evidence
            {evidence.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {evidence.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <div
            ref={dropzoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.txt,.json,.html,.log"
              onChange={handleFileSelect}
              className="hidden"
            />

            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-600">Uploading files...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drag and drop files here, or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500">
                  Images, videos, PDFs, logs (max 10MB per file)
                </p>
              </div>
            )}
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Describe what this evidence shows..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Evidence List */}
          {loading ? (
            <div className="text-center py-4">
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-1">Loading evidence...</p>
            </div>
          ) : evidence.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700">Attached Evidence</h4>
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                >
                  <div className="flex-shrink-0">
                    <Badge className={`text-xs ${getFileTypeColor(item.type)}`}>
                      {getFileIcon(item.type, item.mimeType)}
                      <span className="ml-1">{item.type}</span>
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(item.size)}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {canPreview(item.mimeType) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPreviewFile(item)}
                        className="text-xs px-2 py-1"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(item.url, '_blank')}
                      className="text-xs px-2 py-1"
                    >
                      <Download className="w-3 h-3" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteEvidence(item.id)}
                      className="text-xs px-2 py-1 text-red-600 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No evidence attached yet</p>
            </div>
          )}

          {/* Quick Upload Buttons */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 text-xs"
            >
              <Upload className="w-3 h-3 mr-1" />
              Add Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{previewFile.filename}</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              {previewFile.mimeType.startsWith('image/') && (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  className="max-w-full h-auto mx-auto"
                />
              )}

              {previewFile.mimeType.startsWith('video/') && (
                <video
                  src={previewFile.url}
                  controls
                  className="max-w-full h-auto mx-auto"
                >
                  Your browser does not support the video tag.
                </video>
              )}

              {previewFile.mimeType === 'application/pdf' && (
                <iframe
                  src={previewFile.url}
                  className="w-full h-96"
                  title={previewFile.filename}
                />
              )}

              {previewFile.mimeType.startsWith('text/') && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-600 mb-2">Text file content:</p>
                  <iframe
                    src={previewFile.url}
                    className="w-full h-64 bg-white border rounded"
                    title={previewFile.filename}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                {formatFileSize(previewFile.size)} • {previewFile.mimeType}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open(previewFile.url, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}