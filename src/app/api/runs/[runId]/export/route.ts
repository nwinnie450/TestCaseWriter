import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exportRunToCSV, exportRunToMarkdown, exportRunToJUnitXML } from '@/lib/run-exports'

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // csv, markdown, junit

    // Get run with summary data (reuse summary endpoint logic)
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

    // Build summary data (similar to summary endpoint)
    const summary = await buildSummaryData(run)

    // Generate export content based on format
    let content: string
    let filename: string
    let contentType: string

    switch (format.toLowerCase()) {
      case 'csv':
        content = exportRunToCSV(summary)
        filename = `run-${run.id}-summary.csv`
        contentType = 'text/csv'
        break

      case 'markdown':
      case 'md':
        content = exportRunToMarkdown(summary)
        filename = `run-${run.id}-summary.md`
        contentType = 'text/markdown'
        break

      case 'junit':
      case 'xml':
        content = exportRunToJUnitXML(summary, run.runCases)
        filename = `run-${run.id}-junit.xml`
        contentType = 'application/xml'
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: csv, markdown, junit' },
          { status: 400 }
        )
    }

    // Return file download
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Failed to export run:', error)
    return NextResponse.json(
      { error: 'Failed to export run' },
      { status: 500 }
    )
  }
}

// Helper function to build summary data (extracted from summary endpoint)
async function buildSummaryData(run: any) {
  const environments = run.environments ? JSON.parse(run.environments as string) : []

  // Calculate statistics
  const total = run.runCases.length
  let pass = 0, fail = 0, blocked = 0, skipped = 0, notRun = 0

  for (const rc of run.runCases) {
    switch (rc.status) {
      case 'Pass': pass++; break
      case 'Fail': fail++; break
      case 'Blocked': blocked++; break
      case 'Skipped': skipped++; break
      default: notRun++; break
    }
  }

  const counts = { total, pass, fail, blocked, skipped, notRun }
  const passRate = total > 0 ? pass / total : 0

  // Component breakdown
  const componentMap = new Map<string, { pass: number; fail: number; total: number }>()
  for (const rc of run.runCases) {
    const component = rc.component || 'Unassigned'
    if (!componentMap.has(component)) {
      componentMap.set(component, { pass: 0, fail: 0, total: 0 })
    }

    const comp = componentMap.get(component)!
    comp.total++
    if (rc.status === 'Pass') comp.pass++
    else if (rc.status === 'Fail') comp.fail++
  }

  const byComponent = Array.from(componentMap.entries()).map(([key, value]) => ({
    key,
    ...value,
    passRate: value.total > 0 ? value.pass / value.total : 0
  })).sort((a, b) => b.total - a.total)

  // Failures
  const failures = run.runCases
    .filter((rc: any) => rc.status === 'Fail' || rc.status === 'Blocked')
    .map((rc: any) => ({
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

  // Duration statistics
  const durations = run.runCases
    .filter((rc: any) => rc.durationSec && rc.durationSec > 0)
    .map((rc: any) => rc.durationSec)

  const duration = durations.length > 0 ? {
    total: durations.reduce((sum: number, d: number) => sum + d, 0),
    average: durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length,
    fastest: Math.min(...durations),
    slowest: Math.max(...durations),
    executed: durations.length
  } : {
    total: 0, average: 0, fastest: 0, slowest: 0, executed: 0
  }

  // Meta information
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

  return {
    meta,
    counts,
    passRate,
    duration,
    byComponent,
    failures
  }
}