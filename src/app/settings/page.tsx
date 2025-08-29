'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useSettings } from '@/contexts/SettingsContext'
import { AIProviderSettings } from '@/components/settings/AIProviderSettings'
import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Globe,
  Save,
  Key,
  Mail,
  Smartphone,
  Check,
  Bot,
  Eye,
  EyeOff,
  Plus,
  Brain,
  HelpCircle,
  Info
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ai') // Start with AI tab
  const [showApiKey, setShowApiKey] = useState(false)
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    accessLevel: 'widget',
    rateLimit: '100',
    expiration: '90',
    ipRestrictions: ''
  })
  const [widgetKeys, setWidgetKeys] = useState([
    {
      id: 'chatgpt-key',
      name: 'ChatGPT Plugin Key',
      key: 'tcw_widget_sk-chatgpt_7a8b9c2d3e4f5g6h1i2j3k4l5m6n7o8p9q0r',
      created: '3 days ago',
      lastUsed: '2 hours ago',
      status: 'active',
      accessLevel: 'Widget Only',
      rateLimit: '500 req/hour',
      expiration: '1 year',
      ipRestrictions: 'None',
      requestCount: 1247,
      lastRequest: '2 hours ago'
    },
    {
      id: 'claude-key', 
      name: 'Claude Integration Key',
      key: 'tcw_widget_sk-claude_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2',
      created: '1 week ago', 
      lastUsed: 'Never',
      status: 'inactive',
      accessLevel: 'Read Only',
      rateLimit: '100 req/hour',
      expiration: '90 days',
      ipRestrictions: 'None',
      requestCount: 0,
      lastRequest: 'Never'
    }
  ])
  const { settings, updateSettings, updateAIConfig } = useSettings()

  const generateWidgetKey = (keyName: string) => {
    const newKey = `tcw_widget_sk-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    
    // Map form values to display values
    const accessLevelMap = {
      'widget': 'Widget Only',
      'readonly': 'Read Only', 
      'full': 'Full Access'
    }
    
    const rateLimitMap = {
      '100': '100 req/hour',
      '500': '500 req/hour',
      '1000': '1000 req/hour',
      'unlimited': 'Unlimited'
    }
    
    const expirationMap = {
      '30': '30 days',
      '90': '90 days', 
      '365': '1 year',
      'never': 'Never expires'
    }
    
    const newWidgetKey = {
      id: `key-${Date.now()}`,
      name: keyName || 'New Widget Key',
      key: newKey,
      created: 'Just now',
      lastUsed: 'Never',
      status: 'active',
      accessLevel: accessLevelMap[newKeyForm.accessLevel as keyof typeof accessLevelMap] || 'Widget Only',
      rateLimit: rateLimitMap[newKeyForm.rateLimit as keyof typeof rateLimitMap] || '100 req/hour',
      expiration: expirationMap[newKeyForm.expiration as keyof typeof expirationMap] || '90 days',
      ipRestrictions: newKeyForm.ipRestrictions || 'None',
      requestCount: 0,
      lastRequest: 'Never'
    }
    
    setWidgetKeys([...widgetKeys, newWidgetKey])
    
    // Reset form
    setNewKeyForm({
      name: '',
      accessLevel: 'widget',
      rateLimit: '100',
      expiration: '90',
      ipRestrictions: ''
    })
    
    // Show the full key once in an alert
    alert(`New Widget API Key Generated:\n\n${newKey}\n\n⚠️ Copy this key now! It will be masked in the list for security.`)
    
    return newKey
  }

  const revokeWidgetKey = (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      setWidgetKeys(widgetKeys.filter(key => key.id !== keyId))
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    const prefix = key.substring(0, 20) // Show first 20 characters
    const masked = '•'.repeat(32) // Mask the rest
    return prefix + masked
  }

  const handleSave = (category: keyof typeof settings) => {
    console.log(`Saving ${category} settings:`, settings[category])
    
    // Special handling for AI settings
    if (category === 'ai') {
      console.log('AI Settings before save:', settings.ai)
      console.log('API Key length:', settings.ai.apiKey.length)
      console.log('API Key preview:', settings.ai.apiKey.substring(0, 10))
      
      // The settings are already saved in real-time via updateAIConfig
      // This is just for user feedback
      alert('AI Configuration saved successfully! Your API key is now configured.')
    } else {
      alert(`${category} settings saved successfully!`)
    }
  }

  const breadcrumbs = [
    { label: 'Settings' }
  ]

  const tabs = [
    { id: 'ai', label: 'AI Providers', icon: Brain },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'integrations', label: 'Integrations', icon: Database }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AIProviderSettings />

      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                    <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <Input placeholder="Enter first name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <Input placeholder="Enter last name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea 
                        className="input min-h-[80px] w-full" 
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                    <Input placeholder="QA Engineer, Test Manager, etc." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <Input placeholder="Company name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <Input placeholder="+1 (555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select className="input w-full">
                      <option>UTC-8 (Pacific Time)</option>
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC+0 (GMT)</option>
                      <option>UTC+1 (Central European Time)</option>
                      <option>UTC+8 (Singapore Time)</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={() => handleSave('profile')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Email Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Test Generation Complete</p>
                      <p className="text-sm text-gray-500">When AI finishes generating test cases</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Export Complete</p>
                      <p className="text-sm text-gray-500">When test case export is ready for download</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">API Errors</p>
                      <p className="text-sm text-gray-500">When API requests fail or quota is exceeded</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Summary</p>
                      <p className="text-sm text-gray-500">Weekly report of test generation activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={() => handleSave('notifications')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Browser Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Enable Browser Notifications</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Get real-time notifications in your browser for important events.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Browser Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Appearance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="theme" value="light" defaultChecked className="text-blue-600" />
                      <div>
                        <p className="font-medium">Light</p>
                        <p className="text-sm text-gray-500">Clean and bright</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="theme" value="dark" className="text-blue-600" />
                      <div>
                        <p className="font-medium">Dark</p>
                        <p className="text-sm text-gray-500">Easy on the eyes</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="theme" value="auto" className="text-blue-600" />
                      <div>
                        <p className="font-medium">Auto</p>
                        <p className="text-sm text-gray-500">Follow system</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Position</label>
                  <select className="input w-full md:w-48">
                    <option>Left</option>
                    <option>Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Table Density</label>
                  <select className="input w-full md:w-48">
                    <option>Comfortable</option>
                    <option>Compact</option>
                    <option>Spacious</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Localization</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select className="input w-full">
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Japanese</option>
                      <option>Chinese (Simplified)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                    <select className="input w-full">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                      <option>DD MMM YYYY</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                    <select className="input w-full">
                      <option>12 Hour (AM/PM)</option>
                      <option>24 Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number Format</label>
                    <select className="input w-full">
                      <option>1,234.56 (US)</option>
                      <option>1.234,56 (EU)</option>
                      <option>1 234,56 (FR)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Default Export Format</label>
                    <select className="input w-full">
                      <option>CSV</option>
                      <option>Excel</option>
                      <option>JSON</option>
                      <option>PDF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rows Per Page</label>
                    <select className="input w-full">
                      <option>10</option>
                      <option>25</option>
                      <option>50</option>
                      <option>100</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto-save Frequency</label>
                  <select className="input w-full md:w-48">
                    <option>Every 30 seconds</option>
                    <option>Every minute</option>
                    <option>Every 5 minutes</option>
                    <option>Manual only</option>
                  </select>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={() => handleSave('preferences')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Password & Authentication</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button>
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-900">Current Session</p>
                      <p className="text-sm text-green-700">Chrome on Windows • Active now</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Mobile Session</p>
                      <p className="text-sm text-gray-500">Safari on iPhone • 2 hours ago</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      Revoke
                    </Button>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button variant="secondary" className="text-red-600 hover:text-red-700">
                    Logout All Other Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'api':
        return (
          <div className="space-y-6">
            {/* API Types Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>API Types Comparison</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <Key className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">External API Access</h4>
                    </div>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p><strong>👤 Who:</strong> Your apps & services</p>
                      <p><strong>🎯 Purpose:</strong> Full system control</p>
                      <p><strong>🔓 Access:</strong> Everything (CRUD, admin, users)</p>
                      <p><strong>💡 Example:</strong> Your mobile app needs to sync data</p>
                    </div>
                  </div>
                  
                  <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <Bot className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Widget Integration</h4>
                    </div>
                    <div className="space-y-2 text-sm text-purple-700">
                      <p><strong>👥 Who:</strong> Other AI platforms</p>
                      <p><strong>🎯 Purpose:</strong> Embed your service</p>
                      <p><strong>🔒 Access:</strong> Limited (generate, export only)</p>
                      <p><strong>💡 Example:</strong> ChatGPT plugin for test generation</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Quick Rule:</strong> If it's YOUR app/service → use External API. If it's SOMEONE ELSE'S platform embedding your features → use Widget API.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External API Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>External API Access</span>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                      <div className="font-semibold mb-2">🔧 External API Access</div>
                      <div className="space-y-2">
                        <p><strong>For:</strong> Your own applications and services</p>
                        <p><strong>Examples:</strong> Mobile apps, web dashboards, CI/CD pipelines, backend services</p>
                        <p><strong>Access:</strong> Full CRUD operations, project management, user management</p>
                        <p><strong>Endpoints:</strong> /test-cases, /projects, /users, /admin</p>
                        <p><strong>Think of it as:</strong> Your personal master key to control everything</p>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">API Keys for Your Applications & Services</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Generate API keys for your own mobile apps, web applications, CI/CD pipelines, and backend services that need full access to your Test Case Manager system.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Use cases:</strong> Mobile app login, automated testing pipelines, data synchronization, admin dashboards
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-900">Production API Key</p>
                      <p className="text-sm text-green-700">Full access • Created 2 days ago • Last used: 1 hour ago</p>
                      <p className="text-xs text-green-600 font-mono">tcw_prod_abc123...def789</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Revoke
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-yellow-900">Development API Key</p>
                      <p className="text-sm text-yellow-700">Limited access • Created 1 week ago • Last used: Never</p>
                      <p className="text-xs text-yellow-600 font-mono">tcw_dev_xyz789...abc123</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Create New API Key</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                      <Input placeholder="e.g., CI/CD Pipeline, Mobile App" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                      <select className="input w-full">
                        <option>Full Access - Read & Write all resources</option>
                        <option>Read Only - View test cases and projects</option>
                        <option>Limited - Specific endpoints only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiration</label>
                      <select className="input w-full">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>1 year</option>
                        <option>Never expires</option>
                      </select>
                    </div>
                    <Button variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget & Plugin Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Widget & Plugin Integration</span>
                  <div className="group relative">
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    <div className="invisible group-hover:visible absolute left-0 top-6 z-10 w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                      <div className="font-semibold mb-2">🧩 Widget & Plugin Integration</div>
                      <div className="space-y-2">
                        <p><strong>For:</strong> Other AI platforms that want to embed your service</p>
                        <p><strong>Examples:</strong> ChatGPT plugins, Claude tools, Notion widgets, custom AI assistants</p>
                        <p><strong>Access:</strong> Limited to test case generation & export only</p>
                        <p><strong>Endpoints:</strong> /widget/generate, /widget/export, /widget/status</p>
                        <p><strong>Think of it as:</strong> YouTube embed code - others can use your service on their platform</p>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Bot className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                                      <h4 className="font-medium text-purple-900">Embed Test Case Manager in Other AI Platforms</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Allow ChatGPT, Claude, Notion, and other AI platforms to integrate Test Case Manager as a plugin or widget. Users can generate test cases without leaving their preferred platform.
                      </p>
                      <div className="mt-2 text-xs text-purple-600">
                        <strong>Use cases:</strong> "Generate test cases" ChatGPT plugin, Claude tool integration, Notion page widgets, custom AI assistants
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Generated Widget API Keys</h4>
                    <div className="space-y-3">
                      {widgetKeys.map((widgetKey, index) => {
                        const bgColor = widgetKey.status === 'active' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        const textColor = widgetKey.status === 'active' ? 'text-green-900' : 'text-gray-900'
                        const subtextColor = widgetKey.status === 'active' ? 'text-green-700' : 'text-gray-600'
                        const keyBgColor = widgetKey.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                        const keyTextColor = widgetKey.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        
                        return (
                          <div key={widgetKey.id} className={`rounded-lg border ${bgColor} overflow-hidden`}>
                            {/* Header */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className={`font-medium ${textColor}`}>{widgetKey.name}</p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    widgetKey.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {widgetKey.status}
                                  </span>
                                </div>
                                <p className={`text-sm ${subtextColor}`}>Created {widgetKey.created} • Last used: {widgetKey.lastUsed}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <code className={`text-xs font-mono ${keyTextColor} ${keyBgColor} px-2 py-1 rounded`}>
                                    {showApiKey ? widgetKey.key : maskApiKey(widgetKey.key)}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className={`${keyTextColor} hover:opacity-70`}
                                  >
                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(widgetKey.key)
                                    alert('API key copied to clipboard!')
                                  }}
                                >
                                  Copy
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => revokeWidgetKey(widgetKey.id)}
                                >
                                  Revoke
                                </Button>
                              </div>
                            </div>
                            
                            {/* Details */}
                            <div className="px-3 pb-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                  <span className="font-medium text-gray-500">Access Level:</span>
                                  <p className={subtextColor}>{widgetKey.accessLevel}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Rate Limit:</span>
                                  <p className={subtextColor}>{widgetKey.rateLimit}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Expires:</span>
                                  <p className={subtextColor}>{widgetKey.expiration}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-500">Requests:</span>
                                  <p className={subtextColor}>{(widgetKey.requestCount || 0).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                      {widgetKeys.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Key className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p>No widget API keys generated yet.</p>
                          <p className="text-sm">Generate your first key to start integrating with other platforms.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Generate New Widget API Key</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Key Name/Purpose</label>
                        <Input 
                          placeholder="e.g., Notion Widget, Custom AI Platform" 
                          value={newKeyForm.name}
                          onChange={(e) => setNewKeyForm({...newKeyForm, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                          <select 
                            className="input w-full"
                            value={newKeyForm.accessLevel}
                            onChange={(e) => setNewKeyForm({...newKeyForm, accessLevel: e.target.value})}
                          >
                            <option value="widget">Widget Only - Generate & Export test cases</option>
                            <option value="readonly">Read Only - View existing test cases</option>
                            <option value="full">Full Access - Create, read, update test cases</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit</label>
                          <select 
                            className="input w-full"
                            value={newKeyForm.rateLimit}
                            onChange={(e) => setNewKeyForm({...newKeyForm, rateLimit: e.target.value})}
                          >
                            <option value="100">100 requests/hour</option>
                            <option value="500">500 requests/hour</option>
                            <option value="1000">1000 requests/hour</option>
                            <option value="unlimited">Unlimited</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Expiration</label>
                          <select 
                            className="input w-full"
                            value={newKeyForm.expiration}
                            onChange={(e) => setNewKeyForm({...newKeyForm, expiration: e.target.value})}
                          >
                            <option value="30">30 days</option>
                            <option value="90">90 days</option>
                            <option value="365">1 year</option>
                            <option value="never">Never expires</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">IP Restrictions</label>
                          <Input 
                            placeholder="Optional: 192.168.1.0/24" 
                            value={newKeyForm.ipRestrictions}
                            onChange={(e) => setNewKeyForm({...newKeyForm, ipRestrictions: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t flex space-x-3">
                  <Button 
                    variant="primary"
                    onClick={() => generateWidgetKey(newKeyForm.name)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Generate Widget Key
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      window.open('/docs/widget-api', '_blank')
                    }}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Widget Documentation
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">API Usage Statistics (Last 30 Days)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">2,847</p>
                      <p className="text-xs text-green-600">↗ +12% from last month</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Test Cases Generated</p>
                      <p className="text-2xl font-bold text-gray-900">1,523</p>
                      <p className="text-xs text-green-600">↗ +18% from last month</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Active Integrations</p>
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-xs text-gray-500">ChatGPT, Claude, Notion</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Error Rate</p>
                      <p className="text-2xl font-bold text-gray-900">0.2%</p>
                      <p className="text-xs text-green-600">↘ -0.3% from last month</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Documentation & Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>API Documentation & Usage</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Base URL</h4>
                    <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm">
                                              https://api.testcasemanager.com/v1
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Authentication</h4>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-700 mb-2">Include your API key in the Authorization header:</p>
                      <code className="text-sm font-mono text-gray-800">
                        Authorization: Bearer tcw_your_api_key_here
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Available Endpoints</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">GET /projects</span>
                        <span className="text-gray-600">List all projects</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">GET /test-cases</span>
                        <span className="text-gray-600">List test cases</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">POST /test-cases</span>
                        <span className="text-gray-600">Create new test case</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">POST /generate</span>
                        <span className="text-gray-600">Generate test cases from documents</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-mono">GET /export/:format</span>
                        <span className="text-gray-600">Export test cases</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        window.open('/docs/api', '_blank')
                      }}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      View Full API Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'integrations':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Issue Tracking Systems</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* JIRA Integration */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">J</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">JIRA</h4>
                          <p className="text-sm text-gray-500">Connect to Atlassian JIRA</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="JIRA URL (https://company.atlassian.net)" />
                      <Input placeholder="API Token" type="password" />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Communication Platforms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Slack Integration */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Slack</h4>
                          <p className="text-sm text-gray-500">Send notifications to Slack channels</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <Input placeholder="Slack Webhook URL" type="password" />
                      <Input placeholder="Default Channel (e.g., #qa-team)" />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

          </div>
        )

      case 'ai_old':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Provider Configuration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Provider
                  </label>
                  <select
                    value={settings.ai.provider}
                    onChange={(e) => updateAIConfig({ provider: e.target.value as 'openai' | 'claude' | 'local' })}
                    className="input w-full"
                  >
                    <option value="openai">OpenAI (GPT-4)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="local">Local Model (Ollama)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={settings.ai.apiKey}
                      onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
                      placeholder="Enter your API key"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is stored locally and never shared
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={settings.ai.model}
                    onChange={(e) => updateAIConfig({ model: e.target.value })}
                    className="input w-full"
                  >
                    <option value="gpt-4o">GPT-4o (Recommended)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Tokens
                    </label>
                    <Input
                      type="number"
                      value={settings.ai.maxTokens}
                      onChange={(e) => updateAIConfig({ maxTokens: parseInt(e.target.value) || 128000 })}
                      min="100"
                      max="1000000"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperature
                    </label>
                    <Input
                      type="number"
                      value={settings.ai.temperature}
                      onChange={(e) => updateAIConfig({ temperature: parseFloat(e.target.value) || 0.3 })}
                      min="0"
                      max="2"
                      step="0.1"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower = more focused, Higher = more creative
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Prompt
                  </label>
                  <textarea
                    value={settings.ai.customPrompt}
                    onChange={(e) => updateAIConfig({ customPrompt: e.target.value })}
                    className="input min-h-[100px] w-full"
                    placeholder="Custom instructions for AI test case generation..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This prompt will be used to guide AI generation of test cases
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-900">Document-Based Generation Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                      <div>
                        <p className="font-medium text-blue-900">Require Uploaded Documents</p>
                        <p className="text-sm text-blue-700">Only generate test cases when documents are uploaded</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ai.requireDocuments}
                          onChange={(e) => updateAIConfig({ requireDocuments: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                      <div>
                        <p className="font-medium text-green-900">Document-Focused Generation</p>
                        <p className="text-sm text-green-700">AI will strictly follow uploaded document content</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.ai.documentFocused}
                          onChange={(e) => updateAIConfig({ documentFocused: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>



                <div className="pt-4 border-t">
                  <Button onClick={() => handleSave('ai')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save AI Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Case Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">AI-Powered Test Generation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Configure your AI settings to generate intelligent, context-aware test cases from your requirements documents.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Document Analysis</p>
                      <p className="text-sm text-gray-500">AI reads and understands your uploaded documents</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      Enabled
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Requirement Extraction</p>
                      <p className="text-sm text-gray-500">Identifies user stories and acceptance criteria</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      Enabled
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Test Case Generation</p>
                      <p className="text-sm text-gray-500">Creates comprehensive test scenarios</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      Enabled
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Configuration</h3>
            <p className="text-gray-600">Please select the AI Configuration tab to configure your OpenAI API key.</p>
          </div>
        )
    }
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Settings"
    >
      <div className="space-y-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  )
}