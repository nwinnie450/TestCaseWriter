import { chunkRequirement, saveChunks, getChunksByDocId, RequirementChunk } from './chunking'

export interface DocumentChunkingResult {
  docId: string
  chunks: RequirementChunk[]
  totalChunks: number
  totalTokens: number
  chunkingTime: number
}

export async function chunkDocuments(documents: Array<{
  extractedText?: string
  content?: string
  fileName: string
  uploadedAt: Date
}>): Promise<DocumentChunkingResult[]> {
  const results: DocumentChunkingResult[] = []
  
  for (const doc of documents) {
    const startTime = Date.now()
    
    // Create a deterministic document ID
    const docId = createDocumentId(doc.fileName, doc.extractedText || doc.content)
    
    const textToProcess = doc.extractedText || doc.content || ''
    console.log(`🔧 Document Chunking - Processing: ${doc.fileName} (${textToProcess.length} chars)`)
    console.log(`🔧 Document Chunking - Generated docId: ${docId} for file: ${doc.fileName}`)
    
    // Chunk the document text
    const chunks = chunkRequirement(docId, textToProcess)
    
    // Save chunks to localStorage
    saveChunks(chunks)
    
    // Verify chunks were saved correctly
    const savedChunks = getChunksByDocId(docId)
    console.log(`🔍 Document Chunking - Verification: ${savedChunks.length} chunks saved vs ${chunks.length} created for docId: ${docId}`)
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)
    const chunkingTime = Date.now() - startTime
    
    const result: DocumentChunkingResult = {
      docId,
      chunks,
      totalChunks: chunks.length,
      totalTokens,
      chunkingTime
    }
    
    results.push(result)
    
    console.log(`✅ Document Chunking - ${doc.fileName}: ${chunks.length} chunks, ~${totalTokens} tokens, docId: ${docId}`)
  }
  
  return results
}

export function createDocumentId(fileName: string, content: string): string {
  // Simple hash for document ID (deterministic based on name + content)
  // Handle case where content might be undefined or null
  const safeContent = content || ''
  const safeFileName = fileName || 'unknown'
  
  // Create a more stable hash using file name and content length
  const combined = `${safeFileName}|${safeContent.length}|${safeContent.substring(0, 500)}` // Use first 500 chars for stability
  
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  const stableId = `doc_${Math.abs(hash).toString(36)}`
  console.log(`🔧 Document ID - Generated: ${stableId} for file: ${safeFileName} (${safeContent.length} chars)`)
  
  return stableId
}

export async function getDocumentChunkingSummary(docId: string): Promise<{
  totalChunks: number
  processedChunks: number
  pendingChunks: number
  canGenerateMore: boolean
  estimatedTokens: number
} | null> {
  try {
    const { getChunksByDocId, getRunsByDocId } = await import('./chunking')
    const { buildSettingsHash, getCurrentSettings } = await import('./settingsHash')
    
    const chunks = getChunksByDocId(docId)
    if (chunks.length === 0) return null
    
    const runs = getRunsByDocId(docId)
    const settings = getCurrentSettings() // Use default settings for summary
    const settingsHash = buildSettingsHash(settings)
    
    const processedChunkIds = new Set(runs.filter(run => run.settingsHash === settingsHash).map(run => run.chunkId))
    const processedChunks = chunks.filter(chunk => processedChunkIds.has(chunk.id)).length
    const pendingChunks = chunks.length - processedChunks
    const estimatedTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0)
    
    return {
      totalChunks: chunks.length,
      processedChunks,
      pendingChunks,
      canGenerateMore: pendingChunks > 0,
      estimatedTokens
    }
    
  } catch (error) {
    console.error('Failed to get document chunking summary:', error)
    return null
  }
}

export interface ChunkingStats {
  totalDocuments: number
  totalChunks: number
  averageChunksPerDoc: number
  totalEstimatedTokens: number
  largestChunk: number
  smallestChunk: number
}

export async function getGlobalChunkingStats(): Promise<ChunkingStats> {
  try {
    const { getStoredChunks } = await import('./chunking')
    
    const allChunks = getStoredChunks()
    const docIds = new Set(allChunks.map(chunk => chunk.docId))
    
    const tokenCounts = allChunks.map(chunk => chunk.tokenCount).filter(count => count > 0)
    
    return {
      totalDocuments: docIds.size,
      totalChunks: allChunks.length,
      averageChunksPerDoc: docIds.size > 0 ? allChunks.length / docIds.size : 0,
      totalEstimatedTokens: tokenCounts.reduce((sum, count) => sum + count, 0),
      largestChunk: Math.max(...tokenCounts, 0),
      smallestChunk: Math.min(...tokenCounts, 0)
    }
    
  } catch (error) {
    console.error('Failed to get global chunking stats:', error)
    return {
      totalDocuments: 0,
      totalChunks: 0,
      averageChunksPerDoc: 0,
      totalEstimatedTokens: 0,
      largestChunk: 0,
      smallestChunk: 0
    }
  }
}