import { NextRequest, NextResponse } from 'next/server';
import { aiFailureAnalyzer } from '@/lib/ai-failure-analysis';
import { dataService } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCaseId, failureDescription } = body;

    if (!testCaseId || !failureDescription) {
      return NextResponse.json(
        { error: 'testCaseId and failureDescription are required' },
        { status: 400 }
      );
    }

    // Get the failed test case
    const failedTestCase = await dataService.getTestCase(testCaseId);
    if (!failedTestCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      );
    }

    // Get all test cases for analysis
    const allTestCases = await dataService.getAllTestCases();

    // Perform AI analysis
    const analysis = await aiFailureAnalyzer.analyzeFailure(
      failedTestCase,
      failureDescription,
      allTestCases
    );

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        failedTestCase: {
          id: failedTestCase.id,
          title: failedTestCase.title,
          category: failedTestCase.category,
          priority: failedTestCase.priority
        }
      }
    });

  } catch (error) {
    console.error('AI analysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to perform AI analysis' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCasesToBlock, reason } = body;

    if (!testCasesToBlock || !Array.isArray(testCasesToBlock)) {
      return NextResponse.json(
        { error: 'testCasesToBlock array is required' },
        { status: 400 }
      );
    }

    // Block the specified test cases
    const results = [];
    for (const testCaseId of testCasesToBlock) {
      try {
        const blockingData = {
          status: 'Blocked' as const,
          tester: 'AI-System',
          environment: 'Multiple',
          duration: '0 minutes',
          notes: `Automatically blocked by AI analysis: ${reason}`,
          jiraTicket: ''
        };

        const success = await dataService.updateTestCaseExecution(testCaseId, blockingData);
        results.push({
          testCaseId,
          success,
          message: success ? 'Successfully blocked' : 'Failed to block'
        });
      } catch (error) {
        results.push({
          testCaseId,
          success: false,
          message: `Error blocking test case: ${error.message}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      blockedTests: results,
      summary: {
        total: testCasesToBlock.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Failed to block test cases:', error);
    return NextResponse.json(
      { error: 'Failed to block test cases' },
      { status: 500 }
    );
  }
}