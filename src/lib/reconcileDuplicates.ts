import { TestCase } from '@/types'
import { getAllStoredTestCases, deleteTestCasesByIds, getStorageStats, getStoredTestCaseSessions } from './test-case-storage'
import { findSimilarTestCases, getSimhashStats, buildTestCaseSimhash } from './simhash'

export interface ReconcileResult {
  totalCases: number
  duplicateGroups: number
  casesRemoved: number
  casesMerged: number
  details: Array<{
    keepId: string
    keepTitle: string
    removedIds: string[]
    removedTitles: string[]
    reason: string
  }>
  stats: {
    withSimhash: number
    withoutSimhash: number
    uniqueHashes: number
  }
}

/**
 * Reconcile duplicate test cases across chunks using SimHash
 * @param projectId - Optional project ID to filter by
 * @param threshold - Similarity threshold (default: 4)
 * @returns Reconciliation results
 */
export async function reconcileProjectDuplicates(
  projectId?: string,
  threshold: number = 4
): Promise<ReconcileResult> {
  console.log('🔄 Reconciliation - Starting cross-chunk duplicate detection', {
    projectId: projectId ? projectId.substring(0, 8) + '...' : 'all',
    threshold
  })

  try {
    // Get all test cases
    const allTestCases = getAllStoredTestCases()
    console.log('📊 Reconciliation - Total test cases loaded:', allTestCases.length)

    // Filter by project if specified
    const testCases = projectId 
      ? allTestCases.filter(tc => tc.projectId === projectId)
      : allTestCases

    console.log('📊 Reconciliation - Test cases in scope:', testCases.length)

    // Get SimHash statistics
    const stats = getSimhashStats(testCases.map(tc => ({ simhash: tc.data?.simhash })))
    console.log('📊 Reconciliation - SimHash stats:', stats)

    if (stats.withSimhash === 0) {
      console.log('ℹ️ Reconciliation - No test cases with SimHash found')
      return {
        totalCases: testCases.length,
        duplicateGroups: 0,
        casesRemoved: 0,
        casesMerged: 0,
        details: [],
        stats
      }
    }

    // Group by module to reduce comparisons
    const moduleGroups = new Map<string, TestCase[]>()
    for (const testCase of testCases) {
      if (!testCase.data?.simhash) continue // Skip cases without simhash
      
      const moduleKey = `mod:${testCase.module || 'none'}`
      if (!moduleGroups.has(moduleKey)) {
        moduleGroups.set(moduleKey, [])
      }
      moduleGroups.get(moduleKey)!.push(testCase)
    }

    console.log('📊 Reconciliation - Module groups:', moduleGroups.size)

    let totalGroupsFound = 0
    let totalCasesRemoved = 0
    const allRemovedIds: string[] = []
    const details: ReconcileResult['details'] = []

    // Process each module group
    for (const [moduleKey, moduleCases] of moduleGroups.entries()) {
      console.log(`🔍 Reconciliation - Processing ${moduleKey} with ${moduleCases.length} cases`)

      // Prepare cases for similarity analysis
      const casesWithSimhash = moduleCases.map(tc => ({
        id: tc.id,
        simhash: tc.data?.simhash,
        testCase: tc.testCase,
        testSteps: tc.testSteps,
        createdAt: tc.createdAt,
        module: tc.module
      })).filter(tc => tc.simhash) // Only include cases with simhash

      if (casesWithSimhash.length < 2) {
        console.log(`⏭️ Reconciliation - Skipping ${moduleKey} - insufficient cases for comparison`)
        continue
      }

      // Find similar test cases
      const duplicateGroups = findSimilarTestCases(casesWithSimhash, threshold)
      
      console.log(`📊 Reconciliation - Found ${duplicateGroups.length} duplicate groups in ${moduleKey}`)

      for (const group of duplicateGroups) {
        totalGroupsFound++
        totalCasesRemoved += group.removeIds.length
        allRemovedIds.push(...group.removeIds)

        const keepCase = casesWithSimhash.find(tc => tc.id === group.keepId)
        const removedCases = group.removeIds.map(id => 
          casesWithSimhash.find(tc => tc.id === id)
        ).filter(Boolean)

        details.push({
          keepId: group.keepId,
          keepTitle: keepCase?.testCase || 'Unknown',
          removedIds: group.removeIds,
          removedTitles: removedCases.map(tc => tc?.testCase || 'Unknown'),
          reason: `Similar content (Hamming distance ≤ ${threshold})`
        })

        console.log(`🎯 Reconciliation - Group ${totalGroupsFound}:`, {
          keeping: keepCase?.testCase?.substring(0, 50) + '...',
          removing: removedCases.length,
          titles: removedCases.map(tc => tc?.testCase?.substring(0, 30) + '...')
        })
      }
    }

    // Remove duplicate test cases
    if (allRemovedIds.length > 0) {
      console.log(`🗑️ Reconciliation - Removing ${allRemovedIds.length} duplicate test cases`)
      deleteTestCasesByIds(allRemovedIds)
    }

    const result: ReconcileResult = {
      totalCases: testCases.length,
      duplicateGroups: totalGroupsFound,
      casesRemoved: totalCasesRemoved,
      casesMerged: totalGroupsFound, // Each group represents one merge operation
      details,
      stats
    }

    console.log('✅ Reconciliation - Complete:', {
      duplicateGroups: result.duplicateGroups,
      casesRemoved: result.casesRemoved,
      casesMerged: result.casesMerged
    })

    return result

  } catch (error) {
    console.error('❌ Reconciliation - Failed:', error)
    throw new Error(`Reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Preview duplicates without removing them
 */
export async function previewProjectDuplicates(
  projectId?: string,
  threshold: number = 4
): Promise<{
  duplicateGroups: Array<{
    duplicates: Array<{
      id: string
      testCase?: string
      stepCount: number
      createdAt: Date
    }>
    keepId: string
    wouldRemove: number
  }>
  totalWouldRemove: number
}> {
  const allTestCases = getAllStoredTestCases()
  const testCases = projectId 
    ? allTestCases.filter(tc => tc.projectId === projectId)
    : allTestCases

  const casesWithSimhash = testCases
    .filter(tc => tc.data?.simhash)
    .map(tc => ({
      id: tc.id,
      simhash: tc.data?.simhash,
      testCase: tc.testCase,
      testSteps: tc.testSteps,
      createdAt: tc.createdAt
    }))

  const duplicateGroups = findSimilarTestCases(casesWithSimhash, threshold)
  
  return {
    duplicateGroups: duplicateGroups.map(group => ({
      duplicates: group.duplicates,
      keepId: group.keepId,
      wouldRemove: group.removeIds.length
    })),
    totalWouldRemove: duplicateGroups.reduce((sum, group) => sum + group.removeIds.length, 0)
  }
}

/**
 * Add SimHash to existing test cases that don't have it
 */
export async function backfillSimhashes(): Promise<{ updated: number }> {
  console.log('🔄 Backfill - Adding SimHash to existing test cases')

  try {
    let updated = 0
    const sessions = getStoredTestCaseSessions()
    const STORAGE_KEY = 'testCaseWriter_generatedTestCases'
    
    for (const session of sessions) {
      let sessionModified = false
      
      for (const testCase of session.testCases) {
        if (!testCase.data?.simhash) {
          const simhash = buildTestCaseSimhash(testCase)
          testCase.data = {
            ...testCase.data,
            simhash
          }
          sessionModified = true
          updated++
        }
      }
      
      if (sessionModified) {
        // Update the session in localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
      }
    }

    console.log('✅ Backfill - Updated', updated, 'test cases with SimHash')
    return { updated }

  } catch (error) {
    console.error('❌ Backfill - Failed:', error)
    throw error
  }
}

/**
 * Get reconciliation statistics
 */
export async function getReconciliationStats(projectId?: string): Promise<{
  totalCases: number
  withSimhash: number
  potentialDuplicates: number
  estimatedSavings: number
}> {
  try {
    const preview = await previewProjectDuplicates(projectId, 4)
    const allTestCases = getAllStoredTestCases()
    const testCases = projectId 
      ? allTestCases.filter(tc => tc.projectId === projectId)
      : allTestCases

    const stats = getSimhashStats(testCases.map(tc => ({ simhash: tc.data?.simhash })))

    return {
      totalCases: testCases.length,
      withSimhash: stats.withSimhash,
      potentialDuplicates: preview.totalWouldRemove,
      estimatedSavings: Math.round((preview.totalWouldRemove / testCases.length) * 100)
    }
  } catch (error) {
    console.error('❌ Failed to get reconciliation stats:', error)
    return {
      totalCases: 0,
      withSimhash: 0,
      potentialDuplicates: 0,
      estimatedSavings: 0
    }
  }
}