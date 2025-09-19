import { NextRequest, NextResponse } from 'next/server'
import { generateTestCasesWithAI } from '@/lib/ai-providers'
import { z } from 'zod'

// Validation schemas
const DocumentSchema = z.object({
  content: z.string().min(1, 'Document content is required'),
  fileName: z.string().optional(),
  fileType: z.enum(['pdf', 'docx', 'txt', 'md']).optional()
})

const TemplateFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'textarea', 'select', 'multiselect', 'number', 'date', 'boolean', 'file', 'table']),
  label: z.string(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional()
})

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(TemplateFieldSchema).optional()
})

const GenerationConfigSchema = z.object({
  coverage: z.enum(['comprehensive', 'focused', 'minimal']).default('comprehensive'),
  includeNegativeTests: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true),
  maxTestCases: z.number().min(1).max(100).default(20),
  customInstructions: z.string().optional()
})

const AIConfigSchema = z.object({
  providerId: z.enum(['openai', 'claude', 'gemini', 'grok']),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(32000).default(4000),
  documentFocused: z.boolean().default(true)
})

const MetadataSchema = z.object({
  projectId: z.string().optional(),
  enhancement: z.string().optional(),
  ticketId: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const RequestSchema = z.object({
  documents: z.array(DocumentSchema).min(1, 'At least one document is required'),
  template: TemplateSchema,
  config: GenerationConfigSchema.optional(),
  aiConfig: AIConfigSchema,
  metadata: MetadataSchema.optional()
})

// Error response helper
function createErrorResponse(code: string, message: string, status: number = 400, details?: any) {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
      details
    }
  }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = RequestSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return createErrorResponse('INVALID_REQUEST', 'Invalid request format', 400, { validationErrors: errors })
    }

    const { documents, template, config, aiConfig, metadata } = validationResult.data

    // Extract document content with token limiting to prevent context overflow
    const MAX_CONTENT_TOKENS = 80000 // Reserve space for prompt and response
    const documentContents = documents.map(doc => {
      // Rough token estimation: ~4 chars per token
      const estimatedTokens = doc.content.length / 4
      if (estimatedTokens > MAX_CONTENT_TOKENS) {
        console.warn(`Document truncated from ${estimatedTokens} to ${MAX_CONTENT_TOKENS} tokens`)
        return doc.content.substring(0, MAX_CONTENT_TOKENS * 4) + '...[truncated]'
      }
      return doc.content
    })
    
    // Create template structure for AI
    const templateStructure = `Test Case Format:
- Test Case ID: TC-XXXX format
- Module: Functional area being tested
- Test Case: Clear description of what is being tested
- Test Steps: Numbered steps with description, test data, and expected result
- Test Result: Execution status
- QA: Quality assurance notes
- Remarks: Additional context or notes

Template: ${template.name || 'Standard Test Case'}`

    // Generate test cases using AI
    const startTime = Date.now()
    const result = await generateTestCasesWithAI({
      documents: documentContents,
      template: templateStructure,
      config: {
        coverage: config?.coverage || 'comprehensive',
        includeNegativeTests: config?.includeNegativeTests ?? true,
        includeEdgeCases: config?.includeEdgeCases ?? true,
        maxTestCases: config?.maxTestCases || 20,
        customInstructions: config?.customInstructions || ''
      },
      aiConfig: {
        ...aiConfig,
        apiKey: process.env[`${aiConfig.providerId.toUpperCase()}_API_KEY`] || '',
        requireDocuments: true,
        documentFocused: aiConfig.documentFocused,
        customPrompt: config?.customInstructions || ''
      }
    })

    const generationTime = Date.now() - startTime

    // Calculate cost based on token usage
    const cost = calculateCost(aiConfig.providerId, aiConfig.model, result.usage)

    // Add metadata to generated test cases
    const enhancedTestCases = result.testCases.map((tc, index) => {
      // Generate unique ID to prevent duplicates
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 5)
      const uniqueId = `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`
      
      return {
        ...tc,
        id: tc.id || uniqueId, // Use existing ID if present, otherwise generate unique one
        projectId: metadata?.projectId,
        enhancement: metadata?.enhancement,
        ticketId: metadata?.ticketId,
        tags: [...(metadata?.tags || [])],
        priority: 'medium',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        testCases: enhancedTestCases,
        usage: {
          ...result.usage,
          cost
        },
        generationTime,
        template: {
          id: template.id,
          name: template.name
        },
        metadata
      },
      message: `Successfully generated ${enhancedTestCases.length} test cases`
    })

  } catch (error: any) {
    console.error('Test case generation error:', error)

    // Handle specific AI provider errors
    if (error.name === 'AIProviderError') {
      return createErrorResponse(
        'AI_PROVIDER_ERROR',
        error.message,
        500,
        { provider: error.provider, statusCode: error.statusCode }
      )
    }

    // Handle OpenAI API errors
    if (error.message?.includes('OpenAI API error')) {
      return createErrorResponse(
        'AI_PROVIDER_ERROR',
        'OpenAI API error occurred',
        500,
        { details: error.message }
      )
    }

    // Handle validation errors
    if (error.name === 'ZodError') {
      return createErrorResponse(
        'INVALID_REQUEST',
        'Request validation failed',
        400,
        { validationErrors: error.errors }
      )
    }

    // Generic error
    return createErrorResponse(
      'INTERNAL_ERROR',
      'An internal error occurred',
      500,
      { details: error.message }
    )
  }
}

// Cost calculation helper
function calculateCost(providerId: string, model: string, usage: any): number {
  const costs: Record<string, Record<string, { input: number; output: number }>> = {
    openai: {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    },
    claude: {
      'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 }
    },
    gemini: {
      'gemini-1.5-pro': { input: 0.007, output: 0.021 },
      'gemini-1.5-flash': { input: 0.00035, output: 0.00105 },
      'gemini-pro': { input: 0.0005, output: 0.0015 }
    },
    grok: {
      'grok-beta': { input: 0.0001, output: 0.0001 }
    }
  }

  const providerCosts = costs[providerId]
  if (!providerCosts) return 0

  // Find the best matching model (fallback to first available)
  const modelCost = providerCosts[model] || Object.values(providerCosts)[0]
  if (!modelCost) return 0

  const inputCost = (usage.inputTokens / 1000) * modelCost.input
  const outputCost = (usage.outputTokens / 1000) * modelCost.output

  return Math.round((inputCost + outputCost) * 1000000) / 1000000 // Round to 6 decimal places
}

// Handle unsupported methods
export async function GET() {
  return createErrorResponse('METHOD_NOT_ALLOWED', 'GET method not supported', 405)
}

export async function PUT() {
  return createErrorResponse('METHOD_NOT_ALLOWED', 'PUT method not supported', 405)
}

export async function DELETE() {
  return createErrorResponse('METHOD_NOT_ALLOWED', 'DELETE method not supported', 405)
}
