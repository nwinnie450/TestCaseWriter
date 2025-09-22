import { NextRequest, NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/user-storage'
import { getCurrentUserFromSession } from '@/lib/auth-session'

export async function GET(request: NextRequest) {
  try {
    // Get current user for authentication check
    const currentUser = process.env.NODE_ENV === 'development'
      ? { id: 'dev-user', username: 'dev' }
      : await getCurrentUserFromSession()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get all users for assignee selection
    const users = getAllUsers()

    // Return users with minimal info needed for assignee selection
    const userList = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    }))

    return NextResponse.json(userList)

  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}