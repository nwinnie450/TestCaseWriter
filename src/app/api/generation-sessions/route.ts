import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sessions = await prisma.generationSession.findMany({
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to fetch generation sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch generation sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const session = await prisma.generationSession.create({
      data: {
        ...body,
        timestamp: new Date()
      }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to create generation session:', error);
    return NextResponse.json({ error: 'Failed to create generation session' }, { status: 500 });
  }
}