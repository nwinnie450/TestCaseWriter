import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Only keep the custom QA template for production
const mockTemplates = [
  {
    id: 'custom_qa_template',
    name: 'Your Custom QA Template',
    description: 'Customizable template for QA test cases',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
