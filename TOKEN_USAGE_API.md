# Token Usage & Cost Tracking API Documentation

## Overview
This project includes a comprehensive token usage and cost tracking system that automatically monitors AI operations, calculates costs, and provides analytics across all pages and components.

## Core Components

### 1. TokenUsageContext
The main context provider that manages all token usage data and operations.

#### Interface: `TokenUsageContextType`
```typescript
interface TokenUsageContextType {
  usageHistory: TokenUsage[]           // Complete history of all operations
  stats: TokenStats                    // Calculated statistics
  addUsage: (usage: Omit<TokenUsage, 'id' | 'date' | 'cost'>) => void
  clearUsage: () => void              // Clear all usage data
  getUsageByDateRange: (startDate: Date, endDate: Date) => TokenUsage[]
}
```

### 2. Data Types

#### `TokenUsage` Interface
```typescript
export interface TokenUsage {
  id: string                          // Unique identifier
  date: Date                          // When the operation occurred
  operation: 'generate_test_cases' | 'analyze_document' | 'export_processing'
  providerId: string                  // AI provider: 'openai', 'claude', 'gemini'
  model: string                       // Specific model used
  inputTokens: number                 // Input tokens consumed
  outputTokens: number                // Output tokens generated
  totalTokens: number                 // inputTokens + outputTokens
  cost: number                        // Cost in USD (auto-calculated)
  fileName?: string                   // Optional file name
  testCasesGenerated?: number         // Optional test case count
}
```

#### `TokenStats` Interface
```typescript
export interface TokenStats {
  totalTokens: number                 // All-time total tokens
  totalCost: number                   // All-time total cost in USD
  thisMonth: {
    tokens: number                    // Current month tokens
    cost: number                      // Current month cost
  }
  today: {
    tokens: number                    // Today's tokens
    cost: number                      // Today's cost
  }
  byModel: Record<string, {
    tokens: number                    // Tokens per model
    cost: number                      // Cost per model
    count: number                     // Operation count per model
  }>
}
```

## Usage Examples

### Basic Implementation

#### 1. Import and Use the Hook
```typescript
'use client'
import { useTokenUsage } from '@/contexts/TokenUsageContext'

export function MyComponent() {
  const { stats, addUsage, usageHistory } = useTokenUsage()
  
  return (
    <div>
      <p>Total Cost: ${stats.totalCost.toFixed(4)}</p>
      <p>Today's Usage: {stats.today.tokens} tokens</p>
    </div>
  )
}
```

#### 2. Track AI Operations
```typescript
const handleAIOperation = async () => {
  // Your AI API call here
  const response = await callAIAPI(...)
  
  // Track the usage
  addUsage({
    operation: 'generate_test_cases',
    providerId: 'openai',
    model: 'gpt-4o',
    inputTokens: response.usage.prompt_tokens,
    outputTokens: response.usage.completion_tokens,
    totalTokens: response.usage.total_tokens,
    fileName: 'requirements.pdf',
    testCasesGenerated: 25
  })
}
```

### Widget Examples

#### 1. Simple Cost Widget
```typescript
export function CostWidget() {
  const { stats } = useTokenUsage()
  
  const formatCost = (cost: number) => `$${cost.toFixed(4)}`
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold text-gray-900">AI Costs</h3>
      <p className="text-2xl font-bold text-green-600">
        {formatCost(stats.totalCost)}
      </p>
      <p className="text-sm text-gray-500">
        {formatCost(stats.thisMonth.cost)} this month
      </p>
    </div>
  )
}
```

#### 2. Token Usage Badge
```typescript
export function TokenBadge() {
  const { stats } = useTokenUsage()
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }
  
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
      ⚡ {formatNumber(stats.totalTokens)} tokens used
    </span>
  )
}
```

#### 3. Recent Operations List
```typescript
export function RecentOperationsWidget() {
  const { usageHistory } = useTokenUsage()
  const recentOperations = usageHistory.slice(-5).reverse()
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Recent Operations</h4>
      {recentOperations.map((usage) => (
        <div key={usage.id} className="flex justify-between text-sm">
          <span>{usage.operation}</span>
          <span>${usage.cost.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}
```

### Page-Level Integration

#### 1. Settings Page Integration
```typescript
// In your settings page
import { TokenUsageDashboard } from '@/components/dashboard/TokenUsageDashboard'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1>Settings</h1>
      
      {/* Other settings... */}
      
      <section>
        <h2>Usage & Billing</h2>
        <TokenUsageDashboard />
      </section>
    </div>
  )
}
```

#### 2. Header Component Integration
```typescript
export function Header() {
  const { stats } = useTokenUsage()
  
  return (
    <header className="flex justify-between items-center">
      <h1>Test Case Manager</h1>
      
      <div className="flex items-center space-x-4">
        {/* Today's usage indicator */}
        <div className="text-sm text-gray-600">
          Today: ${stats.today.cost.toFixed(4)}
        </div>
        
        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  )
}
```

## Supported AI Providers & Models

### OpenAI
- `gpt-4`: $0.03/$0.06 per 1K tokens (input/output)
- `gpt-4-turbo`: $0.01/$0.03 per 1K tokens
- `gpt-4o`: $0.005/$0.015 per 1K tokens
- `gpt-4o-mini`: $0.00015/$0.0006 per 1K tokens
- `gpt-3.5-turbo`: $0.0015/$0.002 per 1K tokens

### Claude (Anthropic)
- `claude-3-5-sonnet-20241022`: $0.003/$0.015 per 1K tokens
- `claude-3-opus-20240229`: $0.015/$0.075 per 1K tokens
- `claude-3-sonnet-20240229`: $0.003/$0.015 per 1K tokens
- `claude-3-haiku-20240307`: $0.00025/$0.00125 per 1K tokens

### Google Gemini
- `gemini-1.5-pro`: $0.007/$0.021 per 1K tokens
- `gemini-1.5-flash`: $0.00035/$0.00105 per 1K tokens
- `gemini-pro`: $0.0005/$0.0015 per 1K tokens

## Integration Steps

### 1. Ensure Provider is Configured
The `TokenUsageProvider` should wrap your app in `layout.tsx`:
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <TokenUsageProvider>
            {children}
          </TokenUsageProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
```

### 2. Track Operations in API Routes
```typescript
// In your API route (e.g., /api/generate-test-cases)
export async function POST(request: Request) {
  // Your AI API call
  const response = await openai.chat.completions.create({...})
  
  // Return both the result and usage data
  return NextResponse.json({
    testCases: generatedTestCases,
    usage: {
      operation: 'generate_test_cases',
      providerId: 'openai',
      model: 'gpt-4o',
      inputTokens: response.usage.prompt_tokens,
      outputTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      fileName: fileName,
      testCasesGenerated: generatedTestCases.length
    }
  })
}
```

### 3. Track Usage in Frontend
```typescript
const handleGenerate = async () => {
  const response = await fetch('/api/generate-test-cases', {...})
  const data = await response.json()
  
  // Track the usage
  addUsage(data.usage)
  
  // Handle the results
  setTestCases(data.testCases)
}
```

## Utility Functions

### Format Numbers
```typescript
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}
```

### Format Currency
```typescript
const formatCost = (cost: number) => `$${cost.toFixed(4)}`
```

### Get Usage by Date Range
```typescript
const { getUsageByDateRange } = useTokenUsage()

const lastWeekUsage = getUsageByDateRange(
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
)
```

## Advanced Usage

### Custom Operation Types
To add new operation types, update the union type in `TokenUsage`:
```typescript
operation: 'generate_test_cases' | 'analyze_document' | 'export_processing' | 'custom_operation'
```

### Export Usage Data
```typescript
const exportUsageData = () => {
  const csvData = [
    ['Date', 'Operation', 'Model', 'Tokens', 'Cost'],
    ...usageHistory.map(usage => [
      usage.date.toISOString(),
      usage.operation,
      usage.model,
      usage.totalTokens,
      usage.cost.toFixed(6)
    ])
  ]
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'usage-data.csv'
  a.click()
}
```

This API documentation provides everything you need to integrate token usage and cost tracking into any page or component in your application.