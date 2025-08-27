import { NextRequest, NextResponse } from 'next/server'
import { validateAPIKey, recordUsage } from './api-key-tracker'

// Enhanced API key validation with rate limiting and usage tracking
export function validateApiKey(request: NextRequest): { isValid: boolean; error?: string; rateLimit?: any } {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return { isValid: false, error: 'Authorization header is required' }
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Authorization header must start with Bearer' }
  }
  
  const apiKey = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' }
  }
  
  // Use the enhanced validation from api-key-tracker
  const validationResult = validateAPIKey(apiKey)
  
  return validationResult
}

// Enhanced middleware function with usage tracking
export function withApiAuth(handler: Function) {
  return async function(request: NextRequest, ...args: any[]) {
    const startTime = Date.now()
    
    const authResult = validateApiKey(request)
    
    if (!authResult.isValid) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: authResult.error || 'Authentication required'
        }
      }, { status: 401 })
    }
    
    // Extract API key for usage tracking
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.substring(7) || ''
    
    try {
      // Execute the handler
      const result = await handler(request, ...args)
      
      // Record usage (if successful)
      const responseTime = Date.now() - startTime
      recordUsage(apiKey, request.nextUrl?.pathname || 'unknown', 0, 0, responseTime)
      
      return result
    } catch (error) {
      // Record failed usage
      const responseTime = Date.now() - startTime
      recordUsage(apiKey, request.nextUrl?.pathname || 'unknown', 0, 0, responseTime)
      throw error
    }
  }
}

// Rate limiting helper (simple in-memory implementation)
// In production, use Redis or a proper rate limiting service
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  const record = rateLimitStore.get(key)!
  
  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

// Clean up expired rate limit records
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute
