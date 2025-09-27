import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // TODO: Convert to MongoDB
import { getCurrentUser } from '@/lib/user-storage'

export async function POST(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
    const { searchParams } = new URL(request.url)
    const failedOnly = searchParams.get('failedOnly') === 'true'

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the original run with its cases
    const originalRun = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        runCases: {
          include: {
            runSteps: {
              orderBy: { idx: 'asc' }
            }
          },
          where: failedOnly ? {
            status: {
              in: ['Fail', 'Blocked']
            }
          } : undefined
        }
      }
    })

    if (!originalRun) {
      return NextResponse.json(
        { error: 'Original run not found' },
        { status: 404 }
      )
    }

    if (originalRun.runCases.length === 0) {
      return NextResponse.json(
        { error: failedOnly ? 'No failed or blocked cases to rerun' : 'No cases to rerun' },
        { status: 400 }
      )
    }

    // Create new run
    const newRun = await prisma.run.create({
      data: {
        name: `${originalRun.name} - Rerun${failedOnly ? ' (Failed Only)' : ''}`,
        projectId: originalRun.projectId,
        build: originalRun.build,
        environments: originalRun.environments,
        filters: originalRun.filters,
        notes: `Rerun of ${originalRun.name} (ID: ${originalRun.id})${failedOnly ? ' - Failed cases only' : ''}`,
        createdBy: currentUser.id
      }
    })

    // Copy run cases
    for (const originalCase of originalRun.runCases) {
      const newRunCase = await prisma.runCase.create({
        data: {
          runId: newRun.id,
          caseId: originalCase.caseId,
          titleSnapshot: originalCase.titleSnapshot,
          stepsSnapshot: originalCase.stepsSnapshot,
          assignee: originalCase.assignee,
          priority: originalCase.priority,
          component: originalCase.component,
          tags: originalCase.tags,
          status: 'Not Run', // Reset status
          notes: null, // Clear notes
          durationSec: null // Clear duration
        }
      })

      // Copy run steps (reset their status)
      for (const originalStep of originalCase.runSteps) {
        await prisma.runStep.create({
          data: {
            runCaseId: newRunCase.id,
            idx: originalStep.idx,
            description: originalStep.description,
            expected: originalStep.expected,
            status: 'Not Run', // Reset status
            actual: null, // Clear actual result
            durationSec: null // Clear duration
          }
        })
      }
    }

    // Get the new run with stats
    const newRunWithCases = await prisma.run.findUnique({
      where: { id: newRun.id },
      include: {
        runCases: {
          select: {
            status: true
          }
        }
      }
    })

    const stats = {
      totalCases: newRunWithCases!.runCases.length,
      passedCases: 0,
      failedCases: 0,
      blockedCases: 0,
      notRunCases: newRunWithCases!.runCases.length,
      passRate: 0
    }

    return NextResponse.json({
      runId: newRun.id,
      run: {
        ...newRun,
        parentRunId: originalRun.id,
        parentRunName: originalRun.name,
        environments: newRun.environments ? JSON.parse(newRun.environments as string) : [],
        filters: newRun.filters ? JSON.parse(newRun.filters as string) : null
      },
      stats
    })

  } catch (error) {
    console.error('Failed to rerun:', error)
    return NextResponse.json(
      { error: 'Failed to create rerun' },
      { status: 500 }
    )
  }
}