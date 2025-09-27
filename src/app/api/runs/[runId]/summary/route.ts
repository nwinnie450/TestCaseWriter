import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // TODO: Convert to MongoDB

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params

    // Get run with all related data
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: {
        runCases: {
          include: {
            runSteps: true
          }
        }
      }
    })

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      )
    }

    // Parse environments from JSON
    const environments = run.environments ? JSON.parse(run.environments as string) : []

    // Calculate comprehensive statistics
    const stats = calculateRunStats(run.runCases)

    // Get breakdown by component
    const byComponent = getComponentBreakdown(run.runCases)

    // Get breakdown by assignee
    const byAssignee = getAssigneeBreakdown(run.runCases)

    // Get failures with details
    const failures = getFailureDetails(run.runCases)

    // Calculate duration statistics
    const duration = calculateDurationStats(run.runCases)

    // Build meta information
    const meta = {
      name: run.name,
      build: run.build || 'Unknown',
      configs: environments,
      startedAt: run.startedAt?.toISOString() || null,
      closedAt: run.closedAt?.toISOString() || null,
      createdAt: run.createdAt.toISOString(),
      createdBy: run.createdBy,
      status: run.status,
      notes: run.notes
    }

    // Build response matching your API shape
    const summary = {
      meta,
      counts: stats.counts,
      passRate: stats.passRate,
      duration,
      byComponent,
      byAssignee,
      failures,
      trends: await getTrendData(runId) // Optional: comparison with previous runs
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Failed to fetch run summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch run summary' },
      { status: 500 }
    )
  }
}

// Helper functions implementing your suggested logic
function calculateRunStats(runCases: any[]) {
  const total = runCases.length
  let pass = 0, fail = 0, blocked = 0, skipped = 0, notRun = 0

  for (const rc of runCases) {
    switch (rc.status) {
      case 'Pass': pass++; break
      case 'Fail': fail++; break
      case 'Blocked': blocked++; break
      case 'Skipped': skipped++; break
      default: notRun++; break
    }
  }

  return {
    counts: { total, pass, fail, blocked, skipped, notRun },
    passRate: total > 0 ? Number((pass / total).toFixed(4)) : 0
  }
}

function getComponentBreakdown(runCases: any[]) {
  const componentMap = new Map<string, { pass: number; fail: number; total: number }>()

  for (const rc of runCases) {
    const component = rc.component || 'Unassigned'
    if (!componentMap.has(component)) {
      componentMap.set(component, { pass: 0, fail: 0, total: 0 })
    }

    const comp = componentMap.get(component)!
    comp.total++

    if (rc.status === 'Pass') comp.pass++
    else if (rc.status === 'Fail') comp.fail++
  }

  return Array.from(componentMap.entries()).map(([key, value]) => ({
    key,
    ...value,
    passRate: value.total > 0 ? Number((value.pass / value.total).toFixed(4)) : 0
  })).sort((a, b) => b.total - a.total) // Sort by total test cases
}

function getAssigneeBreakdown(runCases: any[]) {
  const assigneeMap = new Map<string, { done: number; pending: number; total: number }>()

  for (const rc of runCases) {
    const assignee = rc.assignee || 'Unassigned'
    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, { done: 0, pending: 0, total: 0 })
    }

    const assign = assigneeMap.get(assignee)!
    assign.total++

    if (rc.status && rc.status !== 'Not Run') {
      assign.done++
    } else {
      assign.pending++
    }
  }

  return Array.from(assigneeMap.entries()).map(([key, value]) => ({
    key,
    ...value,
    completionRate: value.total > 0 ? Number((value.done / value.total).toFixed(4)) : 0
  }))
}

function getFailureDetails(runCases: any[]) {
  return runCases
    .filter(rc => rc.status === 'Fail' || rc.status === 'Blocked')
    .map(rc => ({
      caseId: rc.caseId,
      title: rc.titleSnapshot,
      status: rc.status,
      assignee: rc.assignee,
      component: rc.component,
      priority: rc.priority,
      notes: rc.notes || '',
      defect: rc.defectLink || null,
      evidence: rc.evidenceCount || 0,
      executedAt: rc.executedAt?.toISOString() || null,
      duration: rc.durationSec || null
    }))
    .sort((a, b) => {
      // Sort by priority (critical > high > medium > low), then by component
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1

      if (aPriority !== bPriority) return bPriority - aPriority
      return (a.component || '').localeCompare(b.component || '')
    })
}

function calculateDurationStats(runCases: any[]) {
  const durations = runCases
    .filter(rc => rc.durationSec && rc.durationSec > 0)
    .map(rc => rc.durationSec)

  if (durations.length === 0) {
    return {
      total: 0,
      average: 0,
      fastest: 0,
      slowest: 0,
      executed: 0
    }
  }

  const total = durations.reduce((sum, d) => sum + d, 0)
  const average = Number((total / durations.length).toFixed(1))
  const fastest = Math.min(...durations)
  const slowest = Math.max(...durations)

  return {
    total,
    average,
    fastest,
    slowest,
    executed: durations.length
  }
}

async function getTrendData(runId: string) {
  try {
    // Get the current run's project to find related runs
    const currentRun = await prisma.run.findUnique({
      where: { id: runId },
      select: { projectId: true, createdAt: true }
    })

    if (!currentRun) return null

    // Get previous runs from the same project
    const previousRuns = await prisma.run.findMany({
      where: {
        projectId: currentRun.projectId,
        createdAt: { lt: currentRun.createdAt },
        status: 'Completed' // Only compare with completed runs
      },
      include: {
        runCases: {
          select: { status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5 // Last 5 runs for trend
    })

    if (previousRuns.length === 0) return null

    // Calculate trend data
    const previousPassRates = previousRuns.map(run => {
      const stats = calculateRunStats(run.runCases)
      return {
        runId: run.id,
        name: run.name,
        passRate: stats.passRate,
        createdAt: run.createdAt.toISOString()
      }
    })

    return {
      previousRuns: previousPassRates,
      averagePassRate: previousPassRates.length > 0
        ? Number((previousPassRates.reduce((sum, r) => sum + r.passRate, 0) / previousPassRates.length).toFixed(4))
        : 0
    }

  } catch (error) {
    console.warn('Failed to calculate trend data:', error)
    return null
  }
}