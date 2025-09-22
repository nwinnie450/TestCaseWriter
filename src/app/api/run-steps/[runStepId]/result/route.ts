import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-storage'
import { getCurrentUserFromSession } from '@/lib/auth-session'

export async function POST(
  request: NextRequest,
  { params }: { params: { runStepId: string } }
) {
  try {
    const { runStepId } = params
    const body = await request.json()
    const { status, actual, durationSec } = body

    // Validate required fields
    if (!status || !['Pass', 'Fail', 'NA', 'Not Run'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (Pass, Fail, NA, Not Run)' },
        { status: 400 }
      )
    }

    // Get current user with environment-based authentication
    const currentUser = process.env.NODE_ENV === 'development'
      ? getCurrentUser() || { id: 'dev-user', username: 'dev' }
      : await getCurrentUserFromSession()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if run step exists and get run info
    const existingRunStep = await prisma.runStep.findUnique({
      where: { id: runStepId },
      include: {
        runCase: {
          include: {
            run: true
          }
        }
      }
    })

    if (!existingRunStep) {
      return NextResponse.json(
        { error: 'Run step not found' },
        { status: 404 }
      )
    }

    // Check if run is still editable
    if (existingRunStep.runCase.run.status === 'completed' || existingRunStep.runCase.run.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot modify completed or archived runs' },
        { status: 403 }
      )
    }

    // Update the run step
    const updatedRunStep = await prisma.runStep.update({
      where: { id: runStepId },
      data: {
        status,
        actual: actual || null,
        durationSec: durationSec || null
      }
    })

    // Check if all steps in this case are completed to auto-update case status
    const allStepsInCase = await prisma.runStep.findMany({
      where: { runCaseId: existingRunStep.runCaseId },
      select: { status: true }
    })

    const allStepsExecuted = allStepsInCase.every(step =>
      ['Pass', 'Fail', 'NA'].includes(step.status)
    )

    if (allStepsExecuted) {
      // Determine case status based on step results
      const hasFailedSteps = allStepsInCase.some(step => step.status === 'Fail')
      const caseStatus = hasFailedSteps ? 'Fail' : 'Pass'

      // Update the run case status
      await prisma.runCase.update({
        where: { id: existingRunStep.runCaseId },
        data: { status: caseStatus }
      })

      // Check if this completes the entire run
      const allRunCases = await prisma.runCase.findMany({
        where: { runId: existingRunStep.runCase.runId },
        select: { status: true }
      })

      const allCasesExecuted = allRunCases.every(c =>
        ['Pass', 'Fail', 'Blocked', 'Skipped'].includes(c.status)
      )

      if (allCasesExecuted && existingRunStep.runCase.run.status === 'active') {
        await prisma.run.update({
          where: { id: existingRunStep.runCase.runId },
          data: {
            status: 'completed',
            closedAt: new Date()
          }
        })
      }
      // If run is still draft and we're executing steps, mark as active
      else if (existingRunStep.runCase.run.status === 'draft') {
        await prisma.run.update({
          where: { id: existingRunStep.runCase.runId },
          data: {
            status: 'active',
            startedAt: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      runStep: updatedRunStep,
      caseCompleted: allStepsExecuted
    })

  } catch (error) {
    console.error('Failed to update run step result:', error)
    return NextResponse.json(
      { error: 'Failed to update run step result' },
      { status: 500 }
    )
  }
}