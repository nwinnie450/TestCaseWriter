import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
// import { getAllStoredTestCases } from '@/lib/test-case-storage'
import { dataService } from '@/lib/data-service'
// import { getCurrentUser } from '@/lib/user-storage'

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
    const run = await prisma.run.create({
      data: {
        name,
        projectId,
        build: build || null,
        environments: environments ? JSON.stringify(environments) : null,
        filters: filters ? JSON.stringify(filters) : null,
        dueAt: dueAt ? new Date(dueAt) : null,
        notes: notes || null,
        createdBy: currentUser.id
      }
    })

    // Create run cases with snapshots
    const runCasesData = testCasesToInclude.map(testCase => ({
      runId: run.id,
      caseId: testCase.id,
      titleSnapshot: testCase.data?.testCase || 'Untitled Test Case',
      stepsSnapshot: JSON.stringify(testCase.data?.testSteps || []),
      assignee: assignees && assignees.length > 0 ? assignees[0] : null,
      priority: testCase.priority || 'medium',
      component: testCase.data?.module || null,
      tags: testCase.tags ? JSON.stringify(testCase.tags) : null,
      status: 'Not Run' // Explicitly set the default status to match database schema
    }))

    const runCases = await prisma.runCase.createMany({
      data: runCasesData
    })

    // Create run steps for each case
    for (const testCase of testCasesToInclude) {
      const runCase = await prisma.runCase.findFirst({
        where: {
          runId: run.id,
          caseId: testCase.id
        }
      })

      if (runCase) {
        const steps = testCase.data?.testSteps || []
        if (steps.length > 0) {
          const runStepsData = steps.map((step: any, index: number) => ({
            runCaseId: runCase.id,
            idx: index + 1,
            description: step.description || '',
            expected: step.expectedResult || ''
          }))

          await prisma.runStep.createMany({
            data: runStepsData
          })
        } else {
          // Create a default step if no steps exist
          await prisma.runStep.create({
            data: {
              runCaseId: runCase.id,
              idx: 1,
              description: 'Execute test case',
              expected: 'Test case passes successfully'
            }
          })
        }
      }
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
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (projectId) {
      where.projectId = projectId
    }
    if (status && status !== 'all') {
      where.status = status
    }

    // Get runs with basic case statistics
    const runs = await prisma.run.findMany({
      where,
      include: {
        runCases: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Add statistics to each run
    const runsWithStats = runs.map(run => {
      const cases = run.runCases
      const totalCases = cases.length
      const passedCases = cases.filter(c => c.status === 'Pass').length
      const failedCases = cases.filter(c => c.status === 'Fail').length
      const blockedCases = cases.filter(c => c.status === 'Blocked').length
      const notRunCases = cases.filter(c => c.status === 'Not Run').length

      return {
        ...run,
        runCases: undefined, // Remove the detailed cases from response
        stats: {
          totalCases,
          passedCases,
          failedCases,
          blockedCases,
          notRunCases,
          passRate: totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0
        },
        environments: run.environments ? JSON.parse(run.environments as string) : [],
        filters: run.filters ? JSON.parse(run.filters as string) : null
      }
    })

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

    // Check if run has been started (has any executed cases)
    const runWithCases = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        runCases: {
          where: {
            OR: [
              { status: { not: 'Not Run' } },
              { durationSec: { not: null } }
            ]
          }
        }
      }
    })

    if (!runWithCases) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    if (runWithCases.runCases.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete run that has started execution' },
        { status: 400 }
      )
    }

    // Delete run steps first (cascading delete)
    await prisma.runStep.deleteMany({
      where: {
        runCase: {
          runId: runId
        }
      }
    })

    // Delete run cases
    await prisma.runCase.deleteMany({
      where: {
        runId: runId
      }
    })

    // Delete the run
    await prisma.run.delete({
      where: {
        id: runId
      }
    })

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