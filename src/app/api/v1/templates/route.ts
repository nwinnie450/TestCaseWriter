import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Mock templates data - in a real app, this would come from a database
const mockTemplates = [
  {
    id: 'standard_test_case',
    name: 'Standard Test Case',
    description: 'Basic test case template with essential fields',
    fields: [
      {
        id: 'test_case_id',
        type: 'text',
        label: 'Test Case ID',
        required: true,
        options: []
      },
      {
        id: 'module',
        type: 'text',
        label: 'Module',
        required: true,
        options: []
      },
      {
        id: 'test_case',
        type: 'textarea',
        label: 'Test Case Description',
        required: true,
        options: []
      },
      {
        id: 'test_steps',
        type: 'table',
        label: 'Test Steps',
        required: true,
        options: []
      },
      {
        id: 'test_result',
        type: 'select',
        label: 'Test Result',
        required: false,
        options: ['Not Executed', 'Passed', 'Failed', 'Blocked', 'Skipped']
      },
      {
        id: 'priority',
        type: 'select',
        label: 'Priority',
        required: false,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      {
        id: 'qa_notes',
        type: 'textarea',
        label: 'QA Notes',
        required: false,
        options: []
      },
      {
        id: 'remarks',
        type: 'textarea',
        label: 'Remarks',
        required: false,
        options: []
      }
    ],
    version: 1,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    projectId: null
  },
  {
    id: 'user_story_test',
    name: 'User Story Test Case',
    description: 'Test case template designed for user story validation',
    fields: [
      {
        id: 'user_story_id',
        type: 'text',
        label: 'User Story ID',
        required: true,
        options: []
      },
      {
        id: 'acceptance_criteria',
        type: 'textarea',
        label: 'Acceptance Criteria',
        required: true,
        options: []
      },
      {
        id: 'test_scenarios',
        type: 'table',
        label: 'Test Scenarios',
        required: true,
        options: []
      },
      {
        id: 'business_value',
        type: 'select',
        label: 'Business Value',
        required: false,
        options: ['Low', 'Medium', 'High', 'Critical']
      }
    ],
    version: 1,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    projectId: null
  },
  {
    id: 'api_test_case',
    name: 'API Test Case',
    description: 'Specialized template for API testing scenarios',
    fields: [
      {
        id: 'endpoint',
        type: 'text',
        label: 'API Endpoint',
        required: true,
        options: []
      },
      {
        id: 'http_method',
        type: 'select',
        label: 'HTTP Method',
        required: true,
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      {
        id: 'request_headers',
        type: 'textarea',
        label: 'Request Headers',
        required: false,
        options: []
      },
      {
        id: 'request_body',
        type: 'textarea',
        label: 'Request Body',
        required: false,
        options: []
      },
      {
        id: 'expected_status',
        type: 'number',
        label: 'Expected Status Code',
        required: true,
        options: []
      },
      {
        id: 'expected_response',
        type: 'textarea',
        label: 'Expected Response',
        required: false,
        options: []
      }
    ],
    version: 1,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    projectId: null
  },
  {
    id: 'performance_test',
    name: 'Performance Test Case',
    description: 'Template for performance and load testing scenarios',
    fields: [
      {
        id: 'performance_metric',
        type: 'text',
        label: 'Performance Metric',
        required: true,
        options: []
      },
      {
        id: 'target_value',
        type: 'number',
        label: 'Target Value',
        required: true,
        options: []
      },
      {
        id: 'test_duration',
        type: 'number',
        label: 'Test Duration (minutes)',
        required: true,
        options: []
      },
      {
        id: 'concurrent_users',
        type: 'number',
        label: 'Concurrent Users',
        required: false,
        options: []
      },
      {
        id: 'success_criteria',
        type: 'textarea',
        label: 'Success Criteria',
        required: true,
        options: []
      }
    ],
    version: 1,
    isPublished: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    projectId: null
  }
]

// Query parameter validation
const QuerySchema = z.object({
  projectId: z.string().optional(),
  isPublished: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional()
}).transform(data => ({
  projectId: data.projectId,
  isPublished: data.isPublished === 'true',
  limit: data.limit ? Math.min(Math.max(parseInt(data.limit, 10) || 50, 1), 100) : 50,
  offset: data.offset ? Math.max(parseInt(data.offset, 10) || 0, 0) : 0
}))

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

    const { projectId, isPublished, limit, offset } = validationResult.data

    // Filter templates based on query parameters
    let filteredTemplates = [...mockTemplates]

    if (projectId !== undefined) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.projectId === projectId || template.projectId === null
      )
    }

    if (isPublished !== undefined && isPublished !== null) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.isPublished === isPublished
      )
    }

    // Calculate pagination
    const total = filteredTemplates.length
    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return NextResponse.json({
      success: true,
      data: {
        templates: paginatedTemplates,
        pagination: {
          total,
          limit,
          offset,
          hasMore
        }
      }
    })

  } catch (error: any) {
    console.error('Templates API error:', error)
    
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
