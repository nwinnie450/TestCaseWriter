'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wand2, Eye, EyeOff, Check } from 'lucide-react'
import { registerUser, loginUser } from '@/lib/user-storage'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userId: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains a number', met: /\d/.test(formData.password) },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      if (!passwordRequirements.every(req => req.met)) {
        setError('Password does not meet requirements')
        return
      }

      if (!formData.name || !formData.email || !formData.userId || !formData.password) {
        setError('Please fill in all fields')
        return
      }

      // Use the proper registration function
      const newUser = registerUser(formData.email, formData.name, formData.password, formData.userId)
      
      if (newUser) {
        // Auto-login the newly registered user
        const loggedInUser = loginUser(formData.email, formData.password)
        if (loggedInUser) {
          alert('✅ Registration successful!\n\nWelcome to Test Case Manager! You are now logged in.')
          window.location.href = '/'
        } else {
          alert('✅ Registration successful!\n\nPlease login with your new account.')
          window.location.href = '/auth/login'
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Registration failed. Please try again.')
      }
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Wand2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Get started with{' '}
                          <span className="font-medium text-primary-600">Test Case Manager</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="John Doe"
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@company.com"
                required
              />

              <Input
                label="User ID"
                type="text"
                value={formData.userId}
                onChange={(e) => updateField('userId', e.target.value)}
                placeholder="johndoe123"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className={`flex items-center text-sm ${
                        req.met ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <Check className={`h-3 w-3 mr-2 ${
                          req.met ? 'text-green-600' : 'text-gray-300'
                        }`} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">Passwords do not match</p>
                )}
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full"
                disabled={isLoading || !passwordRequirements.every(req => req.met)}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}