'use client'

import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Upload, 
  FileText, 
  Image, 
  File,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'
import { Document, FileUploadProgress } from '@/types'

interface FileUploadZoneProps {
  onFilesAdded: (files: File[]) => void
  uploadProgress: FileUploadProgress[]
  maxFiles?: number
  maxFileSize?: number
  acceptedTypes?: string[]
  disabled?: boolean
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/markdown',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
]

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type === 'application/pdf') return FileText
  if (type.includes('word') || type.includes('document')) return FileText
  return File
}

function getFileTypeLabel(type: string) {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/msword': 'Word Document',
    'text/markdown': 'Markdown File',
    'text/plain': 'Text File',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image'
  }
  
  return typeMap[type] || 'Unknown File Type'
}

export function FileUploadZone({
  onFilesAdded,
  uploadProgress,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false
}: FileUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      // Handle rejected files
      rejectedFiles.forEach(({ file, errors }) => {
        console.error(`File ${file.name} rejected:`, errors)
      })
    }
    
    if (acceptedFiles.length > 0) {
      onFilesAdded(acceptedFiles)
    }
  }, [onFilesAdded])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open
  } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxFileSize,
    maxFiles: maxFiles - uploadProgress.length,
    disabled,
    noClick: true,
    noKeyboard: true
  })

  const hasFiles = uploadProgress.length > 0
  const canAddMore = uploadProgress.length < maxFiles

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        {...getRootProps()}
        className={`border-2 border-dashed transition-all cursor-pointer ${
          isDragActive && !isDragReject
            ? 'border-primary-400 bg-primary-50'
            : isDragReject
            ? 'border-error-400 bg-error-50'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-300 hover:bg-primary-50/30'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="p-8 text-center">
          <Upload 
            className={`h-12 w-12 mx-auto mb-4 ${
              isDragActive && !isDragReject
                ? 'text-primary-600'
                : isDragReject
                ? 'text-error-600'
                : 'text-gray-400'
            }`} 
          />
          
          <div className="space-y-2">
            {isDragActive && !isDragReject ? (
              <p className="text-lg font-medium text-primary-700">
                Drop files here to upload
              </p>
            ) : isDragReject ? (
              <p className="text-lg font-medium text-error-700">
                Some files are not supported
              </p>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Requirements Documents
                </h3>
                <p className="text-gray-600">
                  Drag & drop files here, or{' '}
                  <button
                    type="button"
                    onClick={open}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                    disabled={disabled || !canAddMore}
                  >
                    browse files
                  </button>
                </p>
              </>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <p>
              Supported formats: PDF, DOCX, MD, TXT, JPG, PNG
            </p>
            <p>
              Maximum file size: {formatBytes(maxFileSize)}
            </p>
            <p>
              Maximum {maxFiles} files total
            </p>
          </div>
          
          {!canAddMore && (
            <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-700">
                Maximum number of files reached. Remove some files to add more.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Upload Progress */}
      {hasFiles && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Uploaded Files ({uploadProgress.length})
              </h3>
              
              {canAddMore && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={open}
                  disabled={disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add More Files
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {uploadProgress.map((item, index) => {
                const FileIcon = getFileIcon(item.file.type)
                
                return (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <FileIcon className="h-8 w-8 text-primary-600 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.file.name}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatBytes(item.file.size)}
                          </span>
                          
                          {item.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-success-600" />
                          )}
                          
                          {item.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-error-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {getFileTypeLabel(item.file.type)}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          {item.status === 'uploading' || item.status === 'processing' ? (
                            <>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8">
                                {item.progress}%
                              </span>
                            </>
                          ) : item.status === 'completed' ? (
                            <span className="text-xs font-medium text-success-600">
                              Ready
                            </span>
                          ) : item.status === 'error' ? (
                            <span className="text-xs font-medium text-error-600">
                              Failed
                            </span>
                          ) : null}
                        </div>
                      </div>
                      
                      {item.error && (
                        <p className="text-xs text-error-600 mt-1">
                          {item.error}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}