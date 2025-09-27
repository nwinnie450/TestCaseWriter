import { NextRequest, NextResponse } from 'next/server'
import { mongodb } from '@/lib/mongodb-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const projectId = searchParams.get('projectId') || 'default'
    const suite = searchParams.get('suite')
    const runName = searchParams.get('runName')

    console.log('📊 Report API - Request params:', { from, to, projectId, suite, runName })

    if (!from || !to) {
      return NextResponse.json(
        { error: 'from and to date parameters are required' },
        { status: 400 }
      )
    }

    // Parse dates
    const fromDate = new Date(from)
    const toDate = new Date(to)
    toDate.setHours(23, 59, 59, 999) // End of day

    console.log('📊 Report API - Date range:', { fromDate, toDate })

    // Build query filters
    const where: any = {
      createdAt: {
        $gte: fromDate,
        $lte: toDate
      }
    }

    // Handle name filters (suite and runName are mutually exclusive)
    if (runName) {
      where.name = {
        $regex: runName,
        $options: 'i'
      }
    } else if (suite) {
      where.name = {
        $regex: suite,
        $options: 'i'
      }
    }

    try {
      // Fetch runs from MongoDB
      const runs = await mongodb.findMany('test_runs', where, {
        sort: { createdAt: -1 }
      })

      console.log('📊 Report API - Found runs:', runs.length)
      console.log('📊 Report API - Query filter:', JSON.stringify(where, null, 2))

      if (runs.length === 0) {
        return NextResponse.json({
          summary: {
            totalRuns: 0,
            averagePassRate: 0,
            totalTests: 0,
            dateRange: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
          },
          trends: [],
          topFailingComponents: [],
          topFailingCases: []
        })
      }

      // Calculate summary statistics
      let totalTests = 0
      let totalPassRates = 0
      const trends = []

      // Component failure tracking
      const componentFailures = new Map<string, {
        failureCount: number,
        totalTests: number
      }>()

      // Test case failure tracking
      const caseFailures = new Map<string, {
        caseId: string,
        title: string,
        failureCount: number,
        lastFailure: string,
        component: string
      }>()

      for (const run of runs) {
        const runCases = run.testCases || []
        const total = runCases.length
        const passed = runCases.filter((rc: any) => rc.status === 'passed').length
        const failed = runCases.filter((rc: any) => rc.status === 'failed').length
        const blocked = runCases.filter((rc: any) => rc.status === 'blocked').length
        const skipped = runCases.filter((rc: any) => rc.status === 'skipped').length
        const notRun = runCases.filter((rc: any) => rc.status === 'pending').length
        const passRate = total > 0 ? passed / total : 0

        console.log('📊 Report API - Run case statuses:', {
          runId: run.id,
          total,
          passed,
          failed,
          blocked,
          skipped,
          notRun,
          passRate,
          statuses: runCases.map((rc: any) => ({ id: rc.testCaseId, status: rc.status }))
        })

        totalTests += total
        totalPassRates += passRate

        trends.push({
          runId: run.id,
          name: run.name,
          passRate,
          createdAt: new Date(run.createdAt).toISOString(),
          totalTests: total
        })

        // Track component failures
        for (const rc of runCases) {
          const component = rc.component || 'Unassigned'

          if (!componentFailures.has(component)) {
            componentFailures.set(component, { failureCount: 0, totalTests: 0 })
          }

          const compData = componentFailures.get(component)!
          compData.totalTests++

          if (rc.status === 'failed' || rc.status === 'blocked') {
            compData.failureCount++
          }

          // Track individual test case failures
          if (rc.status === 'failed' || rc.status === 'blocked') {
            const caseKey = `${rc.testCaseId}`

            if (!caseFailures.has(caseKey)) {
              caseFailures.set(caseKey, {
                caseId: rc.testCaseId,
                title: rc.notes || rc.testCaseId,
                failureCount: 0,
                lastFailure: new Date(run.createdAt).toISOString(),
                component
              })
            }

            const caseData = caseFailures.get(caseKey)!
            caseData.failureCount++
            caseData.lastFailure = new Date(run.createdAt).toISOString()
          }
        }
      }

      const averagePassRate = runs.length > 0 ? totalPassRates / runs.length : 0

      // Calculate overall status counts across all runs
      let overallPassed = 0
      let overallFailed = 0
      let overallBlocked = 0
      let overallSkipped = 0
      let overallNotRun = 0

      for (const run of runs) {
        const runCases = run.testCases || []
        overallPassed += runCases.filter((rc: any) => rc.status === 'passed').length
        overallFailed += runCases.filter((rc: any) => rc.status === 'failed').length
        overallBlocked += runCases.filter((rc: any) => rc.status === 'blocked').length
        overallSkipped += runCases.filter((rc: any) => rc.status === 'skipped').length
        overallNotRun += runCases.filter((rc: any) => rc.status === 'pending').length
      }

      // Build top failing components (sorted by failure rate)
      const topFailingComponents = Array.from(componentFailures.entries())
        .map(([component, data]) => ({
          component,
          failureCount: data.failureCount,
          totalTests: data.totalTests,
          failureRate: data.totalTests > 0 ? data.failureCount / data.totalTests : 0
        }))
        .filter(comp => comp.failureCount > 0)
        .sort((a, b) => b.failureRate - a.failureRate)
        .slice(0, 10)

      // Build top failing test cases (sorted by failure count)
      const topFailingCases = Array.from(caseFailures.values())
        .sort((a, b) => b.failureCount - a.failureCount)
        .slice(0, 15)

      const summary = {
        totalRuns: runs.length,
        averagePassRate,
        totalTests,
        passCount: overallPassed,
        failCount: overallFailed,
        blockerCount: overallBlocked,
        skippedCount: overallSkipped,
        notExecutedCount: overallNotRun,
        avgExecutionTime: 0,
        dateRange: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
      }

      return NextResponse.json({
        summary,
        trends: trends.slice(0, 20), // Limit trends to most recent 20 runs
        topFailingComponents,
        topFailingCases
      })

    } catch (dbError) {
      console.error('MongoDB connection failed for reports:', dbError)
      console.log('Falling back to empty report due to database connection issues')

      // Return empty report as fallback
      return NextResponse.json({
        summary: {
          totalRuns: 0,
          averagePassRate: 0,
          totalTests: 0,
          passCount: 0,
          failCount: 0,
          blockerCount: 0,
          skippedCount: 0,
          notExecutedCount: 0,
          avgExecutionTime: 0,
          dateRange: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
        },
        trends: [],
        topFailingComponents: [],
        topFailingCases: []
      })
    }

  } catch (error) {
    console.error('Failed to generate runs report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}