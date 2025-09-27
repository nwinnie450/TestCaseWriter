import { NextRequest, NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { getAllUsers } from '@/lib/user-storage'
import { getCurrentUserFromSession } from '@/lib/auth-session'

const client = new MongoClient(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    await client.connect()
    const db = client.db('testcasewriter')

    // Get all users from MongoDB
    const users = await db.collection('users')
      .find({})
      .project({ password: 0 }) // Exclude password field
      .toArray()

    // Transform to expected format
    const userList = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar || null,
      role: user.role
    }))

    return NextResponse.json(userList)

  } catch (error) {
    console.error('Failed to fetch users:', error)
    // Fallback to localStorage users if MongoDB fails
    try {
      const users = getAllUsers()
      const userList = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role
      }))
      return NextResponse.json(userList)
    } catch (fallbackError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }
  } finally {
    await client.close()
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, username, password, role } = body

    // Validate required fields
    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Email, name, password, and role are required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('testcasewriter')

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      email: email.toLowerCase()
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const userData = {
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      username: username?.trim() || email.split('@')[0],
      password, // In production, this should be hashed
      role,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to MongoDB
    await db.collection('users').insertOne(userData)

    // Return user without password
    const { password: _, ...userWithoutPassword } = userData

    return NextResponse.json(userWithoutPassword, { status: 201 })

  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('testcasewriter')

    // Check if user exists and get their role
    const user = await db.collection('users').findOne({ id: userId })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting super-admin users
    if (user.role === 'super-admin') {
      return NextResponse.json(
        { error: 'Cannot delete super-admin user' },
        { status: 400 }
      )
    }

    // Delete user
    await db.collection('users').deleteOne({ id: userId })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name, username, role } = body

    // Validate required fields
    if (!id || !email || !name || !role) {
      return NextResponse.json(
        { error: 'ID, email, name, and role are required' },
        { status: 400 }
      )
    }

    await client.connect()
    const db = client.db('testcasewriter')

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ id })
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it conflicts with another user
    if (email !== existingUser.email) {
      const emailConflict = await db.collection('users').findOne({
        email: email.toLowerCase(),
        id: { $ne: id } // Exclude current user
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another user with this email already exists' },
          { status: 400 }
        )
      }
    }

    const updateData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      username: username?.trim() || email.split('@')[0],
      role,
      updatedAt: new Date()
    }

    // Update user in MongoDB
    await db.collection('users').updateOne(
      { id },
      { $set: updateData }
    )

    // Get updated user
    const updatedUser = await db.collection('users').findOne({ id })
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json(userWithoutPassword)

  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  } finally {
    await client.close()
  }
}