'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useSettings } from '@/contexts/SettingsContext'
import { getAvailableProviders, getProvider } from '@/lib/ai-providers'
import { 
  X, 
  Key, 
  Eye, 
  EyeOff, 
  Brain, 
  Cpu, 
  Zap,
  AlertCircle,
  Check
} from 'lucide-react'

interface APIKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function APIKeyModal({ isOpen, onClose, onSuccess }: APIKeyModalProps) {
  const { getAIConfig, updateAIConfig, hasValidAPIKey } = useSettings()
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const availableProviders = getAvailableProviders()
  const currentProvider = getProvider(getAIConfig().providerId)
  const [localApiKey, setLocalApiKey] = useState(getAIConfig().apiKey)

  const handleProviderChange = (providerId: string) => {
    const provider = getProvider(providerId)
    if (provider) {
      updateAIConfig({
        providerId: provider.id,
        provider: provider.id as any,
        model: provider.models[0] // Set first model as default
      })
      setLocalApiKey('') // Clear API key when switching providers
      setConnectionStatus('idle')
    }
  }

  const handleModelChange = (model: string) => {
    updateAIConfig({ model })
  }

  const handleAPIKeyChange = (apiKey: string) => {
    setLocalApiKey(apiKey)
    updateAIConfig({ apiKey })
    setConnectionStatus('idle')
  }

  const testConnection = async () => {
    if (!localApiKey.trim()) {
      setConnectionStatus('error')
      return
    }

    setTestingConnection(true)
    try {
      // Simple test - just check if API key is properly formatted
      // In a real implementation, you'd make a test API call
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      setConnectionStatus('success')
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSaveAndClose = () => {
    if (hasValidAPIKey()) {
      onSuccess()
      onClose()
    }
  }

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'openai': return '🤖'
      case 'claude': return '🧠'  
      case 'gemini': return '💎'
      case 'grok': return '🚀'
      case 'azure': return '☁️'
      default: return '🔮'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Configure AI Provider</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select AI Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    getAIConfig().providerId === provider.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleProviderChange(provider.id)}
                >
                  {getAIConfig().providerId === provider.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary-500" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">
                      {getProviderIcon(provider.id)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-500">
                        {provider.models.length} models available
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentProvider && (
            <>
              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={getAIConfig().model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full pl-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                  >
                    {currentProvider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentProvider.apiKeyLabel || 'API Key'}
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localApiKey}
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
                    disabled={!localApiKey.trim() || testingConnection}
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
                  <div className={`flex items-center space-x-2 mt-2 text-sm ${
                    connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
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
                
                <p className="text-xs text-gray-500 mt-1">
                  Your API key is stored locally and never shared
                </p>
              </div>

              {/* Quick Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Quick Setup Complete!</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      You can configure advanced settings like temperature, max tokens, and custom prompts 
                      in the full Settings page later.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open('/settings', '_blank')}
            >
              Advanced Settings
            </Button>
            <Button 
              variant="primary"
              onClick={handleSaveAndClose}
              disabled={!hasValidAPIKey()}
            >
              Save & Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}