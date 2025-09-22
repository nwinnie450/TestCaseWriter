'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/Layout'
import { RunSummary } from '@/components/execution/RunSummary'

export default function RunSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.runId as string

  const breadcrumbs = [
    { label: 'Execution', href: '/execution' },
    { label: 'Run Summary' }
  ]

  const handleNavigateToRun = (newRunId: string) => {
    router.push(`/execution?runId=${newRunId}`)
  }

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      title="Run Summary"
    >
      <RunSummary
        runId={runId}
        onNavigateToRun={handleNavigateToRun}
      />
    </Layout>
  )
}