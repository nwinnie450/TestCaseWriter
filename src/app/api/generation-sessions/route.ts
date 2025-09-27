import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_URL!);

export async function GET() {
  try {
    await client.connect();
    const db = client.db('testcasewriter');

    const sessions = await db.collection('generation_sessions')
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    const transformedSessions = sessions.map(session => ({
      ...session,
      id: session._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(transformedSessions);
  } catch (error) {
    console.error('Failed to fetch generation sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch generation sessions' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    await client.connect();
    const db = client.db('testcasewriter');

    const sessionData = {
      ...body,
      timestamp: new Date()
    };

    const result = await db.collection('generation_sessions').insertOne(sessionData);
    const session = { id: result.insertedId.toString(), ...sessionData };

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to create generation session:', error);
    return NextResponse.json({ error: 'Failed to create generation session' }, { status: 500 });
  } finally {
    await client.close();
  }
}