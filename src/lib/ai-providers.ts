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
      const documentContent = documents.join('\n\n')
      
      const documentFocusPrefix = aiConfig.documentFocused 
        ? `🚨 STRICT DOCUMENT-ONLY MODE ENABLED 🚨\nABSOLUTELY CRITICAL: You MUST ONLY generate test cases based on the specific content in the uploaded documents.\n\n`
        : ''

      const systemPrompt = `${documentFocusPrefix}You are an expert QA engineer specializing in test case generation.\n\nYour task is to analyze requirements documents and generate EXACTLY ${config.maxTestCases} test cases following this template format:\n\n${template}\n\nIMPORTANT: Generate EXACTLY ${config.maxTestCases} test cases, no more, no less.\n\nCRITICAL: Each test case MUST have AT LEAST 5-8 detailed test steps to ensure comprehensive testing. Create thorough, step-by-step test scenarios that cover setup, execution, validation, and cleanup phases.\n\nGenerate test cases in JSON format with this structure:\n[\n  {\n    "id": "TC-0001",\n    "module": "Module Name",\n    "testCase": "Detailed test case description explaining the specific scenario being tested",\n    "testSteps": [\n      {\n        "step": 1,\n        "description": "Navigate to the application login page",\n        "testData": "Valid username and password credentials",\n        "expectedResult": "Login page displays correctly with username and password fields"\n      },\n      {\n        "step": 2,\n        "description": "Enter valid username in the username field",\n        "testData": "username: testuser@example.com",\n        "expectedResult": "Username is entered successfully without validation errors"\n      },\n      {\n        "step": 3,\n        "description": "Enter valid password in the password field",\n        "testData": "password: ValidPass123!",\n        "expectedResult": "Password is masked and entered successfully"\n      },\n      {\n        "step": 4,\n        "description": "Click the Login button to submit credentials",\n        "testData": "N/A",\n        "expectedResult": "Login button triggers authentication process"\n      },\n      {\n        "step": 5,\n        "description": "Verify successful authentication and dashboard loading",\n        "testData": "N/A",\n        "expectedResult": "User is redirected to dashboard with welcome message displayed"\n      }\n    ],\n    "testResult": "Not Executed",\n    "qa": "",\n    "remarks": "Generated from requirements"\n  }\n]`

      const userPrompt = `Please analyze the following requirements document and generate EXACTLY ${config.maxTestCases} test cases:\n\nDOCUMENT CONTENT:\n${documentContent}\n\nCONFIGURATION:\n- Maximum test cases: ${config.maxTestCases}\n- Coverage: ${config.coverage}\n- Include negative tests: ${config.includeNegativeTests}\n- Include edge cases: ${config.includeEdgeCases}\n- Custom instructions: ${config.customInstructions}\n\nGenerate EXACTLY ${config.maxTestCases} test cases based on the ACTUAL requirements above. Do not exceed this limit.`

      const supportsJsonFormat = aiConfig.model.includes('gpt-4') || 
                                 aiConfig.model.includes('gpt-4o') || 
                                 aiConfig.model.includes('gpt-3.5-turbo')

      const requestBody: any = {
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: aiConfig.maxTokens,
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
      
      throw new AIProviderError(`Failed to parse OpenAI response as JSON. Response preview: ${content.substring(0, 200)}...`)
    }
  }

  private formatTestCases(testCases: TestCase[]): TestCase[] {
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    
    return testCases.map((tc, index) => ({
      id: tc.id || `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`,
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
      
      const prompt = `You are an expert QA engineer. Generate test cases based on this template:\n\n${template}\n\nRequirements document:\n${documentContent}\n\nGenerate ${config.maxTestCases} test cases in JSON format as an array.`

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
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    
    return testCases.map((tc, index) => ({
      id: tc.id || `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`,
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
      
      const systemPrompt = `You are an expert QA engineer specializing in test case generation. Generate test cases based on the provided template and requirements documents.`
      
      const userPrompt = `Generate test cases using this template:\n\n${template}\n\nRequirements document:\n${documentContent}\n\nGenerate ${config.maxTestCases} test cases in JSON array format.`

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
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    
    return testCases.map((tc, index) => ({
      id: tc.id || `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`,
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

      const systemPrompt = `${documentFocusPrefix}You are an expert QA engineer specializing in test case generation.\n\nYour task is to analyze requirements documents and generate comprehensive test cases following this template format:\n\n${template}\n\nGenerate test cases in JSON format with this structure:\n[\n  {\n    "id": "TC-0001",\n    "module": "Module Name",\n    "testCase": "Test case description",\n    "testSteps": [\n      {\n        "step": 1,\n        "description": "Step description",\n        "testData": "Test data",\n        "expectedResult": "Expected result"\n      }\n    ],\n    "testResult": "Not Executed",\n    "qa": "",\n    "remarks": "Generated from requirements"\n  }\n]`

      const userPrompt = `Please analyze the following requirements document and generate test cases:\n\nDOCUMENT CONTENT:\n${documentContent}\n\nGenerate comprehensive test cases based on the ACTUAL requirements above.`

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
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    
    return testCases.map((tc, index) => ({
      id: tc.id || `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`,
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