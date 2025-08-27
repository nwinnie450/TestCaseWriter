'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  size?: 'small' | 'medium' | 'large' | 'extra-large'
  title?: string
  children: React.ReactNode
  hideCloseButton?: boolean
  className?: string
}

export function Modal({ 
  isOpen, 
  onClose, 
  size = 'medium', 
  title, 
  children, 
  hideCloseButton = false,
  className = ''
}: ModalProps) {
  if (!isOpen) {
    return null
  }

  const sizeClasses = {
    small: 'sm:max-w-md',
    medium: 'sm:max-w-lg',
    large: 'sm:max-w-4xl',
    'extra-large': 'sm:max-w-6xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content */}
        <div className={`relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} sm:w-full ${className}`}>
          {/* Header */}
          {(title || !hideCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                  {title}
                </h3>
              )}
              
              {!hideCloseButton && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={title || !hideCloseButton ? '' : 'p-6'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}