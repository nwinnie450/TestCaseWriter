// Export utilities for run summaries - CSV, Markdown, JUnit XML

export function exportRunToCSV(summary: any): string {
  const { meta, counts, byComponent, failures } = summary
  const passRatePercent = Math.round(summary.passRate * 100)

  // CSV structure: Run metadata + case status + component breakdown
  const lines = []

  // Header
  lines.push('# Run Summary CSV Export')
  lines.push('')

  // Run metadata
  lines.push('Run Name,Build,Pass Rate,Total Cases,Passed,Failed,Blocked,Not Run')
  lines.push(`"${meta.name}","${meta.build}",${passRatePercent}%,${counts.total},${counts.pass},${counts.fail},${counts.blocked},${counts.notRun}`)
  lines.push('')

  // Component breakdown
  lines.push('Component,Total,Passed,Failed,Pass Rate')
  for (const comp of byComponent) {
    const compPassRate = comp.total > 0 ? Math.round((comp.pass / comp.total) * 100) : 0
    lines.push(`"${comp.key}",${comp.total},${comp.pass},${comp.fail},${compPassRate}%`)
  }
  lines.push('')

  // Failures detail
  if (failures.length > 0) {
    lines.push('Failed Cases')
    lines.push('Case ID,Title,Status,Component,Priority,Assignee,Notes')
    for (const failure of failures) {
      const notes = (failure.notes || '').replace(/"/g, '""') // Escape quotes
      lines.push(`"${failure.caseId}","${failure.title}","${failure.status}","${failure.component || ''}","${failure.priority}","${failure.assignee || ''}","${notes}"`)
    }
  }

  return lines.join('\n')
}

export function exportRunToMarkdown(summary: any): string {
  const { meta, counts, passRate, byComponent, failures, duration } = summary
  const passRatePercent = Math.round(passRate * 100)

  const status = passRatePercent >= 95 ? '🟢 Excellent' :
                passRatePercent >= 80 ? '🟡 Good' : '🔴 Needs Attention'

  const md = []

  // Header
  md.push(`# Test Run Summary: ${meta.name}`)
  md.push('')

  // Overview
  md.push('## 📊 Overview')
  md.push('')
  md.push(`| Metric | Value |`)
  md.push(`|--------|-------|`)
  md.push(`| **Status** | ${status} |`)
  md.push(`| **Pass Rate** | ${passRatePercent}% (${counts.pass}/${counts.total}) |`)
  md.push(`| **Build** | ${meta.build} |`)
  md.push(`| **Executed** | ${meta.startedAt ? new Date(meta.startedAt).toLocaleString() : 'N/A'} |`)

  if (duration && duration.executed > 0) {
    md.push(`| **Duration** | ${formatDuration(duration.total)} (avg: ${formatDuration(duration.average)}) |`)
  }

  md.push('')

  // Status breakdown
  md.push('## 📈 Test Results')
  md.push('')
  md.push('| Status | Count | Percentage |')
  md.push('|--------|-------|------------|')
  md.push(`| ✅ Passed | ${counts.pass} | ${Math.round((counts.pass / counts.total) * 100)}% |`)
  md.push(`| ❌ Failed | ${counts.fail} | ${Math.round((counts.fail / counts.total) * 100)}% |`)
  md.push(`| 🚫 Blocked | ${counts.blocked} | ${Math.round((counts.blocked / counts.total) * 100)}% |`)
  md.push(`| ⏸️ Not Run | ${counts.notRun} | ${Math.round((counts.notRun / counts.total) * 100)}% |`)
  md.push('')

  // Component breakdown
  if (byComponent.length > 0) {
    md.push('## 🏗️ Component Breakdown')
    md.push('')
    md.push('| Component | Total | Passed | Failed | Pass Rate |')
    md.push('|-----------|-------|--------|--------|-----------|')

    for (const comp of byComponent.slice(0, 10)) { // Top 10 components
      const compPassRate = comp.total > 0 ? Math.round((comp.pass / comp.total) * 100) : 0
      const statusIcon = compPassRate >= 90 ? '🟢' : compPassRate >= 70 ? '🟡' : '🔴'
      md.push(`| ${statusIcon} ${comp.key} | ${comp.total} | ${comp.pass} | ${comp.fail} | ${compPassRate}% |`)
    }
    md.push('')
  }

  // Critical failures
  const criticalFailures = failures.filter((f: any) => f.priority === 'critical' || f.priority === 'high')
  if (criticalFailures.length > 0) {
    md.push('## 🚨 Critical Failures')
    md.push('')

    for (const failure of criticalFailures.slice(0, 5)) { // Top 5 critical failures
      md.push(`### ${failure.caseId}: ${failure.title}`)
      md.push(`- **Status**: ${failure.status}`)
      md.push(`- **Component**: ${failure.component || 'Unknown'}`)
      md.push(`- **Priority**: ${failure.priority}`)
      md.push(`- **Assignee**: ${failure.assignee || 'Unassigned'}`)
      if (failure.notes) {
        md.push(`- **Notes**: ${failure.notes}`)
      }
      md.push('')
    }
  }

  // All failures (if not too many)
  if (failures.length > 0 && failures.length <= 20) {
    md.push('## ❌ All Failures')
    md.push('')
    md.push('| Case ID | Title | Component | Priority | Assignee |')
    md.push('|---------|-------|-----------|----------|----------|')

    for (const failure of failures) {
      md.push(`| ${failure.caseId} | ${failure.title} | ${failure.component || ''} | ${failure.priority} | ${failure.assignee || ''} |`)
    }
    md.push('')
  }

  // Recommendations
  md.push('## 💡 Recommendations')
  md.push('')

  if (passRatePercent < 80) {
    md.push('- 🔴 **Pass rate below 80%** - investigate failures before proceeding to production')
  }

  if (criticalFailures.length > 0) {
    md.push(`- ⚠️ **${criticalFailures.length} critical failures** require immediate attention`)
  }

  const failingComponents = byComponent.filter(c => c.fail > 0)
  if (failingComponents.length > 0) {
    const worstComponent = failingComponents.sort((a, b) => b.fail - a.fail)[0]
    md.push(`- 🎯 **Focus on ${worstComponent.key}** component (${worstComponent.fail} failures)`)
  }

  if (passRatePercent >= 95) {
    md.push('- ✅ **Excellent pass rate** - ready for deployment')
  }

  md.push('')

  // Footer
  md.push('---')
  md.push(`*Generated by Test Case Manager on ${new Date().toLocaleString()}*`)

  return md.join('\n')
}

export function exportRunToJUnitXML(summary: any, runCases: any[]): string {
  const { meta, counts, duration } = summary
  const totalDuration = duration?.total || 0

  const xml = []
  xml.push('<?xml version="1.0" encoding="UTF-8"?>')
  xml.push(`<testsuite name="${escapeXml(meta.name)}" tests="${counts.total}" failures="${counts.fail}" errors="${counts.blocked}" skipped="${counts.notRun}" time="${totalDuration}">`)

  // Add properties
  xml.push('  <properties>')
  xml.push(`    <property name="build" value="${escapeXml(meta.build)}"/>`)
  xml.push(`    <property name="environment" value="${meta.configs?.join(',') || 'unknown'}"/>`)
  xml.push('  </properties>')

  // Add test cases
  for (const testCase of runCases) {
    const caseDuration = testCase.durationSec || 0
    xml.push(`  <testcase classname="${escapeXml(testCase.component || 'Unknown')}" name="${escapeXml(testCase.titleSnapshot)}" time="${caseDuration}">`)

    if (testCase.status === 'Fail') {
      xml.push(`    <failure message="Test failed">${escapeXml(testCase.notes || 'No details available')}</failure>`)
    } else if (testCase.status === 'Blocked') {
      xml.push(`    <error message="Test blocked">${escapeXml(testCase.notes || 'No details available')}</error>`)
    } else if (testCase.status === 'Not Run') {
      xml.push(`    <skipped message="Test not executed"/>`)
    }

    xml.push('  </testcase>')
  }

  xml.push('</testsuite>')
  return xml.join('\n')
}

// Helper functions
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ${seconds % 60}s`
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Generate shareable report URL
export function generateShareableUrl(runId: string, baseUrl: string): string {
  // Generate a simple token (in production, use proper JWT or similar)
  const token = Buffer.from(`${runId}:${Date.now()}`).toString('base64')
  return `${baseUrl}/runs/${runId}/share?token=${token}`
}