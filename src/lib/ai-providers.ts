export interface AIProvider {
  id: string
  name: string
  models: string[]
  apiKeyLabel: string
  baseUrl: string
  pricing: Record<string, { input: number, output: number }>
}

export interface AIConfig {
  providerId: string
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
  customPrompt: string
  requireDocuments?: boolean
  documentFocused?: boolean
}

export interface TokenUsageData {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface TestCaseGenerationResult {
  testCases: TestCase[]
  usage?: TokenUsageData
}

export interface TestCaseGenerationRequest {
  documents: string[]
  template: string
  config: {
    coverage: 'comprehensive' | 'focused' | 'minimal'
    includeNegativeTests: boolean
    includeEdgeCases: boolean
    maxTestCases: number
    customInstructions: string
  }
  aiConfig: AIConfig
}

export interface TestCase {
  id: string
  module: string
  testCase: string
  testSteps: {
    step: number
    description: string
    testData: string
    expectedResult: string
  }[]
  testResult: string
  qa: string
  remarks: string
}

export class AIProviderError extends Error {
  constructor(message: string, public statusCode?: number, public provider?: string) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export const AI_PROVIDERS: Record<string, AIProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ],
    apiKeyLabel: 'OpenAI API Key',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    pricing: {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
      'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
      'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
    }
  },
  
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ],
    apiKeyLabel: 'Google AI API Key',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    pricing: {
      'gemini-1.5-pro': { input: 0.007 / 1000, output: 0.021 / 1000 },
      'gemini-1.5-flash': { input: 0.00035 / 1000, output: 0.00105 / 1000 },
      'gemini-pro': { input: 0.0005 / 1000, output: 0.0015 / 1000 }
    }
  },

  claude: {
    id: 'claude',
    name: 'Anthropic Claude',
    models: [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    apiKeyLabel: 'Anthropic API Key',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    pricing: {
      'claude-3-5-sonnet-20241022': { input: 0.003 / 1000, output: 0.015 / 1000 },
      'claude-3-opus-20240229': { input: 0.015 / 1000, output: 0.075 / 1000 },
      'claude-3-sonnet-20240229': { input: 0.003 / 1000, output: 0.015 / 1000 },
      'claude-3-haiku-20240307': { input: 0.00025 / 1000, output: 0.00125 / 1000 }
    }
  },

  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    models: [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-35-turbo'
    ],
    apiKeyLabel: 'Azure OpenAI API Key',
    baseUrl: 'https://{resource-name}.openai.azure.com/openai/deployments/{deployment-name}/chat/completions',
    pricing: {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
      'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
      'gpt-35-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
    }
  },

  grok: {
    id: 'grok',
    name: 'xAI Grok',
    models: [
      'grok-beta',
      'grok-vision-beta'
    ],
    apiKeyLabel: 'xAI API Key',
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    pricing: {
      'grok-beta': { input: 0.005 / 1000, output: 0.015 / 1000 },
      'grok-vision-beta': { input: 0.01 / 1000, output: 0.03 / 1000 }
    }
  }
}

// Abstract AI provider interface
interface BaseAIProvider {
  generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult>
}

class OpenAIProvider implements BaseAIProvider {
  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
    const { documents, template, config, aiConfig } = request

    if (!aiConfig.apiKey) {
      throw new AIProviderError('OpenAI API key is required', undefined, 'openai')
    }

    try {
      // Truncate document content to prevent token overflow
      const MAX_CONTENT_TOKENS = 80000 // Reserve space for prompt and response
      let documentContent = documents.join('\n\n')

      // Rough token estimation: ~4 chars per token
      const estimatedTokens = documentContent.length / 4
      if (estimatedTokens > MAX_CONTENT_TOKENS) {
        console.warn(`🔧 Document truncated from ${Math.round(estimatedTokens)} to ${MAX_CONTENT_TOKENS} tokens`)
        documentContent = documentContent.substring(0, MAX_CONTENT_TOKENS * 4) + '...[truncated for token limit]'
      }

      const documentFocusPrefix = aiConfig.documentFocused
        ? `🚨 STRICT DOCUMENT-ONLY MODE ENABLED 🚨\nABSOLUTELY CRITICAL: You MUST ONLY generate test cases based on the specific content in the uploaded documents.\n\n`
        : ''

      const systemPrompt = `${documentFocusPrefix}You are an expert QA engineer specializing in comprehensive test case generation.\n\nYour task is to analyze requirements documents and generate EXACTLY ${config.maxTestCases} test cases following this template format:\n\n${template}\n\nCRITICAL REQUIREMENTS FOR COMPREHENSIVE COVERAGE:\n\n1. FOR EACH REQUIREMENT, create multiple test cases covering:\n   - POSITIVE SCENARIOS: Happy path with valid data, boundary conditions, different data types\n   - NEGATIVE SCENARIOS: Invalid inputs, missing fields, error conditions, unauthorized access\n   - EDGE CASES: Extremely large/small values, special characters, concurrent operations\n   - INTEGRATION SCENARIOS: API interactions, database operations, external services\n   - SECURITY SCENARIOS: Input validation, authentication, data sanitization\n   - PERFORMANCE SCENARIOS: Load conditions, resource limits, timeouts\n\n2. TEST CASE STRUCTURE:\n   - Each test case MUST have AT LEAST 5-8 detailed test steps\n   - Include specific test data and expected results for each step\n   - Cover setup, execution, validation, and cleanup phases\n   - Consider different user roles and permissions\n   - Include realistic test data and conditions\n\n3. QUALITY STANDARDS:\n   - Ensure 100% requirement coverage across all test cases\n   - Each test case must be specific and actionable\n   - Consider business impact and risk levels\n   - Generate test cases that can be executed immediately\n\n4. CRITICAL ORDERING REQUIREMENT:\n   - Generate test cases in the EXACT SAME ORDER as requirements appear in the document\n   - Test Case ID should follow sequential order (TC-0001, TC-0002, TC-0003...)\n   - Each requirement should have its test cases generated immediately after it appears\n   - Maintain logical flow and dependency relationships\n   - Do NOT mix test cases from different requirements randomly\n\nGenerate EXACTLY ${config.maxTestCases} test cases in JSON format with this structure:\n[\n  {\n    "id": "TC-0001",\n    "module": "Module Name",\n    "testCase": "Detailed test case description covering specific scenario",\n    "testSteps": [\n      {\n        "step": 1,\n        "description": "Specific step description with test data",\n        "testData": "Specific test data values",\n        "expectedResult": "Detailed expected result"\n      }\n    ],\n    "testResult": "Not Executed",\n    "qa": "QA notes for this test case",\n    "remarks": "Additional context or risk considerations"\n  }\n]`

      const userPrompt = `Please analyze the following requirements document and generate EXACTLY ${config.maxTestCases} comprehensive test cases:\n\nDOCUMENT CONTENT:\n${documentContent}\n\nCONFIGURATION:\n- Maximum test cases: ${config.maxTestCases}\n- Coverage: ${config.coverage}\n- Include negative tests: ${config.includeNegativeTests}\n- Include edge cases: ${config.includeEdgeCases}\n- Custom instructions: ${config.customInstructions}\n\nIMPORTANT: Generate comprehensive test cases that cover EVERY requirement with multiple test scenarios:\n- Positive, negative, and edge case testing\n- Security and performance considerations\n- Integration and user workflow coverage\n- Realistic test data and conditions\n\nCRITICAL ORDERING: Generate test cases in the EXACT SAME ORDER as requirements appear in the document. Maintain logical flow and sequential numbering (TC-0001, TC-0002, TC-0003...).\n\nEnsure 100% requirement coverage with detailed, actionable test cases. Generate EXACTLY ${config.maxTestCases} test cases based on the ACTUAL requirements above.`

      const supportsJsonFormat = aiConfig.model.includes('gpt-4') || 
                                 aiConfig.model.includes('gpt-4o') || 
                                 aiConfig.model.includes('gpt-3.5-turbo')

      // Calculate appropriate max_tokens to prevent truncation
      const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4) // Rough estimate
      const safeMaxTokens = Math.min(
        aiConfig.maxTokens,
        // For most models, reserve some tokens for the response
        aiConfig.model.includes('gpt-4') ? 8000 : 4000
      )
      
      console.log('🔍 Token calculation:', {
        estimatedInput: estimatedInputTokens,
        maxOutput: safeMaxTokens,
        total: estimatedInputTokens + safeMaxTokens
      })
      
      const requestBody: any = {
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: safeMaxTokens,
        temperature: aiConfig.temperature
      }

      if (supportsJsonFormat) {
        requestBody.response_format = { type: 'json_object' }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          errorData.error?.message || `OpenAI API error: ${response.status}`,
          response.status,
          'openai'
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new AIProviderError('No content received from OpenAI API', undefined, 'openai')
      }
      
      // Check if response was truncated
      if (data.choices[0]?.finish_reason === 'length') {
        console.warn('⚠️ OpenAI response was truncated due to token limit. Consider reducing maxTestCases or increasing max_tokens.')
      }
      
      console.log('🔍 OpenAI response received:', {
        contentLength: content.length,
        finishReason: data.choices[0]?.finish_reason,
        usage: data.usage
      })

      const usage: TokenUsageData = {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }

      let testCases: TestCase[] = this.parseTestCases(content)
      
      // Enforce maxTestCases limit client-side for OpenAI
      if (testCases.length > config.maxTestCases) {
        console.log(`🔥 OpenAI generated ${testCases.length} test cases, limiting to ${config.maxTestCases} as requested`)
        testCases = testCases.slice(0, config.maxTestCases)
      }
      
      const formattedTestCases = this.formatTestCases(testCases)

      return {
        testCases: formattedTestCases,
        usage
      }

    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AIProviderError('Network error: Unable to connect to OpenAI API', undefined, 'openai')
      }
      
      throw new AIProviderError(`Unexpected error: ${error.message}`, undefined, 'openai')
    }
  }

  private parseTestCases(content: string): TestCase[] {
    console.log('🔍 Parsing test cases from content length:', content.length)
    console.log('🔍 Content preview (first 500 chars):', content.substring(0, 500))
    
    try {
      const parsed = JSON.parse(content)
      console.log('✅ Direct JSON parse successful')
      return Array.isArray(parsed) ? parsed : parsed.testCases || []
    } catch (parseError) {
      console.log('❌ Initial JSON parse failed, trying to extract JSON from response...')
      console.log('❌ Parse error:', parseError)
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        try {
          console.log('🔍 Found JSON in code block, attempting to parse...')
          const parsed = JSON.parse(jsonMatch[1])
          console.log('✅ JSON from code block parse successful')
          return Array.isArray(parsed) ? parsed : parsed.testCases || []
        } catch (secondParseError) {
          console.error('❌ Failed to parse extracted JSON from code block:', secondParseError)
        }
      }
      
      // Try to find JSON array or object boundaries
      const jsonStartIndex = content.indexOf('[')
      const jsonEndIndex = content.lastIndexOf(']')
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        try {
          console.log('🔍 Found JSON array boundaries, attempting to extract...')
          const extractedJson = content.substring(jsonStartIndex, jsonEndIndex + 1)
          console.log('🔍 Extracted JSON length:', extractedJson.length)
          const parsed = JSON.parse(extractedJson)
          console.log('✅ JSON from boundaries parse successful')
          return Array.isArray(parsed) ? parsed : []
        } catch (thirdParseError) {
          console.error('❌ Failed to parse extracted JSON from boundaries:', thirdParseError)
        }
      }
      
      // Try to find JSON object boundaries
      const objStartIndex = content.indexOf('{')
      const objEndIndex = content.lastIndexOf('}')
      if (objStartIndex !== -1 && objEndIndex !== -1 && objEndIndex > objStartIndex) {
        try {
          console.log('🔍 Found JSON object boundaries, attempting to extract...')
          const extractedJson = content.substring(objStartIndex, objEndIndex + 1)
          console.log('🔍 Extracted JSON object length:', extractedJson.length)
          const parsed = JSON.parse(extractedJson)
          console.log('✅ JSON object parse successful')
          return Array.isArray(parsed) ? parsed : parsed.testCases || []
        } catch (fourthParseError) {
          console.error('❌ Failed to parse extracted JSON object:', fourthParseError)
        }
      }
      
      // Try to salvage partial results from truncated JSON
      console.log('🔄 Attempting to salvage partial results from truncated response...')
      const partialResults = this.extractPartialTestCases(content)
      if (partialResults.length > 0) {
        console.log(`✅ Salvaged ${partialResults.length} test cases from truncated response`)
        return partialResults
      }
      
      // Log the full content for debugging
      console.error('❌ All parsing attempts failed. Full content:', content)
      
      // Provide a more helpful error message
      const errorMessage = content.length > 1000 
        ? `Response too long (${content.length} chars). Check token limits. Content preview: ${content.substring(0, 300)}...`
        : `Failed to parse response as JSON. Content: ${content}`
      
      throw new AIProviderError(`Failed to parse OpenAI response as JSON. ${errorMessage}`)
    }
  }

  private getNextSequentialId(): string {
    const nextNumber = this.getNextIdNumber();
    return `TC-${String(nextNumber).padStart(3, '0')}`;
  }

  private getNextIdNumber(): number {
    // Get existing test cases from localStorage to find the highest ID number
    try {
      const existingTestCases = localStorage.getItem('testCaseWriterLibrary');
      if (!existingTestCases) {
        return 1;
      }
      
      const testCases = JSON.parse(existingTestCases);
      let maxNumber = 0;
      
      // Find the highest TC number in existing test cases
      testCases.forEach((tc: any) => {
        if (tc.id && tc.id.startsWith('TC-')) {
          const match = tc.id.match(/^TC-(\d+)$/);
          if (match) {
            const number = parseInt(match[1], 10);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }
      });
      
      return maxNumber + 1;
    } catch (error) {
      console.warn('Error reading existing test cases for ID generation:', error);
      return 1;
    }
  }

  private extractPartialTestCases(content: string): TestCase[] {
    console.log('🔍 Attempting to extract partial test cases...')
    const results: TestCase[] = []
    
    try {
      // Look for complete test case objects in the truncated response
      const testCasePattern = /"id":\s*"[^"]*",[\s\S]*?(?="id":|$)/g
      const matches = content.match(testCasePattern)
      
      if (matches) {
        for (const match of matches) {
          try {
            // Try to construct a valid JSON object from the match
            let testCaseJson = '{' + match
            
            // Remove trailing incomplete parts
            testCaseJson = testCaseJson.replace(/,\s*$/, '')
            
            // Try to close any unclosed structures
            const openBraces = (testCaseJson.match(/{/g) || []).length
            const closeBraces = (testCaseJson.match(/}/g) || []).length
            const openBrackets = (testCaseJson.match(/\[/g) || []).length
            const closeBrackets = (testCaseJson.match(/]/g) || []).length
            
            // Add missing closing brackets and braces
            for (let i = 0; i < openBrackets - closeBrackets; i++) {
              testCaseJson += ']'
            }
            for (let i = 0; i < openBraces - closeBraces; i++) {
              testCaseJson += '}'
            }
            
            const parsed = JSON.parse(testCaseJson)
            if (parsed.id && parsed.testCase) {
              results.push(parsed)
              console.log(`✅ Extracted partial test case: ${parsed.id}`)
            }
          } catch (parseError) {
            console.log(`⚠️ Failed to parse partial test case:`, parseError)
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Pattern matching failed:', error)
    }
    
    return results
  }

  private formatTestCases(testCases: TestCase[]): TestCase[] {
    // Generate sequential IDs for the batch starting from the next available number
    let nextIdNumber = this.getNextIdNumber();
    
    return testCases.map((tc, index) => ({
      id: `TC-${String(nextIdNumber + index).padStart(3, '0')}`, // Force sequential IDs
      templateId: tc.templateId || 'ai-generated',
      projectId: tc.projectId || 'default',
      module: tc.module || 'General',
      testCase: tc.testCase || 'Test Case',
      testSteps: tc.testSteps || [],
      testResult: tc.testResult || 'Not Executed',
      qa: tc.qa || '',
      remarks: tc.remarks || 'Generated from requirements',
      data: tc.data || { title: tc.testCase || 'Test Case', description: tc.testCase || '' },
      status: tc.status || 'draft',
      priority: tc.priority || 'medium',
      tags: tc.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai-assistant',
      lastModifiedBy: 'ai-assistant',
      estimatedTime: tc.estimatedTime || undefined,
      actualTime: tc.actualTime || undefined,
      enhancement: tc.enhancement || undefined,
      ticketId: tc.ticketId || undefined,
      epic: tc.epic || undefined,
      feature: tc.feature || tc.module || 'General'
    }))
  }
}

class GeminiProvider implements BaseAIProvider {
  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
    const { documents, template, config, aiConfig } = request

    if (!aiConfig.apiKey) {
      throw new AIProviderError('Google AI API key is required', undefined, 'gemini')
    }

    try {
      const documentContent = documents.join('\n\n')
      
      const prompt = `You are an expert QA engineer specializing in comprehensive test case generation.\n\nYour task is to analyze requirements documents and generate EXACTLY ${config.maxTestCases} comprehensive test cases following this template format:\n\n${template}\n\nCRITICAL REQUIREMENTS FOR COMPREHENSIVE COVERAGE:\n\n1. FOR EACH REQUIREMENT, create multiple test cases covering:\n   - POSITIVE SCENARIOS: Happy path with valid data, boundary conditions, different data types\n   - NEGATIVE SCENARIOS: Invalid inputs, missing fields, error conditions, unauthorized access\n   - EDGE CASES: Extremely large/small values, special characters, concurrent operations\n   - INTEGRATION SCENARIOS: API interactions, database operations, external services\n   - SECURITY SCENARIOS: Input validation, authentication, data sanitization\n   - PERFORMANCE SCENARIOS: Load conditions, resource limits, timeouts\n\n2. TEST CASE STRUCTURE:\n   - Each test case MUST have AT LEAST 5-8 detailed test steps\n   - Include specific test data and expected results for each step\n   - Cover setup, execution, validation, and cleanup phases\n   - Consider different user roles and permissions\n   - Include realistic test data and conditions\n\n3. QUALITY STANDARDS:\n   - Ensure 100% requirement coverage across all test cases\n   - Each test case must be specific and actionable\n   - Consider business impact and risk levels\n   - Generate test cases that can be executed immediately\n\nRequirements document:\n${documentContent}\n\nGenerate EXACTLY ${config.maxTestCases} comprehensive test cases in JSON format as an array. Ensure 100% requirement coverage with detailed, actionable test cases.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: aiConfig.temperature,
            maxOutputTokens: aiConfig.maxTokens,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          errorData.error?.message || `Gemini API error: ${response.status}`,
          response.status,
          'gemini'
        )
      }

      const data = await response.json()
      const content = data.candidates[0]?.content?.parts[0]?.text

      if (!content) {
        throw new AIProviderError('No content received from Gemini API', undefined, 'gemini')
      }

      // Gemini doesn't provide detailed usage stats in the same format
      const usage: TokenUsageData = {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }

      let testCases: TestCase[] = this.parseTestCases(content)
      
      // Enforce maxTestCases limit client-side for OpenAI
      if (testCases.length > config.maxTestCases) {
        console.log(`🔥 OpenAI generated ${testCases.length} test cases, limiting to ${config.maxTestCases} as requested`)
        testCases = testCases.slice(0, config.maxTestCases)
      }
      
      const formattedTestCases = this.formatTestCases(testCases)

      return {
        testCases: formattedTestCases,
        usage
      }

    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      throw new AIProviderError(`Unexpected Gemini error: ${error.message}`, undefined, 'gemini')
    }
  }

  private parseTestCases(content: string): TestCase[] {
    // Similar parsing logic as OpenAI but adapted for Gemini responses
    try {
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : parsed.testCases || []
    } catch (parseError) {
      // Try to extract JSON from markdown or other formatting
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch (secondParseError) {
          console.error('Failed to parse Gemini JSON:', secondParseError)
        }
      }
      
      throw new AIProviderError(`Failed to parse Gemini response as JSON`)
    }
  }

  private formatTestCases(testCases: TestCase[]): TestCase[] {
    // Generate sequential IDs for the batch starting from the next available number
    let nextIdNumber = this.getNextIdNumber();
    
    return testCases.map((tc, index) => ({
      id: `TC-${String(nextIdNumber + index).padStart(3, '0')}`, // Force sequential IDs
      templateId: tc.templateId || 'ai-generated',
      projectId: tc.projectId || 'default',
      module: tc.module || 'General',
      testCase: tc.testCase || 'Test Case',
      testSteps: tc.testSteps || [],
      testResult: tc.testResult || 'Not Executed',
      qa: tc.qa || '',
      remarks: tc.remarks || 'Generated from requirements',
      data: tc.data || { title: tc.testCase || 'Test Case', description: tc.testCase || '' },
      status: tc.status || 'draft',
      priority: tc.priority || 'medium',
      tags: tc.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai-assistant',
      lastModifiedBy: 'ai-assistant',
      estimatedTime: tc.estimatedTime || undefined,
      actualTime: tc.actualTime || undefined,
      enhancement: tc.enhancement || undefined,
      ticketId: tc.ticketId || undefined,
      epic: tc.epic || undefined,
      feature: tc.feature || tc.module || 'General'
    }))
  }
}

class ClaudeProvider implements BaseAIProvider {
  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
    const { documents, template, config, aiConfig } = request

    if (!aiConfig.apiKey) {
      throw new AIProviderError('Anthropic API key is required', undefined, 'claude')
    }

    try {
      const documentContent = documents.join('\n\n')
      
      const systemPrompt = `You are an expert QA engineer specializing in comprehensive test case generation.\n\nYour task is to analyze requirements documents and generate EXACTLY ${config.maxTestCases} comprehensive test cases following the provided template format.\n\nCRITICAL REQUIREMENTS FOR COMPREHENSIVE COVERAGE:\n\n1. FOR EACH REQUIREMENT, create multiple test cases covering:\n   - POSITIVE SCENARIOS: Happy path with valid data, boundary conditions, different data types\n   - NEGATIVE SCENARIOS: Invalid inputs, missing fields, error conditions, unauthorized access\n   - EDGE CASES: Extremely large/small values, special characters, concurrent operations\n   - INTEGRATION SCENARIOS: API interactions, database operations, external services\n   - SECURITY SCENARIOS: Input validation, authentication, data sanitization\n   - PERFORMANCE SCENARIOS: Load conditions, resource limits, timeouts\n\n2. TEST CASE STRUCTURE:\n   - Each test case MUST have AT LEAST 5-8 detailed test steps\n   - Include specific test data and expected results for each step\n   - Cover setup, execution, validation, and cleanup phases\n   - Consider different user roles and permissions\n   - Include realistic test data and conditions\n\n3. QUALITY STANDARDS:\n   - Ensure 100% requirement coverage across all test cases\n   - Each test case must be specific and actionable\n   - Consider business impact and risk levels\n   - Generate test cases that can be executed immediately`
      
      const userPrompt = `Generate EXACTLY ${config.maxTestCases} comprehensive test cases using this template:\n\n${template}\n\nRequirements document:\n${documentContent}\n\nIMPORTANT: Generate comprehensive test cases that cover EVERY requirement with multiple test scenarios:\n- Positive, negative, and edge case testing\n- Security and performance considerations\n- Integration and user workflow coverage\n- Realistic test data and conditions\n\nEnsure 100% requirement coverage with detailed, actionable test cases. Generate in JSON array format.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': aiConfig.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiConfig.model,
          max_tokens: aiConfig.maxTokens,
          temperature: aiConfig.temperature,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          errorData.error?.message || `Claude API error: ${response.status}`,
          response.status,
          'claude'
        )
      }

      const data = await response.json()
      const content = data.content[0]?.text

      if (!content) {
        throw new AIProviderError('No content received from Claude API', undefined, 'claude')
      }

      const usage: TokenUsageData = {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }

      let testCases: TestCase[] = this.parseTestCases(content)
      
      // Enforce maxTestCases limit client-side for OpenAI
      if (testCases.length > config.maxTestCases) {
        console.log(`🔥 OpenAI generated ${testCases.length} test cases, limiting to ${config.maxTestCases} as requested`)
        testCases = testCases.slice(0, config.maxTestCases)
      }
      
      const formattedTestCases = this.formatTestCases(testCases)

      return {
        testCases: formattedTestCases,
        usage
      }

    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      throw new AIProviderError(`Unexpected Claude error: ${error.message}`, undefined, 'claude')
    }
  }

  private parseTestCases(content: string): TestCase[] {
    try {
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : parsed.testCases || []
    } catch (parseError) {
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1])
        } catch (secondParseError) {
          console.error('Failed to parse Claude JSON:', secondParseError)
        }
      }
      
      throw new AIProviderError(`Failed to parse Claude response as JSON`)
    }
  }

  private formatTestCases(testCases: TestCase[]): TestCase[] {
    // Generate sequential IDs for the batch starting from the next available number
    let nextIdNumber = this.getNextIdNumber();
    
    return testCases.map((tc, index) => ({
      id: `TC-${String(nextIdNumber + index).padStart(3, '0')}`, // Force sequential IDs
      templateId: tc.templateId || 'ai-generated',
      projectId: tc.projectId || 'default',
      module: tc.module || 'General',
      testCase: tc.testCase || 'Test Case',
      testSteps: tc.testSteps || [],
      testResult: tc.testResult || 'Not Executed',
      qa: tc.qa || '',
      remarks: tc.remarks || 'Generated from requirements',
      data: tc.data || { title: tc.testCase || 'Test Case', description: tc.testCase || '' },
      status: tc.status || 'draft',
      priority: tc.priority || 'medium',
      tags: tc.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai-assistant',
      lastModifiedBy: 'ai-assistant',
      estimatedTime: tc.estimatedTime || undefined,
      actualTime: tc.actualTime || undefined,
      enhancement: tc.enhancement || undefined,
      ticketId: tc.ticketId || undefined,
      epic: tc.epic || undefined,
      feature: tc.feature || tc.module || 'General'
    }))
  }
}

class GrokProvider implements BaseAIProvider {
  async generateTestCases(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
    const { documents, template, config, aiConfig } = request

    if (!aiConfig.apiKey) {
      throw new AIProviderError('xAI API key is required', undefined, 'grok')
    }

    try {
      const documentContent = documents.join('\n\n')
      
      const documentFocusPrefix = aiConfig.documentFocused 
        ? `🚨 STRICT DOCUMENT-ONLY MODE ENABLED 🚨\nABSOLUTELY CRITICAL: You MUST ONLY generate test cases based on the specific content in the uploaded documents.\n\n`
        : ''

      const systemPrompt = `${documentFocusPrefix}You are an expert QA engineer specializing in comprehensive test case generation.\n\nYour task is to analyze requirements documents and generate EXHAUSTIVE test coverage following this template format:\n\n${template}\n\nCRITICAL REQUIREMENTS FOR COMPREHENSIVE COVERAGE:\n\n1. FOR EACH REQUIREMENT, create multiple test cases covering:\n   - POSITIVE SCENARIOS: Happy path with valid data, boundary conditions, different data types\n   - NEGATIVE SCENARIOS: Invalid inputs, missing fields, error conditions, unauthorized access\n   - EDGE CASES: Extremely large/small values, special characters, concurrent operations\n   - INTEGRATION SCENARIOS: API interactions, database operations, external services\n   - SECURITY SCENARIOS: Input validation, authentication, data sanitization\n   - PERFORMANCE SCENARIOS: Load conditions, resource limits, timeouts\n\n2. TEST CASE STRUCTURE:\n   - Each test case must be specific and actionable\n   - Include detailed test steps with specific test data\n   - Specify expected results for each step\n   - Cover all possible user workflows and business logic\n   - Consider different user roles and permissions\n\n3. QUALITY STANDARDS:\n   - Ensure 100% requirement coverage\n   - Include realistic test data and conditions\n   - Consider business impact and risk levels\n   - Generate test cases that can be executed immediately\n\nGenerate test cases in JSON format with this structure:\n[\n  {\n    "id": "TC-0001",\n    "module": "Module Name",\n    "testCase": "Detailed test case description covering specific scenario",\n    "testSteps": [\n      {\n        "step": 1,\n        "description": "Specific step description with test data",\n        "testData": "Specific test data values",\n        "expectedResult": "Detailed expected result"\n      }\n    ],\n    "testResult": "Not Executed",\n    "qa": "QA notes for this test case",\n    "remarks": "Additional context or risk considerations"\n  }\n]`

      const userPrompt = `Please analyze the following requirements document and generate EXHAUSTIVE test coverage:\n\nDOCUMENT CONTENT:\n${documentContent}\n\nIMPORTANT: Generate comprehensive test cases that cover EVERY requirement with multiple test scenarios:\n- Positive, negative, and edge case testing\n- Security and performance considerations\n- Integration and user workflow coverage\n- Realistic test data and conditions\n\nEnsure 100% requirement coverage with detailed, actionable test cases.`

      const requestBody = {
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: aiConfig.maxTokens,
        temperature: aiConfig.temperature,
        stream: false
      }

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new AIProviderError(
          errorData.error?.message || `Grok API error: ${response.status}`,
          response.status,
          'grok'
        )
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new AIProviderError('No content received from Grok API', undefined, 'grok')
      }

      const usage: TokenUsageData = {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }

      let testCases: TestCase[] = this.parseTestCases(content)
      
      // Enforce maxTestCases limit client-side for OpenAI
      if (testCases.length > config.maxTestCases) {
        console.log(`🔥 OpenAI generated ${testCases.length} test cases, limiting to ${config.maxTestCases} as requested`)
        testCases = testCases.slice(0, config.maxTestCases)
      }
      
      const formattedTestCases = this.formatTestCases(testCases)

      return {
        testCases: formattedTestCases,
        usage
      }

    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new AIProviderError('Network error: Unable to connect to Grok API', undefined, 'grok')
      }
      
      throw new AIProviderError(`Unexpected Grok error: ${error.message}`, undefined, 'grok')
    }
  }

  private parseTestCases(content: string): TestCase[] {
    try {
      const parsed = JSON.parse(content)
      return Array.isArray(parsed) ? parsed : parsed.testCases || []
    } catch (parseError) {
      console.log('Initial JSON parse failed, trying to extract JSON from response...')
      
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          return Array.isArray(parsed) ? parsed : parsed.testCases || []
        } catch (secondParseError) {
          console.error('Failed to parse extracted JSON:', secondParseError)
        }
      }
      
      const jsonStartIndex = content.indexOf('[')
      const jsonEndIndex = content.lastIndexOf(']')
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        try {
          const extractedJson = content.substring(jsonStartIndex, jsonEndIndex + 1)
          const parsed = JSON.parse(extractedJson)
          return Array.isArray(parsed) ? parsed : []
        } catch (thirdParseError) {
          console.error('Failed to parse extracted JSON array:', thirdParseError)
        }
      }
      
      throw new AIProviderError(`Failed to parse Grok response as JSON. Response preview: ${content.substring(0, 200)}...`)
    }
  }

  private formatTestCases(testCases: TestCase[]): TestCase[] {
    // Generate sequential IDs for the batch starting from the next available number
    let nextIdNumber = this.getNextIdNumber();
    
    return testCases.map((tc, index) => ({
      id: `TC-${String(nextIdNumber + index).padStart(3, '0')}`, // Force sequential IDs
      templateId: tc.templateId || 'ai-generated',
      projectId: tc.projectId || 'default',
      module: tc.module || 'General',
      testCase: tc.testCase || 'Test Case',
      testSteps: tc.testSteps || [],
      testResult: tc.testResult || 'Not Executed',
      qa: tc.qa || '',
      remarks: tc.remarks || 'Generated from requirements',
      data: tc.data || { title: tc.testCase || 'Test Case', description: tc.testCase || '' },
      status: tc.status || 'draft',
      priority: tc.priority || 'medium',
      tags: tc.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'ai-assistant',
      lastModifiedBy: 'ai-assistant',
      estimatedTime: tc.estimatedTime || undefined,
      actualTime: tc.actualTime || undefined,
      enhancement: tc.enhancement || undefined,
      ticketId: tc.ticketId || undefined,
      epic: tc.epic || undefined,
      feature: tc.feature || tc.module || 'General'
    }))
  }
}

// Provider factory
const providers: Record<string, BaseAIProvider> = {
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
  claude: new ClaudeProvider(),
  grok: new GrokProvider()
}

export async function generateTestCasesWithAI(request: TestCaseGenerationRequest): Promise<TestCaseGenerationResult> {
  const provider = providers[request.aiConfig.providerId]
  
  if (!provider) {
    throw new AIProviderError(`Unsupported AI provider: ${request.aiConfig.providerId}`)
  }

  return provider.generateTestCases(request)
}

export function getAvailableProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS)
}

export function getProvider(providerId: string): AIProvider | undefined {
  return AI_PROVIDERS[providerId]
}

export function calculateCost(providerId: string, model: string, inputTokens: number, outputTokens: number): number {
  const provider = AI_PROVIDERS[providerId]
  if (!provider) return 0
  
  const pricing = provider.pricing[model]
  if (!pricing) return 0
  
  return (inputTokens * pricing.input) + (outputTokens * pricing.output)
}