'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthService } from '@/lib/auth-service'
import { User, Mail, AlertCircle, CheckCircle, Lock } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (user: any) => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Attempting login for:', email)
      const user = await AuthService.authenticate({
        username: email,
        password: password
      })
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
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }


  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-4 sm:p-6 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Sign In
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter your credentials to access your account
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
                placeholder="Enter your password"
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>


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
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Need Access?</h4>
                <p className="text-xs text-blue-700">
                  Accounts are created by administrators only. Contact your system administrator to request access.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}