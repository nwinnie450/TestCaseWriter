import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function DELETE() {
  try {
    await client.connect();
    const db = client.db('testcasewriter');

    // Delete all test cases
    const result = await db.collection('test_cases').deleteMany({});

    // Also clear generation sessions if needed
    await db.collection('generation_sessions').deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Cleared all ${result.deletedCount} test cases`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Failed to clear test cases:', error);
    return NextResponse.json({ error: 'Failed to clear test cases' }, { status: 500 });
  } finally {
    await client.close();
  }
}