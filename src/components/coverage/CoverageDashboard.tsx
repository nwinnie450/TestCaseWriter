'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { CoverageStats, calculateDocumentCoverage, formatCoverage, getCoverageColor } from '@/lib/coverage'
import { ChunkCoverageCard } from './ChunkCoverageCard'
import { CoverageBar } from './CoverageBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface CoverageDashboardProps {
  docId: string
  projectId?: string
  onGenerateMore?: (chunkId: string) => void
  isGenerating?: boolean
  className?: string
}

export function CoverageDashboard({
  docId,
  projectId,
  onGenerateMore,
  isGenerating = false,
  className = ''
}: CoverageDashboardProps) {
  const [coverage, setCoverage] = useState<CoverageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load coverage data
  useEffect(() => {
    if (docId) {
      loadCoverage()
    }
  }, [docId, projectId])

  const loadCoverage = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const coverageData = calculateDocumentCoverage(docId, projectId)
      setCoverage(coverageData)
      
    } catch (err) {
      console.error('Failed to load coverage:', err)
      setError(err instanceof Error ? err.message : 'Failed to load coverage')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
              <span className="text-gray-600">Loading coverage data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !coverage) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{error || 'No coverage data available'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lowCoverageChunks = coverage.chunks.filter(c => c.level === 'low')
  const mediumCoverageChunks = coverage.chunks.filter(c => c.level === 'medium')
  const highCoverageChunks = coverage.chunks.filter(c => c.level === 'high')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Coverage Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Test Coverage Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Overall Coverage */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${getCoverageColor(coverage.overall)}`}>
                {formatCoverage(coverage.overall)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Overall Coverage</div>
              <div className="text-xs text-gray-500">
                {coverage.coveredOutlineItems}/{coverage.totalOutlineItems} items
              </div>
            </div>

            {/* Chunks Status */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {coverage.chunks.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Chunks</div>
              <div className="text-xs text-gray-500">
                {highCoverageChunks.length} high, {mediumCoverageChunks.length} medium, {lowCoverageChunks.length} low
              </div>
            </div>

            {/* Gaps */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${lowCoverageChunks.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {lowCoverageChunks.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Needs Attention</div>
              <div className="text-xs text-gray-500">
                {lowCoverageChunks.length === 0 ? 'All chunks covered' : 'Low coverage chunks'}
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {coverage.coveredOutlineItems} of {coverage.totalOutlineItems} items covered
              </span>
            </div>
            <CoverageBar
              coverage={coverage.overall}
              total={coverage.totalOutlineItems}
              covered={coverage.coveredOutlineItems}
              showText={false}
              size="lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chunk-by-Chunk Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Chunk Coverage Details</span>
            </div>
            <button
              onClick={loadCoverage}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Refresh
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {/* Low coverage first (needs attention) */}
            {lowCoverageChunks.map((chunkCoverage) => {
              // Get chunk text for preview
              try {
                const { getChunksByDocId } = require('@/lib/chunking')
                const chunks = getChunksByDocId(docId)
                const chunk = chunks.find((c: any) => c.id === chunkCoverage.chunkId)
                
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      chunkText={chunk?.text}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              } catch (err) {
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              }
            })}

            {/* Medium coverage */}
            {mediumCoverageChunks.map((chunkCoverage) => {
              try {
                const { getChunksByDocId } = require('@/lib/chunking')
                const chunks = getChunksByDocId(docId)
                const chunk = chunks.find((c: any) => c.id === chunkCoverage.chunkId)
                
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      chunkText={chunk?.text}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              } catch (err) {
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              }
            })}

            {/* High coverage last */}
            {highCoverageChunks.map((chunkCoverage) => {
              try {
                const { getChunksByDocId } = require('@/lib/chunking')
                const chunks = getChunksByDocId(docId)
                const chunk = chunks.find((c: any) => c.id === chunkCoverage.chunkId)
                
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      chunkText={chunk?.text}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              } catch (err) {
                return (
                  <div key={chunkCoverage.chunkId} className="p-4">
                    <ChunkCoverageCard
                      coverage={chunkCoverage}
                      onGenerateMore={onGenerateMore}
                      isGenerating={isGenerating}
                    />
                  </div>
                )
              }
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Coverage</p>
                <p className="text-2xl font-bold text-red-600">{lowCoverageChunks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Medium Coverage</p>
                <p className="text-2xl font-bold text-yellow-600">{mediumCoverageChunks.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Coverage</p>
                <p className="text-2xl font-bold text-green-600">{highCoverageChunks.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}