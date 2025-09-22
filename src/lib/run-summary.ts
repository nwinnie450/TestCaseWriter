// Drop-in utility for run statistics - matching your sample
export function summarize(run: { runCases: any[] }) {
  const counts = {
    total: run.runCases.length,
    pass: 0,
    fail: 0,
    blocked: 0,
    skipped: 0,
    notRun: 0
  }

  const componentMap = new Map<string, { pass: number; fail: number }>()

  for (const rc of run.runCases) {
    // Count by status
    if (rc.status === "Pass") counts.pass++
    else if (rc.status === "Fail") counts.fail++
    else if (rc.status === "Blocked") counts.blocked++
    else if (rc.status === "Skipped") counts.skipped++
    else counts.notRun++

    // Count by component
    const key = rc.component || "unassigned"
    if (!componentMap.has(key)) {
      componentMap.set(key, { pass: 0, fail: 0 })
    }

    if (rc.status === "Pass") {
      componentMap.get(key)!.pass++
    } else if (rc.status === "Fail") {
      componentMap.get(key)!.fail++
    }
  }

  return {
    counts,
    passRate: counts.pass / Math.max(1, counts.total),
    byComponent: [...componentMap].map(([key, v]) => ({ key, ...v }))
  }
}

// Enhanced summarize with more TestRail-like metrics
export function enhancedSummarize(run: {
  runCases: any[];
  name?: string;
  build?: string;
  startedAt?: Date;
  closedAt?: Date
}) {
  const basic = summarize(run)

  // Calculate execution progress
  const executed = basic.counts.total - basic.counts.notRun
  const executionRate = executed / Math.max(1, basic.counts.total)

  // Calculate defect density (failures per executed test)
  const defectDensity = basic.counts.fail / Math.max(1, executed)

  // Get top failing components
  const failingComponents = basic.byComponent
    .filter(comp => comp.fail > 0)
    .sort((a, b) => b.fail - a.fail)
    .slice(0, 5)

  // Calculate estimated completion time (if in progress)
  let estimatedCompletion = null
  if (run.startedAt && basic.counts.notRun > 0 && executed > 0) {
    const elapsed = Date.now() - run.startedAt.getTime()
    const avgTimePerTest = elapsed / executed
    const remainingTime = avgTimePerTest * basic.counts.notRun
    estimatedCompletion = new Date(Date.now() + remainingTime)
  }

  return {
    ...basic,
    metrics: {
      executionRate,
      defectDensity,
      executed,
      estimatedCompletion
    },
    insights: {
      topFailingComponents: failingComponents,
      riskLevel: defectDensity > 0.3 ? 'high' : defectDensity > 0.1 ? 'medium' : 'low'
    }
  }
}

// Export utility for creating run reports
export function generateRunReport(summary: any) {
  const { meta, counts, passRate, byComponent, failures } = summary

  const passRatePercent = Math.round(passRate * 100)
  const status = passRatePercent >= 95 ? '🟢 Excellent' :
                passRatePercent >= 80 ? '🟡 Good' : '🔴 Needs Attention'

  return {
    title: `Test Run Summary: ${meta.name}`,
    overview: {
      status,
      passRate: `${passRatePercent}%`,
      totalTests: counts.total,
      executed: counts.total - counts.notRun,
      build: meta.build
    },
    breakdown: byComponent,
    criticalFailures: failures.filter((f: any) => f.priority === 'critical' || f.priority === 'high'),
    recommendations: generateRecommendations(summary)
  }
}

function generateRecommendations(summary: any) {
  const recommendations = []
  const { passRate, failures, byComponent } = summary

  if (passRate < 0.8) {
    recommendations.push("🔴 Pass rate below 80% - investigate failures before proceeding")
  }

  if (failures.length > 0) {
    const criticalFailures = failures.filter((f: any) => f.priority === 'critical')
    if (criticalFailures.length > 0) {
      recommendations.push(`⚠️ ${criticalFailures.length} critical failures require immediate attention`)
    }
  }

  const failingComponents = byComponent.filter((c: any) => c.fail > 0)
  if (failingComponents.length > 0) {
    const worstComponent = failingComponents.sort((a: any, b: any) => b.fail - a.fail)[0]
    recommendations.push(`🎯 Focus on ${worstComponent.key} component (${worstComponent.fail} failures)`)
  }

  if (recommendations.length === 0) {
    recommendations.push("✅ All tests passing - ready for deployment")
  }

  return recommendations
}