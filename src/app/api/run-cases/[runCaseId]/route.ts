import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-storage'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { runCaseId: string } }
) {
  try {
    const { runCaseId } = params
    const body = await request.json()

    // Get current user
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if run case exists
    const existingRunCase = await prisma.runCase.findUnique({
      where: { id: runCaseId },
      include: {
        run: true
      }
    })

    if (!existingRunCase) {
      return NextResponse.json(
        { error: 'Run case not found' },
        { status: 404 }
      )
    }

    // Check if run is still editable
    if (existingRunCase.run.status === 'completed' || existingRunCase.run.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot modify completed or archived runs' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.assignee !== undefined) updateData.assignee = body.assignee
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.durationSec !== undefined) updateData.durationSec = body.durationSec

    // Update the run case
    const updatedRunCase = await prisma.runCase.update({
      where: { id: runCaseId },
      data: updateData
    })

    // If this case is now complete, check if we should update the run status
    if (body.status && ['Pass', 'Fail', 'Blocked', 'Skipped'].includes(body.status)) {
      // Get all cases in this run to check completion
      const allRunCases = await prisma.runCase.findMany({
        where: { runId: existingRunCase.runId },
        select: { status: true }
      })

      const allCasesExecuted = allRunCases.every(c =>
        ['Pass', 'Fail', 'Blocked', 'Skipped'].includes(c.status)
      )

      // If all cases are executed and run is still active, mark as completed
      if (allCasesExecuted && existingRunCase.run.status === 'active') {
        await prisma.run.update({
          where: { id: existingRunCase.runId },
          data: {
            status: 'completed',
            closedAt: new Date()
          }
        })
      }
      // If run is still draft and we're executing cases, mark as active
      else if (existingRunCase.run.status === 'draft') {
        await prisma.run.update({
          where: { id: existingRunCase.runId },
          data: {
            status: 'active',
            startedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({ runCase: updatedRunCase })

  } catch (error) {
    console.error('Failed to update run case:', error)
    return NextResponse.json(
      { error: 'Failed to update run case' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { runCaseId: string } }
) {
  try {
    const { runCaseId } = params

    const runCase = await prisma.runCase.findUnique({
      where: { id: runCaseId },
      include: {
        runSteps: {
          orderBy: { idx: 'asc' }
        },
        evidence: true,
        defects: true,
        run: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    })

    if (!runCase) {
      return NextResponse.json(
        { error: 'Run case not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const runCaseWithParsedData = {
      ...runCase,
      stepsSnapshot: JSON.parse(runCase.stepsSnapshot as string),
      tags: runCase.tags ? JSON.parse(runCase.tags as string) : []
    }

    return NextResponse.json({ runCase: runCaseWithParsedData })

  } catch (error) {
    console.error('Failed to fetch run case:', error)
    return NextResponse.json(
      { error: 'Failed to fetch run case' },
      { status: 500 }
    )
  }
}