import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET() {
  try {
    const testCases = await dataService.getAllTestCases();
    return NextResponse.json(testCases);
  } catch (error) {
    console.error('Failed to fetch test cases:', error);
    return NextResponse.json({ error: 'Failed to fetch test cases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testCaseId, executionData } = body;

    if (!testCaseId || !executionData) {
      return NextResponse.json({ error: 'Missing testCaseId or executionData' }, { status: 400 });
    }

    const success = await dataService.updateTestCaseExecution(testCaseId, executionData);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Test case execution updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to update test case execution' }, { status: 500 });
    }
  } catch (error) {
    console.error('Failed to update test case execution:', error);
    return NextResponse.json({ error: 'Failed to update test case execution' }, { status: 500 });
  }
}