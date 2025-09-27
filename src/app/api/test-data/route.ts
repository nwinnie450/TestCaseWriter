import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // TODO: Convert to MongoDB

export async function POST(request: NextRequest) {
  try {
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });

    // Create some sample test cases with duplicate IDs to test the fixer
    const sampleTestCases = [
      {
        id: 'TC-001',
        testCase: 'User Login with Valid Credentials',
        module: 'Authentication',
        testSteps: JSON.stringify([
          { step: 1, description: 'Navigate to login page', testData: 'URL: /login', expectedResult: 'Login page displays' },
          { step: 2, description: 'Enter valid credentials', testData: 'user@test.com / password123', expectedResult: 'Credentials accepted' },
          { step: 3, description: 'Click login button', testData: '', expectedResult: 'User is logged in successfully' }
        ]),
        status: 'active',
        priority: 'high',
        qa: 'Verify login functionality works correctly',
        remarks: 'Core authentication test',
        tags: JSON.stringify(['login', 'authentication', 'smoke']),
        projectId: 'test-project'
      },
      {
        id: 'TC-001', // Duplicate ID to test fixer
        testCase: 'User Logout Functionality',
        module: 'Authentication',
        testSteps: JSON.stringify([
          { step: 1, description: 'Login to application', testData: 'user@test.com / password123', expectedResult: 'User logged in' },
          { step: 2, description: 'Click logout button', testData: '', expectedResult: 'User is logged out' },
          { step: 3, description: 'Verify redirect to login', testData: '', expectedResult: 'Redirected to login page' }
        ]),
        status: 'active',
        priority: 'medium',
        qa: 'Verify logout functionality',
        remarks: 'Authentication cleanup test',
        tags: JSON.stringify(['logout', 'authentication']),
        projectId: 'test-project'
      },
      {
        id: 'TC-002',
        testCase: 'Search Functionality Test',
        module: 'Search',
        testSteps: JSON.stringify([
          { step: 1, description: 'Navigate to search page', testData: '', expectedResult: 'Search page loads' },
          { step: 2, description: 'Enter search term', testData: 'test query', expectedResult: 'Search results appear' },
          { step: 3, description: 'Verify results relevance', testData: '', expectedResult: 'Results match search term' }
        ]),
        status: 'draft',
        priority: 'low',
        qa: 'Search feature validation',
        remarks: 'Basic search test',
        tags: JSON.stringify(['search', 'functional']),
        projectId: 'test-project'
      },
      {
        id: 'TC-002', // Another duplicate to test
        testCase: 'Advanced Search with Filters',
        module: 'Search',
        testSteps: JSON.stringify([
          { step: 1, description: 'Navigate to advanced search', testData: '', expectedResult: 'Advanced search page loads' },
          { step: 2, description: 'Apply search filters', testData: 'category: electronics', expectedResult: 'Filters applied' },
          { step: 3, description: 'Execute search', testData: 'laptop', expectedResult: 'Filtered results displayed' }
        ]),
        status: 'review',
        priority: 'medium',
        qa: 'Advanced search capabilities',
        remarks: 'Filter functionality test',
        tags: JSON.stringify(['search', 'filters', 'advanced']),
        projectId: 'test-project'
      },
      {
        id: 'TC-003',
        testCase: 'User Profile Update',
        module: 'User Management',
        testSteps: JSON.stringify([
          { step: 1, description: 'Login and navigate to profile', testData: 'user@test.com', expectedResult: 'Profile page loads' },
          { step: 2, description: 'Update profile information', testData: 'New name, email', expectedResult: 'Information updated' },
          { step: 3, description: 'Save changes', testData: '', expectedResult: 'Changes saved successfully' }
        ]),
        status: 'active',
        priority: 'medium',
        qa: 'Profile update functionality',
        remarks: 'User data management test',
        tags: JSON.stringify(['profile', 'user-management']),
        projectId: 'test-project'
      }
    ];

    // Insert test cases one by one to handle potential ID conflicts
    const createdTestCases = [];
    for (const testCase of sampleTestCases) {
      try {
        const created = await prisma.testCase.create({
          data: {
            ...testCase,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdTestCases.push(created);
      } catch (error) {
        console.log(`Test case ${testCase.id} might already exist or have conflict:`, error);
        // Try with a random suffix if there's a conflict
        try {
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const created = await prisma.testCase.create({
            data: {
              ...testCase,
              id: `${testCase.id}-${randomSuffix}`,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          createdTestCases.push(created);
        } catch (retryError) {
          console.log(`Failed to create test case even with random suffix:`, retryError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdTestCases.length} test cases`,
      testCases: createdTestCases.map(tc => ({ id: tc.id, testCase: tc.testCase }))
    });

  } catch (error) {
    console.error('Failed to create test data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Delete all test cases for testing
    const result = await prisma.testCase.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} test cases`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Failed to delete test data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}