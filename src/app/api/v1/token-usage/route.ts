import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Mock token usage data - in a real app, this would come from a database
const mockUsageHistory = [
  {
    id: '1',
    date: '2024-12-01T10:00:00Z',
    operation: 'generate_test_cases',
    providerId: 'openai',
    model: 'gpt-4o',
    inputTokens: 1500,
    outputTokens: 3000,
    totalTokens: 4500,
    cost: 0.0675,
    fileName: 'requirements.pdf',
    testCasesGenerated: 15
  },
  {
    id: '2',
    date: '2024-12-01T14:30:00Z',
    operation: 'generate_test_cases',
    providerId: 'claude',
    model: 'claude-3-5-sonnet',
    inputTokens: 2000,
    outputTokens: 4000,
    totalTokens: 6000,
    cost: 0.075,
    fileName: 'user_stories.docx',
    testCasesGenerated: 20
  },
  {
    id: '3',
    date: '2024-12-02T09:15:00Z',
    operation: 'generate_test_cases',
    providerId: 'gemini',
    model: 'gemini-1.5-pro',
    inputTokens: 1200,
    outputTokens: 2500,
    totalTokens: 3700,
    cost: 0.0595,
    fileName: 'api_spec.md',
    testCasesGenerated: 12
  }
]

// Query parameter validation
const QuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  providerId: z.string().optional(),
  operation: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
}).transform(data => ({
  startDate: data.startDate,
  endDate: data.endDate,
  providerId: data.providerId as 'openai' | 'claude' | 'gemini' | 'grok' | undefined,
  operation: data.operation,
  limit: data.limit ? Math.min(Math.max(parseInt(data.limit, 10) || 100, 1), 1000) : 100,
  offset: data.offset ? Math.max(parseInt(data.offset, 10) || 0, 0) : 0
}))

// Calculate statistics from usage history
function calculateStats(usageHistory: any[]) {
  const totalTokens = usageHistory.reduce((sum, usage) => sum + usage.totalTokens, 0)
  const totalCost = usageHistory.reduce((sum, usage) => sum + usage.cost, 0)
  
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const thisMonthUsage = usageHistory.filter(usage => new Date(usage.date) >= startOfMonth)
  const todayUsage = usageHistory.filter(usage => new Date(usage.date) >= startOfDay)
  
  const thisMonth = {
    tokens: thisMonthUsage.reduce((sum, usage) => sum + usage.totalTokens, 0),
    cost: thisMonthUsage.reduce((sum, usage) => sum + usage.cost, 0)
  }
  
  const today = {
    tokens: todayUsage.reduce((sum, usage) => sum + usage.totalTokens, 0),
    cost: todayUsage.reduce((sum, usage) => sum + usage.cost, 0)
  }
  
  // Group by model
  const byModel: Record<string, any> = {}
  usageHistory.forEach(usage => {
    const modelKey = `${usage.providerId}:${usage.model}`
    if (!byModel[modelKey]) {
      byModel[modelKey] = {
        providerId: usage.providerId,
        model: usage.model,
        tokens: 0,
        cost: 0,
        count: 0
      }
    }
    byModel[modelKey].tokens += usage.totalTokens
    byModel[modelKey].cost += usage.cost
    byModel[modelKey].count += 1
  })
  
  return {
    totalTokens,
    totalCost,
    thisMonth,
    today,
    byModel
  }
}

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = QuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_QUERY_PARAMS',
          message: 'Invalid query parameters',
          details: validationResult.error.errors
        }
      }, { status: 400 })
    }

    const { startDate, endDate, providerId, operation, limit, offset } = validationResult.data

    // Filter usage history based on query parameters
    let filteredUsage = [...mockUsageHistory]

    if (startDate) {
      filteredUsage = filteredUsage.filter(usage => new Date(usage.date) >= new Date(startDate))
    }

    if (endDate) {
      filteredUsage = filteredUsage.filter(usage => new Date(usage.date) <= new Date(endDate))
    }

    if (providerId) {
      filteredUsage = filteredUsage.filter(usage => usage.providerId === providerId)
    }

    if (operation) {
      filteredUsage = filteredUsage.filter(usage => usage.operation === operation)
    }

    // Sort by date (newest first)
    filteredUsage.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calculate pagination
    const total = filteredUsage.length
    const paginatedUsage = filteredUsage.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    // Calculate statistics for the filtered data
    const stats = calculateStats(filteredUsage)

    return NextResponse.json({
      success: true,
      data: {
        usageHistory: paginatedUsage,
        stats,
        pagination: {
          total,
          limit,
          offset,
          hasMore
        },
        filters: {
          startDate,
          endDate,
          providerId,
          operation
        }
      }
    })

  } catch (error: any) {
    console.error('Token Usage API error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: error.message
      }
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'POST method not supported'
    }
  }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'PUT method not supported'
    }
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'DELETE method not supported'
    }
  }, { status: 405 })
}
