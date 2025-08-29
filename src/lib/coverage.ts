// Lightweight coverage meter using outline IDs and test case links
import { TestCase } from '@/types'
import { RequirementChunk } from './chunking'
import { linkChunkToOutline } from './outline/link'
import { buildOrGetOutline } from './outline/build'
import { getAllStoredTestCases } from './test-case-storage'

export interface ChunkCoverage {
  chunkId: string
  chunkIndex: number
  coverage: number // 0.0 - 1.0
  totalItems: number
  coveredItems: number
  missing: {
    features: string[]
    flows: string[]
    rules: string[]
  }
  level: 'low' | 'medium' | 'high' // coverage level
}

export interface CoverageStats {
  overall: number // 0.0 - 1.0
  chunks: ChunkCoverage[]
  totalOutlineItems: number
  coveredOutlineItems: number
}

/**
 * Calculate coverage for a specific chunk
 */
export function coverageForChunk({
  linked,
  allCases,
  chunkId,
  chunkIndex
}: {
  linked: { featureIds: string[]; flowIds: string[]; ruleIds: string[] }
  allCases: TestCase[]
  chunkId: string
  chunkIndex: number
}): ChunkCoverage {
  // Collect all outline IDs that have been covered by existing test cases
  const coveredIds = new Set<string>()
  allCases.forEach(tc => {
    (tc.data?.links?.feature_ids ?? []).forEach((id: string) => coveredIds.add(id))
    (tc.data?.links?.flow_ids ?? []).forEach((id: string) => coveredIds.add(id))
    (tc.data?.links?.rule_ids ?? []).forEach((id: string) => coveredIds.add(id))
  })

  // Calculate what this chunk needs vs what's already covered
  const chunkItems = [
    ...linked.featureIds,
    ...linked.flowIds, 
    ...linked.ruleIds
  ]
  
  const totalItems = chunkItems.length || 1 // Avoid division by zero
  const coveredItems = chunkItems.filter(id => coveredIds.has(id)).length
  const coverage = coveredItems / totalItems

  // Find missing items by category
  const missing = {
    features: linked.featureIds.filter(id => !coveredIds.has(id)),
    flows: linked.flowIds.filter(id => !coveredIds.has(id)),
    rules: linked.ruleIds.filter(id => !coveredIds.has(id))
  }

  // Determine coverage level
  let level: 'low' | 'medium' | 'high'
  if (coverage >= 0.8) level = 'high'
  else if (coverage >= 0.3) level = 'medium'  
  else level = 'low'

  return {
    chunkId,
    chunkIndex,
    coverage,
    totalItems,
    coveredItems,
    missing,
    level
  }
}

/**
 * Calculate coverage for all chunks of a document
 */
export function calculateDocumentCoverage(docId: string, projectId?: string): CoverageStats {
  console.log(`📊 Coverage - Calculating for doc ${docId?.substring(0, 8) || 'unknown'}...`)

  try {
    // Get all chunks for this document
    const { getChunksByDocId } = require('./chunking')
    const chunks = getChunksByDocId(docId) as RequirementChunk[]
    
    if (chunks.length === 0) {
      console.log('📊 Coverage - No chunks found')
      return {
        overall: 0,
        chunks: [],
        totalOutlineItems: 0,
        coveredOutlineItems: 0
      }
    }

    // Get outline for the document
    const outlineRow = buildOrGetOutline(docId, chunks.map(c => ({
      chunkIndex: c.chunkIndex,
      text: c.text
    })))

    // Get all test cases (filtered by project if specified)
    const allTestCases = getAllStoredTestCases()
    const relevantTestCases = projectId 
      ? allTestCases.filter(tc => tc.projectId === projectId)
      : allTestCases

    console.log(`📊 Coverage - Processing ${chunks.length} chunks with ${relevantTestCases.length} test cases`)

    // Calculate coverage for each chunk
    const chunkCoverages: ChunkCoverage[] = []
    let totalOutlineItems = 0
    let coveredOutlineItems = 0

    for (const chunk of chunks) {
      // Link this chunk to outline items
      const chunkLinks = linkChunkToOutline(chunk.text, outlineRow.outline)
      
      // Calculate coverage for this chunk
      const chunkCoverage = coverageForChunk({
        linked: chunkLinks,
        allCases: relevantTestCases,
        chunkId: chunk.id,
        chunkIndex: chunk.chunkIndex
      })

      chunkCoverages.push(chunkCoverage)
      totalOutlineItems += chunkCoverage.totalItems
      coveredOutlineItems += chunkCoverage.coveredItems
    }

    const overallCoverage = totalOutlineItems > 0 ? coveredOutlineItems / totalOutlineItems : 0

    const result = {
      overall: overallCoverage,
      chunks: chunkCoverages,
      totalOutlineItems,
      coveredOutlineItems
    }

    console.log(`📊 Coverage - Complete: ${Math.round(overallCoverage * 100)}% (${coveredOutlineItems}/${totalOutlineItems})`)
    return result

  } catch (error) {
    console.error('❌ Coverage calculation failed:', error)
    return {
      overall: 0,
      chunks: [],
      totalOutlineItems: 0,
      coveredOutlineItems: 0
    }
  }
}

/**
 * Get chunks that need more test cases (below coverage threshold)
 */
export function getLowCoverageChunks(
  docId: string, 
  projectId?: string, 
  threshold: number = 0.7
): RequirementChunk[] {
  const coverage = calculateDocumentCoverage(docId, projectId)
  const lowCoverageChunkIds = coverage.chunks
    .filter(c => c.coverage < threshold)
    .map(c => c.chunkId)

  const { getChunksByDocId } = require('./chunking')
  const allChunks = getChunksByDocId(docId) as RequirementChunk[]
  
  return allChunks.filter(chunk => lowCoverageChunkIds.includes(chunk.id))
}

/**
 * Format coverage percentage for display
 */
export function formatCoverage(coverage: number): string {
  return `${Math.round(coverage * 100)}%`
}

/**
 * Get coverage color class for UI
 */
export function getCoverageColor(coverage: number): string {
  if (coverage >= 0.8) return 'text-green-600'
  if (coverage >= 0.3) return 'text-yellow-600'  
  return 'text-red-600'
}

/**
 * Get coverage background color for progress bars
 */
export function getCoverageBgColor(coverage: number): string {
  if (coverage >= 0.8) return 'bg-green-500'
  if (coverage >= 0.3) return 'bg-yellow-500'
  return 'bg-red-500'
}