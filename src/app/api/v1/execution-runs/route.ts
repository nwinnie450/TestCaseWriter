import { NextRequest, NextResponse } from 'next/server'

// Sample data - in production this would use a database
const sampleExecutionRuns = [
  {
    id: 'run-1',
    name: 'Sprint 24 - Login Tests',
    project: 'E-commerce Platform',
    status: 'Active',
    assignedTester: 'john.doe@company.com',
    environment: 'Staging',
    createdAt: '2024-01-15T10:00:00Z',
    startedAt: '2024-01-15T10:00:00Z',
    progress: {
      total: 25,
      executed: 18,
      passed: 15,
      failed: 2,
      blocked: 1
    },
    testCases: []
  },
  {
    id: 'run-2',
    name: 'Payment Gateway Testing',
    project: 'E-commerce Platform',
    status: 'Completed',
    assignedTester: 'jane.smith@company.com',
    environment: 'Production',
    createdAt: '2024-01-10T09:00:00Z',
    startedAt: '2024-01-10T09:00:00Z',
    completedAt: '2024-01-14T17:30:00Z',
    progress: {
      total: 32,
      executed: 32,
      passed: 30,
      failed: 2,
      blocked: 0
    },
    testCases: []
  },
  {
    id: 'run-3',
    name: 'Mobile App - User Registration',
    project: 'Mobile App',
    status: 'Draft',
    assignedTester: 'mike.wilson@company.com',
    environment: 'Development',
    createdAt: '2024-01-16T08:30:00Z',
    progress: {
      total: 0,
      executed: 0,
      passed: 0,
      failed: 0,
      blocked: 0
    },
    testCases: []
  }
]

// GET /api/v1/execution-runs - Get all execution runs
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const project = url.searchParams.get('project')
    const assignedTo = url.searchParams.get('assignedTo')

    let filteredRuns = [...sampleExecutionRuns]

    // Apply filters
    if (status) {
      filteredRuns = filteredRuns.filter(run => run.status === status)
    }

    if (project) {
      filteredRuns = filteredRuns.filter(run =>
        run.project.toLowerCase().includes(project.toLowerCase())
      )
    }

    if (assignedTo) {
      filteredRuns = filteredRuns.filter(run =>
        run.assignedTester.toLowerCase().includes(assignedTo.toLowerCase())
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredRuns,
      total: filteredRuns.length
    })
  } catch (error) {
    console.error('Error fetching execution runs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution runs' },
      { status: 500 }
    )
  }
}

// POST /api/v1/execution-runs - Create new execution run
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, project, assignedTester, environment, testCaseIds } = body

    // Validate required fields
    if (!name || !project || !assignedTester || !environment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newRun = {
      id: `run-${Date.now()}`,
      name,
      project,
      status: testCaseIds && testCaseIds.length > 0 ? 'Active' : 'Draft',
      assignedTester,
      environment,
      createdAt: new Date().toISOString(),
      startedAt: testCaseIds && testCaseIds.length > 0 ? new Date().toISOString() : undefined,
      progress: {
        total: testCaseIds ? testCaseIds.length : 0,
        executed: 0,
        passed: 0,
        failed: 0,
        blocked: 0
      },
      testCases: testCaseIds || []
    }

    // In production, save to database
    sampleExecutionRuns.push(newRun)

    return NextResponse.json({
      success: true,
      data: newRun,
      message: 'Execution run created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating execution run:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create execution run' },
      { status: 500 }
    )
  }
}