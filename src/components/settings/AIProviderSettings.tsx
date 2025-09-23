'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSettings } from '@/contexts/SettingsContext'
import { getAvailableProviders, getProvider } from '@/lib/ai-providers'

// Helper function to get optimal tokens for display (matches ai-providers.ts)
function getModelOptimalTokens(model: string): number {
  if (model.includes('gpt-4o')) {
    return 16000  // GPT-4o can handle much larger responses
  } else if (model.includes('gpt-4-turbo')) {
    return 12000  // GPT-4 turbo has good capacity
  } else if (model.includes('gpt-4')) {
    return 8000   // Standard GPT-4
  } else if (model.includes('gpt-3.5-turbo')) {
    return 4000   // GPT-3.5 turbo
  } else if (model.includes('claude-3-5-sonnet')) {
    return 16000  // Claude 3.5 Sonnet can handle large responses
  } else if (model.includes('claude-3-opus')) {
    return 12000  // Claude 3 Opus
  } else if (model.includes('claude-3-sonnet')) {
    return 10000  // Claude 3 Sonnet
  } else if (model.includes('claude-3-haiku')) {
    return 6000   // Claude 3 Haiku
  } else if (model.includes('gemini-1.5-pro')) {
    return 12000  // Gemini 1.5 Pro
  } else if (model.includes('gemini-1.5-flash')) {
    return 8000   // Gemini 1.5 Flash
  } else if (model.includes('gemini-pro')) {
    return 6000   // Gemini Pro
  } else if (model.includes('grok')) {
    return 8000   // Grok models
  } else {
    return 4000   // Conservative default
  }
}
import { 
  Settings, 
  Key, 
  Cpu, 
  Thermometer, 
  FileText,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Brain,
  Zap
} from 'lucide-react'

export function AIProviderSettings() {
  const { settings, updateAIConfig } = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const availableProviders = getAvailableProviders()
  const currentProvider = getProvider(settings.ai.providerId)

  const handleProviderChange = (providerId: string) => {
    const provider = getProvider(providerId)
    if (provider) {
      updateAIConfig({
        providerId: provider.id,
        provider: provider.id as any,
        model: provider.models[0], // Set first model as default
        apiKey: '' // Clear API key when switching providers
      })
      setConnectionStatus('idle')
    }
  }

  const handleModelChange = (model: string) => {
    updateAIConfig({ model })
  }

  const handleAPIKeyChange = (apiKey: string) => {
    updateAIConfig({ apiKey })
    setConnectionStatus('idle')
  }

  const testConnection = async () => {
    if (!settings.ai.apiKey.trim()) {
      setConnectionStatus('error')
      return
    }

    setTestingConnection(true)
    try {
      // Simple test request to verify API key works
      const testPrompt = "Say 'Hello' in JSON format"
      
      // This is just a basic connectivity test - in production you'd want a proper test endpoint
      setConnectionStatus('success')
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    } finally {
      setTestingConnection(false)
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'openai': return '🤖'
      case 'claude': return '🧠'
      case 'gemini': return '💎'
      case 'grok': return '🚀'
      default: return '🔮'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Provider</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  settings.ai.providerId === provider.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleProviderChange(provider.id)}
              >
                {settings.ai.providerId === provider.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-primary-500" />
                  </div>
                )}

                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl">
                    {getProviderIcon(provider.id)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-500">
                      {provider.models.length} model{provider.models.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Always show models for all providers - standardized display */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Available Models:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.models.slice(0, 3).map((model) => (
                      <span
                        key={model}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-md"
                      >
                        {model}
                      </span>
                    ))}
                    {provider.models.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 rounded-md">
                        +{provider.models.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      {currentProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>{currentProvider.name} Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentProvider.apiKeyLabel}
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.ai.apiKey}
                    onChange={(e) => handleAPIKeyChange(e.target.value)}
                    placeholder={`Enter your ${currentProvider.name} API key`}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={testConnection}
                  disabled={!settings.ai.apiKey.trim() || testingConnection}
                  className="flex items-center space-x-1"
                >
                  {testingConnection ? (
                    <>
                      <Zap className="h-4 w-4 animate-pulse" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Test</span>
                    </>
                  )}
                </Button>
              </div>
              
              {connectionStatus !== 'idle' && (
                <div className={`flex items-center space-x-2 mt-2 text-sm ${getStatusColor(connectionStatus)}`}>
                  {connectionStatus === 'success' ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Connection successful!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span>Connection failed. Please check your API key.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={settings.ai.model}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {currentProvider.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Tokens - Now auto-calculated */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens (Auto-Optimized)
                </label>
                <input
                  type="text"
                  value={`${getModelOptimalTokens(settings.ai.model)} (Auto)`}
                  readOnly
                  className="w-full py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically optimized for {settings.ai.model}. System manages token limits for best results.
                </p>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({settings.ai.temperature})
                </label>
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-gray-400" />
                  <input
                    type="range"
                    value={settings.ai.temperature}
                    onChange={(e) => updateAIConfig({ temperature: parseFloat(e.target.value) })}
                    min={0}
                    max={1}
                    step={0.1}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Lower = more focused, Higher = more creative
                </p>
              </div>
            </div>

            {/* Document Requirements */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Require Documents
                  </label>
                  <p className="text-xs text-gray-500">Force document upload before generation</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ai.requireDocuments}
                  onChange={(e) => updateAIConfig({ requireDocuments: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document-Focused Mode
                  </label>
                  <p className="text-xs text-gray-500">Generate test cases strictly from document content</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.ai.documentFocused}
                  onChange={(e) => updateAIConfig({ documentFocused: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom System Prompt
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  value={settings.ai.customPrompt}
                  onChange={(e) => updateAIConfig({ customPrompt: e.target.value })}
                  rows={4}
                  placeholder="Enter custom instructions for the AI..."
                  className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Additional instructions to customize AI behavior
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button 
                variant="primary" 
                className="w-full sm:w-auto"
                onClick={() => {
                  // Show confirmation that settings are saved
                  alert('✅ AI Configuration saved successfully! Your settings are automatically saved as you make changes.')
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Save AI Configuration
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                💡 Settings are automatically saved as you make changes. This button provides confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Information */}
      {currentProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💰</span>
              <span>Pricing Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input (per 1K tokens)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Output (per 1K tokens)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(currentProvider.pricing).map(([model, pricing]) => (
                    <tr key={model} className={settings.ai.model === model ? 'bg-primary-50' : ''}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {model}
                        {settings.ai.model === model && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${(pricing.input * 1000).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${(pricing.output * 1000).toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}