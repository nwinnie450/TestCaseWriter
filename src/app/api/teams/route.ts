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
    */
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
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });
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
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });
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
    // TODO: Convert this endpoint to use MongoDB
    return NextResponse.json({
      success: false,
      error: 'This endpoint needs to be converted to MongoDB',
      message: 'Prisma has been removed, this endpoint needs MongoDB implementation'
    }, { status: 501 });
  } catch (error) {
    console.error('Failed to update team:', error)
    return NextResponse.json(
      { error: 'Failed to update team: ' + (error as Error).message },
      { status: 500 }
    )
  }
}