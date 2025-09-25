import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // Get test cases from Prisma database
    const testCases = await prisma.testCase.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Transform Prisma data to match the expected format for RunCreateWizard
    const transformedTestCases = testCases.map(tc => ({
      id: tc.id,
      title: tc.testCase,
      currentStatus: tc.status,
      priority: tc.priority,
      category: tc.module || 'General',
      tags: Array.isArray(tc.tags) ? tc.tags : (tc.tags ? JSON.parse(tc.tags as string) : []),
      projectId: tc.projectId || 'default',
      description: tc.qa || '',
      steps: Array.isArray(tc.testSteps) ? tc.testSteps : (tc.testSteps ? JSON.parse(tc.testSteps as string) : []),
      expectedResult: tc.remarks || '',
      createdDate: tc.createdAt,
      lastModified: tc.updatedAt
    }));

    return NextResponse.json(transformedTestCases);
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle bulk creation of test cases
    if (Array.isArray(body)) {
      const testCases = await prisma.testCase.createMany({
        data: body.map(testCase => ({
          ...testCase,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        skipDuplicates: true
      });

      return NextResponse.json({
        success: true,
        message: `Created ${testCases.count} test cases`,
        count: testCases.count
      });
    }

    // Handle single test case creation
    const testCase = await prisma.testCase.create({
      data: {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json(testCase);
  } catch (error) {
    console.error('Failed to create test case(s):', error);
    return NextResponse.json({ error: 'Failed to create test case(s)' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'Missing or invalid ids array' }, { status: 400 });
    }

    // Delete test cases by IDs
    const result = await prisma.testCase.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} test cases`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Failed to delete test cases:', error);
    return NextResponse.json({ error: 'Failed to delete test cases' }, { status: 500 });
  }
}