// Token-free soft deduplication using SimHash
// Detects near-duplicate test cases across chunks without calling AI

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

function hash32(s: string): number {
  let x = 2166136261 >>> 0
  for (const c of s) {
    x ^= c.charCodeAt(0)
    x = (x * 16777619) >>> 0
  }
  return x
}

/**
 * Build SimHash for text content
 * @param text - Text to hash
 * @param bits - Number of bits (default 64)
 * @returns BigInt representation of SimHash
 */
export function buildSimhash(text: string, bits = 64n): bigint {
  const tokens = norm(text).split(/\W+/).filter(Boolean)
  const v = Array(Number(bits)).fill(0)
  
  for (const t of tokens) {
    const h = BigInt(hash32(t))
    for (let i = 0; i < Number(bits); i++) {
      const bit = (h >> BigInt(i)) & 1n
      v[i] += bit ? 1 : -1
    }
  }
  
  let out = 0n
  for (let i = 0; i < Number(bits); i++) {
    if (v[i] > 0) out |= (1n << BigInt(i))
  }
  
  return out
}

/**
 * Calculate Hamming distance between two hashes
 * @param a - First hash
 * @param b - Second hash
 * @returns Hamming distance (number of different bits)
 */
export function hamming(a: bigint, b: bigint): number {
  let x = a ^ b
  let d = 0
  while (x) {
    x &= x - 1n
    d++
  }
  return d
}

/**
 * Build SimHash for a test case
 * @param testCase - Test case object
 * @returns SimHash as string for storage
 */
export function buildTestCaseSimhash(testCase: {
  testCase?: string
  title?: string
  module?: string
  testSteps?: Array<{
    description?: string
    action?: string
    testData?: string
    expectedResult?: string
  }>
}): string {
  const textParts = [
    testCase.testCase || testCase.title || '',
    testCase.module || '',
    ...(testCase.testSteps || []).map(step => 
      `${step.description || step.action || ''}|${step.testData || ''}|${step.expectedResult || ''}`
    )
  ].filter(Boolean)
  
  const textForHash = textParts.join('\\n')
  const simhash = buildSimhash(textForHash)
  
  // Convert to string for localStorage compatibility
  return simhash.toString()
}

/**
 * Compare two test cases for similarity using SimHash
 * @param simhash1 - First test case SimHash (as string)
 * @param simhash2 - Second test case SimHash (as string)
 * @param threshold - Maximum Hamming distance to consider similar (default: 4)
 * @returns True if test cases are similar
 */
export function areTestCasesSimilar(
  simhash1: string,
  simhash2: string,
  threshold: number = 4
): boolean {
  try {
    const hash1 = BigInt(simhash1)
    const hash2 = BigInt(simhash2)
    const distance = hamming(hash1, hash2)
    
    console.log('🔍 SimHash Comparison:', {
      hash1: simhash1.substring(0, 16) + '...',
      hash2: simhash2.substring(0, 16) + '...',
      distance,
      threshold,
      similar: distance <= threshold
    })
    
    return distance <= threshold
  } catch (error) {
    console.error('❌ SimHash comparison failed:', error)
    return false
  }
}

/**
 * Find groups of similar test cases
 * @param testCases - Array of test cases with simhash
 * @param threshold - Similarity threshold (default: 4)
 * @returns Array of duplicate groups
 */
export function findSimilarTestCases(
  testCases: Array<{
    id: string
    simhash?: string
    testCase?: string
    testSteps?: any[]
    createdAt: Date
  }>,
  threshold: number = 4
): Array<{
  duplicates: Array<{
    id: string
    testCase?: string
    testSteps?: any[]
    createdAt: Date
    stepCount: number
  }>
  keepId: string
  removeIds: string[]
}> {
  const groups: Array<{
    duplicates: Array<{
      id: string
      testCase?: string
      testSteps?: any[]
      createdAt: Date
      stepCount: number
    }>
    keepId: string
    removeIds: string[]
  }> = []
  
  const processed = new Set<string>()
  
  for (let i = 0; i < testCases.length; i++) {
    if (processed.has(testCases[i].id)) continue
    if (!testCases[i].simhash) continue
    
    const duplicates: Array<{
      id: string
      testCase?: string
      testSteps?: any[]
      createdAt: Date
      stepCount: number
    }> = []
    
    // Add the current test case
    duplicates.push({
      id: testCases[i].id,
      testCase: testCases[i].testCase,
      testSteps: testCases[i].testSteps,
      createdAt: testCases[i].createdAt,
      stepCount: testCases[i].testSteps?.length || 0
    })
    processed.add(testCases[i].id)
    
    // Find similar test cases
    for (let j = i + 1; j < testCases.length; j++) {
      if (processed.has(testCases[j].id)) continue
      if (!testCases[j].simhash) continue
      
      if (areTestCasesSimilar(testCases[i].simhash!, testCases[j].simhash!, threshold)) {
        duplicates.push({
          id: testCases[j].id,
          testCase: testCases[j].testCase,
          testSteps: testCases[j].testSteps,
          createdAt: testCases[j].createdAt,
          stepCount: testCases[j].testSteps?.length || 0
        })
        processed.add(testCases[j].id)
      }
    }
    
    // Only create a group if we found duplicates
    if (duplicates.length > 1) {
      // Choose the "best" test case to keep (more steps, then earlier creation)
      const winner = duplicates.reduce((best, current) => {
        if (current.stepCount > best.stepCount) return current
        if (current.stepCount < best.stepCount) return best
        return current.createdAt <= best.createdAt ? current : best
      })
      
      groups.push({
        duplicates,
        keepId: winner.id,
        removeIds: duplicates.filter(d => d.id !== winner.id).map(d => d.id)
      })
    }
  }
  
  return groups
}

/**
 * Get similarity statistics for debugging
 */
export function getSimhashStats(testCases: Array<{ simhash?: string }>): {
  totalCases: number
  withSimhash: number
  withoutSimhash: number
  uniqueHashes: number
} {
  const hashes = new Set(testCases.filter(tc => tc.simhash).map(tc => tc.simhash))
  
  return {
    totalCases: testCases.length,
    withSimhash: testCases.filter(tc => tc.simhash).length,
    withoutSimhash: testCases.filter(tc => !tc.simhash).length,
    uniqueHashes: hashes.size
  }
}