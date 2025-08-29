import { NextRequest, NextResponse } from 'next/server'
import { findRemainingChunks, findRemainingChunksPrioritized, getChunksByDocId, getStoredChunks } from '@/lib/chunking'
import { GenerationSettings, buildSettingsHash } from '@/lib/settingsHash'
import { generateForChunk, ChunkGenerationResult } from '@/lib/generateForChunk'
import { reconcileProjectDuplicates } from '@/lib/reconcileDuplicates'

export interface GenerateMoreRequest {
  docId: string
  projectId?: string
  settings: GenerationSettings
  maxChunksPerCall?: number
  useCoveragePrioritization?: boolean
  chunks?: any[] // Client-side chunks data
  runs?: any[] // Client-side runs data
}

export interface GenerateMoreResponse {
  success: boolean
  processedChunks: number
  remainingChunks: number
  totalChunks: number
  saved: number
  skipped: number
  reused: number
  results: ChunkGenerationResult[]
  reconciliation?: {
    duplicateGroups: number
    casesRemoved: number
    casesMerged: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GenerateMoreResponse>> {
  try {
    const body: GenerateMoreRequest = await request.json()
    const { docId, projectId, settings, maxChunksPerCall = 3, useCoveragePrioritization = true, chunks: clientChunks, runs: clientRuns } = body
    
    console.log('🔄 Generate More - Starting batch generation:', {
      docId: docId?.substring(0, 8) + '...' || 'undefined',
      projectId,
      maxChunks: maxChunksPerCall,
      settings: {
        model: settings.model,
        maxCases: settings.maxCases,
        temperature: settings.temperature
      }
    })
    
    // Validate input
    if (!docId || !settings) {
      return NextResponse.json({
        success: false,
        processedChunks: 0,
        remainingChunks: 0,
        totalChunks: 0,
        saved: 0,
        skipped: 0,
        reused: 0,
        results: [],
        error: 'Missing required fields: docId and settings'
      }, { status: 400 })
    }
    
    const settingsHash = buildSettingsHash(settings)
    
    // Use client-provided chunks or fallback to localStorage access
    let allChunks: any[]
    if (clientChunks && clientChunks.length > 0) {
      allChunks = clientChunks
      console.log(`🔍 Generate More API - Using ${clientChunks.length} chunks from client`)
    } else {
      // Fallback to server-side localStorage (may not work)
      allChunks = getChunksByDocId(docId)
      console.log(`🔍 Generate More API - Using ${allChunks.length} chunks from server localStorage`)
    }
    
    console.log(`🔍 Generate More API - Processing chunks for docId: ${docId}`)
    console.log(`🔍 Generate More API - Chunks analysis:`, {
      totalChunks: allChunks.length,
      requestedDocId: docId,
      sampleChunks: allChunks.slice(0, 3).map((c: any) => ({
        docId: c.docId?.substring(0, 15) + '...',
        chunkIndex: c.chunkIndex,
        textPreview: c.text?.substring(0, 50) + '...'
      }))
    })
    
    if (allChunks.length === 0) {
      let suggestion = 'Please ensure the document has been chunked by generating initial test cases first.'
      
      if (!clientChunks) {
        suggestion = 'No chunk data received from client. Please refresh the page and try again.'
      }
      
      return NextResponse.json({
        success: false,
        processedChunks: 0,
        remainingChunks: 0,
        totalChunks: 0,
        saved: 0,
        skipped: 0,
        reused: 0,
        results: [],
        error: `No chunks found for document ${docId}. ${suggestion}`
      }, { status: 404 })
    }
    
    // Find remaining chunks that haven't been processed with these settings
    let remainingChunks: any[]
    
    if (clientRuns) {
      // Use client-provided runs data
      const processedChunkIds = new Set(clientRuns
        .filter((r: any) => r.settingsHash === settingsHash)
        .map((r: any) => r.chunkId))
      
      remainingChunks = allChunks.filter((c: any) => !processedChunkIds.has(c.id))
      console.log(`🔍 Generate More API - Using client runs data: ${clientRuns.length} total runs, ${processedChunkIds.size} for current settings`)
    } else {
      // Fallback to server-side calculation
      remainingChunks = useCoveragePrioritization 
        ? findRemainingChunksPrioritized(docId, settingsHash, projectId, 0.7)
        : findRemainingChunks(docId, settingsHash)
    }
    
    console.log(`🔍 Generate More - Found ${remainingChunks.length} remaining chunks out of ${allChunks.length} total (prioritization: ${useCoveragePrioritization ? 'enabled' : 'disabled'})`)
    
    if (remainingChunks.length === 0) {
      return NextResponse.json({
        success: true,
        processedChunks: 0,
        remainingChunks: 0,
        totalChunks: allChunks.length,
        saved: 0,
        skipped: 0,
        reused: 0,
        results: [],
        error: 'All chunks have already been processed with these settings'
      })
    }
    
    // Process batch of chunks (limited by maxChunksPerCall)
    const batchToProcess = remainingChunks.slice(0, maxChunksPerCall)
    const results: ChunkGenerationResult[] = []
    
    let totalSaved = 0
    let totalSkipped = 0
    let totalReused = 0
    
    console.log(`🔄 Generate More - Processing batch of ${batchToProcess.length} chunks`)
    
    // Process chunks sequentially to avoid overwhelming the AI API
    for (const chunk of batchToProcess) {
      try {
        console.log(`🔄 Processing chunk ${chunk.chunkIndex + 1}/${allChunks.length}`)
        
        const result = await generateForChunk({
          docId,
          chunk,
          settings,
          projectId,
          onProgress: (step) => console.log(`📝 ${step}`)
        })
        
        results.push(result)
        totalSaved += result.saved
        totalSkipped += result.skipped
        if (result.reused) totalReused++
        
        // Small delay between chunks to be respectful to AI API
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (chunkError) {
        console.error(`❌ Failed to process chunk ${chunk.chunkIndex}:`, chunkError)
        results.push({
          saved: 0,
          skipped: 0,
          reused: false,
          chunkId: chunk.id,
          chunkIndex: chunk.chunkIndex,
          error: chunkError instanceof Error ? chunkError.message : 'Unknown error'
        })
      }
    }
    
    const finalRemainingCount = Math.max(remainingChunks.length - batchToProcess.length, 0)
    
    // Prepare initial response
    const response: GenerateMoreResponse = {
      success: true,
      processedChunks: batchToProcess.length,
      remainingChunks: finalRemainingCount,
      totalChunks: allChunks.length,
      saved: totalSaved,
      skipped: totalSkipped,
      reused: totalReused,
      results
    }
    
    // If we saved any new test cases and this batch is complete (no remaining chunks),
    // run reconciliation to clean up duplicates across chunks
    if (totalSaved > 0 && finalRemainingCount === 0) {
      try {
        console.log('🔄 Generate More - Running post-generation reconciliation...')
        const reconcileResult = await reconcileProjectDuplicates(projectId, 4)
        
        response.reconciliation = {
          duplicateGroups: reconcileResult.duplicateGroups,
          casesRemoved: reconcileResult.casesRemoved,
          casesMerged: reconcileResult.casesMerged
        }
        
        console.log('✅ Generate More - Reconciliation complete:', response.reconciliation)
      } catch (reconcileError) {
        console.error('⚠️ Generate More - Reconciliation failed (non-critical):', reconcileError)
        // Don't fail the whole request if reconciliation fails
      }
    }
    
    console.log('✅ Generate More - Batch complete:', {
      processed: response.processedChunks,
      remaining: response.remainingChunks,
      saved: response.saved,
      skipped: response.skipped,
      reused: response.reused,
      reconciliation: response.reconciliation
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Generate More - API Error:', error)
    
    return NextResponse.json({
      success: false,
      processedChunks: 0,
      remainingChunks: 0,
      totalChunks: 0,
      saved: 0,
      skipped: 0,
      reused: 0,
      results: [],
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const docId = searchParams.get('docId')
  const settingsHash = searchParams.get('settingsHash')
  
  if (!docId || !settingsHash) {
    return NextResponse.json({
      error: 'Missing docId or settingsHash parameters'
    }, { status: 400 })
  }
  
  try {
    const allChunks = getChunksByDocId(docId)
    const remainingChunks = findRemainingChunks(docId, settingsHash)
    
    return NextResponse.json({
      totalChunks: allChunks.length,
      remainingChunks: remainingChunks.length,
      processedChunks: allChunks.length - remainingChunks.length,
      canGenerateMore: remainingChunks.length > 0
    })
    
  } catch (error) {
    console.error('❌ Generate More - GET Error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}