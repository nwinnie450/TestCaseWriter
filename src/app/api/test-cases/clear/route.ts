import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    // Delete all test cases
    const result = await prisma.testCase.deleteMany({});

    // Also clear generation sessions if needed
    await prisma.generationSession.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Cleared all ${result.count} test cases`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Failed to clear test cases:', error);
    return NextResponse.json({ error: 'Failed to clear test cases' }, { status: 500 });
  }
}