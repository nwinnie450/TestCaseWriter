import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const run = await prisma.run.findUnique({
      where: { id: params.runId },
      include: {
        runCases: {
          include: {
            runSteps: {
              orderBy: { idx: 'asc' }
            },
            evidence: true,
            defects: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

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
