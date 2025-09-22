import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const projectId = searchParams.get('projectId') || 'default'
    const format = searchParams.get('format') || 'csv'
    const suite = searchParams.get('suite')
    const runName = searchParams.get('runName')

    if (!from || !to) {
      return NextResponse.json(
        { error: 'from and to date parameters are required' },
        { status: 400 }
      )
    }

    // Get the report data from the main reports endpoint
    const reportUrl = new URL('/api/reports/runs', request.url)
    reportUrl.searchParams.set('from', from)
    reportUrl.searchParams.set('to', to)
    reportUrl.searchParams.set('projectId', projectId)
    if (suite) reportUrl.searchParams.set('suite', suite)
    if (runName) reportUrl.searchParams.set('runName', runName)

    const reportResponse = await fetch(reportUrl.toString())
    if (!reportResponse.ok) {
      throw new Error('Failed to fetch report data')
    }

    const reportData = await reportResponse.json()

    // Generate export content based on format
    let content: string
    let filename: string
    let contentType: string

    switch (format.toLowerCase()) {
      case 'csv':
        content = exportReportToCSV(reportData)
        filename = `runs-report-${from}-to-${to}.csv`
        contentType = 'text/csv'
        break

      case 'markdown':
      case 'md':
        content = exportReportToMarkdown(reportData)
        filename = `runs-report-${from}-to-${to}.md`
        contentType = 'text/markdown'
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported format. Use: csv, markdown' },
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
    console.error('Failed to export runs report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

function exportReportToCSV(data: any): string {
  const { summary, trends, topFailingComponents, topFailingCases } = data

  let csv = 'Runs Report\n\n'

  // Summary section
  csv += 'Summary\n'
  csv += 'Metric,Value\n'
  csv += `Total Runs,${summary.totalRuns}\n`
  csv += `Average Pass Rate,${Math.round(summary.averagePassRate * 100)}%\n`
  csv += `Total Tests,${summary.totalTests}\n`
  csv += `Date Range,${summary.dateRange}\n\n`

  // Trends section
  csv += 'Run Trends\n'
  csv += 'Run ID,Name,Pass Rate,Date,Total Tests\n'
  for (const trend of trends) {
    csv += `${trend.runId},"${trend.name}",${Math.round(trend.passRate * 100)}%,${new Date(trend.createdAt).toLocaleDateString()},${trend.totalTests}\n`
  }
  csv += '\n'

  // Top failing components
  csv += 'Top Failing Components\n'
  csv += 'Component,Failure Count,Total Tests,Failure Rate\n'
  for (const comp of topFailingComponents) {
    csv += `"${comp.component}",${comp.failureCount},${comp.totalTests},${Math.round(comp.failureRate * 100)}%\n`
  }
  csv += '\n'

  // Top failing cases
  csv += 'Most Frequently Failing Test Cases\n'
  csv += 'Case ID,Title,Component,Failure Count,Last Failure\n'
  for (const testCase of topFailingCases) {
    csv += `"${testCase.caseId}","${testCase.title}","${testCase.component}",${testCase.failureCount},${new Date(testCase.lastFailure).toLocaleDateString()}\n`
  }

  return csv
}

function exportReportToMarkdown(data: any): string {
  const { summary, trends, topFailingComponents, topFailingCases } = data

  let md = '# Runs Analysis Report\n\n'

  // Summary section
  md += '## Summary\n\n'
  md += `**Date Range:** ${summary.dateRange}\n\n`
  md += `| Metric | Value |\n`
  md += `|--------|-------|\n`
  md += `| Total Runs | ${summary.totalRuns} |\n`
  md += `| Average Pass Rate | ${Math.round(summary.averagePassRate * 100)}% |\n`
  md += `| Total Tests | ${summary.totalTests} |\n\n`

  // Pass rate assessment
  const avgPassRate = Math.round(summary.averagePassRate * 100)
  const status = avgPassRate >= 90 ? '🟢 Excellent' : avgPassRate >= 75 ? '🟡 Good' : '🔴 Needs Attention'
  md += `**Overall Health:** ${status}\n\n`

  // Trends section
  if (trends.length > 0) {
    md += '## Recent Run Trends\n\n'
    md += '| Run | Pass Rate | Date | Tests |\n'
    md += '|-----|-----------|------|-------|\n'
    for (const trend of trends.slice(0, 10)) {
      const passRate = Math.round(trend.passRate * 100)
      const indicator = passRate >= 90 ? '🟢' : passRate >= 70 ? '🟡' : '🔴'
      md += `| ${trend.name} | ${indicator} ${passRate}% | ${new Date(trend.createdAt).toLocaleDateString()} | ${trend.totalTests} |\n`
    }
    md += '\n'
  }

  // Top failing components
  if (topFailingComponents.length > 0) {
    md += '## Top Failing Components\n\n'
    md += '| Component | Failures | Total | Rate |\n'
    md += '|-----------|----------|-------|------|\n'
    for (const comp of topFailingComponents.slice(0, 10)) {
      md += `| ${comp.component} | ${comp.failureCount} | ${comp.totalTests} | ${Math.round(comp.failureRate * 100)}% |\n`
    }
    md += '\n'
  }

  // Top failing cases
  if (topFailingCases.length > 0) {
    md += '## Most Frequently Failing Test Cases\n\n'
    md += '| Case | Component | Failures | Last Failure |\n'
    md += '|------|-----------|----------|-------------|\n'
    for (const testCase of topFailingCases.slice(0, 15)) {
      md += `| ${testCase.caseId} | ${testCase.component} | ${testCase.failureCount} | ${new Date(testCase.lastFailure).toLocaleDateString()} |\n`
    }
    md += '\n'
  }

  md += '---\n'
  md += `*Generated on ${new Date().toLocaleString()}*\n`

  return md
}