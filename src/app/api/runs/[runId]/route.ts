import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/user-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    const run = await prisma.run.findUnique({
      where: { id: runId },
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
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const runWithParsedData = {
      ...run,
      environments: run.environments ? JSON.parse(run.environments as string) : [],
      filters: run.filters ? JSON.parse(run.filters as string) : null,
      runCases: run.runCases.map(runCase => ({
        ...runCase,
        stepsSnapshot: JSON.parse(runCase.stepsSnapshot as string),
        tags: runCase.tags ? JSON.parse(runCase.tags as string) : []
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
      { error: 'Failed to fetch run' },
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
    const existingRun = await prisma.run.findUnique({
      where: { id: runId }
    })

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
    const updatedRun = await prisma.run.update({
      where: { id: runId },
      data: updateData
    })

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
    const existingRun = await prisma.run.findUnique({
      where: { id: runId }
    })

    if (!existingRun) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Delete the run (cascade will handle related records)
    await prisma.run.delete({
      where: { id: runId }
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