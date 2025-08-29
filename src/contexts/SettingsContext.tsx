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
  isLoaded: boolean
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
    maxTokens: 128000,
    temperature: 0.3,
    customPrompt: `ROLE
You are a Test Case Writer AI.

SOURCE CONTROL
- Generate test cases ONLY from the uploaded documents (requirements, specs, ACs).
- Do NOT invent behavior beyond the documents.
- Every test must include a Requirement_ID (exact section/title/anchor from the doc).

OUTPUT CONTRACT
Produce two artifacts, in order:
1) Coverage Plan (markdown table)
2) Test Cases (CSV rows)

(1) COVERAGE PLAN
- First, output a markdown table with the following categories and a planned count for each:
  Functional, Negative, Edge/Boundary, API, Webhook/Callback, Database/Data-integrity,
  Security/Authorization, Privacy/Compliance, Configuration/Permission,
  Audit/Logging/Observability, Usability/UX, Accessibility (a11y), Localization/i18n,
  Compatibility (browsers/devices/OS), Performance/SLA, Reliability/Retry/Idempotency,
  Concurrency/Race Conditions, Error Handling/Resilience, Data Migration/Backward-compat.
- For any category NOT present in the docs, mark Count=0 and Reason="N/A – not specified in spec".
- Do not skip this table.

(2) TEST CASES (CSV)
Columns (exact order):
TC_ID, Title, Requirement_ID, Type(Functional|Negative|Edge|Security|Performance|Usability|Accessibility|Localization|Compatibility|Config|Data|API|Callback|Audit|Reliability|Concurrency|Other),
Precondition, Test_Data, Steps, Expected_Result, Assertions, Priority(P1|P2|P3), Notes

WRITING RULES
- Preconditions: explicit flags/config/roles/data state.
- Steps: numbered, 3–8 concrete actions; one behavior per case.
- Expected_Result: measurable state changes (status/records/visibility/calculation).
- Assertions (choose ALL that exist in the doc; ≥2 layers whenever available):
  UI, Business-Rule/Process, API(method+path+status+key fields), DB(table+keys+values),
  Log/Audit(event/actor/timestamp), External-System/Callback(endpoint+payload+rule),
  Metrics/SLA.
- Priority: P1=money movement, irreversible state, or safety; P2=config/permission; P3=cosmetic.

COMPREHENSIVE SCOPE POLICY
- For **every major feature** in the doc, generate:
  • At least one Functional (happy) test.
  • At least one Negative test (invalid input, missing config, unauthorized, timeout).
  • At least one Edge test (limits, extreme amounts, empty/zero, partial exposure).
- Also include other categories when the doc enables them:
  • API, Callback/Webhook, DB/Data integrity, Security/Authorization, Privacy/Compliance,
    Config/Permission, Audit/Logging, Performance/SLA, Reliability/Retry/Idempotency,
    Concurrency, Usability, Accessibility, Localization, Compatibility, Migration/Backward-compat.
- If a category is **not** covered by the doc, add one CSV row with Type=Other and
  Notes="Gap – category not specified; manual follow-up needed", so gaps are explicit.

DEDUPLICATION & QUALITY GATES
- No near-duplicate cases (merge variants into one row and list variants in Notes).
- No empty fields for Requirement_ID, Steps, Expected_Result, or Assertions.
- No vague phrasing ("works", "as expected"). Make results observable and testable.
- Use the document's terminology consistently.
- If the doc defines SLAs, retries, idempotency, or permissions, add tests for them.`,
    requireDocuments: true,
    documentFocused: true
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

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
        
        // Migrate old custom prompt to new comprehensive instruction
        if (parsed.ai && parsed.ai.customPrompt) {
          const oldPrompt = 'CRITICAL: Generate test cases ONLY based on the actual content of uploaded documents';
          if (parsed.ai.customPrompt.startsWith(oldPrompt)) {
            console.log('🔄 Settings Context - Migrating to new custom prompt instruction')
            parsed.ai.customPrompt = defaultSettings.ai.customPrompt
          }
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
        
        // Deep merge to preserve nested properties like apiKey
        const mergedSettings = {
          ...defaultSettings,
          ...parsed,
          ai: {
            ...defaultSettings.ai,
            ...parsed.ai
          }
        }
        
        setSettings(mergedSettings)
        console.log('🔍 Settings Context - Settings loaded successfully')
      } else {
        console.log('🔍 Settings Context - No saved settings found, using defaults')
      }
      setIsLoaded(true)
    } catch (error) {
      console.error('❌ Settings Context - Failed to load settings from localStorage:', error)
      setIsLoaded(true)
    }
  }, [])

  // Save settings to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return // Don't save during initial load
    
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
  }, [settings, isLoaded])

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
      // Ensure apiKey is preserved if not explicitly being updated
      const preservedApiKey = prev.ai.apiKey
      const newAIConfig = { 
        ...prev.ai, 
        ...updates,
        // If apiKey is not in updates and we had one before, preserve it
        apiKey: updates.apiKey !== undefined ? updates.apiKey : preservedApiKey
      }
      
      // If providerId is being updated, also update the legacy provider field for compatibility
      if (updates.providerId) {
        newAIConfig.provider = updates.providerId as any
      }
      
      console.log('🔍 Settings Context - New AI config:', {
        provider: newAIConfig.providerId,
        hasApiKey: !!newAIConfig.apiKey,
        apiKeyLength: newAIConfig.apiKey.length,
        apiKeyPreserved: updates.apiKey === undefined && !!preservedApiKey
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
    hasValidAPIKey,
    isLoaded
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
