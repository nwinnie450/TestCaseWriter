import { TestCase } from '@/types'

// Database service that handles both localStorage and API operations
export class DatabaseService {

  // Save test cases to both API and localStorage for hybrid approach
  static async saveTestCases(testCases: TestCase[]): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Try API first (production)
      const response = await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCases)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API save successful:', result)
        return { success: true, count: result.count || testCases.length }
      } else {
        throw new Error(`API save failed: ${response.statusText}`)
      }
    } catch (error) {
      console.log('⚠️ API save failed, falling back to localStorage...')

      try {
        // Fallback to localStorage (keep using sync version for backward compatibility)
        const { saveGeneratedTestCases } = await import('@/lib/test-case-storage')
        const saveResult = saveGeneratedTestCases(
          testCases,
          ['Generated Test Cases'],
          'gpt-4o',
          undefined,
          'Generated Session'
        )

        return { success: true, count: saveResult.saved }
      } catch (localError) {
        console.error('Both API and localStorage save failed:', localError)
        return {
          success: false,
          count: 0,
          error: localError instanceof Error ? localError.message : 'Unknown error'
        }
      }
    }
  }

  // Get test cases with fallback
  static async getTestCases(projectId?: string): Promise<TestCase[]> {
    try {
      // Try API first (production)
      const url = projectId ? `/api/test-cases?projectId=${projectId}` : '/api/test-cases'
      const response = await fetch(url)

      if (response.ok) {
        const testCases = await response.json()
        console.log('✅ API load successful:', testCases.length)
        return testCases
      } else {
        throw new Error(`API load failed: ${response.statusText}`)
      }
    } catch (error) {
      console.log('⚠️ API load failed, falling back to localStorage...')

      try {
        // Fallback to localStorage
        const { getAllStoredTestCases } = await import('@/lib/test-case-storage')
        const testCases = getAllStoredTestCases()

        // Filter by project if specified
        if (projectId) {
          return testCases.filter(tc => tc.projectId === projectId)
        }

        return testCases
      } catch (localError) {
        console.error('Both API and localStorage load failed:', localError)
        return []
      }
    }
  }

  // Delete test cases with fallback
  static async deleteTestCases(ids: string[]): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Try API first (production)
      const response = await fetch('/api/test-cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API delete successful:', result)
        return { success: true, count: result.deletedCount }
      } else {
        throw new Error(`API delete failed: ${response.statusText}`)
      }
    } catch (error) {
      console.log('⚠️ API delete failed, falling back to localStorage...')

      try {
        // Fallback to localStorage
        const { deleteTestCasesByIds } = await import('@/lib/test-case-storage')
        deleteTestCasesByIds(ids)

        return { success: true, count: ids.length }
      } catch (localError) {
        console.error('Both API and localStorage delete failed:', localError)
        return {
          success: false,
          count: 0,
          error: localError instanceof Error ? localError.message : 'Unknown error'
        }
      }
    }
  }

  // Clear all test cases with fallback
  static async clearTestCases(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Try API first (production)
      const response = await fetch('/api/test-cases/clear', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API clear successful:', result)
        return { success: true, count: result.deletedCount }
      } else {
        throw new Error(`API clear failed: ${response.statusText}`)
      }
    } catch (error) {
      console.log('⚠️ API clear failed, falling back to localStorage...')

      try {
        // Fallback to localStorage
        const { clearStoredTestCases } = await import('@/lib/test-case-storage')
        clearStoredTestCases()

        return { success: true, count: 0 }
      } catch (localError) {
        console.error('Both API and localStorage clear failed:', localError)
        return {
          success: false,
          count: 0,
          error: localError instanceof Error ? localError.message : 'Unknown error'
        }
      }
    }
  }
}