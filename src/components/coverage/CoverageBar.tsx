'use client'

import React from 'react'
import { formatCoverage, getCoverageBgColor } from '@/lib/coverage'

interface CoverageBarProps {
  coverage: number // 0.0 - 1.0
  total: number
  covered: number
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CoverageBar({
  coverage,
  total,
  covered,
  showText = true,
  size = 'md',
  className = ''
}: CoverageBarProps) {
  const percentage = Math.round(coverage * 100)
  const bgColor = getCoverageBgColor(coverage)
  
  // Size variants
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Progress bar */}
      <div className={`flex-1 bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${bgColor} ${sizeClasses[size]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Coverage text */}
      {showText && (
        <div className={`${textSizeClasses[size]} font-medium min-w-0 flex-shrink-0`}>
          <span className={getCoverageBgColor(coverage).replace('bg-', 'text-')}>
            {covered}/{total}
          </span>
          <span className="text-gray-500 ml-1">
            ({formatCoverage(coverage)})
          </span>
        </div>
      )}
    </div>
  )
}