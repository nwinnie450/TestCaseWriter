import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-12345'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface SessionData {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export function createSession(user: User): string {
  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user'
  }

  return jwt.sign(sessionData, JWT_SECRET, {
    expiresIn: '7d'
  })
}

export function verifySession(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData
    return decoded
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

export async function getCurrentUserFromSession(): Promise<User | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const sessionData = verifySession(token)
    if (!sessionData) {
      return null
    }

    // In production, you'd fetch from database
    // For now, return user data from session
    return {
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.email.split('@')[0], // Fallback name
      username: sessionData.email.split('@')[0],
      role: sessionData.role,
      password: '' // Never return password
    }
  } catch (error) {
    console.error('Failed to get current user from session:', error)
    return null
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/'
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete('auth-token')
}