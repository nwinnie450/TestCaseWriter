import { TestCase } from '@/types'
import { getTestCaseSignature } from './caseSignature'
import { buildTestCaseSimhash } from './simhash'

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
}

export function saveGeneratedTestCases(
  testCases: TestCase[], 
  documentNames: string[] = [], 
  model: string = 'gpt-4o', 
  projectId?: string, 
  projectName?: string,
  continueSessionId?: string
): SaveResult {
  try {
    console.log('🔍 Storage Debug - Starting deduplication save for', testCases.length, 'test cases')
    
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
    
    console.log('🔍 Storage Debug - Found', existingSignatures.size, 'existing signatures in project')
    
    // Deduplicate incoming test cases
    const newTestCases: TestCase[] = []
    const duplicateSignatures: string[] = []
    let skipped = 0
    
    for (const testCase of testCases) {
      const signature = getTestCaseSignature(testCase)
      
      if (existingSignatures.has(signature)) {
        console.log('🚫 Storage Debug - Skipping duplicate:', {
          id: testCase.id,
          title: testCase.testCase,
          signature: signature.substring(0, 8) + '...'
        })
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
        console.log('✅ Storage Debug - Adding new test case:', {
          id: testCase.id,
          title: testCase.testCase,
          signature: signature.substring(0, 8) + '...'
        })
      }
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
          console.log('✅ Storage Debug - Appended to existing session:', { sessionId, added: newTestCases.length, totalInSession: existingSession.totalCount })
        } else {
          // Session not found, create new one
          console.log('⚠️ Requested session not found, creating new session')
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
          console.log('✅ Storage Debug - New session created:', { sessionId, saved: newTestCases.length, skipped })
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
        console.log('✅ Storage Debug - New session created:', { sessionId, saved: newTestCases.length, skipped })
      }
    } else {
      sessionId = continueSessionId || 'no-new-cases'
      console.log('ℹ️ Storage Debug - No new test cases to save, all were duplicates')
    }
    
    return {
      sessionId,
      saved: newTestCases.length,
      skipped,
      duplicateSignatures
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
  const sessions = getStoredTestCaseSessions()
  const allTestCases: TestCase[] = []
  
  sessions.forEach(session => {
    allTestCases.push(...session.testCases)
  })
  
  return allTestCases
}

export function deleteTestCasesByIds(testCaseIds: string[]): void {
  try {
    const sessions = getStoredTestCaseSessions()
    
    // Remove test cases with matching IDs from all sessions
    const updatedSessions = sessions.map(session => ({
      ...session,
      testCases: session.testCases.filter(tc => !testCaseIds.includes(tc.id)),
      totalCount: session.testCases.filter(tc => !testCaseIds.includes(tc.id)).length
    })).filter(session => session.testCases.length > 0) // Remove empty sessions
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
    console.log(`✅ Deleted ${testCaseIds.length} test cases from localStorage`)
  } catch (error) {
    console.error('❌ Failed to delete test cases:', error)
    throw new Error('Failed to delete test cases')
  }
}

export function clearStoredTestCases(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ Cleared all stored test cases')
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
      console.log('🔍 Found duplicate test case IDs:', Array.from(duplicateIds))
      
      // Regenerate IDs for test cases with duplicates
      const updatedSessions = sessions.map(session => ({
        ...session,
        testCases: session.testCases.map(tc => {
          if (duplicateIds.has(tc.id)) {
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 5)
            const newId = `TC-${timestamp}-${randomSuffix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            console.log(`🔄 Regenerating ID: ${tc.id} → ${newId}`)
            return { ...tc, id: newId }
          }
          return tc
        })
      }))
      
      // Save updated sessions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
      console.log('✅ Cleaned up duplicate test case IDs')
    } else {
      console.log('✅ No duplicate test case IDs found')
    }
  } catch (error) {
    console.error('❌ Failed to cleanup duplicate test case IDs:', error)
  }
}