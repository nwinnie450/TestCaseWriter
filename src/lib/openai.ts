import { TestCase } from '@/types'

export interface OpenAIConfig {
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
  aiConfig: OpenAIConfig
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

export class OpenAIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export async function generateTestCasesWithAI(request: any): Promise<any> {
  const { documents, template, config, aiConfig } = request

  if (!aiConfig.apiKey) {
    throw new OpenAIError('OpenAI API key is required')
  }

  // Validate document requirements
  if (aiConfig.requireDocuments && (!documents || documents.length === 0 || documents.every((doc: any) => !doc.trim()))) {
    throw new OpenAIError('Documents are required for test case generation. Please upload requirements documents first.')
  }

  try {
    // Combine all document content
    const documentContent = documents.join('\n\n')
    
    // Log document content for debugging (first 500 characters of each document)
    console.log('Document content being sent to AI:')
    documents.forEach((doc: any, index: number) => {
      const preview = doc.substring(0, 500) + (doc.length > 500 ? '...' : '')
      console.log(`Document ${index + 1}:`, preview)
    })
    
    // Create the system prompt with enhanced document focus
    const documentFocusPrefix = aiConfig.documentFocused 
      ? `🚨 STRICT DOCUMENT-ONLY MODE ENABLED 🚨
ABSOLUTELY CRITICAL: You MUST ONLY generate test cases based on the specific content in the uploaded documents. DO NOT create any generic, assumed, or hypothetical test cases. If the documents don't contain enough information for a test case, do not create it.

MANDATORY REQUIREMENTS:
- Every test case MUST reference a specific section, requirement, or feature from the uploaded documents
- Include the exact document reference in the "remarks" field (e.g., "Based on Section 3.2: User Authentication Requirements")
- Do NOT make assumptions about functionality not explicitly described in the documents
- If fewer than ${config.maxTestCases} test cases can be derived from the documents, generate only what the documents support

` : ''

    const systemPrompt = `${documentFocusPrefix}
    
Your task is to analyze requirements documents and generate comprehensive test cases following this template format:

${template}

CRITICAL REQUIREMENTS:
1. Analyze the ACTUAL document content provided - do NOT generate generic test cases
2. Extract specific requirements, user stories, and acceptance criteria from the documents
3. Generate test cases that directly test the requirements found in the documents
4. Each test case must be traceable to a specific requirement or feature mentioned
5. Include document references in test case remarks

Guidelines:
- Generate ${config.maxTestCases} test cases maximum (or fewer if documents don't support more)
- Coverage level: ${config.coverage}
- Include negative tests: ${config.includeNegativeTests ? 'Yes' : 'No'}
- Include edge cases: ${config.includeEdgeCases ? 'Yes' : 'No'}
- Custom instructions: ${config.customInstructions}

${aiConfig.customPrompt}

Generate test cases in JSON format with this structure:
[
  {
    "id": "TC-0001",
    "module": "Module Name (based on requirements)",
    "testCase": "Specific test case based on actual requirements",
    "testSteps": [
      {
        "step": 1,
        "description": "Step description",
        "testData": "Test data if any",
        "expectedResult": "Expected result"
      }
    ],
    "testResult": "Not Executed",
    "qa": "",
    "remarks": "Generated from requirements: [specific requirement reference]"
  }
]`

    // Create the user prompt with document content
    const documentAnalysisInstructions = aiConfig.documentFocused
      ? `ANALYZE THIS DOCUMENT CONTENT ONLY:
${documentContent}

Generate test cases based on the above content. Do NOT create generic test cases.`
      : `Document content to analyze:
${documentContent}`

    const userPrompt = `${documentAnalysisInstructions}

Please generate ${config.maxTestCases} test cases following the template format above.`

    // Make API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: aiConfig.maxTokens || 4000,
        temperature: aiConfig.temperature || 0.3,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new OpenAIError(`OpenAI API error: ${response.status} ${response.statusText}`, response.status)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new OpenAIError('No content received from OpenAI API')
    }

    // Parse the JSON response
    let testCases: any[]
    try {
      const parsed = JSON.parse(content)
      testCases = Array.isArray(parsed) ? parsed : parsed.testCases || []
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content.substring(0, 200))
      throw new OpenAIError('Failed to parse OpenAI response as JSON')
    }

    // Validate test cases
    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new OpenAIError('No valid test cases received from OpenAI API')
    }
    
    // Enforce maxTestCases limit client-side
    if (testCases.length > config.maxTestCases) {
      console.log(`🔥 AI generated ${testCases.length} test cases, limiting to ${config.maxTestCases} as requested`)
      testCases = testCases.slice(0, config.maxTestCases)
    }

    // Get usage information
    const usage = {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0
    }

    // Validate and format test cases with truly unique IDs
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 5)
    const formattedTestCases = testCases.map((tc: any, index: number) => ({
      id: tc.id || `TC-${timestamp}-${randomSuffix}-${String(index + 1).padStart(2, '0')}`,
      templateId: tc.templateId || 'ai-generated',
      projectId: tc.projectId || 'default',
      module: tc.module || 'General',
      testCase: tc.testCase || 'Test Case',
      testSteps: tc.testSteps || [],
      testResult: tc.testResult || 'Not Executed',
      qa: tc.qa || '',
      remarks: tc.remarks || 'Generated from requirements',
      // Required TestCase interface fields
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
      
      // Grouping fields
      enhancement: tc.enhancement || undefined,
      ticketId: tc.ticketId || undefined,
      epic: tc.epic || undefined,
      feature: tc.feature || tc.module || 'General'
    }))

    return {
      testCases: formattedTestCases,
      usage
    }

  } catch (error: any) {
    if (error instanceof OpenAIError) {
      throw error
    }
    
    // Handle network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new OpenAIError('Network error: Unable to connect to OpenAI API')
    }
    
    throw new OpenAIError(`Unexpected error: ${error.message}`)
  }
}

// Mock function for development/testing when no API key is available
export async function generateMockTestCases(request: TestCaseGenerationRequest): Promise<TestCase[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 5)
  
  const baseTestCases: TestCase[] = [
    {
      id: `TC-${timestamp}-${randomSuffix}-01`, // Unique ID
      templateId: 'mock-template',
      projectId: 'mock-project',
      data: {
        module: 'Authentication',
        testCase: 'User Login with Valid Credentials',
        testSteps: [
          { step: 1, description: 'Navigate to login page', testData: '', expectedResult: 'Login page displays' },
          { step: 2, description: 'Enter valid credentials', testData: 'user@example.com, password123', expectedResult: 'Credentials accepted' },
          { step: 3, description: 'Click login button', testData: '', expectedResult: 'User redirected to dashboard' }
        ],
        testResult: 'Not Executed',
        qa: '',
        remarks: 'Generated from requirements document'
      },
      status: 'draft',
      priority: 'medium',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock-system',
      module: 'Authentication',
      testCase: 'User Login with Valid Credentials',
      testSteps: [
        { step: 1, description: 'Navigate to login page', testData: '', expectedResult: 'Login page displays' },
        { step: 2, description: 'Enter valid credentials', testData: 'user@example.com, password123', expectedResult: 'Credentials accepted' },
        { step: 3, description: 'Click login button', testData: '', expectedResult: 'User redirected to dashboard' }
      ],
      testResult: 'Not Executed',
      qa: '',
      remarks: 'Generated from requirements document'
    },
    {
      id: `TC-${timestamp}-${randomSuffix}-02`, // Unique ID
      templateId: 'mock-template',
      projectId: 'mock-project',
      data: {
        module: 'Authentication',
        testCase: 'User Login with Invalid Password',
        testSteps: [
          { step: 1, description: 'Navigate to login page', testData: '', expectedResult: 'Login page displays' },
          { step: 2, description: 'Enter valid username, invalid password', testData: 'user@example.com, wrongpassword', expectedResult: 'Error message shown' },
          { step: 3, description: 'Verify user remains on login page', testData: '', expectedResult: 'User not logged in' }
        ],
        testResult: 'Not Executed',
        qa: '',
        remarks: 'Negative test case - Generated from security requirements'
      },
      status: 'draft',
      priority: 'medium',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'mock-system',
      module: 'Authentication',
      testCase: 'User Login with Invalid Password',
      testSteps: [
        { step: 1, description: 'Navigate to login page', testData: '', expectedResult: 'Login page displays' },
        { step: 2, description: 'Enter valid username, invalid password', testData: 'user@example.com, wrongpassword', expectedResult: 'Error message shown' },
        { step: 3, description: 'Verify user remains on login page', testData: '', expectedResult: 'User not logged in' }
      ],
      testResult: 'Not Executed',
      qa: '',
      remarks: 'Negative test case - Generated from security requirements'
    }
  ]

  const testCases = (() => {
    const cases = [...baseTestCases]
    
    if (config.includeEdgeCases) {
      cases.push({
        id: 'TC-0003',
        module: 'Authentication',
        testCase: 'Login with Maximum Length Username',
        testSteps: [
          { step: 1, description: 'Enter username with 255 characters', testData: 'a'.repeat(255) + '@example.com', expectedResult: 'System accepts maximum length' }
        ],
        testResult: 'Not Executed',
        qa: '',
        remarks: 'Edge case - Maximum boundary testing'
      })
    }

    if (config.includeNegativeTests) {
      cases.push({
        id: 'TC-0004',
        module: 'User Management',
        testCase: 'Create User with Duplicate Email',
        testSteps: [
          { step: 1, description: 'Attempt to create user with existing email', testData: 'existing@example.com', expectedResult: 'Error message displayed' }
        ],
        testResult: 'Not Executed',
        qa: '',
        remarks: 'Negative test - Duplicate validation'
      })
    }

    // Limit to max test cases configured
    return cases.slice(0, Math.min(config.maxTestCases, cases.length))
  })()

  return testCases
}
