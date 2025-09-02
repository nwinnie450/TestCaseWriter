'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginUser, registerUser, initializeDefaultUsers } from '@/lib/user-storage'
import { User, Mail, AlertCircle, CheckCircle, UserPlus, Lock } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any) => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    if (!password.trim()) {
      setError('Please enter your password')
      return
    }
    
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name')
        return
      }
      
      if (!userId.trim()) {
        setError('Please enter a user ID')
        return
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long')
        return
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Initialize default users for testing
      initializeDefaultUsers()

      if (mode === 'login') {
        console.log('Attempting login for:', email)
        const user = loginUser(email, password)
        console.log('Login result:', user)
        
        if (user) {
          setSuccess('Login successful!')
          setTimeout(() => {
            onSuccess?.(user)
            onClose()
            resetForm()
          }, 1000)
        } else {
          console.log('Login failed - invalid credentials')
          setError('Invalid email or password. Please try again.')
        }
      } else {
        try {
          const newUser = registerUser(email, name, password, userId)
          console.log('User registered:', newUser)
          
          // Try to login the new user
          const loggedInUser = loginUser(email, password)
          console.log('Login attempt result:', loggedInUser)
          
          if (loggedInUser) {
            setSuccess('Account created and logged in successfully!')
            setTimeout(() => {
              onSuccess?.(loggedInUser)
              onClose()
              resetForm()
            }, 1000)
          } else {
            setError('Account created but login failed. Please try logging in manually.')
            setTimeout(() => {
              setMode('login')
              setError('')
            }, 2000)
          }
        } catch (err: any) {
          console.error('Registration error:', err)
          setError(err.message || 'Failed to create account')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setName('')
    setUserId('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setMode('login')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest_user',
      email: 'guest@testcasewriter.com',
      name: 'Guest User',
      role: 'guest',
      avatar: 'https://ui-avatars.com/api/?name=Guest%20User&background=9ca3af&color=fff'
    }

    setSuccess('Logged in as Guest - Limited access mode')
    setTimeout(() => {
      onSuccess?.(guestUser)
      onClose()
      resetForm()
    }, 1000)
  }

  const quickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
    setError('')
    setSuccess('')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-4 sm:p-6 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'login' 
              ? 'Enter your email to access your projects'
              : 'Create an account to start managing test cases'
            }
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or User ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or user ID"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter a unique user ID"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary-600 hover:text-primary-700"
                disabled={loading}
              >
                {mode === 'login' 
                  ? "Don't have an account? Create one"
                  : "Already have an account? Sign in"
                }
              </button>
              
              {mode === 'login' && (
                <div>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    disabled={loading}
                    onClick={() => handleGuestLogin()}
                  >
                    Continue as Guest
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Limited access - Read-only mode with basic features
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}