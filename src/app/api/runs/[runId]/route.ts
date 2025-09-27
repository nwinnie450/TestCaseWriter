import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { mongodb } from '@/lib/mongodb-service'
import { getCurrentUser } from '@/lib/user-storage'

function parseJSONField(value: any, fallback: any) {
  if (value === null || value === undefined) {
          return fallback;
  }
  if (typeof value === 'string') {
    try {
            return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to parse JSON field', error);
            return fallback;
    }
  }
  return value;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    console.log('🔍 [GET /api/runs/[runId]] Fetching run:', runId);

    // Find run by ID (support both string ID and ObjectId)
    let run
    if (ObjectId.isValid(runId)) {
      run = await mongodb.findOne('runs', { _id: new ObjectId(runId) })
    } else {
      run = await mongodb.findOne('runs', { id: runId })
    }

    if (run) {
      // Get run cases for this run
      const runCases = await mongodb.findMany('run_cases', { runId: run._id })

      // Get run steps for each case
      const runCasesWithSteps = await Promise.all(
        runCases.map(async (runCase: any) => {
          const runSteps = await mongodb.findMany('run_steps',
            { runCaseId: runCase._id },
            { sort: { idx: 1 } }
          )
          return {
            ...runCase,
            id: runCase._id?.toString() || runCase.id,
            runSteps: runSteps.map((step: any) => ({
              ...step,
              id: step._id?.toString() || step.id
            })),
            evidence: [], // TODO: Implement evidence collection
            defects: []   // TODO: Implement defects collection
          }
        })
      )

      run = {
        ...run,
        id: run._id?.toString() || run.id,
        _id: undefined,
        runCases: runCasesWithSteps
      }
    }

    console.log('🔍 [GET /api/runs/[runId]] Run found:', !!run);
    console.log('🔍 [GET /api/runs/[runId]] Run runCases count:', run?.runCases?.length || 0);

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const runWithParsedData = {
      ...run,
      environments: parseJSONField(run.environments, []),
      filters: parseJSONField(run.filters, null),
      runCases: run.runCases.map(runCase => ({
        ...runCase,
        stepsSnapshot: parseJSONField(runCase.stepsSnapshot, []),
        tags: parseJSONField(runCase.tags, [])
      }))
    }

    // Calculate statistics
    const totalCases = run.runCases.length
    const passedCases = run.runCases.filter(c => c.status === 'Pass').length
    const failedCases = run.runCases.filter(c => c.status === 'Fail').length
    const blockedCases = run.runCases.filter(c => c.status === 'Blocked').length
    const skippedCases = run.runCases.filter(c => c.status === 'Skipped').length
    const notRunCases = run.runCases.filter(c => c.status === 'Not Run').length

    const stats = {
      totalCases,
      passedCases,
      failedCases,
      blockedCases,
      skippedCases,
      notRunCases,
      passRate: totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0,
      totalDuration: run.runCases.reduce((sum, c) => sum + (c.durationSec || 0), 0)
    }

    return NextResponse.json({
      run: runWithParsedData,
      stats
    })

  } catch (error) {
    console.error('Failed to fetch run:', error)
    return NextResponse.json(
      { error: 'Failed to fetch run', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
    const body = await request.json()

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if run exists
    let existingRun
    if (ObjectId.isValid(runId)) {
      existingRun = await mongodb.findOne('runs', { _id: new ObjectId(runId) })
    } else {
      existingRun = await mongodb.findOne('runs', { id: runId })
    }

    if (!existingRun) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.build !== undefined) updateData.build = body.build
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.status !== undefined) updateData.status = body.status
    if (body.environments !== undefined) updateData.environments = JSON.stringify(body.environments)
    if (body.dueAt !== undefined) updateData.dueAt = body.dueAt ? new Date(body.dueAt) : null

    // Handle status transitions
    if (body.status === 'active' && !existingRun.startedAt) {
      updateData.startedAt = new Date()
    }
    if ((body.status === 'completed' || body.status === 'archived') && !existingRun.closedAt) {
      updateData.closedAt = new Date()
    }

    // Update the run
    let updatedRun
    if (ObjectId.isValid(runId)) {
      updatedRun = await mongodb.updateOne('runs', { _id: new ObjectId(runId) }, { $set: updateData })
    } else {
      updatedRun = await mongodb.updateOne('runs', { id: runId }, { $set: updateData })
    }

    return NextResponse.json({ run: updatedRun })

  } catch (error) {
    console.error('Failed to update run:', error)
    return NextResponse.json(
      { error: 'Failed to update run' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if run exists
    let existingRun
    if (ObjectId.isValid(runId)) {
      existingRun = await mongodb.findOne('runs', { _id: new ObjectId(runId) })
    } else {
      existingRun = await mongodb.findOne('runs', { id: runId })
    }

    if (!existingRun) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Get run cases for cleanup
    const runCases = await mongodb.findMany('run_cases', { runId: existingRun._id })
    const runCaseIds = runCases.map((rc: any) => rc._id)

    // Delete run steps first
    if (runCaseIds.length > 0) {
      await mongodb.deleteMany('run_steps', { runCaseId: { $in: runCaseIds } })
    }

    // Delete run cases
    await mongodb.deleteMany('run_cases', { runId: existingRun._id })

    // Delete the run
    if (ObjectId.isValid(runId)) {
      await mongodb.deleteOne('runs', { _id: new ObjectId(runId) })
    } else {
      await mongodb.deleteOne('runs', { id: runId })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to delete run:', error)
    return NextResponse.json(
      { error: 'Failed to delete run' },
      { status: 500 }
    )
  }
}


