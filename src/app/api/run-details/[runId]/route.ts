import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { mongodb } from '@/lib/mongodb-service'

const emptyArray: any[] = []

const parseJSON = (value: unknown) => {
  if (value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

export async function GET(
  _request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    // Find run by ID (support both string ID and ObjectId)
    let run
    if (ObjectId.isValid(params.runId)) {
      run = await mongodb.findOne('runs', { _id: new ObjectId(params.runId) })
    } else {
      run = await mongodb.findOne('runs', { id: params.runId })
    }

    if (run) {
      // Get run cases for this run
      const runCases = await mongodb.findMany('run_cases',
        { runId: run._id },
        { sort: { createdAt: 1 } }
      )

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

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 })
    }

    const runCases = run.runCases.map(runCase => ({
      ...runCase,
      stepsSnapshot: (parseJSON(runCase.stepsSnapshot) as any[]) ?? emptyArray,
      tags: (parseJSON(runCase.tags) as string[]) ?? emptyArray
    }))

    const stats = {
      totalCases: runCases.length,
      passedCases: runCases.filter(c => c.status === 'Pass').length,
      failedCases: runCases.filter(c => c.status === 'Fail').length,
      blockedCases: runCases.filter(c => c.status === 'Blocked').length,
      skippedCases: runCases.filter(c => c.status === 'Skipped').length,
      notRunCases: runCases.filter(c => c.status === 'Not Run').length,
      passRate: runCases.length > 0
        ? Math.round((runCases.filter(c => c.status === 'Pass').length / runCases.length) * 100)
        : 0,
      totalDuration: runCases.reduce((sum, c) => sum + (c.durationSec || 0), 0)
    }

    return NextResponse.json({
      run: {
        ...run,
        environments: (parseJSON(run.environments) as string[]) ?? emptyArray,
        filters: parseJSON(run.filters),
        runCases
      },
      stats
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch run details', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
