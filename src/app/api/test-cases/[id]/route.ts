import { NextRequest, NextResponse } from 'next/server';
import { dataService } from '@/lib/data-service';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const testCase = await dataService.getTestCase(params.id);
    
    if (!testCase) {
      return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
    }
    
    return NextResponse.json(testCase);
  } catch (error) {
    console.error(`Failed to fetch test case ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch test case' }, { status: 500 });
  }
}