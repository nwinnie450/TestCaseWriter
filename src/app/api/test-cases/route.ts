import { NextRequest, NextResponse } from 'next/server'
import { mongodb, TestCaseDocument } from '@/lib/mongodb-service'
import { getCurrentUser } from '@/lib/user-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Build filter
    const filter: any = {}
    if (projectId) {
      filter.projectId = projectId
    }
    if (priority) {
      filter.priority = priority
    }
    if (tag) {
      filter.tags = { $in: [tag] }
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { testCase: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { qa: { $regex: search, $options: 'i' } }
      ]
    }

    // Get test cases from MongoDB using service
    const testCases = await mongodb.findMany<any>(
      'test_cases',
      filter,
      {
        sort: { createdAt: -1 },
        limit,
        skip
      }
    )

    // Get total count for pagination
    const total = await mongodb.count('test_cases', filter)

    // Transform MongoDB data to match the expected format
    const transformedTestCases = testCases.map(tc => ({
      id: tc.id || tc._id?.toString(),
      title: tc.testCase || tc.title || tc.data?.title || 'Untitled Test Case',
      testCase: tc.testCase || tc.title || tc.data?.title || 'Untitled Test Case', // For backward compatibility
      currentStatus: tc.status || 'draft',
      status: tc.status || 'draft', // Both formats
      priority: tc.priority || 'medium',
      category: tc.module || tc.category || 'General',
      module: tc.module || tc.category || 'General', // Both formats
      tags: Array.isArray(tc.tags) ? tc.tags : (tc.tags ? JSON.parse(tc.tags as string) : []),
      projectId: tc.projectId || 'default',
      description: tc.data?.description || tc.description || tc.qa || '',
      qa: tc.qa || tc.data?.assignee || '', // For backward compatibility
      steps: Array.isArray(tc.testSteps) ? tc.testSteps : (tc.steps ? (Array.isArray(tc.steps) ? tc.steps : JSON.parse(tc.steps as string)) : []),
      expectedResult: tc.testResult || tc.data?.expectedResult || tc.expectedResult || tc.remarks || '',
      remarks: tc.remarks || tc.data?.remarks || '', // For backward compatibility
      createdDate: tc.createdAt,
      createdAt: tc.createdAt,
      lastModified: tc.updatedAt,
      updatedAt: tc.updatedAt,
      type: tc.type || 'manual',
      createdBy: tc.createdBy || 'unknown',
      testSteps: Array.isArray(tc.testSteps) ? tc.testSteps.map((step, idx) => ({
        step: step.step || idx + 1,
        description: step.description || step.step || '',
        expectedResult: step.expectedResult || step.expected || '',
        testData: step.testData || ''
      })) : (Array.isArray(tc.steps) ? tc.steps.map((step, idx) => ({
        step: step.step || idx + 1,
        description: step.description || step.step || '',
        expectedResult: step.expectedResult || step.expected || '',
        testData: step.testData || ''
      })) : []),
      // Add the new fields that are saved in MongoDB
      enhancement: tc.enhancement || '',
      ticketId: tc.ticketId || '',
      testData: tc.testData || '',
      feature: tc.feature || '',
      requirements: tc.requirements || '',
      // User tracking fields
      createdBy: tc.createdBy || 'unknown',
      createdByName: tc.createdByName || tc.createdBy || 'Unknown',
      updatedBy: tc.updatedBy || tc.createdBy || 'unknown',
      lastModifiedBy: tc.lastModifiedBy || tc.updatedBy || tc.createdByName || tc.createdBy || 'Unknown',
      // Add data object for compatibility (preserve existing data structure)
      data: {
        title: tc.testCase || tc.title || tc.data?.title || 'Untitled Test Case',
        description: tc.data?.description || tc.description || tc.qa || '',
        enhancement: tc.enhancement || tc.data?.enhancement || '',
        ticketId: tc.ticketId || tc.data?.ticketId || '',
        testData: tc.testData || tc.data?.testData || '',
        feature: tc.feature || tc.data?.feature || '',
        requirements: tc.requirements || tc.data?.requirements || '',
        complexity: tc.data?.complexity || tc.complexity || 'Medium',
        module: tc.module || tc.data?.module || tc.category || 'General',
        expectedResult: tc.testResult || tc.data?.expectedResult || tc.expectedResult || '',
        assignee: tc.qa || tc.data?.assignee || '',
        remarks: tc.remarks || tc.data?.remarks || '',
        steps: tc.testSteps || tc.data?.steps || tc.steps || []
      }
    }))

    return NextResponse.json({
      testCases: transformedTestCases,
      total,
      hasMore: skip + limit < total
    })

  } catch (error) {
    console.error('Failed to fetch test cases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/test-cases called')

    // Get current user from localStorage
    const currentUser = getCurrentUser()

    // If no user found, try a development fallback
    const effectiveUser = currentUser || (process.env.NODE_ENV === 'development'
      ? { id: 'dev-user', username: 'dev', email: 'dev@local', name: 'Development User' }
      : null)

    if (!effectiveUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('🔍 POST /api/test-cases received body:', JSON.stringify(body, null, 2))

    // Handle bulk creation of test cases
    if (Array.isArray(body)) {
      const testCasesData = body.map((testCase, index) => {
        const tcId = testCase.id || `tc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`
        return {
          ...testCase,
          id: tcId,
          createdBy: effectiveUser.id,
          createdByName: effectiveUser.username || effectiveUser.name || effectiveUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: effectiveUser.id,
          lastModifiedBy: effectiveUser.username || effectiveUser.name || effectiveUser.id
        }
      })

      const result = await mongodb.insertMany('test_cases', testCasesData)

      return NextResponse.json({
        success: true,
        message: `Created ${result.length} test cases`,
        count: result.length,
        testCases: result
      })
    }

    // Handle single test case creation
    const { title, description, steps, priority, type, tags, projectId } = body

    // Validate required fields
    console.log('🔍 Validation check - title:', title, 'steps:', steps, 'isArray:', Array.isArray(steps), 'length:', steps?.length)
    if (!title || !steps || !Array.isArray(steps) || steps.length === 0) {
      console.log('❌ Validation failed - title:', !!title, 'steps:', !!steps, 'isArray:', Array.isArray(steps), 'length:', steps?.length)
      return NextResponse.json(
        { error: 'Title and steps are required' },
        { status: 400 }
      )
    }

    // Generate test case ID
    const testCaseId = body.id || `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Validate and format steps
    const formattedSteps = steps.map((step: any, index: number) => ({
      id: step.id || `step_${index + 1}`,
      step: step.step || step.action || '',
      expected: step.expected || step.expectedResult || ''
    }))

    const testCaseData = {
      ...body,
      id: testCaseId,
      title: title.trim(),
      description: description?.trim() || '',
      steps: formattedSteps,
      priority: priority || 'medium',
      type: type || 'manual',
      tags: Array.isArray(tags) ? tags : [],
      projectId: projectId || null,
      createdBy: effectiveUser.id,
      createdByName: effectiveUser.username || effectiveUser.name || effectiveUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: effectiveUser.id,
      lastModifiedBy: effectiveUser.username || effectiveUser.name || effectiveUser.id
    }

    // Save to MongoDB using service
    const result = await mongodb.insertOne('test_cases', testCaseData)

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Failed to create test case(s):', error)
    return NextResponse.json(
      { error: 'Failed to create test case(s)' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user from localStorage
    const currentUser = getCurrentUser()

    // If no user found, try a development fallback
    const effectiveUser = currentUser || (process.env.NODE_ENV === 'development'
      ? { id: 'dev-user', username: 'dev', email: 'dev@local', name: 'Development User', role: 'admin' }
      : null)

    if (!effectiveUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const testCaseId = searchParams.get('id')

    // Handle single test case deletion by ID
    if (testCaseId) {
      // Check if test case exists
      const testCase = await mongodb.findOne('test_cases', { id: testCaseId })
      if (!testCase) {
        return NextResponse.json(
          { error: 'Test case not found' },
          { status: 404 }
        )
      }

      // Check permissions (owner or admin)
      if (testCase.createdBy !== effectiveUser.id && !['admin', 'super-admin'].includes(effectiveUser.role)) {
        return NextResponse.json(
          { error: 'Permission denied' },
          { status: 403 }
        )
      }

      const deleted = await mongodb.deleteOne('test_cases', { id: testCaseId })
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete test case' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Handle bulk deletion
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: 'Missing or invalid ids array' },
        { status: 400 }
      )
    }

    // Delete test cases by IDs with permission check
    const deleteFilter: any = {
      $and: [
        {
          $or: [
            { id: { $in: ids } },
            { _id: { $in: ids.filter(id => mongodb.isValidObjectId(id)).map(id => mongodb.createObjectId(id)) } }
          ]
        },
        // Only allow deletion of own test cases or admin
        {
          $or: [
            { createdBy: effectiveUser.id },
            ...((['admin', 'super-admin'].includes(effectiveUser.role)) ? [{}] : [])
          ]
        }
      ]
    }

    const result = await mongodb.deleteMany('test_cases', deleteFilter)

    return NextResponse.json({
      success: true,
      message: `Deleted ${result} test cases`,
      deletedCount: result
    })

  } catch (error) {
    console.error('Failed to delete test cases:', error)
    return NextResponse.json(
      { error: 'Failed to delete test cases' },
      { status: 500 }
    )
  }
}

// Add PUT method for updates
export async function PUT(request: NextRequest) {
  try {
    // Get current user from localStorage
    const currentUser = getCurrentUser()

    // If no user found, try a development fallback
    const effectiveUser = currentUser || (process.env.NODE_ENV === 'development'
      ? { id: 'dev-user', username: 'dev', email: 'dev@local', name: 'Development User' }
      : null)

    if (!effectiveUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      id, title, description, steps, priority, type, tags, projectId,
      module, feature, enhancement, ticketId, qa, remarks
    } = body

    // Validate required fields
    if (!id || !title || !steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'ID, title and steps are required' },
        { status: 400 }
      )
    }

    // Check if test case exists
    const existingTestCase = await mongodb.findOne('test_cases', { id })
    if (!existingTestCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    // Validate and format steps
    const formattedSteps = steps.map((step: any, index: number) => ({
      id: step.id || `step_${index + 1}`,
      step: step.step || step.action || '',
      expected: step.expected || step.expectedResult || ''
    }))

    const updateData = {
      $set: {
        title: title.trim(),
        description: description?.trim() || '',
        steps: formattedSteps,
        priority: priority || 'medium',
        type: type || 'manual',
        tags: Array.isArray(tags) ? tags : [],
        projectId: projectId || null,
        module: module || 'General',
        feature: feature || '',
        enhancement: enhancement || '',
        ticketId: ticketId || '',
        qa: qa || '',
        remarks: remarks || '',
        updatedAt: new Date(),
        updatedBy: effectiveUser.id,
        lastModifiedBy: effectiveUser.username || effectiveUser.name || effectiveUser.id
      }
    }

    // Update test case in MongoDB
    const updatedTestCase = await mongodb.updateOne(
      'test_cases',
      { id },
      updateData
    )

    if (!updatedTestCase) {
      return NextResponse.json(
        { error: 'Failed to update test case' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTestCase)

  } catch (error) {
    console.error('Failed to update test case:', error)
    return NextResponse.json(
      { error: 'Failed to update test case' },
      { status: 500 }
    )
  }
}