import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

const client = new MongoClient(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await client.connect()
    const db = client.db('testcasewriter')
    const teams = await db.collection('teams').find({}).toArray()

    // Convert MongoDB format to the expected format
    const formattedTeams = teams.map(team => ({
      id: team._id.toString(),
      name: team.name,
      description: team.description || '',
      color: team.color || '#3B82F6',
      isDefault: team.isDefault || false,
      createdBy: team.createdBy || 'system',
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      members: [] // We'll handle members separately
    }))

    return NextResponse.json(formattedTeams)
  } catch (error) {
    console.error('Failed to fetch teams directly:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, color, createdBy } = await request.json()

    await client.connect()
    const db = client.db('testcasewriter')

    // Check if team already exists
    const existingTeam = await db.collection('teams').findOne({ name })
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this name already exists' },
        { status: 400 }
      )
    }

    const team = await db.collection('teams').insertOne({
      name,
      description,
      color,
      createdBy,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const newTeam = {
      id: team.insertedId.toString(),
      name,
      description,
      color,
      createdBy,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: []
    }

    return NextResponse.json(newTeam, { status: 201 })
  } catch (error) {
    console.error('Failed to create team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('id')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('testcasewriter')

    const { ObjectId } = await import('mongodb')
    await db.collection('teams').deleteOne({ _id: new ObjectId(teamId) })

    console.log(`Team ${teamId} deleted successfully from database`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}