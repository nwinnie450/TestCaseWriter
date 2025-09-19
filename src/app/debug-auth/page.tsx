'use client'

import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/auth-service'
import { Button } from '@/components/ui/Button'

export default function DebugAuth() {
  const [users, setUsers] = useState<any[]>([])
  const [loginAttempt, setLoginAttempt] = useState<any>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    try {
      // Access private method through any casting (for debugging only)
      const storedUsers = (AuthService as any).getStoredUsers()
      setUsers(storedUsers)
      console.log('Debug - Loaded users:', storedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const resetUsers = () => {
    AuthService.resetDemoUsers()
    loadUsers()
  }

  const testLogin = async () => {
    try {
      console.log('Testing login with admin/Orion888!')
      const result = await AuthService.authenticate({ username: 'admin', password: 'Orion888!' })
      setLoginAttempt({ success: !!result, user: result, timestamp: new Date() })
      console.log('Login test result:', result)
    } catch (error) {
      console.error('Login test error:', error)
      setLoginAttempt({ success: false, error: error, timestamp: new Date() })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Stored Users</h2>
          <div className="space-y-2">
            <Button onClick={loadUsers} variant="secondary" size="sm">Reload Users</Button>
            <Button onClick={resetUsers} variant="primary" size="sm">Reset Demo Users</Button>
          </div>
          <div className="mt-4 space-y-2">
            {users.map((user, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border text-sm">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Username:</strong> {user.username}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Password:</strong> {user.password}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>Name:</strong> {user.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Test Login</h2>
          <Button onClick={testLogin} variant="primary">Test Admin Login</Button>
          {loginAttempt && (
            <div className={`mt-4 p-3 rounded border ${loginAttempt.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div><strong>Success:</strong> {loginAttempt.success ? 'Yes' : 'No'}</div>
              <div><strong>Time:</strong> {loginAttempt.timestamp.toLocaleTimeString()}</div>
              {loginAttempt.user && (
                <div className="mt-2">
                  <strong>Logged in as:</strong> {loginAttempt.user.name} ({loginAttempt.user.role})
                </div>
              )}
              {loginAttempt.error && (
                <div className="mt-2 text-red-600">
                  <strong>Error:</strong> {loginAttempt.error.toString()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Current User</h2>
          <div className="text-sm">
            {AuthService.getCurrentUser() ? (
              <pre>{JSON.stringify(AuthService.getCurrentUser(), null, 2)}</pre>
            ) : (
              <div className="text-gray-500">No user logged in</div>
            )}
          </div>
          <Button onClick={() => AuthService.logout()} variant="secondary" size="sm" className="mt-2">
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}