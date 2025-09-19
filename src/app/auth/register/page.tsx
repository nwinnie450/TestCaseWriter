'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wand2, Shield, Mail, User, Lock } from 'lucide-react'

export default function RegisterPage() {

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
            <Wand2 className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="mt-8">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Registration Restricted
              </CardTitle>
              <p className="text-gray-600 mt-2">
                For security and compliance, user accounts are created by administrators only
              </p>
            </CardHeader>
            <CardContent className="pt-0">

              {/* Enterprise Security Features */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Enterprise Security
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Admin-Controlled Access</p>
                      <p className="text-xs text-blue-700">Only authorized personnel can create accounts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Automated Onboarding</p>
                      <p className="text-xs text-blue-700">Welcome email with secure password setup</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Role-Based Permissions</p>
                      <p className="text-xs text-blue-700">Proper access control and governance</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="text-center space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Need Access?</h4>
                <p className="text-gray-600">
                  Contact your system administrator to request an account. They will:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      <span>Create your account with appropriate permissions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      <span>Send you a welcome email with login instructions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      <span>Provide a secure password reset link</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                <Link href="/auth/login" className="block">
                  <Button variant="primary" className="w-full">
                    Already Have an Account? Sign In
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="secondary" className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </div>

              {/* Admin Note */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>For Administrators:</strong> Create user accounts through the Admin Panel → User Management section.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}