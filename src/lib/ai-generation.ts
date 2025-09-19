import { generateTestCasesWithAI, TestCaseGenerationRequest, TestCaseGenerationResult, AIConfig } from '@/lib/ai-providers'
import { detectContentDuplicates } from '@/lib/utils'

export class AIGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AIGenerationError'
  }
}

export async function generateTestCasesWithAILocal(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
  const { documents, template, config, aiConfig } = request

  if (!aiConfig.apiKey) {
    throw new AIGenerationError(`${aiConfig.providerId} API key is required`)
  }

  // Validate document requirements
  if (aiConfig.requireDocuments && (!documents || documents.length === 0 || documents.every((doc: any) => !doc.trim()))) {
    throw new AIGenerationError('Documents are required for test case generation. Please upload requirements documents first.')
  }

  try {
    // Use the provider system from ai-providers.ts
    const result = await generateTestCasesWithAI({
      documents,
      template,
      config,
      aiConfig
    })

    // Check for duplicates
    const duplicateInfo = detectContentDuplicates(result.testCases, [])

    return {
      testCases: result.testCases,
      usage: result.usage,
      duplicateInfo
    }

  } catch (error: any) {
    if (error instanceof AIGenerationError) {
      throw error
    }
    
    // Handle provider-specific errors
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      throw new AIGenerationError(`${aiConfig.providerId} API key is invalid or unauthorized`)
    }
    
    if (error.message?.includes('403') || error.message?.includes('forbidden')) {
      throw new AIGenerationError(`${aiConfig.providerId} API access forbidden. Check your API key permissions`)
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      throw new AIGenerationError(`${aiConfig.providerId} API rate limit exceeded. Please try again later`)
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AIGenerationError(`Network error: Unable to connect to ${aiConfig.providerId} API`)
    }
    
    console.error(`${aiConfig.providerId} API Error:`, error)
    throw new AIGenerationError(`${aiConfig.providerId} API Error: ${error.message}`)
  }
}