// API Key Tracker and Usage Management
// This file handles API key validation, rate limiting, and usage tracking

interface APIKeyUsage {
  apiKey: string
  endpoint: string
  timestamp: Date
  tokensUsed: number
  cost: number
  responseTime: number
}

interface RateLimitInfo {
  remaining: number
  resetTime: Date
  limit: number
}

// In-memory storage for rate limiting and usage tracking
// In production, use Redis or database
const rateLimitStore = new Map<string, { count: number; resetTime: Date }>()
const usageStore = new Map<string, APIKeyUsage[]>()

// Rate limit window in milliseconds (1 minute)
const RATE_LIMIT_WINDOW_MS = 60 * 1000

/**
 * Validate API key and check rate limits
 */
export function validateAPIKey(apiKey: string): { isValid: boolean; error?: string; rateLimit?: RateLimitInfo } {
  // Get valid API keys from environment or use mock data
  const validAPIKeys = process.env.VALID_API_KEYS?.split(',') || ['demo-api-key-123']
  
  if (!validAPIKeys.includes(apiKey)) {
    return { isValid: false, error: 'Invalid API key' }
  }

  // Check rate limiting
  const rateLimitInfo = checkRateLimit(apiKey)
  if (rateLimitInfo.remaining <= 0) {
    return { 
      isValid: false, 
      error: 'Rate limit exceeded',
      rateLimit: rateLimitInfo
    }
  }

  return { isValid: true, rateLimit: rateLimitInfo }
}

/**
 * Check rate limit for an API key
 */
function checkRateLimit(apiKey: string): RateLimitInfo {
  const now = new Date()
  const key = `rate_limit:${apiKey}`
  
  if (!rateLimitStore.has(key)) {
    // Initialize rate limit
    rateLimitStore.set(key, {
      count: 0,
      resetTime: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)
    })
  }

  const rateLimit = rateLimitStore.get(key)!
  
  // Check if rate limit window has reset
  if (now > rateLimit.resetTime) {
    rateLimit.count = 0
    rateLimit.resetTime = new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)
  }

  // Default rate limit (can be customized per API key)
  const limit = 100 // requests per minute
  
  return {
    remaining: Math.max(0, limit - rateLimit.count),
    resetTime: rateLimit.resetTime,
    limit
  }
}

/**
 * Record API usage for an API key
 */
export function recordUsage(apiKey: string, endpoint: string, tokensUsed: number, cost: number, responseTime: number) {
  const usage: APIKeyUsage = {
    apiKey,
    endpoint,
    timestamp: new Date(),
    tokensUsed,
    cost,
    responseTime
  }

  // Store usage
  if (!usageStore.has(apiKey)) {
    usageStore.set(apiKey, [])
  }
  usageStore.get(apiKey)!.push(usage)

  // Update rate limit counter
  const key = `rate_limit:${apiKey}`
  if (rateLimitStore.has(key)) {
    rateLimitStore.get(key)!.count++
  }
}

/**
 * Get usage statistics for an API key
 */
export function getUsageStats(apiKey: string, days: number = 30) {
  if (!usageStore.has(apiKey)) {
    return {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
      dailyUsage: []
    }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  const usage = usageStore.get(apiKey)!.filter(u => u.timestamp > cutoffDate)
  
  const totalRequests = usage.length
  const totalTokens = usage.reduce((sum, u) => sum + u.tokensUsed, 0)
  const totalCost = usage.reduce((sum, u) => sum + u.cost, 0)
  const averageResponseTime = totalRequests > 0 ? usage.reduce((sum, u) => sum + u.responseTime, 0) / totalRequests : 0

  // Group by endpoint
  const requestsByEndpoint: Record<string, number> = {}
  usage.forEach(u => {
    requestsByEndpoint[u.endpoint] = (requestsByEndpoint[u.endpoint] || 0) + 1
  })

  // Group by day
  const dailyUsage: Record<string, { requests: number; tokens: number; cost: number }> = {}
  usage.forEach(u => {
    const date = u.timestamp.toISOString().split('T')[0]
    if (!dailyUsage[date]) {
      dailyUsage[date] = { requests: 0, tokens: 0, cost: 0 }
    }
    dailyUsage[date].requests++
    dailyUsage[date].tokens += u.tokensUsed
    dailyUsage[date].cost += u.cost
  })

  return {
    totalRequests,
    totalTokens,
    totalCost,
    averageResponseTime,
    requestsByEndpoint,
    dailyUsage: Object.entries(dailyUsage).map(([date, stats]) => ({
      date,
      ...stats
    }))
  }
}

/**
 * Get all API keys usage summary
 */
export function getAllAPIKeysUsage() {
  const summary: Record<string, any> = {}
  
  for (const [apiKey, usage] of usageStore.entries()) {
    summary[apiKey] = getUsageStats(apiKey)
  }
  
  return summary
}

/**
 * Reset rate limits (useful for testing)
 */
export function resetRateLimits() {
  rateLimitStore.clear()
}

/**
 * Get rate limit info for an API key
 */
export function getRateLimitInfo(apiKey: string): RateLimitInfo {
  return checkRateLimit(apiKey)
}

/**
 * Check if API key has exceeded monthly usage limit
 */
export function checkMonthlyUsageLimit(apiKey: string, monthlyLimit: number): { withinLimit: boolean; currentUsage: number; remaining: number } {
  const stats = getUsageStats(apiKey, 30)
  const currentUsage = stats.totalRequests
  
  return {
    withinLimit: currentUsage < monthlyLimit,
    currentUsage,
    remaining: Math.max(0, monthlyLimit - currentUsage)
  }
}
