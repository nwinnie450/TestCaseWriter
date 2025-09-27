// Client-side API helpers for MongoDB operations

export interface TestCaseData {
  id?: string
  title: string
  description?: string
  steps: Array<{
    id: string
    step: string
    expected: string
  }>
  priority?: 'low' | 'medium' | 'high' | 'critical'
  type?: string
  tags?: string[]
  projectId?: string
}

export interface ProjectData {
  id?: string
  name: string
  description?: string
  status?: 'active' | 'archived' | 'draft'
  ownerId?: string
  testCaseCount?: number
  templateCount?: number
  memberCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface MigrationResponse {
  success: boolean
  message: string
  details?: any
}

/**
 * Client-side API wrapper for test cases operations
 */
export class TestCasesAPI {
  static async getAll(params?: {
    projectId?: string
    search?: string
    tag?: string
    priority?: string
    limit?: number
    skip?: number
  }): Promise<{ testCases: any[], total: number, hasMore: boolean }> {
    const searchParams = new URLSearchParams()
    if (params?.projectId) searchParams.append('projectId', params.projectId)
    if (params?.search) searchParams.append('search', params.search)
    if (params?.tag) searchParams.append('tag', params.tag)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.skip) searchParams.append('skip', params.skip.toString())

    const response = await fetch(`/api/test-cases?${searchParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch test cases')
    }
    return await response.json()
  }

  static async create(testCase: TestCaseData): Promise<any> {
    const response = await fetch('/api/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCase)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create test case')
    }
    return await response.json()
  }

  static async createMany(testCases: TestCaseData[]): Promise<any> {
    const response = await fetch('/api/test-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testCases)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create test cases')
    }
    return await response.json()
  }

  static async update(id: string, testCase: Partial<TestCaseData>): Promise<any> {
    const response = await fetch('/api/test-cases', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...testCase })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update test case')
    }
    return await response.json()
  }

  static async delete(id: string): Promise<boolean> {
    const response = await fetch(`/api/test-cases?id=${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete test case')
    }
    const result = await response.json()
    return result.success
  }

  static async deleteMany(ids: string[]): Promise<{ success: boolean, deletedCount: number }> {
    const response = await fetch('/api/test-cases', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete test cases')
    }
    return await response.json()
  }
}

/**
 * Client-side API wrapper for migration operations
 */
export class MigrationAPI {
  static async migrate(): Promise<MigrationResponse> {
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'migrate' })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Migration failed')
    }
    return await response.json()
  }

  static async cleanup(): Promise<MigrationResponse> {
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleanup' })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Cleanup failed')
    }
    return await response.json()
  }

  static async restore(backupKey: string): Promise<MigrationResponse> {
    const response = await fetch('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore', backupKey })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Restore failed')
    }
    return await response.json()
  }

  static async getStatus(): Promise<{
    localStorageStats: any
    migrationAvailable: boolean
  }> {
    const response = await fetch('/api/migrate')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get migration status')
    }
    return await response.json()
  }
}

/**
 * Client-side API wrapper for projects operations
 */
export class ProjectsAPI {
  static async getAll(): Promise<ProjectData[]> {
    const response = await fetch('/api/projects')
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    const data = await response.json()
    // API returns { projects: [...] }, extract the projects array
    return data.projects || data || []
  }

  static async getById(id: string): Promise<ProjectData> {
    const response = await fetch(`/api/projects?id=${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch project')
    }
    return await response.json()
  }

  static async create(projectData: Omit<ProjectData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectData> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    })
    if (!response.ok) {
      const error = await response.json()
      if (response.status === 409) {
        // Handle duplicate name error specifically
        throw new Error(error.error || 'Project name already exists')
      }
      throw new Error(error.error || 'Failed to create project')
    }
    return await response.json()
  }

  static async update(id: string, projectData: Partial<ProjectData>): Promise<ProjectData> {
    const response = await fetch('/api/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...projectData })
    })
    if (!response.ok) {
      const error = await response.json()
      if (response.status === 409) {
        // Handle duplicate name error specifically
        throw new Error(error.error || 'Project name already exists')
      }
      throw new Error(error.error || 'Failed to update project')
    }
    return await response.json()
  }

  static async delete(id: string): Promise<boolean> {
    const response = await fetch(`/api/projects?id=${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete project')
    }
    const result = await response.json()
    return result.success
  }
}

/**
 * Client-side API wrapper for users operations
 */
export class UsersAPI {
  static async getAll(): Promise<any[]> {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return await response.json()
  }

  static async create(userData: {
    email: string
    name: string
    username?: string
    password: string
    role: 'super-admin' | 'admin' | 'lead' | 'qa' | 'user'
  }): Promise<any> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create user')
    }
    return await response.json()
  }

  static async update(id: string, updates: Partial<{
    email: string
    name: string
    username: string
    role: string
  }>): Promise<any> {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user')
    }
    return await response.json()
  }

  static async delete(id: string): Promise<boolean> {
    const response = await fetch(`/api/users?id=${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete user')
    }
    const result = await response.json()
    return result.success
  }
}

/**
 * Utility functions for client-side data operations
 */
export class ClientStorage {
  /**
   * Get all test cases from localStorage (fallback when API is unavailable)
   */
  static getTestCasesFromLocalStorage(): any[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem('testCaseWriter_generatedTestCases')
      if (!stored) return []

      const sessions = JSON.parse(stored)
      const allTestCases: any[] = []

      sessions.forEach((session: any) => {
        allTestCases.push(...session.testCases)
      })

      return allTestCases
    } catch (error) {
      console.error('Error reading test cases from localStorage:', error)
      return []
    }
  }

  /**
   * Save test cases to localStorage (for backup/offline support)
   */
  static saveTestCasesToLocalStorage(testCases: any[], sessionId?: string): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('testCaseWriter_generatedTestCases')
      const sessions = stored ? JSON.parse(stored) : []

      const session = {
        id: sessionId || `session_${Date.now()}`,
        generatedAt: new Date(),
        testCases,
        totalCount: testCases.length
      }

      const updatedSessions = [session, ...sessions.slice(0, 9)] // Keep latest 10 sessions
      localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(updatedSessions))
    } catch (error) {
      console.error('Error saving test cases to localStorage:', error)
    }
  }
}