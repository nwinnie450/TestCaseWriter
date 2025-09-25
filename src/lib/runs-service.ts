// Service layer for the runs system
export interface CreateRunRequest {
  name: string
  projectId: string
  selectedTestCaseIds?: string[]
  testCaseSnapshots?: any[] // Full test case data for localStorage cases
  filters?: {
    status?: string
    priority?: string
    projectId?: string
    tags?: string[]
    module?: string
    search?: string
  }
  assignees?: string[]
  environments?: string[]
  build?: string
  dueAt?: string
  notes?: string
}

export interface RunWithStats {
  id: string
  name: string
  projectId: string
  build?: string
  environments: string[]
  status: string
  createdBy: string
  createdAt: string
  startedAt?: string
  closedAt?: string
  dueAt?: string
  notes?: string
  stats: {
    totalCases: number
    passedCases: number
    failedCases: number
    blockedCases: number
    notRunCases: number
    passRate: number
  }
}

export interface RunCase {
  id: string
  runId: string
  caseId: string
  titleSnapshot: string
  stepsSnapshot: any[]
  assignee?: string
  status: string
  durationSec?: number
  notes?: string
  priority: string
  component?: string
  tags: string[]
  runSteps: RunStep[]
  evidence: Evidence[]
  defects: Defect[]
}

export interface RunStep {
  id: string
  runCaseId: string
  idx: number
  description: string
  expected: string
  status: string
  actual?: string
  durationSec?: number
}

export interface Evidence {
  id: string
  type: string
  filename: string
  url: string
  size?: number
  mimeType?: string
  description?: string
  createdBy: string
  createdAt: string
}

export interface Defect {
  id: string
  externalId: string
  system: string
  status: string
  severity?: string
  title?: string
  description?: string
  url?: string
  createdBy: string
  createdAt: string
}

export class RunsService {
  private static baseUrl = '/api/runs'

  static async createRun(request: CreateRunRequest): Promise<{ runId: string; run: RunWithStats }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create run')
    }

    return response.json()
  }

  static async getRuns(params?: {
    projectId?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ runs: RunWithStats[] }> {
    const searchParams = new URLSearchParams()
    if (params?.projectId) searchParams.append('projectId', params.projectId)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const url = `${this.baseUrl}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch runs')
    }

    return response.json()
  }

  static async getRun(runId: string): Promise<{ run: any; stats: any }> {
    const response = await fetch(`${this.baseUrl}/${runId}`, { cache: 'no-store' })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch run')
    }

    return response.json()
  }

  static async updateRun(runId: string, updates: {
    name?: string
    build?: string
    notes?: string
    status?: string
    environments?: string[]
    dueAt?: string
  }): Promise<{ run: any }> {
    const response = await fetch(`${this.baseUrl}/${runId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update run')
    }

    return response.json()
  }

  static async deleteRun(runId: string): Promise<{ success: boolean }> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ runId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete run')
    }

    return response.json()
  }

  static async updateRunCase(runCaseId: string, updates: {
    status?: string
    assignee?: string
    notes?: string
    durationSec?: number
  }): Promise<{ runCase: RunCase }> {
    const response = await fetch(`/api/run-cases/${runCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update run case')
    }

    return response.json()
  }

  static async updateRunStepResult(runStepId: string, result: {
    status: 'Pass' | 'Fail' | 'NA' | 'Not Run'
    actual?: string
    durationSec?: number
  }): Promise<{ runStep: RunStep; caseCompleted: boolean }> {
    const response = await fetch(`/api/run-steps/${runStepId}/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update run step result')
    }

    return response.json()
  }

  static async rerunFailed(runId: string): Promise<{ runId: string; run: any; stats: any }> {
    const response = await fetch(`${this.baseUrl}/${runId}/rerun?failedOnly=true`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to rerun failed cases')
    }

    return response.json()
  }

  static async rerunAll(runId: string): Promise<{ runId: string; run: any; stats: any }> {
    const response = await fetch(`${this.baseUrl}/${runId}/rerun`, {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to rerun all cases')
    }

    return response.json()
  }
}
