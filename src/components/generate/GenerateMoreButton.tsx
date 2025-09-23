'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { MoreHorizontal, Play, Clock, CheckCircle } from 'lucide-react'
import { GenerationSettings } from '@/lib/settingsHash'
import { GenerateMoreResponse } from '@/app/api/v1/generate-more/route'
import { generateTestCasesWithAI } from '@/lib/ai-providers'
import { saveGeneratedTestCases } from '@/lib/test-case-storage'
import { buildGenerationPrompt } from '@/lib/prompt/buildGenerationPrompt'
import { TestCase } from '@/types/index'
import { useSettings } from '@/contexts/SettingsContext'

interface ChunkStatus {
  totalChunks: number
  remainingChunks: number
  processedChunks: number
  canGenerateMore: boolean
}

interface GenerateMoreButtonProps {
  docId: string
  projectId?: string
  settings: GenerationSettings
  enhancement?: string
  ticketId?: string
  tags?: string[]
  disabled?: boolean
  onProgress?: (step: string) => void
  onComplete?: (result: GenerateMoreResponse) => void
}

export function GenerateMoreButton({
  docId,
  projectId,
  settings,
  enhancement,
  ticketId,
  tags = [],
  disabled = false,
  onProgress,
  onComplete
}: GenerateMoreButtonProps) {
  const { getAIConfig } = useSettings()
  const [status, setStatus] = useState<ChunkStatus | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<GenerateMoreResponse | null>(null)

  // Load chunk status on mount and when settings change
  useEffect(() => {
    if (docId && settings) {
      loadChunkStatus()
    }
  }, [docId, settings])

  // Helper function to find the correct docId if there's a mismatch
  const findCorrectDocId = async (requestedDocId: string) => {
    if (typeof window === 'undefined' || !localStorage) {
      return requestedDocId
    }
    
    const chunksKey = 'testCaseWriter_requirementChunks'
    const storedChunks = localStorage.getItem(chunksKey)
    const parsedChunks = storedChunks ? JSON.parse(storedChunks) : []
    
    // First, try exact match
    const exactMatch = parsedChunks.filter((c: any) => c.docId === requestedDocId)
    if (exactMatch.length > 0) {
      console.log(`✅ Found exact docId match: ${requestedDocId}`)
      return requestedDocId
    }
    
    // If no exact match, try to find similar docIds
    const uniqueDocIds = Array.from(new Set(parsedChunks.map((c: any) => c.docId)))
    console.log(`🔍 No exact match for ${requestedDocId}, available docIds:`, uniqueDocIds)
    
    // If there's only one docId in storage, use that
    if (uniqueDocIds.length === 1) {
      console.log(`🔄 Using single available docId: ${uniqueDocIds[0]} instead of ${requestedDocId}`)
      return uniqueDocIds[0]
    }
    
    // If there are multiple, try to find a partial match
    const partialMatch = (uniqueDocIds as string[]).find(id => 
      id.includes(requestedDocId.substring(4, 12)) || requestedDocId.includes(id.substring(4, 12))
    )
    
    if (partialMatch) {
      console.log(`🔄 Using partial match docId: ${partialMatch} instead of ${requestedDocId}`)
      return partialMatch
    }
    
    console.log(`⚠️ No matching docId found for ${requestedDocId}`)
    return requestedDocId
  }

  const loadChunkStatus = async () => {
    try {
      const { buildSettingsHash } = await import('@/lib/settingsHash')
      const settingsHash = buildSettingsHash(settings)
      
      // Try to find the correct docId
      const correctDocId = await findCorrectDocId(docId)
      
      console.log(`🔍 GenerateMoreButton - Loading chunk status for docId: ${correctDocId} (requested: ${docId}), settingsHash: ${settingsHash.substring(0, 8)}...`)
      
      // Debug: Check localStorage directly
      if (typeof window !== 'undefined' && localStorage) {
        const chunksKey = 'testCaseWriter_requirementChunks'
        const storedChunks = localStorage.getItem(chunksKey)
        const parsedChunks = storedChunks ? JSON.parse(storedChunks) : []
        
        console.log(`🔍 GenerateMoreButton - localStorage analysis:`, {
          totalChunks: parsedChunks.length,
          uniqueDocIds: Array.from(new Set(parsedChunks.map((c: any) => c.docId))),
          requestedDocId: docId,
          matchingChunks: parsedChunks.filter((c: any) => c.docId === docId).length,
          settingsHash: settingsHash.substring(0, 8) + '...',
          allChunks: parsedChunks.map((c: any) => ({ 
            docId: c.docId?.substring(0, 12) + '...', 
            chunkIndex: c.chunkIndex,
            textLength: c.text?.length || 0
          }))
        })
      }
      
      // Get chunks and runs data to calculate status locally
      let chunks: any[] = []
      let runs: any[] = []
      
      if (typeof window !== 'undefined' && localStorage) {
        const chunksData = localStorage.getItem('testCaseWriter_requirementChunks')
        const runsData = localStorage.getItem('testCaseWriter_generationRuns')
        
        if (chunksData) {
          const allChunks = JSON.parse(chunksData)
          chunks = allChunks.filter((c: any) => c.docId === correctDocId)
        }
        
        if (runsData) {
          runs = JSON.parse(runsData).filter((r: any) => r.docId === correctDocId && r.settingsHash === settingsHash)
        }
      }

      // Calculate status locally instead of calling API for status
      const processedChunkIds = new Set(runs.map((r: any) => r.chunkId))
      const remainingChunks = chunks.filter((c: any) => !processedChunkIds.has(c.id))
      
      const chunkStatus = {
        totalChunks: chunks.length,
        processedChunks: chunks.length - remainingChunks.length,
        remainingChunks: remainingChunks.length,
        canGenerateMore: remainingChunks.length > 0
      }
      
      console.log(`🔍 GenerateMoreButton - Calculated status locally:`, chunkStatus)
      setStatus(chunkStatus)
      setError(null)
    } catch (err) {
      console.error('Failed to load chunk status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load status')
    }
  }

  const handleGenerateMore = async () => {
    if (!status?.canGenerateMore || isGenerating) {
      return
    }

    setIsGenerating(true)
    setError(null)
    setLastResult(null)

    try {
      onProgress?.('🔄 Starting client-side generation...')

      // Get chunks and runs data from localStorage
      const correctDocId = await findCorrectDocId(docId)
      let chunks: any[] = []
      let runs: any[] = []
      
      if (typeof window !== 'undefined' && localStorage) {
        const chunksData = localStorage.getItem('testCaseWriter_requirementChunks')
        const runsData = localStorage.getItem('testCaseWriter_generationRuns')
        
        if (chunksData) {
          const allChunks = JSON.parse(chunksData)
          chunks = allChunks.filter((c: any) => c.docId === correctDocId)
        }
        
        if (runsData) {
          runs = JSON.parse(runsData).filter((r: any) => r.docId === correctDocId)
        }
      }

      console.log(`🔄 GenerateMore - Processing ${chunks.length} chunks client-side`)

      // Find unprocessed chunks
      const settingsHashValue = settings.model + settings.temperature + settings.maxCases
      const processedChunkIds = new Set(runs
        .filter(r => r.settingsHash?.includes(settingsHashValue.slice(0, 8)))
        .map(r => r.chunkId))

      const remainingChunks = chunks.filter(c => !processedChunkIds.has(c.id))
      const chunksToProcess = remainingChunks.slice(0, 2) // Process 2 chunks

      console.log(`🔄 GenerateMore - Processing ${chunksToProcess.length} unprocessed chunks`)

      let totalSaved = 0
      const processedCount = chunksToProcess.length

      // Process each chunk with client-side AI
      for (const chunk of chunksToProcess) {
        try {
          onProgress?.(`🔄 Processing chunk ${chunk.chunkIndex + 1}...`)

          // Build prompt for this chunk
          const prompt = buildGenerationPrompt({
            docId: correctDocId as string,
            chunkIndex: chunk.chunkIndex,
            chunkText: chunk.text,
            outline: null,
            slice: { features: [], flows: [], rules: [] },
            maxCases: settings.maxCases,
            schemaJson: JSON.stringify({
              type: "array",
              items: {
                type: "object",
                properties: {
                  testCase: { type: "string" },
                  module: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  testSteps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "number" },
                        description: { type: "string" },
                        testData: { type: "string" },
                        expectedResult: { type: "string" }
                      }
                    }
                  }
                }
              }
            })
          })

          // Get current AI config from settings context
          const aiConfig = getAIConfig()
          
          // Call AI with client-side generation
          const result = await generateTestCasesWithAI({
            documents: [prompt],
            template: '',
            config: {
              coverage: 'comprehensive',
              includeNegativeTests: true,
              includeEdgeCases: true,
              maxTestCases: settings.maxCases,
              customInstructions: ''
            },
            aiConfig: {
              providerId: settings.model.includes('gpt') ? 'openai' : 'anthropic',
              model: settings.model,
              temperature: settings.temperature,
              maxTokens: settings.model.includes('gpt-4o') ? 128000 : settings.model.includes('gpt-4') ? 8192 : 4096, // Use model's max capacity
              apiKey: aiConfig.apiKey,
              customPrompt: aiConfig.customPrompt || ''
            }
          })

          if (result.testCases && result.testCases.length > 0) {
            // Add enhancement, ticketId, and tags to each test case
            const testCasesWithMetadata = (result.testCases as TestCase[]).map(tc => ({
              ...tc,
              enhancement: enhancement || tc.enhancement || undefined,
              ticketId: ticketId || tc.ticketId || undefined,
              tags: tags.length > 0 ? [...tags] : tc.tags || [],
              data: {
                ...tc.data,
                tags: tags.length > 0 ? [...tags] : tc.data?.tags || []
              }
            }))

            // Save generated test cases
            const saveResult = saveGeneratedTestCases(
              testCasesWithMetadata,
              [`chunk-${chunk.chunkIndex}-${correctDocId as string}`],
              settings.model,
              projectId || 'default',
              `Chunk ${chunk.chunkIndex + 1}`
            )

            totalSaved += saveResult.saved
            console.log(`✅ Chunk ${chunk.chunkIndex}: Generated ${saveResult.saved} test cases`)
          }

        } catch (chunkError) {
          console.error(`❌ Failed to process chunk ${chunk.chunkIndex}:`, chunkError)
        }
      }

      const remainingCount = remainingChunks.length - processedCount

      const result: GenerateMoreResponse = {
        success: true,
        processedChunks: processedCount,
        remainingChunks: remainingCount,
        totalChunks: chunks.length,
        saved: totalSaved,
        skipped: 0,
        reused: 0,
        results: []
      }

      setLastResult(result)

      let message = remainingCount > 0 
        ? `✅ Processed ${processedCount} chunks · ${remainingCount} remaining`
        : `🎉 All chunks complete! Generated ${totalSaved} cases total`
      
      onProgress?.(message)
      onComplete?.(result)
      
      // Refresh status after generation
      setTimeout(() => {
        loadChunkStatus()
      }, 500)

    } catch (err) {
      console.error('Generate More failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Generation failed'
      setError(errorMessage)
      onProgress?.(`❌ ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Don't render if no status loaded yet
  if (!status) {
    return (
      <div className="flex items-center space-x-3">
        <Button variant="secondary" disabled>
          <Clock className="h-4 w-4 mr-2" />
          Loading...
        </Button>
        
        {/* Debug button */}
        <Button
          onClick={async () => {
            console.log(`🔍 Debug (Loading state) - docId: ${docId}`)
            console.log(`🔍 Debug - settings:`, settings)
            
            if (typeof window !== 'undefined' && localStorage) {
              const chunksKey = 'testCaseWriter_requirementChunks'
              const runsKey = 'testCaseWriter_generationRuns'
              
              const storedChunks = localStorage.getItem(chunksKey)
              const storedRuns = localStorage.getItem(runsKey)
              
              const parsedChunks = storedChunks ? JSON.parse(storedChunks) : []
              const parsedRuns = storedRuns ? JSON.parse(storedRuns) : []
              
              try {
                const { buildSettingsHash } = await import('@/lib/settingsHash')
                const currentSettingsHash = buildSettingsHash(settings)
                
                console.log(`🔍 Debug - Complete analysis (Loading):`, {
                  docId,
                  currentSettingsHash,
                  chunks: {
                    total: parsedChunks.length,
                    forThisDoc: parsedChunks.filter((c: any) => c.docId === docId).length,
                    uniqueDocIds: Array.from(new Set(parsedChunks.map((c: any) => c.docId))),
                    sampleChunk: parsedChunks[0]
                  },
                  runs: {
                    total: parsedRuns.length,
                    forThisDoc: parsedRuns.filter((r: any) => r.docId === docId).length,
                    withCurrentSettings: parsedRuns.filter((r: any) => r.docId === docId && r.settingsHash === currentSettingsHash).length
                  }
                })
              } catch (error) {
                console.error('Debug error:', error)
              }
            }
          }}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          Debug
        </Button>
      </div>
    )
  }

  // Show completion status
  if (!status.canGenerateMore) {
    return (
      <div className="flex items-center space-x-3">
        <Button variant="secondary" disabled>
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          All Chunks Complete
        </Button>
        
        {/* Debug button */}
        <Button
          onClick={async () => {
            console.log(`🔍 Debug (Complete state) - docId: ${docId}`)
            console.log(`🔍 Debug - settings:`, settings)
            console.log(`🔍 Debug - status:`, status)
            
            if (typeof window !== 'undefined' && localStorage) {
              const chunksKey = 'testCaseWriter_requirementChunks'
              const runsKey = 'testCaseWriter_generationRuns'
              
              const storedChunks = localStorage.getItem(chunksKey)
              const storedRuns = localStorage.getItem(runsKey)
              
              const parsedChunks = storedChunks ? JSON.parse(storedChunks) : []
              const parsedRuns = storedRuns ? JSON.parse(storedRuns) : []
              
              try {
                const { buildSettingsHash } = await import('@/lib/settingsHash')
                const currentSettingsHash = buildSettingsHash(settings)
                
                console.log(`🔍 Debug - Complete analysis (Complete):`, {
                  docId,
                  currentSettingsHash,
                  chunks: {
                    total: parsedChunks.length,
                    forThisDoc: parsedChunks.filter((c: any) => c.docId === docId).length,
                    uniqueDocIds: Array.from(new Set(parsedChunks.map((c: any) => c.docId))),
                    sampleChunk: parsedChunks[0]
                  },
                  runs: {
                    total: parsedRuns.length,
                    forThisDoc: parsedRuns.filter((r: any) => r.docId === docId).length,
                    withCurrentSettings: parsedRuns.filter((r: any) => r.docId === docId && r.settingsHash === currentSettingsHash).length
                  }
                })
              } catch (error) {
                console.error('Debug error:', error)
              }
            }
          }}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          Debug
        </Button>
        
        <div className="text-sm text-gray-600">
          {status.totalChunks} chunks processed
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-3">
        <Button
          onClick={handleGenerateMore}
          disabled={disabled || isGenerating || !status.canGenerateMore}
          variant={status.remainingChunks > 0 ? "primary" : "secondary"}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate More ({status.remainingChunks})
            </>
          )}
        </Button>
        
        {/* Debug button */}
        <Button
          onClick={async () => {
            console.log(`🔍 Debug (Active state) - docId: ${docId}`)
            console.log(`🔍 Debug - settings:`, settings)
            console.log(`🔍 Debug - status:`, status)
            
            if (typeof window !== 'undefined' && localStorage) {
              const chunksKey = 'testCaseWriter_requirementChunks'
              const runsKey = 'testCaseWriter_generationRuns'
              
              const storedChunks = localStorage.getItem(chunksKey)
              const storedRuns = localStorage.getItem(runsKey)
              
              const parsedChunks = storedChunks ? JSON.parse(storedChunks) : []
              const parsedRuns = storedRuns ? JSON.parse(storedRuns) : []
              
              try {
                const { buildSettingsHash } = await import('@/lib/settingsHash')
                const currentSettingsHash = buildSettingsHash(settings)
                
                console.log(`🔍 Debug - Complete analysis (Active):`, {
                  docId,
                  currentSettingsHash,
                  chunks: {
                    total: parsedChunks.length,
                    forThisDoc: parsedChunks.filter((c: any) => c.docId === docId).length,
                    uniqueDocIds: Array.from(new Set(parsedChunks.map((c: any) => c.docId))),
                    sampleChunk: parsedChunks[0]
                  },
                  runs: {
                    total: parsedRuns.length,
                    forThisDoc: parsedRuns.filter((r: any) => r.docId === docId).length,
                    withCurrentSettings: parsedRuns.filter((r: any) => r.docId === docId && r.settingsHash === currentSettingsHash).length
                  }
                })
              } catch (error) {
                console.error('Debug error:', error)
              }
            }
          }}
          size="sm"
          variant="secondary"
          className="text-xs"
        >
          Debug
        </Button>
        
        <div className="text-sm text-gray-600">
          {status.processedChunks}/{status.totalChunks} chunks complete
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${(status.processedChunks / status.totalChunks) * 100}%`
          }}
        />
      </div>

      {/* Last result summary */}
      {lastResult && (
        <div className="text-xs text-gray-500">
          Last batch: +{lastResult.saved} saved, {lastResult.skipped} skipped, {lastResult.reused} reused
          {lastResult.reconciliation && lastResult.reconciliation.casesRemoved > 0 && (
            <span className="text-green-600"> · {lastResult.reconciliation.casesRemoved} duplicates removed</span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}