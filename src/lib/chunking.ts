// Simple hash function for browser compatibility (no Node.js crypto dependency)
function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString(16)
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16)
}

const normalize = (s: string) => s.replace(/\s+/g, " ").trim()

export interface RequirementChunk {
  id: string // chunkId = hash(docId|start|normText)
  docId: string
  chunkIndex: number
  text: string
  textHash: string
  tokenCount: number
  createdAt: Date
}

export interface GenerationRun {
  id: string
  docId: string
  chunkId: string
  settingsHash: string
  model: string
  createdAt: Date
  saved: number
  skipped: number
}

// Simple char-based chunker (approx. tokens ≈ chars/4)
export function chunkRequirement(
  docId: string,
  text: string,
  maxChars = 3000,   // ~750 tokens - smaller chunks for better "Generate More" support
  overlap = 300      // ~75 tokens
): RequirementChunk[] {
  const clean = normalize(text)
  const chunks: RequirementChunk[] = []
  let i = 0, idx = 0
  
  // Ensure we always create at least one chunk, even for short text
  if (clean.length === 0) {
    console.log(`⚠️ Chunking - Empty text provided for doc ${docId}`)
    return []
  }
  
  // For very short text, create a single chunk
  if (clean.length <= maxChars) {
    const textHash = simpleHash(clean)
    const chunkId = simpleHash(`${docId}|0|${clean}`)
    
    chunks.push({
      id: chunkId,
      docId,
      chunkIndex: 0,
      text: clean,
      textHash,
      tokenCount: Math.ceil(clean.length / 4),
      createdAt: new Date()
    })
    
    console.log(`🔧 Chunking - Single chunk for short text (${clean.length} chars)`)
    return chunks
  }
  
  while (i < clean.length) {
    const end = Math.min(i + maxChars, clean.length)
    const slice = clean.slice(i, end)
    const textHash = simpleHash(slice)
    const chunkId = simpleHash(`${docId}|${i}|${slice}`)
    
    chunks.push({
      id: chunkId,
      docId,
      chunkIndex: idx++,
      text: slice,
      textHash,
      tokenCount: Math.ceil(slice.length / 4), // rough estimation
      createdAt: new Date()
    })
    
    if (end >= clean.length) break
    i = end - overlap // slide with overlap
  }
  
  console.log(`🔧 Chunking - Created ${chunks.length} chunks for doc ${docId} (text length: ${clean.length} chars)`)
  return chunks
}

// localStorage keys
const CHUNKS_STORAGE_KEY = 'testCaseWriter_requirementChunks'
const RUNS_STORAGE_KEY = 'testCaseWriter_generationRuns'

// Chunk storage functions
export function saveChunks(chunks: RequirementChunk[]): void {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !localStorage) {
      console.log('⚠️ Cannot save chunks: localStorage not available (server-side)')
      return
    }
    
    const existing = getStoredChunks()
    const chunkMap = new Map(existing.map(c => [c.id, c]))
    
    // Update or add new chunks
    chunks.forEach(chunk => {
      chunkMap.set(chunk.id, chunk)
    })
    
    const updated = Array.from(chunkMap.values())
    localStorage.setItem(CHUNKS_STORAGE_KEY, JSON.stringify(updated))
    console.log('✅ Saved', chunks.length, 'chunks to localStorage')
  } catch (error) {
    console.error('❌ Failed to save chunks:', error)
  }
}

export function getStoredChunks(): RequirementChunk[] {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !localStorage) {
      return []
    }
    
    const stored = localStorage.getItem(CHUNKS_STORAGE_KEY)
    if (!stored) return []
    
    return JSON.parse(stored).map((chunk: any) => ({
      ...chunk,
      createdAt: new Date(chunk.createdAt)
    }))
  } catch (error) {
    console.error('❌ Failed to load chunks:', error)
    return []
  }
}

export function getChunksByDocId(docId: string): RequirementChunk[] {
  return getStoredChunks()
    .filter(chunk => chunk.docId === docId)
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
}

// Generation run storage functions
export function saveGenerationRun(run: Omit<GenerationRun, 'id' | 'createdAt'>): GenerationRun {
  try {
    const newRun: GenerationRun = {
      ...run,
      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date()
    }
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !localStorage) {
      console.log('⚠️ Cannot save generation run: localStorage not available (server-side)')
      return newRun
    }
    
    const existing = getStoredGenerationRuns()
    const updated = [newRun, ...existing]
    
    localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(updated))
    console.log('✅ Saved generation run:', newRun.id)
    return newRun
  } catch (error) {
    console.error('❌ Failed to save generation run:', error)
    throw error
  }
}

export function getStoredGenerationRuns(): GenerationRun[] {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !localStorage) {
      return []
    }
    
    const stored = localStorage.getItem(RUNS_STORAGE_KEY)
    if (!stored) return []
    
    return JSON.parse(stored).map((run: any) => ({
      ...run,
      createdAt: new Date(run.createdAt)
    }))
  } catch (error) {
    console.error('❌ Failed to load generation runs:', error)
    return []
  }
}

export function findExistingRun(chunkId: string, settingsHash: string): GenerationRun | null {
  const runs = getStoredGenerationRuns()
  return runs.find(run => run.chunkId === chunkId && run.settingsHash === settingsHash) || null
}

export function getRunsByDocId(docId: string): GenerationRun[] {
  return getStoredGenerationRuns().filter(run => run.docId === docId)
}

export function findRemainingChunks(docId: string, settingsHash: string): RequirementChunk[] {
  const chunks = getChunksByDocId(docId)
  const runs = getStoredGenerationRuns().filter(run => 
    run.docId === docId && run.settingsHash === settingsHash
  )
  
  const completedChunkIds = new Set(runs.map(run => run.chunkId))
  const remaining = chunks.filter(chunk => !completedChunkIds.has(chunk.id))
  
  console.log(`🔍 Chunking - Found ${remaining.length} remaining chunks out of ${chunks.length} total for settings ${settingsHash.substring(0, 8)}...`)
  return remaining
}

/**
 * Find chunks that need processing prioritized by coverage gaps
 */
export function findRemainingChunksPrioritized(
  docId: string, 
  settingsHash: string, 
  projectId?: string,
  coverageThreshold: number = 0.7
): RequirementChunk[] {
  // Get unprocessed chunks
  const remainingChunks = findRemainingChunks(docId, settingsHash)
  
  if (remainingChunks.length === 0) {
    return []
  }
  
  try {
    // Try to get coverage data to prioritize low-coverage chunks
    const { getLowCoverageChunks } = require('./coverage')
    const lowCoverageChunks = getLowCoverageChunks(docId, projectId, coverageThreshold)
    
    // Split into priority groups
    const lowCoverageIds = new Set(lowCoverageChunks.map((c: any) => c.id))
    const highPriority: RequirementChunk[] = []
    const normalPriority: RequirementChunk[] = []
    
    for (const chunk of remainingChunks) {
      if (lowCoverageIds.has(chunk.id)) {
        highPriority.push(chunk)
      } else {
        normalPriority.push(chunk)
      }
    }
    
    console.log(`📋 Chunk Priority - High: ${highPriority.length}, Normal: ${normalPriority.length}`)
    
    // Return high-priority chunks first, then normal
    return [...highPriority, ...normalPriority]
    
  } catch (error) {
    console.warn('⚠️ Coverage prioritization failed, using default order:', error)
    // Fallback to regular remaining chunks if coverage calculation fails
    return remainingChunks
  }
}