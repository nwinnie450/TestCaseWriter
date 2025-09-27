import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma' // TODO: Convert to MongoDB

// GET /api/teams - Get all teams
export async function GET() {
  try {
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });

    /*
    const teams = await prisma.team.findMany({
      include: {
        members: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Failed to fetch teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const { name, description, color, createdBy } = await request.json()

    // Check if team with same name exists
    const existingTeam = await prisma.team.findUnique({
      where: { name }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this name already exists' },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        color,
        createdBy,
        isDefault: false
      },
      include: {
        members: true
      }
    })

    console.log(`Team "${name}" created successfully with ID: ${team.id}`)
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Failed to create team:', error)
    return NextResponse.json(
      { error: 'Failed to create team: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE /api/teams - Delete a team
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('id')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Delete team (this will also delete team members due to cascade)
    await prisma.team.delete({
      where: { id: teamId }
    })

    console.log(`Team ${teamId} deleted successfully from database`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// PUT /api/teams - Update a team
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, color } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        name,
        description,
        color
      },
      include: {
        members: true
      }
    })

    console.log(`Team ${id} updated successfully`)
    return NextResponse.json(team)
  } catch (error) {
    console.error('Failed to update team:', error)
    return NextResponse.json(
      { error: 'Failed to update team: ' + (error as Error).message },
      { status: 500 }
    )
  }
}