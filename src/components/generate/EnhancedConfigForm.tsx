'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Settings,
  Monitor,
  Smartphone,
  Globe,
  Code,
  Shield,
  CreditCard,
  Users,
  Search,
  FileText,
  Database,
  Zap,
  AlertTriangle,
  Info,
  Star,
  TrendingUp
} from 'lucide-react'

export interface TestCaseContext {
  applicationType: 'web' | 'mobile' | 'desktop' | 'api' | 'mixed'
  featureCategory: 'smartcontract' | 'gamelogic' | 'aimodel' | 'nft' | 'wallet' | 'authentication' | 'payment' | 'ui' | 'search' | 'crud' | 'integration' | 'security' | 'performance' | 'other'
  userRole: 'player' | 'trader' | 'developer' | 'admin' | 'customer' | 'guest' | 'mixed'
  testPriority: 'critical' | 'high' | 'medium' | 'low'
  businessDomain: 'blockchain' | 'gaming' | 'ai' | 'ecommerce' | 'fintech' | 'healthcare' | 'education' | 'saas' | 'media' | 'other'
  testEnvironment: 'production' | 'staging' | 'dev' | 'mixed'
}

interface EnhancedConfigFormProps {
  context: TestCaseContext
  onContextChange: (context: TestCaseContext) => void
  generationConfig: any
  onConfigChange: (config: any) => void
}

export function EnhancedConfigForm({
  context,
  onContextChange,
  generationConfig,
  onConfigChange
}: EnhancedConfigFormProps) {
  const handleContextChange = (key: keyof TestCaseContext, value: string) => {
    onContextChange({
      ...context,
      [key]: value
    })
  }

  const applicationTypes = [
    { value: 'web', label: 'Web Application', icon: Globe, description: 'Browser-based applications' },
    { value: 'mobile', label: 'Mobile App', icon: Smartphone, description: 'iOS/Android applications' },
    { value: 'desktop', label: 'Desktop App', icon: Monitor, description: 'Desktop applications' },
    { value: 'api', label: 'API/Service', icon: Code, description: 'REST APIs and web services' },
    { value: 'mixed', label: 'Mixed Platform', icon: Zap, description: 'Multiple platforms' }
  ]

  const featureCategories = [
    { value: 'smartcontract', label: 'Smart Contract', icon: Shield, description: 'Contract logic, token operations, DeFi' },
    { value: 'gamelogic', label: 'Game Mechanics', icon: Zap, description: 'Gameplay, rewards, progression' },
    { value: 'aimodel', label: 'AI/ML Models', icon: TrendingUp, description: 'Model inference, training, validation' },
    { value: 'nft', label: 'NFT & Digital Assets', icon: Star, description: 'Minting, trading, ownership' },
    { value: 'wallet', label: 'Wallet Integration', icon: CreditCard, description: 'Connection, transactions, signing' },
    { value: 'authentication', label: 'Authentication', icon: Shield, description: 'Login, registration, security' },
    { value: 'payment', label: 'Payment Processing', icon: CreditCard, description: 'Transactions, billing, checkout' },
    { value: 'ui', label: 'User Interface', icon: Monitor, description: 'Forms, navigation, display' },
    { value: 'search', label: 'Search & Filter', icon: Search, description: 'Search functionality, filtering' },
    { value: 'crud', label: 'Data Operations', icon: Database, description: 'Create, read, update, delete' },
    { value: 'integration', label: 'Integration', icon: Zap, description: 'Third-party integrations, APIs' },
    { value: 'security', label: 'Security', icon: Shield, description: 'Access control, data protection' },
    { value: 'performance', label: 'Performance', icon: TrendingUp, description: 'Speed, scalability, optimization' },
    { value: 'other', label: 'Other', icon: FileText, description: 'Other functionality' }
  ]

  const userRoles = [
    { value: 'player', label: 'Player/Gamer', icon: Users, description: 'Game players, users interacting with game mechanics' },
    { value: 'trader', label: 'Trader/Investor', icon: CreditCard, description: 'NFT traders, DeFi users, token holders' },
    { value: 'developer', label: 'Developer/API', icon: Code, description: 'Smart contract developers, game developers' },
    { value: 'admin', label: 'Administrator', icon: Settings, description: 'System administrators, super users' },
    { value: 'customer', label: 'Customer/User', icon: Users, description: 'End users, customers' },
    { value: 'guest', label: 'Guest/Anonymous', icon: Globe, description: 'Unauthenticated users' },
    { value: 'mixed', label: 'Multiple Roles', icon: Users, description: 'Testing across different roles' }
  ]

  const priorities = [
    { value: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
    { value: 'high', label: 'High', icon: Star, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { value: 'medium', label: 'Medium', icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 'low', label: 'Low', icon: FileText, color: 'text-gray-600 bg-gray-50 border-gray-200' }
  ]

  const businessDomains = [
    { value: 'blockchain', label: 'Blockchain & Web3' },
    { value: 'gaming', label: 'Gaming & GameFi' },
    { value: 'ai', label: 'AI & Machine Learning' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'fintech', label: 'Financial Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'other', label: 'Other' }
  ]

  const testEnvironments = [
    { value: 'production', label: 'Production-like' },
    { value: 'staging', label: 'Staging Environment' },
    { value: 'dev', label: 'Development Environment' },
    { value: 'mixed', label: 'Multiple Environments' }
  ]

  return (
    <div className="space-y-6">
      {/* Test Context Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Test Context Configuration</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Provide context about your application to generate more accurate and relevant test cases
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Application Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Application Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {applicationTypes.map((type) => {
                const Icon = type.icon
                const isSelected = context.applicationType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => handleContextChange('applicationType', type.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all hover:border-blue-300 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feature Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Feature Category
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {featureCategories.map((category) => {
                const Icon = category.icon
                const isSelected = context.featureCategory === category.value
                return (
                  <button
                    key={category.value}
                    onClick={() => handleContextChange('featureCategory', category.value)}
                    className={`p-3 border-2 rounded-lg text-left transition-all hover:border-green-300 ${
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                      <div>
                        <p className="font-medium">{category.label}</p>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Compact Row for User Role, Priority, Domain, Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary User Role
              </label>
              <select
                value={context.userRole}
                onChange={(e) => handleContextChange('userRole', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {userRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Priority Level
              </label>
              <div className="flex space-x-2">
                {priorities.map((priority) => {
                  const Icon = priority.icon
                  const isSelected = context.testPriority === priority.value
                  return (
                    <button
                      key={priority.value}
                      onClick={() => handleContextChange('testPriority', priority.value)}
                      className={`flex-1 p-2 border-2 rounded-lg text-center transition-all ${
                        isSelected
                          ? priority.color
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-sm font-medium">{priority.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Business Domain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Domain
              </label>
              <select
                value={context.businessDomain}
                onChange={(e) => handleContextChange('businessDomain', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {businessDomains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Environment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Environment
              </label>
              <select
                value={context.testEnvironment}
                onChange={(e) => handleContextChange('testEnvironment', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {testEnvironments.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coverage Level
              </label>
              <select
                value={generationConfig.coverage}
                onChange={(e) => onConfigChange({
                  ...generationConfig,
                  coverage: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="minimal">Minimal - Essential scenarios (3-5 tests)</option>
                <option value="focused">Focused - Key scenarios + edge cases (5-15 tests)</option>
                <option value="comprehensive">Comprehensive - Full coverage (10-25 tests)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Test Cases (Initial Batch)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Start with smaller batches to avoid token limits. Use "Generate More" after first generation for additional test cases.
              </p>
              <select
                value={generationConfig.maxTestCases}
                onChange={(e) => onConfigChange({
                  ...generationConfig,
                  maxTestCases: parseInt(e.target.value)
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5">5 test cases</option>
                <option value="10">10 test cases</option>
                <option value="15">15 test cases</option>
                <option value="20">20 test cases</option>
                <option value="25">25 test cases</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeNegative"
                  checked={generationConfig.includeNegativeTests}
                  onChange={(e) => onConfigChange({
                    ...generationConfig,
                    includeNegativeTests: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="includeNegative" className="text-sm font-medium text-gray-700">
                  Include negative tests
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeEdge"
                  checked={generationConfig.includeEdgeCases}
                  onChange={(e) => onConfigChange({
                    ...generationConfig,
                    includeEdgeCases: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="includeEdge" className="text-sm font-medium text-gray-700">
                  Include edge cases
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableEnhanced"
                  checked={generationConfig.enableEnhancedGeneration}
                  onChange={(e) => onConfigChange({
                    ...generationConfig,
                    enableEnhancedGeneration: e.target.checked
                  })}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="enableEnhanced" className="text-sm font-medium text-gray-700">
                  ✨ Enhanced AI Generation
                </label>
              </div>
              {generationConfig.enableEnhancedGeneration && (
                <div className="ml-6 space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-medium">Enhanced Features:</p>
                  <p className="text-xs text-green-600">• Context-aware prompts based on your domain</p>
                  <p className="text-xs text-green-600">• Progressive quality improvement</p>
                  <p className="text-xs text-green-600">• Domain-specific test patterns</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}