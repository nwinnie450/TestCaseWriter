'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface TokenUsage {
  id: string
  date: Date
  operation: 'generate_test_cases' | 'analyze_document' | 'export_processing'
  providerId: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number // in USD
  fileName?: string
  testCasesGenerated?: number
}

export interface TokenStats {
  totalTokens: number
  totalCost: number
  thisMonth: {
    tokens: number
    cost: number
  }
  today: {
    tokens: number
    cost: number
  }
  byModel: Record<string, {
    tokens: number
    cost: number
    count: number
  }>
}

interface TokenUsageContextType {
  usageHistory: TokenUsage[]
  stats: TokenStats
  addUsage: (usage: Omit<TokenUsage, 'id' | 'date' | 'cost'>) => void
  clearUsage: () => void
  getUsageByDateRange: (startDate: Date, endDate: Date) => TokenUsage[]
}

const TokenUsageContext = createContext<TokenUsageContextType | undefined>(undefined)

// Token pricing (approximate costs as of 2024)
const TOKEN_PRICING: Record<string, Record<string, { input: number, output: number }>> = {
  openai: {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
    'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
  },
  gemini: {
    'gemini-1.5-pro': { input: 0.007 / 1000, output: 0.021 / 1000 },
    'gemini-1.5-flash': { input: 0.00035 / 1000, output: 0.00105 / 1000 },
    'gemini-pro': { input: 0.0005 / 1000, output: 0.0015 / 1000 }
  },
  claude: {
    'claude-3-5-sonnet-20241022': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 }
  }
}

const calculateCost = (providerId: string, model: string, inputTokens: number, outputTokens: number): number => {
  const provider = TOKEN_PRICING[providerId]
  if (!provider) return 0
  
  const pricing = provider[model]
  if (!pricing) return 0
  
  return (inputTokens * pricing.input) + (outputTokens * pricing.output)
}

const calculateStats = (usageHistory: TokenUsage[]): TokenStats => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const stats: TokenStats = {
    totalTokens: 0,
    totalCost: 0,
    thisMonth: { tokens: 0, cost: 0 },
    today: { tokens: 0, cost: 0 },
    byModel: {}
  }

  usageHistory.forEach(usage => {
    const usageDate = new Date(usage.date)
    
    // Total stats
    stats.totalTokens += usage.totalTokens
    stats.totalCost += usage.cost

    // This month stats
    if (usageDate >= startOfMonth) {
      stats.thisMonth.tokens += usage.totalTokens
      stats.thisMonth.cost += usage.cost
    }

    // Today stats
    if (usageDate >= startOfDay) {
      stats.today.tokens += usage.totalTokens
      stats.today.cost += usage.cost
    }

    // By model stats
    if (!stats.byModel[usage.model]) {
      stats.byModel[usage.model] = { tokens: 0, cost: 0, count: 0 }
    }
    stats.byModel[usage.model].tokens += usage.totalTokens
    stats.byModel[usage.model].cost += usage.cost
    stats.byModel[usage.model].count += 1
  })

  return stats
}

export function TokenUsageProvider({ children }: { children: React.ReactNode }) {
  const [usageHistory, setUsageHistory] = useState<TokenUsage[]>([])
  const [stats, setStats] = useState<TokenStats>({
    totalTokens: 0,
    totalCost: 0,
    thisMonth: { tokens: 0, cost: 0 },
    today: { tokens: 0, cost: 0 },
    byModel: {}
  })

  // Load usage history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tokenUsageHistory')
      if (stored) {
        try {
          const parsed = JSON.parse(stored).map((usage: any) => ({
            ...usage,
            date: new Date(usage.date)
          }))
          setUsageHistory(parsed)
        } catch (e) {
          console.error('Error parsing token usage history:', e)
        }
      }
    }
  }, [])

  // Recalculate stats when usage history changes
  useEffect(() => {
    const newStats = calculateStats(usageHistory)
    setStats(newStats)
  }, [usageHistory])

  const addUsage = (usage: Omit<TokenUsage, 'id' | 'date' | 'cost'>) => {
    const newUsage: TokenUsage = {
      ...usage,
      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date(),
      cost: calculateCost(usage.providerId, usage.model, usage.inputTokens, usage.outputTokens)
    }

    const updatedHistory = [...usageHistory, newUsage]
    setUsageHistory(updatedHistory)
    
    // Save to localStorage
    localStorage.setItem('tokenUsageHistory', JSON.stringify(updatedHistory))
  }

  const clearUsage = () => {
    setUsageHistory([])
    localStorage.removeItem('tokenUsageHistory')
  }

  const getUsageByDateRange = (startDate: Date, endDate: Date): TokenUsage[] => {
    return usageHistory.filter(usage => {
      const usageDate = new Date(usage.date)
      return usageDate >= startDate && usageDate <= endDate
    })
  }

  return (
    <TokenUsageContext.Provider value={{
      usageHistory,
      stats,
      addUsage,
      clearUsage,
      getUsageByDateRange
    }}>
      {children}
    </TokenUsageContext.Provider>
  )
}

export const useTokenUsage = () => {
  const context = useContext(TokenUsageContext)
  if (context === undefined) {
    throw new Error('useTokenUsage must be used within a TokenUsageProvider')
  }
  return context
}