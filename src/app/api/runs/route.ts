import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { dataService } from '@/lib/data-service'
import { mongodb } from '@/lib/mongodb-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, projectId, filters, assignees, environments, build, dueAt, notes, selectedTestCaseIds, testCaseSnapshots } = body

    // Validate required fields
    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Name and project ID are required' },
        { status: 400 }
      )
    }

    // For now, use a default user since authentication is handled client-side
    const currentUser = { id: 'admin', username: 'admin' }

    // Get test cases from library based on selection
    let testCasesToInclude = []

    // If testCaseSnapshots provided, use them directly (for localStorage test cases)
    if (testCaseSnapshots && testCaseSnapshots.length > 0) {
      console.log('📊 Creating run - Using test case snapshots:', testCaseSnapshots.length)
      testCasesToInclude = testCaseSnapshots.map((tc: any) => ({
        id: tc.id,
        testCase: tc.title || tc.testCase,
        priority: tc.priority?.toLowerCase() || 'medium',
        tags: tc.tags || [],
        data: {
          testCase: tc.title || tc.testCase,
          module: tc.category || tc.module,
          testSteps: tc.steps || tc.testSteps || []
        }
      }))
    } else if (selectedTestCaseIds && selectedTestCaseIds.length > 0) {
      // Fetch from library API
      const allTestCases = await dataService.getAllTestCases()
      console.log('📊 Creating run - All test cases from DB:', allTestCases.length)
      console.log('📊 Creating run - First 5 DB IDs:', allTestCases.slice(0, 5).map((tc: any) => tc.id))
      console.log('📊 Creating run - Selected IDs:', selectedTestCaseIds)
      testCasesToInclude = allTestCases.filter((tc: any) => selectedTestCaseIds.includes(tc.id))
      console.log('📊 Creating run - Filtered test cases:', testCasesToInclude.length)

      // Transform library test cases to the expected format
      testCasesToInclude = testCasesToInclude.map((tc: any) => ({
        id: tc.id,
        testCase: tc.title,
        priority: tc.priority?.toLowerCase() || 'medium',
        tags: tc.tags || [],
        data: {
          testCase: tc.title,
          module: tc.category,
          testSteps: tc.steps || []
        }
      }))
    } else if (filters) {
      // Apply filters to get test cases
      const allTestCases = await dataService.getAllTestCases()
      testCasesToInclude = applyFiltersToTestCases(allTestCases, filters)
    }

    if (testCasesToInclude.length === 0) {
      return NextResponse.json(
        { error: 'No test cases found with the specified criteria' },
        { status: 400 }
      )
    }

    // Create the run
    const runData = {
      name,
      projectId,
      build: build || null,
      environments: environments ? JSON.stringify(environments) : null,
      filters: filters ? JSON.stringify(filters) : null,
      dueAt: dueAt ? new Date(dueAt) : null,
      notes: notes || null,
      createdBy: currentUser.id,
      status: 'draft',
      createdAt: new Date(),
      startedAt: null,
      closedAt: null
    }

    const run = await mongodb.insertOne('runs', runData)

    // Create run cases with snapshots
    const runCasesData = testCasesToInclude.map(testCase => ({
      runId: new ObjectId(run.id),
      caseId: testCase.id,
      titleSnapshot: testCase.data?.testCase || 'Untitled Test Case',
      stepsSnapshot: testCase.data?.testSteps || [],
      assignee: assignees && assignees.length > 0 ? assignees[0] : null,
      priority: testCase.priority || 'medium',
      component: testCase.data?.module || null,
      tags: testCase.tags || null,
      status: 'Not Run',
      durationSec: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const insertedRunCases = await mongodb.insertMany('run_cases', runCasesData)

    // Create run steps for each case
    const allRunStepsData = []
    for (let i = 0; i < testCasesToInclude.length; i++) {
      const testCase = testCasesToInclude[i]
      const runCase = insertedRunCases[i]

      if (runCase) {
        const steps = testCase.data?.testSteps || []
        if (steps.length > 0) {
          const runStepsData = steps.map((step: any, index: number) => ({
            runCaseId: runCase._id,
            idx: index + 1,
            description: step.description || '',
            expected: step.expectedResult || '',
            status: 'Not Run',
            actual: null,
            durationSec: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }))
          allRunStepsData.push(...runStepsData)
        } else {
          // Create a default step if no steps exist
          allRunStepsData.push({
            runCaseId: runCase._id,
            idx: 1,
            description: 'Execute test case',
            expected: 'Test case passes successfully',
            status: 'Not Run',
            actual: null,
            durationSec: null,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
      }
    }

    if (allRunStepsData.length > 0) {
      await mongodb.insertMany('run_steps', allRunStepsData)
    }

    // Return the created run with basic stats
    const runWithStats = {
      ...run,
      totalCases: testCasesToInclude.length,
      environments: environments || [],
      assignees: assignees || []
    }

    return NextResponse.json({
      runId: run.id,
      run: runWithStats
    })

  } catch (error) {
    console.error('Failed to create run:', error)
    return NextResponse.json(
      { error: 'Failed to create run' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/runs called')
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 GET /api/runs params:', { projectId, status, limit, offset })

    // Build filter query
    const filter: any = {}
    if (projectId) {
      filter.projectId = projectId
    }
    if (status && status !== 'all') {
      filter.status = status
    }

    console.log('🔍 GET /api/runs filter:', filter)

    // Get runs using mongodb service
    const runs = await mongodb.findMany('runs', filter, {
      sort: { createdAt: -1 },
      limit,
      skip: offset
    })

    console.log('🔍 GET /api/runs found runs:', runs.length)

    // Get run cases statistics for each run
    const runsWithStats = await Promise.all(runs.map(async run => {
      const runCases = await mongodb.findMany('run_cases', { runId: run._id })

      const totalCases = runCases.length
      const passedCases = runCases.filter((c: any) => c.status === 'Pass').length
      const failedCases = runCases.filter((c: any) => c.status === 'Fail').length
      const blockedCases = runCases.filter((c: any) => c.status === 'Blocked').length
      const notRunCases = runCases.filter((c: any) => c.status === 'Not Run').length

      return {
        ...run,
        id: run._id?.toString() || run.id,
        _id: undefined,
        stats: {
          totalCases,
          passedCases,
          failedCases,
          blockedCases,
          notRunCases,
          passRate: totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0
        },
        environments: run.environments ? JSON.parse(run.environments) : [],
        filters: run.filters ? JSON.parse(run.filters) : null
      }
    }))

    console.log('🔍 GET /api/runs returning:', runsWithStats.length, 'runs with stats')
    return NextResponse.json({ runs: runsWithStats })

  } catch (error) {
    console.error('Failed to fetch runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { runId } = body

    if (!runId) {
      return NextResponse.json(
        { error: 'Run ID is required' },
        { status: 400 }
      )
    }

    const runObjectId = new ObjectId(runId)

    // Check if run exists
    const run = await mongodb.findOne('runs', { _id: runObjectId })
    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Check if run has been started (has any executed cases)
    const executedCases = await mongodb.findMany('run_cases', {
      runId: runObjectId,
      $or: [
        { status: { $ne: 'Not Run' } },
        { durationSec: { $ne: null } }
      ]
    })

    if (executedCases.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete run that has started execution' },
        { status: 400 }
      )
    }

    // Get all run cases for this run
    const runCases = await mongodb.findMany('run_cases', { runId: runObjectId })
    const runCaseIds = runCases.map((rc: any) => rc._id)

    // Delete run steps first
    if (runCaseIds.length > 0) {
      await mongodb.deleteMany('run_steps', {
        runCaseId: { $in: runCaseIds }
      })
    }

    // Delete run cases
    await mongodb.deleteMany('run_cases', { runId: runObjectId })

    // Delete the run
    await mongodb.deleteOne('runs', { _id: runObjectId })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to delete run:', error)
    return NextResponse.json(
      { error: 'Failed to delete run' },
      { status: 500 }
    )
  }
}

// Helper function to apply filters to test cases from library API
function applyFiltersToTestCases(testCases: any[], filters: any) {
  let filtered = testCases

  if (filters.priority && filters.priority !== 'all') {
    filtered = filtered.filter((tc: any) => tc.priority?.toLowerCase() === filters.priority.toLowerCase())
  }

  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((tc: any) =>
      tc.tags && tc.tags.some((tag: string) => filters.tags.includes(tag))
    )
  }

  if (filters.module) {
    filtered = filtered.filter((tc: any) =>
      tc.category && tc.category.toLowerCase().includes(filters.module.toLowerCase())
    )
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter((tc: any) =>
      tc.id.toLowerCase().includes(searchLower) ||
      (tc.title && tc.title.toLowerCase().includes(searchLower)) ||
      (tc.category && tc.category.toLowerCase().includes(searchLower))
    )
  }

  // Transform to expected format
  return filtered.map((tc: any) => ({
    id: tc.id,
    testCase: tc.title,
    priority: tc.priority?.toLowerCase() || 'medium',
    tags: tc.tags || [],
    data: {
      testCase: tc.title,
      module: tc.category,
      testSteps: tc.steps || []
    }
  }))
}