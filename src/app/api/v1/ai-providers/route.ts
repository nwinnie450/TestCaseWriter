import { NextResponse } from 'next/server'

// AI provider configurations
const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Advanced language models with excellent JSON support and streaming capabilities',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable GPT-4 model with improved reasoning and coding abilities',
        inputCost: 0.005,
        outputCost: 0.015,
        maxTokens: 128000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        contextWindow: '128K tokens'
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Optimized GPT-4 model with improved performance and lower costs',
        inputCost: 0.01,
        outputCost: 0.03,
        maxTokens: 128000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        contextWindow: '128K tokens'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Original GPT-4 model with excellent reasoning capabilities',
        inputCost: 0.03,
        outputCost: 0.06,
        maxTokens: 8192,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        contextWindow: '8K tokens'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective model for most use cases',
        inputCost: 0.0015,
        outputCost: 0.002,
        maxTokens: 16385,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        contextWindow: '16K tokens'
      }
    ],
    features: [
      'json_format',
      'streaming',
      'function_calling',
      'fine_tuning',
      'embeddings',
      'moderation'
    ],
    website: 'https://openai.com',
    documentation: 'https://platform.openai.com/docs'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Advanced AI models with excellent reasoning and safety features',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest Claude model with improved reasoning and coding abilities',
        inputCost: 0.003,
        outputCost: 0.015,
        maxTokens: 200000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        contextWindow: '200K tokens'
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Most capable Claude model for complex reasoning tasks',
        inputCost: 0.015,
        outputCost: 0.075,
        maxTokens: 200000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        contextWindow: '200K tokens'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced Claude model with good performance and reasonable cost',
        inputCost: 0.003,
        outputCost: 0.015,
        maxTokens: 200000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        contextWindow: '200K tokens'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest Claude model for simple tasks and high-volume use',
        inputCost: 0.00025,
        outputCost: 0.00125,
        maxTokens: 200000,
        supportsJson: true,
        supportsStreaming: true,
        supportsFunctionCalling: false,
        contextWindow: '200K tokens'
      }
    ],
    features: [
      'json_format',
      'streaming',
      'safety_features',
      'constitutional_ai',
      'long_context'
    ],
    website: 'https://anthropic.com',
    documentation: 'https://docs.anthropic.com'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s advanced AI models with excellent multimodal capabilities',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini model with 1M token context window',
        inputCost: 0.007,
        outputCost: 0.021,
        maxTokens: 1000000,
        supportsJson: true,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast Gemini model with 1M token context and lower costs',
        inputCost: 0.00035,
        outputCost: 0.00105,
        maxTokens: 1000000,
        supportsJson: true,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        contextWindow: '1M tokens'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Standard Gemini model with good performance and reasonable cost',
        inputCost: 0.0005,
        outputCost: 0.0015,
        maxTokens: 32768,
        supportsJson: true,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        contextWindow: '32K tokens'
      }
    ],
    features: [
      'json_format',
      'multimodal',
      'long_context',
      'google_integration'
    ],
    website: 'https://ai.google.dev',
    documentation: 'https://ai.google.dev/docs'
  },
  {
    id: 'grok',
    name: 'xAI Grok',
    description: 'xAI\'s AI model with real-time information access',
    models: [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        description: 'xAI\'s conversational AI model with real-time knowledge',
        inputCost: 0.0001,
        outputCost: 0.0001,
        maxTokens: 8192,
        supportsJson: false,
        supportsStreaming: false,
        supportsFunctionCalling: false,
        contextWindow: '8K tokens'
      }
    ],
    features: [
      'real_time_knowledge',
      'conversational',
      'x_platform_integration'
    ],
    website: 'https://x.ai',
    documentation: 'https://docs.x.ai'
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        providers: AI_PROVIDERS,
        totalProviders: AI_PROVIDERS.length,
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('AI Providers API error:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: error.message
      }
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'POST method not supported'
    }
  }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'PUT method not supported'
    }
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'DELETE method not supported'
    }
  }, { status: 405 })
}
