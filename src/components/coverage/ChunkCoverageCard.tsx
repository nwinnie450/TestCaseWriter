'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, GitBranch, Shield, Layers } from 'lucide-react'
import { ChunkCoverage, formatCoverage, getCoverageColor } from '@/lib/coverage'
import { CoverageBar } from './CoverageBar'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

interface ChunkCoverageCardProps {
  coverage: ChunkCoverage
  chunkText?: string
  onGenerateMore?: (chunkId: string) => void
  isGenerating?: boolean
}

export function ChunkCoverageCard({
  coverage,
  chunkText,
  onGenerateMore,
  isGenerating = false
}: ChunkCoverageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasGaps = coverage.coverage < 1.0
  const isLowCoverage = coverage.level === 'low'

  return (
    <Card className={`${isLowCoverage ? 'border-red-200 bg-red-50/30' : hasGaps ? 'border-yellow-200 bg-yellow-50/30' : 'border-green-200 bg-green-50/30'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            <FileText className="h-4 w-4 text-gray-600" />
            
            <div>
              <h3 className="font-medium text-gray-900">
                Chunk #{coverage.chunkIndex + 1}
              </h3>
              <p className="text-sm text-gray-500">
                {coverage.totalItems} outline items
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className={`text-sm font-medium ${getCoverageColor(coverage.coverage)}`}>
                {formatCoverage(coverage.coverage)}
              </div>
              <div className="text-xs text-gray-500">
                {coverage.coveredItems}/{coverage.totalItems} covered
              </div>
            </div>
            
            {hasGaps && onGenerateMore && (
              <button
                onClick={() => onGenerateMore(coverage.chunkId)}
                disabled={isGenerating}
                className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate More'}
              </button>
            )}
          </div>
        </div>

        {/* Coverage bar */}
        <div className="mt-2">
          <CoverageBar
            coverage={coverage.coverage}
            total={coverage.totalItems}
            covered={coverage.coveredItems}
            showText={false}
            size="md"
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Missing items breakdown */}
            {hasGaps && (
              <div className="bg-white p-3 rounded-md border">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Missing Coverage</h4>
                <div className="space-y-2">
                  {coverage.missing.features.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Layers className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-700">Features:</span>
                        <div className="text-xs text-gray-600 ml-1">
                          {coverage.missing.features.map(id => id.replace('feature.', '')).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {coverage.missing.flows.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <GitBranch className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-700">Flows:</span>
                        <div className="text-xs text-gray-600 ml-1">
                          {coverage.missing.flows.map(id => id.replace('flow.', '')).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {coverage.missing.rules.length > 0 && (
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-700">Rules:</span>
                        <div className="text-xs text-gray-600 ml-1">
                          {coverage.missing.rules.map(id => id.replace('rule.', '')).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chunk preview */}
            {chunkText && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Chunk Content</h4>
                <div className="text-xs text-gray-700 leading-relaxed max-h-24 overflow-y-auto">
                  {chunkText.length > 200 ? chunkText.substring(0, 200) + '...' : chunkText}
                </div>
              </div>
            )}

            {/* Coverage level indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Coverage Level:</span>
              <span className={`px-2 py-1 rounded-full font-medium ${
                coverage.level === 'high' ? 'bg-green-100 text-green-700' :
                coverage.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {coverage.level.charAt(0).toUpperCase() + coverage.level.slice(1)}
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}