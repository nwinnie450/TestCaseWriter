import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

const client = new MongoClient(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testCaseIds } = body

    if (!testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      return NextResponse.json(
        { error: 'Test case IDs array is required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('testcasewriter')

    // Get all runs that are active, draft, or not archived
    const activeRuns = await db.collection('runs')
      .find({
        status: { $in: ['draft', 'active'] }
      })
      .project({ _id: 1, name: 1, status: 1 })
      .toArray()

    if (activeRuns.length === 0) {
      // No active runs, all test cases are safe to modify/delete
      return NextResponse.json({
        testCasesInRuns: {},
        canModify: testCaseIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
        canDelete: testCaseIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
      })
    }

    const activeRunIds = activeRuns.map(run => run._id)

    // Find run cases that reference our test case IDs in active runs
    const runCases = await db.collection('run_cases')
      .find({
        runId: { $in: activeRunIds },
        caseId: { $in: testCaseIds }
      })
      .toArray()

    // Build response data
    const testCasesInRuns: { [testCaseId: string]: Array<{ runId: string, runName: string, runStatus: string }> } = {}
    const canModify: { [testCaseId: string]: boolean } = {}
    const canDelete: { [testCaseId: string]: boolean } = {}

    // Initialize all test cases as modifiable and deletable
    testCaseIds.forEach(id => {
      canModify[id] = true
      canDelete[id] = true
      testCasesInRuns[id] = []
    })

    // Process found run cases
    runCases.forEach(runCase => {
      const run = activeRuns.find(r => r._id.toString() === runCase.runId.toString())
      if (run) {
        testCasesInRuns[runCase.caseId].push({
          runId: run._id.toString(),
          runName: run.name,
          runStatus: run.status
        })

        // Test cases in active runs cannot be deleted
        if (run.status === 'active') {
          canDelete[runCase.caseId] = false
        }

        // Test cases in any active runs can still be modified but with warning
        // Only restrict deletion for active runs
      }
    })

    return NextResponse.json({
      testCasesInRuns,
      canModify,
      canDelete
    })

  } catch (error) {
    console.error('Failed to check run usage:', error)
    return NextResponse.json(
      { error: 'Failed to check run usage' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}