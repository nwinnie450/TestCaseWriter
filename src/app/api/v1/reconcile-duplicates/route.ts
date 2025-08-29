import { NextRequest, NextResponse } from 'next/server'
import { reconcileProjectDuplicates, previewProjectDuplicates, getReconciliationStats, ReconcileResult } from '@/lib/reconcileDuplicates'

export interface ReconcileRequest {
  projectId?: string
  threshold?: number
  preview?: boolean
}

export interface ReconcileResponse {
  success: boolean
  result?: ReconcileResult
  preview?: {
    duplicateGroups: any[]
    totalWouldRemove: number
  }
  stats?: {
    totalCases: number
    withSimhash: number
    potentialDuplicates: number
    estimatedSavings: number
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ReconcileResponse>> {
  try {
    const body: ReconcileRequest = await request.json()
    const { projectId, threshold = 4, preview = false } = body
    
    console.log('🔄 Reconcile API - Starting reconciliation:', {
      projectId: projectId ? projectId.substring(0, 8) + '...' : 'all',
      threshold,
      preview
    })

    if (preview) {
      // Preview mode - show what would be removed without actually removing
      const previewResult = await previewProjectDuplicates(projectId, threshold)
      
      return NextResponse.json({
        success: true,
        preview: previewResult
      })
    } else {
      // Actual reconciliation - remove duplicates
      const result = await reconcileProjectDuplicates(projectId, threshold)
      
      return NextResponse.json({
        success: true,
        result
      })
    }

  } catch (error) {
    console.error('❌ Reconcile API - Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId') || undefined
    
    // Get reconciliation statistics
    const stats = await getReconciliationStats(projectId)
    
    return NextResponse.json({
      success: true,
      stats
    })
    
  } catch (error) {
    console.error('❌ Reconcile Stats API - Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}