'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AIConfig {
  providerId: string
  provider: 'openai' | 'claude' | 'local' | 'gemini' | 'azure' | 'grok'
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  customPrompt: string
  requireDocuments: boolean
  documentFocused: boolean
}

export interface Settings {
  profile: {
    name: string
    email: string
    title: string
    department: string
  }
  notifications: {
    emailNotifications: boolean
    pushNotifications: boolean
    testCaseUpdates: boolean
    exportComplete: boolean
    weeklyDigest: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    defaultTemplate: string
    pageSize: number
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    passwordLastChanged: Date
  }
  ai: AIConfig
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (category: keyof Settings, updates: Partial<Settings[keyof Settings]>) => void
  updateAIConfig: (updates: Partial<AIConfig>) => void
  getAIConfig: () => AIConfig
  hasValidAPIKey: () => boolean
}

const defaultSettings: Settings = {
  profile: {
    name: 'John Doe',
    email: 'john.doe@company.com',
    title: 'Senior QA Engineer',
    department: 'Quality Assurance'
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    testCaseUpdates: true,
    exportComplete: true,
    weeklyDigest: false
  },
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'UTC-08:00',
    defaultTemplate: 'template-1',
    pageSize: 25
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordLastChanged: new Date('2024-01-15')
  },
  ai: {
    providerId: 'openai',
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o',
    maxTokens: 2000,
    temperature: 0.3,
    customPrompt: 'CRITICAL: Generate test cases ONLY based on the actual content of uploaded documents. Do NOT create generic test cases. Analyze the specific requirements, user stories, and acceptance criteria in the documents. Each test case must be traceable to a specific requirement found in the uploaded documents. Include the document section or requirement reference in test case remarks.',
    requireDocuments: true,
    documentFocused: true
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      console.log('🔍 Settings Context - Loading settings from localStorage...')
      const savedSettings = localStorage.getItem('testCaseWriterSettings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        console.log('🔍 Settings Context - Loaded settings:', {
          hasAI: !!parsed.ai,
          aiProvider: parsed.ai?.providerId,
          hasApiKey: !!parsed.ai?.apiKey,
          apiKeyLength: parsed.ai?.apiKey?.length || 0
        })
        
        // Handle date conversion for security.passwordLastChanged
        if (parsed.security?.passwordLastChanged) {
          parsed.security.passwordLastChanged = new Date(parsed.security.passwordLastChanged)
        }
        
        // Ensure AI config has both providerId and provider fields for compatibility
        if (parsed.ai) {
          if (!parsed.ai.providerId && parsed.ai.provider) {
            parsed.ai.providerId = parsed.ai.provider
          }
          if (!parsed.ai.provider && parsed.ai.providerId) {
            parsed.ai.provider = parsed.ai.providerId
          }
        }
        
        setSettings({ ...defaultSettings, ...parsed })
        console.log('🔍 Settings Context - Settings loaded successfully')
      } else {
        console.log('🔍 Settings Context - No saved settings found, using defaults')
      }
    } catch (error) {
      console.error('❌ Settings Context - Failed to load settings from localStorage:', error)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      console.log('🔍 Settings Context - Saving settings to localStorage:', {
        aiProvider: settings.ai.providerId,
        hasApiKey: !!settings.ai.apiKey,
        apiKeyLength: settings.ai.apiKey.length
      })
      localStorage.setItem('testCaseWriterSettings', JSON.stringify(settings))
      console.log('✅ Settings Context - Settings saved successfully')
    } catch (error) {
      console.error('❌ Settings Context - Failed to save settings to localStorage:', error)
    }
  }, [settings])

  const updateSettings = (category: keyof Settings, updates: Partial<Settings[keyof Settings]>) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], ...updates }
    }))
  }

  const updateAIConfig = (updates: Partial<AIConfig>) => {
    console.log('🔍 Settings Context - Updating AI config:', {
      currentProvider: settings.ai.providerId,
      currentApiKey: settings.ai.apiKey ? `${settings.ai.apiKey.substring(0, 10)}...` : 'none',
      updates: {
        ...updates,
        apiKey: updates.apiKey ? `${updates.apiKey.substring(0, 10)}...` : 'unchanged'
      }
    })
    
    setSettings(prev => {
      const newAIConfig = { ...prev.ai, ...updates }
      
      // If providerId is being updated, also update the legacy provider field for compatibility
      if (updates.providerId) {
        newAIConfig.provider = updates.providerId as any
      }
      
      console.log('🔍 Settings Context - New AI config:', {
        provider: newAIConfig.providerId,
        hasApiKey: !!newAIConfig.apiKey,
        apiKeyLength: newAIConfig.apiKey.length
      })
      
      return {
        ...prev,
        ai: newAIConfig
      }
    })
  }

  const getAIConfig = (): AIConfig => {
    return settings.ai
  }

  const hasValidAPIKey = (): boolean => {
    return settings.ai.apiKey.trim().length > 0
  }

  const value: SettingsContextType = {
    settings,
    updateSettings,
    updateAIConfig,
    getAIConfig,
    hasValidAPIKey
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
