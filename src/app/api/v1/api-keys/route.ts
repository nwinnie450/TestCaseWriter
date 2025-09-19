import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

// Mock database for API keys - in production, use real database
interface APIKey {
  id: string
  key: string
  companyName: string
  contactEmail: string
  isActive: boolean
  rateLimit: number
  monthlyUsage: number
  monthlyLimit: number
  createdAt: Date
  lastUsed: Date
  usageHistory: Array<{
    date: string
    endpoint: string
    tokensUsed: number
    cost: number
  }>
}

// Storage key for API keys
const STORAGE_KEY = 'testCaseWriter_apiKeys'

// Helper functions for localStorage persistence
function getStoredAPIKeys(): APIKey[] {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.map((key: any) => ({
          ...key,
          createdAt: new Date(key.createdAt),
          lastUsed: new Date(key.lastUsed)
        }))
      }
    }
    return []
  } catch (error) {
    console.error('Failed to load API keys from storage:', error)
    return []
  }
}

function saveAPIKeys(apiKeys: APIKey[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys))
    }
  } catch (error) {
    console.error('Failed to save API keys to storage:', error)
  }
}

// Initialize with empty keys - no demo data in production
function initializeAPIKeys(): APIKey[] {
  return getStoredAPIKeys()
}

// Get current API keys (with persistence)
const mockAPIKeys: APIKey[] = initializeAPIKeys()

// Generate a secure API key
function generateAPIKey(): string {
  const prefix = 'tcw_' // TestCaseWriter prefix
  const random = Math.random().toString(36).substr(2, 15)
  const timestamp = Date.now().toString(36)
  return `${prefix}${random}_${timestamp}`
}

// Validation schemas
const CreateAPIKeySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Valid email is required'),
  monthlyLimit: z.number().min(100, 'Monthly limit must be at least 100').default(1000),
  rateLimit: z.number().min(10, 'Rate limit must be at least 10').default(100)
})

const UpdateAPIKeySchema = z.object({
  isActive: z.boolean().optional(),
  monthlyLimit: z.number().min(100).optional(),
  rateLimit: z.number().min(10).optional(),
  contactEmail: z.string().email().optional()
})

// GET /api/v1/api-keys - List all API keys (admin only)
export async function GET(request: NextRequest) {
  try {
    // In production, check if user is admin
    const { searchParams } = new URL(request.url)
    const includeUsage = searchParams.get('includeUsage') === 'true'
    
    const keys = mockAPIKeys.map(key => ({
      id: key.id,
      key: key.key,
      companyName: key.companyName,
      contactEmail: key.contactEmail,
      isActive: key.isActive,
      rateLimit: key.rateLimit,
      monthlyUsage: key.monthlyUsage,
      monthlyLimit: key.monthlyLimit,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      ...(includeUsage && { usageHistory: key.usageHistory })
    }))

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: keys,
        total: keys.length,
        activeKeys: keys.filter(k => k.isActive).length
      }
    })

  } catch (error: any) {
    console.error('API Keys GET error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve API keys',
        details: error.message
      }
    }, { status: 500 })
  }
}

// POST /api/v1/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = CreateAPIKeySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: validationResult.error.errors
        }
      }, { status: 400 })
    }

    const { companyName, contactEmail, monthlyLimit, rateLimit } = validationResult.data

    // Check if company already has an API key
    const existingKey = mockAPIKeys.find(key => 
      key.companyName.toLowerCase() === companyName.toLowerCase()
    )

    if (existingKey) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'COMPANY_EXISTS',
          message: 'Company already has an API key',
          details: `Company "${companyName}" already has API key: ${existingKey.key}`
        }
      }, { status: 409 })
    }

    // Generate new API key
    const newAPIKey: APIKey = {
      id: uuidv4(),
      key: generateAPIKey(),
      companyName,
      contactEmail,
      isActive: true,
      rateLimit,
      monthlyUsage: 0,
      monthlyLimit,
      createdAt: new Date(),
      lastUsed: new Date(),
      usageHistory: []
    }

    mockAPIKeys.push(newAPIKey)
    saveAPIKeys(mockAPIKeys) // Save to localStorage

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          id: newAPIKey.id,
          key: newAPIKey.key,
          companyName: newAPIKey.companyName,
          contactEmail: newAPIKey.contactEmail,
          isActive: newAPIKey.isActive,
          rateLimit: newAPIKey.rateLimit,
          monthlyLimit: newAPIKey.monthlyLimit,
          createdAt: newAPIKey.createdAt
        },
        message: `API key created successfully for ${companyName}`,
        usage: {
          currentMonth: 0,
          limit: monthlyLimit,
          remaining: monthlyLimit
        }
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('API Keys POST error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create API key',
        details: error.message
      }
    }, { status: 500 })
  }
}

// PUT /api/v1/api-keys/:id - Update API key
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')
    
    // Debug logging
    console.log('PUT /api-keys - Debug info:')
    console.log('  URL:', request.url)
    console.log('  Search params:', Object.fromEntries(searchParams.entries()))
    console.log('  keyId from searchParams:', keyId)
    
    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'API key ID is required'
        }
      }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = UpdateAPIKeySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: validationResult.error.errors
        }
      }, { status: 400 })
    }

    const apiKeyIndex = mockAPIKeys.findIndex(key => key.id === keyId)
    if (apiKeyIndex === -1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'API key not found'
        }
      }, { status: 404 })
    }

    // Update the API key
    const updatedKey = { ...mockAPIKeys[apiKeyIndex], ...validationResult.data }
    mockAPIKeys[apiKeyIndex] = updatedKey
    saveAPIKeys(mockAPIKeys) // Save to localStorage

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          id: updatedKey.id,
          key: updatedKey.key,
          companyName: updatedKey.companyName,
          contactEmail: updatedKey.contactEmail,
          isActive: updatedKey.isActive,
          rateLimit: updatedKey.rateLimit,
          monthlyUsage: updatedKey.monthlyUsage,
          monthlyLimit: updatedKey.monthlyLimit,
          lastUsed: updatedKey.lastUsed
        },
        message: 'API key updated successfully'
      }
    })

  } catch (error: any) {
    console.error('API Keys PUT error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update API key',
        details: error.message
      }
    }, { status: 500 })
  }
}

// DELETE /api/v1/api-keys/:id - Deactivate API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')
    
    if (!keyId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_ID',
          message: 'API key ID is required'
        }
      }, { status: 400 })
    }

    const apiKeyIndex = mockAPIKeys.findIndex(key => key.id === keyId)
    if (apiKeyIndex === -1) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'API_KEY_NOT_FOUND',
          message: 'API key not found'
        }
      }, { status: 404 })
    }

    // Deactivate the API key instead of deleting
    mockAPIKeys[apiKeyIndex].isActive = false
    saveAPIKeys(mockAPIKeys) // Save to localStorage

    return NextResponse.json({
      success: true,
      data: {
        message: 'API key deactivated successfully',
        apiKey: {
          id: mockAPIKeys[apiKeyIndex].id,
          companyName: mockAPIKeys[apiKeyIndex].companyName,
          isActive: false
        }
      }
    })

  } catch (error: any) {
    console.error('API Keys DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to deactivate API key',
        details: error.message
      }
    }, { status: 500 })
  }
}
