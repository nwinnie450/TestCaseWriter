'use client'

// Updated Gmail-focused email configuration
import React, { useState, useEffect } from 'react'
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
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react'

export default function EmailConfigPage() {
  const currentUser = AuthService.getCurrentUser()
  const hasEmailAccess = !!currentUser && ['admin', 'super-admin'].includes(currentUser.role)

  const [config, setConfig] = useState({
    provider: 'gmail' as 'gmail' | 'sendgrid' | 'development',
    gmailUser: '',
    gmailPassword: '',
    fromEmail: '',
    fromName: 'Test Case Writer'
  })

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Load current configuration
  useEffect(() => {
    if (hasEmailAccess) {
      const emailService = EmailService.getInstance()
      const currentConfig = emailService.getConfig()

      setConfig({
        provider: currentConfig.provider || 'gmail',
        gmailUser: currentConfig.gmailUser || '',
        gmailPassword: currentConfig.gmailPassword || '',
        fromEmail: currentConfig.fromEmail || '',
        fromName: currentConfig.fromName || 'Test Case Writer'
      })

      // Auto-sync fromEmail with gmailUser for Gmail
      if (currentConfig.provider === 'gmail' && currentConfig.gmailUser && !currentConfig.fromEmail) {
        setConfig(prev => ({ ...prev, fromEmail: currentConfig.gmailUser! }))
      }
    }
  }, [hasEmailAccess])

  // Auto-sync fromEmail with gmailUser when gmailUser changes
  useEffect(() => {
    if (config.provider === 'gmail' && config.gmailUser && !config.fromEmail) {
      setConfig(prev => ({ ...prev, fromEmail: config.gmailUser }))
    }
  }, [config.gmailUser, config.provider, config.fromEmail])

  const testConfiguration = async () => {
    if (!hasEmailAccess) return

    setLoading(true)
    try {
      // Apply current config temporarily for testing
      const emailService = EmailService.getInstance()
      emailService.applyConfig(config)

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
  }

  const saveConfiguration = async () => {
    if (!hasEmailAccess) return

    setSaving(true)
    try {
      const emailService = EmailService.getInstance()
      emailService.applyConfig(config, { persist: true })

      setConfigSaved(true)
      setTimeout(() => setConfigSaved(false), 3000)

      // Test the configuration after saving
      await testConfiguration()
    } catch (error) {
      console.error('Failed to save email configuration:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setSaving(false)
    }
  }


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
      title="Email Configuration"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Users', href: '/users' },
        { label: 'Email Config' }
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
              <h1 className="text-xl font-semibold text-gray-900">Email Configuration</h1>
              <p className="text-sm text-gray-600">Setup Gmail for sending emails</p>
            </div>
          </div>
        </div>

        {/* Gmail Configuration Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gmail Setup</h2>
            {configSaved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Configuration saved!</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Gmail User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gmail Address
              </label>
              <Input
                type="email"
                value={config.gmailUser}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  gmailUser: e.target.value,
                  fromEmail: e.target.value // Auto-sync
                }))}
                placeholder="your.email@gmail.com"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Gmail address that will send emails
              </p>
            </div>

            {/* Gmail App Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gmail App Password
              </label>
              <div className="flex items-center space-x-2 max-w-md">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={config.gmailPassword}
                  onChange={(e) => setConfig(prev => ({ ...prev, gmailPassword: e.target.value }))}
                  placeholder="Enter 16-character app password"
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Generate this in your Google Account → Security → App passwords
              </p>
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <Input
                type="text"
                value={config.fromName}
                onChange={(e) => setConfig(prev => ({ ...prev, fromName: e.target.value }))}
                placeholder="Test Case Writer"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                The name that appears as the sender
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-4">
              <Button
                onClick={saveConfiguration}
                disabled={!config.gmailUser || !config.gmailPassword || saving}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={testConfiguration}
                disabled={!config.gmailUser || !config.gmailPassword || loading}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Testing...' : 'Test Gmail Config'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <div className={`rounded-lg border p-6 mb-6 ${getStatusColor()}`}>
          <div className="flex items-center space-x-3 mb-4">
            {getStatusIcon()}
            <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
          </div>

          {testResult && (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">{testResult.message}</p>
              {testResult.success && (
                <div className="text-xs text-green-600">
                  ✓ Gmail configuration is valid and ready to send emails
                </div>
              )}
            </div>
          )}
        </div>


        {/* Setup Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-3">🔧 How to Setup Gmail App Password:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Go to your <strong>Google Account settings</strong></li>
            <li>Navigate to <strong>Security → 2-Step Verification</strong> (must be enabled)</li>
            <li>Go to <strong>Security → App passwords</strong></li>
            <li>Select <strong>Mail</strong> as the app type</li>
            <li>Copy the <strong>16-character password</strong> and paste it above</li>
            <li>Click <strong>Save Configuration</strong> and test the connection</li>
          </ol>

          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Gmail App Passwords are more secure than using your regular password and allow the application to send emails through your Gmail account. Once configured, the system will be able to send welcome emails to new users and other notifications.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}