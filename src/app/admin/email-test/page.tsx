'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmailService } from '@/lib/email-service'
import { AuthService } from '@/lib/auth-service'
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'

export default function EmailTestPage() {
  const currentUser = AuthService.getCurrentUser()
  const hasEmailAccess = !!currentUser && ['admin', 'super-admin'].includes(currentUser.role)

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [loading, setLoading] = useState(hasEmailAccess)
  const [showEnvVars, setShowEnvVars] = useState(false)

  const testEmailConfig = useCallback(async () => {
    if (!hasEmailAccess) {
      setLoading(false)
      setTestResult(null)
      return
    }

    setLoading(true)
    try {
      const emailService = EmailService.getInstance()
      const result = await emailService.testEmailConfiguration()
      setTestResult(result)
    } catch (error) {
      console.error('Failed to test email configuration:', error)
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      setTestResult({
        success: false,
        message: `Failed to test email configuration: ${message}`
      })
    } finally {
      setLoading(false)
    }
  }, [hasEmailAccess])

  useEffect(() => {
    void testEmailConfig()
  }, [testEmailConfig])

  const sendTestEmail = useCallback(async () => {
    if (!testEmail) {
      alert('Please enter a test email address')
      return
    }

    if (!hasEmailAccess) {
      alert('Admin access required for email configuration.')
      return
    }

    setSendingTest(true)
    try {
      const emailService = EmailService.getInstance()
      const template = EmailService.getWelcomeEmailTemplate()

      const success = await emailService.sendEmail({
        to: testEmail,
        template,
        variables: {
          userName: 'Test User',
          userEmail: testEmail,
          userRole: 'QA Tester',
          tempPassword: 'TestPassword123!',
          resetPasswordUrl: 'http://localhost:3009/reset-password?token=test-token'
        }
      })

      if (success) {
        alert('Test email sent successfully! Check your console logs (Development mode) or email inbox (Production mode)')
      } else {
        alert('Failed to send test email. Check console for errors.')
      }
    } catch (error) {
      console.error('Test email error:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Error sending test email: ' + message)
    } finally {
      setSendingTest(false)
    }
  }, [hasEmailAccess, testEmail])

  if (!hasEmailAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Admin access required for email configuration.</p>
          <p className="text-xs text-gray-400 mt-2">Current role: {currentUser?.role || 'none'}</p>
        </div>
      </div>
    )
  }

  const getStatusIcon = () => {
    if (loading) return <Settings className="w-5 h-5 text-gray-500 animate-spin" />
    if (!testResult) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return testResult.success ?
      <CheckCircle className="w-5 h-5 text-green-500" /> :
      <XCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = () => {
    if (loading) return 'bg-gray-50 border-gray-200'
    if (!testResult) return 'bg-yellow-50 border-yellow-200'
    return testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
  }

  return (
    <Layout
      title="Email Configuration Test"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Admin', href: '/admin' },
        { label: 'Email Test' }
      ]}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Email Configuration Test</h1>
              <p className="text-sm text-gray-600">Test and validate email service configuration</p>
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <div className={`rounded-lg border p-6 mb-6 ${getStatusColor()}`}>
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon()}
            <h2 className="text-lg font-semibold text-gray-900">Email Service Status</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={testEmailConfig}
              disabled={loading}
              className="ml-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Retest Configuration
            </Button>
          </div>

          {testResult && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">{testResult.message}</p>
              {testResult.success && (
                <div className="text-xs text-gray-600">
                  {testResult.message.includes('Development') ? (
                    <span>✓ Ready for development testing (emails logged to console)</span>
                  ) : (
                    <span>✓ Ready for production use (emails will be sent via SendGrid)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test Email Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Test Email</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email to test..."
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will send a welcome email template to test the email service
              </p>
            </div>

            <Button
              onClick={sendTestEmail}
              disabled={!testEmail || sendingTest || !testResult?.success}
              className="flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{sendingTest ? 'Sending...' : 'Send Test Email'}</span>
            </Button>
          </div>
        </div>

        {/* Configuration Guide */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Production Setup Guide</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEnvVars(!showEnvVars)}
              className="flex items-center space-x-2"
            >
              {showEnvVars ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showEnvVars ? 'Hide' : 'Show'} Environment Variables</span>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Current Mode:</strong> Development (emails logged to console)</p>
              <p>To enable real email sending in production:</p>

              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Sign up for a <strong>SendGrid account</strong> (free tier available)</li>
                <li>Create an API key in SendGrid dashboard</li>
                <li>Set the following environment variables:</li>
              </ol>
            </div>

            {showEnvVars && (
              <div className="space-y-4">
                {/* Gmail Setup (Recommended for Admin) */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔸 Option 1: Gmail (Easy Setup - Recommended)</h4>
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-2">
                    <p className="text-sm text-green-800 font-medium">✅ Perfect for admin use - Uses your existing Gmail account</p>
                  </div>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <div className="space-y-1">
                      <div><span className="text-blue-300">EMAIL_PROVIDER</span>=gmail</div>
                      <div><span className="text-blue-300">GMAIL_USER</span>=your.email@gmail.com</div>
                      <div><span className="text-blue-300">GMAIL_APP_PASSWORD</span>=your_app_password</div>
                      <div><span className="text-blue-300">EMAIL_FROM</span>=your.email@gmail.com</div>
                      <div><span className="text-blue-300">EMAIL_FROM_NAME</span>=Test Case Writer</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <strong>How to get Gmail App Password:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to your Google Account settings</li>
                      <li>Enable 2-Factor Authentication if not already enabled</li>
                      <li>Go to Security → App passwords</li>
                      <li>Generate a new app password for "Mail"</li>
                      <li>Use that 16-character password in GMAIL_APP_PASSWORD</li>
                    </ol>
                  </div>
                </div>

                {/* SendGrid Setup */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🔸 Option 2: SendGrid (Professional)</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <div className="space-y-1">
                      <div><span className="text-blue-300">EMAIL_PROVIDER</span>=sendgrid</div>
                      <div><span className="text-blue-300">SENDGRID_API_KEY</span>=your_sendgrid_api_key_here</div>
                      <div><span className="text-blue-300">EMAIL_FROM</span>=noreply@yourdomain.com</div>
                      <div><span className="text-blue-300">EMAIL_FROM_NAME</span>=Your App Name</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How to verify production setup:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Set up environment variables</li>
                    <li>Restart your application</li>
                    <li>Come back to this page and click "Retest Configuration"</li>
                    <li>If status shows "SendGrid configured successfully", send a test email</li>
                    <li>Check the recipient's email inbox</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}