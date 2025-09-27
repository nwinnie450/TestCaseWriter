import { TestCase } from '@/types'
import { getTestCaseSignature } from './caseSignature'
import { buildTestCaseSimhash } from './simhash'
import { generateFingerprint, generateLooseFingerprint, areExactDuplicates } from './dedupe/fingerprint'
import { calculateCaseSimilarity, findSimilarCases, getRecommendedAction } from './dedupe/similarity'
import { mergeTestCases, isSafeMerge } from './dedupe/merge'

// Import MongoDB service only on server side
let mongodb: any = null
let TestCaseDocument: any = null

if (typeof window === 'undefined') {
  try {
    const mongoModule = require('./mongodb-service')
    mongodb = mongoModule.mongodb
    TestCaseDocument = mongoModule.TestCaseDocument
  } catch (error) {
    console.warn('MongoDB service not available:', error)
  }
}

const STORAGE_KEY = 'testCaseWriter_generatedTestCases'

export interface TestCaseSession {
  id: string
  generatedAt: Date
  testCases: TestCase[]
  documentNames: string[]
  model: string
  totalCount: number
  projectId?: string
  projectName?: string
}

// Empty mock test cases for production
const mockTestCasesForTesting: TestCase[] = [
  // No mock data for production
]

export interface SaveResult {
  sessionId: string
  saved: number
  skipped: number
  duplicateSignatures: string[]
  // Enhanced deduplication results
  exactDuplicates: number
  autoMerged: number
  reviewRequired: number
  mergeConflicts: Array<{
    incomingCase: TestCase
    existingCase: TestCase
    similarityScore: number
    conflicts: any[]
  }>
}

// Enhanced save function with intelligent duplicate detection and merging
export function saveGeneratedTestCasesWithIntelligentDedup(
  testCases: TestCase[],
  documentNames: string[] = [],
  model: string = 'gpt-4o',
  projectId?: string,
  projectName?: string,
  continueSessionId?: string,
  deduplicationMode: 'strict' | 'smart' | 'off' = 'smart'
): SaveResult {

  const result: SaveResult = {
    sessionId: '',
    saved: 0,
    skipped: 0,
    duplicateSignatures: [],
    exactDuplicates: 0,
    autoMerged: 0,
    reviewRequired: 0,
    mergeConflicts: []
  }

  try {
    if (deduplicationMode === 'off') {
      // Use original function when deduplication is disabled
      const originalResult = saveGeneratedTestCases(
        testCases, documentNames, model, projectId, projectName, continueSessionId, false
      )
      return {
        ...originalResult,
        exactDuplicates: 0,
        autoMerged: 0,
        reviewRequired: 0,
        mergeConflicts: []
      }
    }

    // Get all existing test cases
    const existingTestCases = getAllStoredTestCases()
    const projectFilter = projectId || 'all'

    // Filter existing test cases by project
    const relevantExistingCases = existingTestCases.filter(tc =>
      projectFilter === 'all' || tc.projectId === projectId
    )

    let newTestCases: TestCase[] = []
    const processedCases: Set<string> = new Set()

    // Process each incoming test case
    for (const incomingCase of testCases) {
      try {
        // Generate fingerprints
        const exactFingerprint = generateFingerprint(incomingCase)
        const looseFingerprint = generateLooseFingerprint(incomingCase)

        // Skip if already processed in this batch
        if (processedCases.has(exactFingerprint)) {
          result.skipped++
          continue
        }

        // Check for exact duplicates
        const exactDuplicate = relevantExistingCases.find(existing =>
          generateFingerprint(existing) === exactFingerprint
        )

        if (exactDuplicate) {
          result.exactDuplicates++
          result.duplicateSignatures.push(exactFingerprint)
          processedCases.add(exactFingerprint)
          continue
        }

        // Find similar cases for potential merging
        const similarCases = findSimilarCases(incomingCase, relevantExistingCases, 0.75)

        if (similarCases.length > 0) {
          const bestMatch = similarCases[0]
          const recommendation = getRecommendedAction(bestMatch.similarity.score)

          if (recommendation.action === 'auto_merge' && isSafeMerge(bestMatch.testCase, incomingCase)) {
            // Perform automatic merge
            const mergeResult = mergeTestCases(bestMatch.testCase, incomingCase)

            // Update existing case with merged data
            const sessions = getStoredTestCaseSessions()
            let updated = false

            for (const session of sessions) {
              const caseIndex = session.testCases.findIndex(tc => tc.id === bestMatch.testCase.id)
              if (caseIndex !== -1) {
                session.testCases[caseIndex] = mergeResult.mergedCase
                updated = true
                break
              }
            }

            if (updated) {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
              result.autoMerged++

            }

          } else if (recommendation.action === 'review_merge') {
            // Add to review queue
            result.mergeConflicts.push({
              incomingCase,
              existingCase: bestMatch.testCase,
              similarityScore: bestMatch.similarity.score,
              conflicts: []
            })
            result.reviewRequired++
            console.log('📋 Added to review queue:', incomingCase.testCase?.substring(0, 30))

          } else {
            // Keep as separate case
            const enhancedCase = {
              ...incomingCase,
              projectId: projectId || incomingCase.projectId || 'default',
              data: {
                ...incomingCase.data,
                fingerprint: exactFingerprint,
                looseFingerprint: looseFingerprint,
                simhash: buildTestCaseSimhash(incomingCase)
              }
            }
            newTestCases.push(enhancedCase)
            result.saved++
          }
        } else {
          // No similar cases found - add as new
          const enhancedCase = {
            ...incomingCase,
            projectId: projectId || incomingCase.projectId || 'default',
            data: {
              ...incomingCase.data,
              fingerprint: exactFingerprint,
              looseFingerprint: looseFingerprint,
              simhash: buildTestCaseSimhash(incomingCase)
            }
          }
          newTestCases.push(enhancedCase)
          result.saved++

        }

        processedCases.add(exactFingerprint)

      } catch (error) {
        console.error('❌ Error processing test case:', incomingCase.id, error)
        result.skipped++
      }
    }

    // Save new test cases if any
    if (newTestCases.length > 0) {
      const originalResult = saveGeneratedTestCases(
        newTestCases, documentNames, model, projectId, projectName, continueSessionId, false
      )
      result.sessionId = originalResult.sessionId
    } else {
      result.sessionId = continueSessionId || 'no-new-cases'
    }

    return result

  } catch (error) {
    console.error('❌ Intelligent deduplication failed:', error)
    // Fallback to original function
    const fallbackResult = saveGeneratedTestCases(
      testCases, documentNames, model, projectId, projectName, continueSessionId, false
    )
    return {
      ...fallbackResult,
      exactDuplicates: 0,
      autoMerged: 0,
      reviewRequired: 0,
      mergeConflicts: []
    }
  }
}

// New async function that uses DatabaseService for production database integration
export async function saveGeneratedTestCasesAsync(
  testCases: TestCase[],
  documentNames: string[] = [],
  model: string = 'gpt-4o',
  projectId?: string,
  projectName?: string,
  continueSessionId?: string,
  skipDuplicates: boolean = true
): Promise<SaveResult> {
  try {
    const { DatabaseService } = await import('@/lib/database-service')

    let newTestCases: TestCase[] = []
    let duplicateSignatures: string[] = []
    let skipped = 0

    if (skipDuplicates) {
      // Get existing test cases from database (with localStorage fallback)
      const existingTestCases = await DatabaseService.getTestCases(projectId)
      const existingSignatures = new Set<string>()
      const projectFilter = projectId || 'all'

      // Build signature set for existing test cases in this project
      existingTestCases.forEach(tc => {
        if (projectFilter === 'all' || tc.projectId === projectId) {
          const signature = getTestCaseSignature(tc)
          existingSignatures.add(signature)
        }
      })

      // Deduplicate incoming test cases
      for (const testCase of testCases) {
        const signature = getTestCaseSignature(testCase)

        if (existingSignatures.has(signature)) {
          duplicateSignatures.push(signature)
          skipped++
        } else {
          const simhash = buildTestCaseSimhash(testCase)
          newTestCases.push({
            ...testCase,
            projectId: projectId || testCase.projectId || 'default',
            data: {
              ...testCase.data,
              signature,
              simhash
            }
          })
          existingSignatures.add(signature)
        }
      }

      // Auto-bypass duplicate detection if rate is too high
      const duplicateRate = skipped / testCases.length
      if (duplicateRate > 0.8 && testCases.length > 10) {
        console.log('🚨 High duplicate rate detected, importing all test cases')
        newTestCases = testCases.map(testCase => {
          const signature = getTestCaseSignature(testCase)
          const simhash = buildTestCaseSimhash(testCase)
          return {
            ...testCase,
            projectId: projectId || testCase.projectId || 'default',
            data: { ...testCase.data, signature, simhash }
          }
        })
        skipped = 0
        duplicateSignatures = []
      }
    } else {
      // Import all test cases without duplicate checking
      newTestCases = testCases.map(testCase => {
        const signature = getTestCaseSignature(testCase)
        const simhash = buildTestCaseSimhash(testCase)
        return {
          ...testCase,
          projectId: projectId || testCase.projectId || 'default',
          data: { ...testCase.data, signature, simhash }
        }
      })
    }

    // Save to database using DatabaseService
    if (newTestCases.length > 0) {
      const saveResult = await DatabaseService.saveTestCases(newTestCases)
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save test cases')
      }
    }

    const sessionId = continueSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      sessionId,
      saved: newTestCases.length,
      skipped,
      duplicateSignatures,
      exactDuplicates: skipped,
      autoMerged: 0,
      reviewRequired: 0,
      mergeConflicts: []
    }
  } catch (error) {
    console.error('❌ Failed to save test cases to database:', error)
    throw new Error('Failed to save test cases to database')
  }
}

// Original function (kept for backward compatibility)
export function saveGeneratedTestCases(
  testCases: TestCase[],
  documentNames: string[] = [],
  model: string = 'gpt-4o',
  projectId?: string,
  projectName?: string,
  continueSessionId?: string,
  skipDuplicates: boolean = true
): SaveResult {
  try {

    let newTestCases: TestCase[] = []
    let duplicateSignatures: string[] = []
    let skipped = 0

    if (skipDuplicates) {
      // Get all existing test cases with their signatures
      const existingTestCases = getAllStoredTestCases()
      const existingSignatures = new Set<string>()
      const projectFilter = projectId || 'all'

      // Build signature set for existing test cases in this project
      existingTestCases.forEach(tc => {
        if (projectFilter === 'all' || tc.projectId === projectId) {
          const signature = getTestCaseSignature(tc)
          existingSignatures.add(signature)
        }
      })

      // Track signature collision patterns
      const incomingSignatures = new Set<string>()
      const duplicatesWithinBatch = new Set<string>()

      // First pass: check for duplicates within the incoming batch
      testCases.forEach(testCase => {
        const signature = getTestCaseSignature(testCase)
        if (incomingSignatures.has(signature)) {
          duplicatesWithinBatch.add(signature)
        } else {
          incomingSignatures.add(signature)
        }
      })

      // Deduplicate incoming test cases
      for (const testCase of testCases) {
        const signature = getTestCaseSignature(testCase)

        if (existingSignatures.has(signature)) {
          duplicateSignatures.push(signature)
          skipped++
        } else {
          // Compute SimHash for soft deduplication
          const simhash = buildTestCaseSimhash(testCase)

          // Add to new test cases and mark signature as used
          newTestCases.push({
            ...testCase,
            // Ensure projectId is applied to each test case
            projectId: projectId || testCase.projectId || 'default',
            // Add signature and simhash to test case for future reference
            data: {
              ...testCase.data,
              signature,
              simhash
            }
          })
          existingSignatures.add(signature)
        }
      }

      // Detect suspicious duplicate patterns and auto-fix
      const duplicateRate = skipped / testCases.length
      if (duplicateRate > 0.8 && testCases.length > 10) {
        console.error('🚨 CRITICAL: Suspicious duplicate rate detected! Auto-bypassing duplicate detection.', {
          total: testCases.length,
          skipped,
          duplicateRate: `${Math.round(duplicateRate * 100)}%`,
          action: 'Importing all test cases without duplicate checking'
        })

        // Auto-bypass duplicate detection if the rate is too high
        
        newTestCases = []
        skipped = 0
        duplicateSignatures = []

        // Import all test cases
        testCases.forEach(testCase => {
          const signature = getTestCaseSignature(testCase)
          const simhash = buildTestCaseSimhash(testCase)

          newTestCases.push({
            ...testCase,
            projectId: projectId || testCase.projectId || 'default',
            data: {
              ...testCase.data,
              signature,
              simhash
            }
          })
        })

      }
    } else {
      // Skip duplicate detection - import all test cases
      
      newTestCases = testCases.map(testCase => {
        const signature = getTestCaseSignature(testCase)
        const simhash = buildTestCaseSimhash(testCase)

        return {
          ...testCase,
          // Ensure projectId is applied to each test case
          projectId: projectId || testCase.projectId || 'default',
          // Add signature and simhash to test case for future reference
          data: {
            ...testCase.data,
            signature,
            simhash
          }
        }
      })
      
    }
    
    // Only create/update session if we have new test cases
    let sessionId: string
    
    if (newTestCases.length > 0) {
      const existingSessions = getStoredTestCaseSessions()
      
      // If continuing an existing session, append to it
      if (continueSessionId) {
        const existingSessionIndex = existingSessions.findIndex(s => s.id === continueSessionId)
        if (existingSessionIndex >= 0) {
          // Append to existing session
          sessionId = continueSessionId
          const existingSession = existingSessions[existingSessionIndex]
          existingSession.testCases.push(...newTestCases)
          existingSession.totalCount += newTestCases.length
          existingSession.generatedAt = new Date() // Update timestamp
          
          // Move updated session to front
          const updatedSessions = [existingSession, ...existingSessions.filter((_, i) => i !== existingSessionIndex)]
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
          
        } else {
          // Session not found, create new one
          
          sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const session: TestCaseSession = {
            id: sessionId,
            generatedAt: new Date(),
            testCases: newTestCases,
            documentNames,
            model,
            totalCount: newTestCases.length,
            projectId,
            projectName
          }
          const updatedSessions = [session, ...existingSessions.slice(0, 9)]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
          
        }
      } else {
        // Create new session
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const session: TestCaseSession = {
          id: sessionId,
          generatedAt: new Date(),
          testCases: newTestCases,
          documentNames,
          model,
          totalCount: newTestCases.length,
          projectId,
          projectName
        }
        const updatedSessions = [session, ...existingSessions.slice(0, 9)]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
        
      }
    } else {
      sessionId = continueSessionId || 'no-new-cases'
      
    }
    
    return {
      sessionId,
      saved: newTestCases.length,
      skipped,
      duplicateSignatures,
      // Legacy compatibility
      exactDuplicates: skipped,
      autoMerged: 0,
      reviewRequired: 0,
      mergeConflicts: []
    }
    
  } catch (error) {
    console.error('❌ Failed to save test cases with deduplication:', error)
    throw new Error('Failed to save test cases. Your browser storage may be full.')
  }
}

export function getStoredTestCaseSessions(): TestCaseSession[] {
  try {
    // Check if localStorage is available (browser environment)
    if (typeof window === 'undefined' || !localStorage) {
      return []
    }
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const sessions = JSON.parse(stored) as TestCaseSession[]
    // Convert date strings back to Date objects with proper validation
    return sessions.map(session => ({
      ...session,
      generatedAt: session.generatedAt ? new Date(session.generatedAt) : new Date(),
      testCases: session.testCases.map(testCase => ({
        ...testCase,
        createdAt: testCase.createdAt ? new Date(testCase.createdAt) : new Date(),
        updatedAt: testCase.updatedAt ? new Date(testCase.updatedAt) : new Date()
      }))
    }))
  } catch (error) {
    console.error('❌ Failed to load test cases from localStorage:', error)
    return []
  }
}

export function getLatestTestCases(): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  if (sessions.length === 0) return []
  
  return sessions[0].testCases
}

export function getTestCasesBySessionId(sessionId: string): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  const session = sessions.find(s => s.id === sessionId)
  return session?.testCases || []
}

export function getAllStoredTestCases(): TestCase[] {
  console.log('📖 GetAllStoredTestCases - Loading from localStorage key:', STORAGE_KEY)

  const sessions = getStoredTestCaseSessions()
  console.log('📖 GetAllStoredTestCases - Found sessions:', sessions.length, sessions.map(s => ({ id: s.id, count: s.testCases.length })))

  const allTestCases: TestCase[] = []

  sessions.forEach(session => {
    allTestCases.push(...session.testCases)
  })

  console.log('📖 GetAllStoredTestCases - Total test cases loaded:', allTestCases.length)

  return allTestCases
}

export function deleteTestCasesByIds(testCaseIds: string[]): void {
  try {
    console.log('🗑️ DeleteTestCasesByIds - Input IDs:', testCaseIds)

    const sessions = getStoredTestCaseSessions()
    console.log('🗑️ DeleteTestCasesByIds - Sessions before delete:', sessions.length, sessions.map(s => ({ id: s.id, count: s.testCases.length })))

    // Remove test cases with matching IDs from all sessions
    const updatedSessions = sessions.map(session => {
      const beforeCount = session.testCases.length
      const filteredTestCases = session.testCases.filter(tc => !testCaseIds.includes(tc.id))
      const afterCount = filteredTestCases.length

      console.log(`🗑️ Session ${session.id}: ${beforeCount} -> ${afterCount} test cases`)

      return {
        ...session,
        testCases: filteredTestCases,
        totalCount: filteredTestCases.length
      }
    }).filter(session => session.testCases.length > 0) // Remove empty sessions

    console.log('🗑️ DeleteTestCasesByIds - Sessions after delete:', updatedSessions.length, updatedSessions.map(s => ({ id: s.id, count: s.testCases.length })))

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
    console.log('🗑️ DeleteTestCasesByIds - Successfully updated localStorage')

  } catch (error) {
    console.error('❌ Failed to delete test cases:', error)
    throw new Error('Failed to delete test cases')
  }
}

export function clearStoredTestCases(): void {
  try {
    console.log('🧹 ClearStoredTestCases - Clearing localStorage key:', STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
    console.log('🧹 ClearStoredTestCases - Successfully cleared localStorage')

  } catch (error) {
    console.error('❌ Failed to clear stored test cases:', error)
  }
}

export function getTestCasesByProjectId(projectId: string): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  const testCasesForProject: TestCase[] = []
  
  sessions.forEach(session => {
    // Filter test cases that belong to this project (either from session or individual test case projectId)
    const matchingTestCases = session.testCases.filter(tc =>
      tc.projectId === projectId || session.projectId === projectId
    )
    testCasesForProject.push(...matchingTestCases)
  })
  
  return testCasesForProject
}

export function getProjectTestCaseStats(projectId: string): { total: number, byStatus: Record<string, number>, byPriority: Record<string, number> } {
  const testCases = getTestCasesByProjectId(projectId)
  
  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  
  testCases.forEach(tc => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1
  })
  
  return {
    total: testCases.length,
    byStatus,
    byPriority
  }
}

export function getStorageStats(): { sessions: number, totalTestCases: number, storageSize: string } {
  // Check if localStorage is available (browser environment)
  if (typeof window === 'undefined' || !localStorage) {
    return { sessions: 0, totalTestCases: 0, storageSize: '0 KB' }
  }
  
  const sessions = getStoredTestCaseSessions()
  const totalTestCases = getAllStoredTestCases().length
  const storageData = localStorage.getItem(STORAGE_KEY) || ''
  const storageSize = `${Math.round(storageData.length / 1024)} KB`
  
  return {
    sessions: sessions.length,
    totalTestCases,
    storageSize
  }
}

export function loadMockTestCases(): string {
  try {
    console.log('🎭 Loading mock test cases for expand/collapse testing...')
    
    // No sample projects for production - start clean
    
    return 'session-empty' // No mock data for production
  } catch (error) {
    console.error('❌ Failed to load mock test cases:', error)
    throw new Error('Failed to load mock test cases')
  }
}

export function cleanupDuplicateTestCaseIds(): void {
  try {
    const sessions = getStoredTestCaseSessions()
    let hasDuplicates = false

    // Check for duplicate IDs across all sessions
    const allIds = new Set<string>()
    const duplicateIds = new Set<string>()

    sessions.forEach(session => {
      session.testCases.forEach(tc => {
        if (allIds.has(tc.id)) {
          duplicateIds.add(tc.id)
          hasDuplicates = true
        } else {
          allIds.add(tc.id)
        }
      })
    })

    if (hasDuplicates) {

      // Regenerate IDs for test cases with duplicates
      const updatedSessions = sessions.map(session => ({
        ...session,
        testCases: session.testCases.map(tc => {
          if (duplicateIds.has(tc.id)) {
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 5)
            const newId = `TC-${timestamp}-${randomSuffix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

            return { ...tc, id: newId }
          }
          return tc
        })
      }))

      // Save updated sessions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))

    } else {

    }
  } catch (error) {
    console.error('❌ Failed to cleanup duplicate test case IDs:', error)
  }
}

// ========== MongoDB-based functions ==========

export async function saveGeneratedTestCasesToMongoDB(
  testCases: TestCase[],
  documentNames: string[] = [],
  model: string = 'gpt-4o',
  projectId?: string,
  projectName?: string,
  continueSessionId?: string,
  skipDuplicates: boolean = true
): Promise<SaveResult> {
  try {
    let newTestCases: TestCase[] = []
    let duplicateSignatures: string[] = []
    let skipped = 0

    if (skipDuplicates) {
      // Get existing test cases from MongoDB
      const filter = projectId ? { projectId } : {}
      const existingTestCases = await mongodb.findMany<TestCaseDocument>('test_cases', filter)
      const existingSignatures = new Set<string>()

      // Build signature set for existing test cases
      existingTestCases.forEach(tc => {
        const signature = getTestCaseSignature(tc as any)
        existingSignatures.add(signature)
      })

      // Deduplicate incoming test cases
      for (const testCase of testCases) {
        const signature = getTestCaseSignature(testCase)

        if (existingSignatures.has(signature)) {
          duplicateSignatures.push(signature)
          skipped++
        } else {
          const simhash = buildTestCaseSimhash(testCase)
          newTestCases.push({
            ...testCase,
            projectId: projectId || testCase.projectId || 'default',
            data: {
              ...testCase.data,
              signature,
              simhash
            }
          })
          existingSignatures.add(signature)
        }
      }

      // Auto-bypass duplicate detection if rate is too high
      const duplicateRate = skipped / testCases.length
      if (duplicateRate > 0.8 && testCases.length > 10) {
        console.log('🚨 High duplicate rate detected, importing all test cases')
        newTestCases = testCases.map(testCase => {
          const signature = getTestCaseSignature(testCase)
          const simhash = buildTestCaseSimhash(testCase)
          return {
            ...testCase,
            projectId: projectId || testCase.projectId || 'default',
            data: { ...testCase.data, signature, simhash }
          }
        })
        skipped = 0
        duplicateSignatures = []
      }
    } else {
      // Import all test cases without duplicate checking
      newTestCases = testCases.map(testCase => {
        const signature = getTestCaseSignature(testCase)
        const simhash = buildTestCaseSimhash(testCase)
        return {
          ...testCase,
          projectId: projectId || testCase.projectId || 'default',
          data: { ...testCase.data, signature, simhash }
        }
      })
    }

    // Convert TestCase to TestCaseDocument and save to MongoDB
    if (newTestCases.length > 0) {
      const testCaseDocuments: TestCaseDocument[] = newTestCases.map(tc => ({
        id: tc.id,
        title: tc.testCase || tc.title || '',
        description: tc.qa || tc.description || '',
        steps: Array.isArray(tc.testSteps) ? tc.testSteps : [],
        priority: tc.priority as 'low' | 'medium' | 'high' | 'critical' || 'medium',
        type: tc.type || 'manual',
        tags: Array.isArray(tc.tags) ? tc.tags : [],
        projectId: tc.projectId || 'default',
        createdBy: 'system', // TODO: Get from current user
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      await mongodb.insertMany('test_cases', testCaseDocuments)
    }

    // Also save to localStorage for backward compatibility
    if (newTestCases.length > 0) {
      const originalResult = saveGeneratedTestCases(
        newTestCases, documentNames, model, projectId, projectName, continueSessionId, false
      )
    }

    const sessionId = continueSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      sessionId,
      saved: newTestCases.length,
      skipped,
      duplicateSignatures,
      exactDuplicates: skipped,
      autoMerged: 0,
      reviewRequired: 0,
      mergeConflicts: []
    }
  } catch (error) {
    console.error('❌ Failed to save test cases to MongoDB:', error)
    // Fallback to localStorage
    const fallbackResult = saveGeneratedTestCases(
      testCases, documentNames, model, projectId, projectName, continueSessionId, skipDuplicates
    )
    return {
      ...fallbackResult,
      exactDuplicates: 0,
      autoMerged: 0,
      reviewRequired: 0,
      mergeConflicts: []
    }
  }
}

export async function getAllStoredTestCasesFromMongoDB(projectId?: string): Promise<TestCase[]> {
  try {
    const filter = projectId ? { projectId } : {}
    const testCaseDocuments = await mongodb.findMany<TestCaseDocument>('test_cases', filter, {
      sort: { createdAt: -1 }
    })

    // Transform MongoDB documents back to TestCase format
    const testCases: TestCase[] = testCaseDocuments.map(doc => ({
      id: doc.id || doc._id?.toString() || '',
      testCase: doc.title || '',
      qa: doc.description || '',
      testSteps: doc.steps || [],
      priority: doc.priority || 'medium',
      type: doc.type || 'manual',
      tags: doc.tags || [],
      projectId: doc.projectId || 'default',
      status: 'active', // Default status
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
      data: {
        signature: getTestCaseSignature({
          testCase: doc.title,
          qa: doc.description,
          testSteps: doc.steps
        } as any)
      }
    }))

    console.log('📖 GetAllStoredTestCasesFromMongoDB - Total test cases loaded:', testCases.length)
    return testCases
  } catch (error) {
    console.error('❌ Failed to load test cases from MongoDB:', error)
    // Fallback to localStorage
    return getAllStoredTestCases()
  }
}

export async function deleteTestCasesByIdsFromMongoDB(testCaseIds: string[]): Promise<void> {
  try {
    console.log('🗑️ DeleteTestCasesByIdsFromMongoDB - Input IDs:', testCaseIds)

    // Delete from MongoDB
    const deletedCount = await mongodb.deleteMany('test_cases', {
      id: { $in: testCaseIds }
    })

    console.log(`🗑️ DeleteTestCasesByIdsFromMongoDB - Deleted ${deletedCount} test cases from MongoDB`)

    // Also delete from localStorage for backward compatibility
    deleteTestCasesByIds(testCaseIds)

    console.log('🗑️ DeleteTestCasesByIdsFromMongoDB - Successfully deleted from both MongoDB and localStorage')
  } catch (error) {
    console.error('❌ Failed to delete test cases from MongoDB:', error)
    // Fallback to localStorage only
    deleteTestCasesByIds(testCaseIds)
    throw new Error('Failed to delete test cases from MongoDB')
  }
}

export async function getTestCasesByProjectIdFromMongoDB(projectId: string): Promise<TestCase[]> {
  try {
    const testCaseDocuments = await mongodb.findMany<TestCaseDocument>('test_cases',
      { projectId },
      { sort: { createdAt: -1 } }
    )

    // Transform MongoDB documents back to TestCase format
    const testCases: TestCase[] = testCaseDocuments.map(doc => ({
      id: doc.id || doc._id?.toString() || '',
      testCase: doc.title || '',
      qa: doc.description || '',
      testSteps: doc.steps || [],
      priority: doc.priority || 'medium',
      type: doc.type || 'manual',
      tags: doc.tags || [],
      projectId: doc.projectId || 'default',
      status: 'active', // Default status
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
      data: {
        signature: getTestCaseSignature({
          testCase: doc.title,
          qa: doc.description,
          testSteps: doc.steps
        } as any)
      }
    }))

    return testCases
  } catch (error) {
    console.error('❌ Failed to load project test cases from MongoDB:', error)
    // Fallback to localStorage
    return getTestCasesByProjectId(projectId)
  }
}

export async function migrateLocalStorageToMongoDB(): Promise<{ success: boolean, migrated: number, errors: number }> {
  try {
    console.log('🔄 Starting migration from localStorage to MongoDB...')

    // Get all test cases from localStorage
    const localStorageTestCases = getAllStoredTestCases()
    console.log(`📦 Found ${localStorageTestCases.length} test cases in localStorage`)

    let migrated = 0
    let errors = 0

    if (localStorageTestCases.length === 0) {
      console.log('✅ No test cases to migrate')
      return { success: true, migrated: 0, errors: 0 }
    }

    // Group test cases by project for better organization
    const testCasesByProject = localStorageTestCases.reduce((groups, tc) => {
      const projectId = tc.projectId || 'default'
      if (!groups[projectId]) {
        groups[projectId] = []
      }
      groups[projectId].push(tc)
      return groups
    }, {} as Record<string, TestCase[]>)

    // Migrate each project's test cases
    for (const [projectId, testCases] of Object.entries(testCasesByProject)) {
      try {
        console.log(`📁 Migrating ${testCases.length} test cases for project: ${projectId}`)

        const result = await saveGeneratedTestCasesToMongoDB(
          testCases,
          [],
          'migration',
          projectId,
          undefined,
          undefined,
          false // Don't skip duplicates during migration
        )

        migrated += result.saved
        console.log(`✅ Successfully migrated ${result.saved} test cases for project: ${projectId}`)
      } catch (projectError) {
        console.error(`❌ Failed to migrate test cases for project ${projectId}:`, projectError)
        errors += testCases.length
      }
    }

    console.log(`🎉 Migration completed: ${migrated} migrated, ${errors} errors`)

    return {
      success: errors === 0,
      migrated,
      errors
    }
  } catch (error) {
    console.error('❌ Failed to migrate localStorage to MongoDB:', error)
    return { success: false, migrated: 0, errors: -1 }
  }
}