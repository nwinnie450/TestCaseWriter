'use client'

import { useRouter } from 'next/navigation'
import { LoginPage } from '@/components/auth/LoginPage'
import { AuthService, LoginCredentials } from '@/lib/auth-service'

export default function Login() {
  const router = useRouter()

  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    const user = await AuthService.authenticate(credentials)

    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'super-admin':
        case 'admin':
          router.push('/admin')
          break
        case 'lead':
          router.push('/users') // Lead users can manage teams/users
          break
        case 'qa':
        case 'user':
        default:
          router.push('/') // Main dashboard for QA and regular users
      }
      return true
    }

    return false
  }

  return <LoginPage onLogin={handleLogin} />
}