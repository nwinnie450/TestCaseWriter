'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { AuthService } from '@/lib/auth-service'

interface PasswordResetFormData {
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState<PasswordResetFormData>({
    newPassword: '',
    confirmPassword: ''
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [token, setToken] = useState<string>('')
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [resetComplete, setResetComplete] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Extract token and email from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get('token')
    const emailParam = urlParams.get('email')

    if (tokenParam && emailParam) {
      setToken(tokenParam)
      setUserEmail(decodeURIComponent(emailParam))
      setIsValidToken(true) // In production, validate token on server
    } else {
      setIsValidToken(false)
    }
  }, [])

  // Password validation
  const validatePassword = (password: string): string[] => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return errors
  }

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, newPassword: password }))
    setPasswordErrors(validatePassword(password))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    if (passwordErrors.length > 0) {
      alert('Please fix password requirements')
      return
    }

    setLoading(true)

    try {
      // Update password using AuthService
      const success = await AuthService.updatePassword(userEmail, formData.newPassword)

      if (!success) {
        throw new Error('Failed to update password')
      }

      setResetComplete(true)

      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 3000)

    } catch (error) {
      console.error('Password reset failed:', error)
      alert('Failed to reset password. Please try again.')
    }

    setLoading(false)
  }

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => window.location.href = '/login'}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (resetComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Password Updated!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <p className="mt-4 text-xs text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => window.location.href = '/login'}
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hello! Please set a new password for your account: <strong>{userEmail}</strong>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={formData.newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter your new password"
                  className={`pr-10 ${passwordErrors.length > 0 ? 'border-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                {passwordErrors.map((error, index) => (
                  <p key={index} className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {error}
                  </p>
                ))}
                {passwordErrors.length === 0 && formData.newPassword && (
                  <p className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Password meets all requirements
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm your new password"
                  className={`pr-10 ${
                    formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                      ? 'border-red-300'
                      : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Passwords match
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={
                loading ||
                passwordErrors.length > 0 ||
                !formData.newPassword ||
                !formData.confirmPassword ||
                formData.newPassword !== formData.confirmPassword
              }
              className="w-full flex justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}