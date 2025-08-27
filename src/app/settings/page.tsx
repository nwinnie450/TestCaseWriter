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
  Brain
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ai') // Start with AI tab
  const [showApiKey, setShowApiKey] = useState(false)
  const { settings, updateSettings, updateAIConfig } = useSettings()

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
    { id: 'integrations', label: 'Integrations', icon: Database }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AIProviderSettings />

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
                      onChange={(e) => updateAIConfig({ maxTokens: parseInt(e.target.value) || 2000 })}
                      min="100"
                      max="8000"
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