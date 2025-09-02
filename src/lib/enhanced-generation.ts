import { TestCase } from '@/types'
import { TestCaseContext } from '@/components/generate/EnhancedConfigForm'
import { DocumentContext } from './document-analyzer'
import { ContextualPromptGenerator, ContextualPromptConfig } from './context-aware-prompts'
import { ProgressiveTestCaseGenerator, QualityMetrics, GenerationFeedback } from './progressive-generation'
import { generateTestCasesWithAI } from './ai-providers'

export interface EnhancedGenerationConfig {
  // Basic config
  coverage: 'comprehensive' | 'focused' | 'minimal'
  includeNegativeTests: boolean
  includeEdgeCases: boolean
  maxTestCases: number
  customInstructions: string
  
  // Enhanced config
  enableProgressiveGeneration: boolean
  qualityThreshold: number
  maxIterations: number
  enableParallelGeneration: boolean
  chunkSize: number
}

export interface EnhancedGenerationResult {
  testCases: TestCase[]
  quality: QualityMetrics
  feedback: GenerationFeedback
  iterations: number
  generationTime: number
  contextPrompt: ContextualPromptConfig
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface GenerationProgress {
  stage: 'analyzing' | 'generating' | 'evaluating' | 'improving' | 'complete'
  progress: number
  message: string
  iteration?: number
  quality?: QualityMetrics
}

export class EnhancedTestCaseGenerator {
  
  /**
   * Generate test cases with enhanced context-aware and progressive approaches
   */
  static async generateEnhanced(
    documents: string[],
    template: string,
    config: EnhancedGenerationConfig,
    testContext: TestCaseContext,
    documentAnalysis: DocumentContext | null,
    aiConfig: any,
    progressCallback?: (progress: GenerationProgress) => void
  ): Promise<EnhancedGenerationResult> {
    
    const startTime = Date.now()
    let allTestCases: TestCase[] = []
    let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    let iteration = 0
    
    try {
      // Stage 1: Generate context-aware prompt
      progressCallback?.({
        stage: 'analyzing',
        progress: 10,
        message: 'Analyzing context and generating enhanced prompts...'
      })
      
      const contextPrompt = ContextualPromptGenerator.generateContextualPrompt(
        testContext,
        documentAnalysis || undefined,
        config.customInstructions
      )
      
      // Stage 2: Initial generation with context-aware prompt
      progressCallback?.({
        stage: 'generating',
        progress: 30,
        message: 'Generating initial test cases with domain-specific context...',
        iteration: 1
      })
      
      const enhancedPrompt = ContextualPromptGenerator.buildFinalPrompt(contextPrompt)
      
      // Create enhanced generation request
      const enhancedConfig = {
        ...config,
        customInstructions: enhancedPrompt
      }
      
      const initialResult = await generateTestCasesWithAI({
        documents,
        template,
        config: enhancedConfig,
        aiConfig
      })
      
      allTestCases = initialResult.testCases
      if (initialResult.usage) {
        totalUsage.inputTokens += initialResult.usage.inputTokens
        totalUsage.outputTokens += initialResult.usage.outputTokens
        totalUsage.totalTokens += initialResult.usage.totalTokens
      }
      iteration = 1
      
      // Stage 3: Quality analysis and progressive improvement
      if (config.enableProgressiveGeneration && allTestCases.length > 0) {
        
        let currentQuality = ProgressiveTestCaseGenerator.analyzeTestCaseQuality(allTestCases, testContext)
        let feedback = ProgressiveTestCaseGenerator.generateFeedback(allTestCases, currentQuality, testContext)
        
        progressCallback?.({
          stage: 'evaluating',
          progress: 50,
          message: `Analyzing quality: ${Math.round(currentQuality.coverage * 100)}% coverage`,
          iteration: 1,
          quality: currentQuality
        })
        
        // Continue improving if quality is below threshold
        while (
          iteration < config.maxIterations &&
          this.calculateOverallQuality(currentQuality) < config.qualityThreshold &&
          feedback.suggestions.length > 0
        ) {
          
          iteration++
          
          progressCallback?.({
            stage: 'improving',
            progress: 50 + (iteration - 1) * (40 / config.maxIterations),
            message: `Iteration ${iteration}: Improving test cases based on quality feedback...`,
            iteration,
            quality: currentQuality
          })
          
          // Generate improvement prompt
          const improvementPrompt = ProgressiveTestCaseGenerator.generateImprovementPrompt(
            allTestCases,
            feedback,
            testContext,
            Math.min(config.maxTestCases - allTestCases.length, 10)
          )
          
          // Generate additional test cases
          const improvementConfig = {
            ...config,
            customInstructions: improvementPrompt,
            maxTestCases: Math.min(config.maxTestCases - allTestCases.length, 10)
          }
          
          if (improvementConfig.maxTestCases > 0) {
            const improvementResult = await generateTestCasesWithAI({
              documents,
              template,
              config: improvementConfig,
              aiConfig
            })
            
            // Add new test cases
            allTestCases = [...allTestCases, ...improvementResult.testCases]
            
            if (improvementResult.usage) {
              totalUsage.inputTokens += improvementResult.usage.inputTokens
              totalUsage.outputTokens += improvementResult.usage.outputTokens
              totalUsage.totalTokens += improvementResult.usage.totalTokens
            }
            
            // Re-analyze quality
            currentQuality = ProgressiveTestCaseGenerator.analyzeTestCaseQuality(allTestCases, testContext)
            feedback = ProgressiveTestCaseGenerator.generateFeedback(allTestCases, currentQuality, testContext)
          } else {
            break // No more test cases can be generated
          }
        }
        
        // Final quality analysis
        const finalQuality = ProgressiveTestCaseGenerator.analyzeTestCaseQuality(allTestCases, testContext)
        const finalFeedback = ProgressiveTestCaseGenerator.generateFeedback(allTestCases, finalQuality, testContext)
        
        progressCallback?.({
          stage: 'complete',
          progress: 100,
          message: `Generation complete! ${allTestCases.length} test cases generated across ${iteration} iterations`,
          iteration,
          quality: finalQuality
        })
        
        return {
          testCases: allTestCases,
          quality: finalQuality,
          feedback: finalFeedback,
          iterations: iteration,
          generationTime: Date.now() - startTime,
          contextPrompt,
          usage: totalUsage
        }
        
      } else {
        // Single iteration without progressive improvement
        const quality = ProgressiveTestCaseGenerator.analyzeTestCaseQuality(allTestCases, testContext)
        const feedback = ProgressiveTestCaseGenerator.generateFeedback(allTestCases, quality, testContext)
        
        progressCallback?.({
          stage: 'complete',
          progress: 100,
          message: `Generation complete! ${allTestCases.length} test cases generated`,
          iteration: 1,
          quality
        })
        
        return {
          testCases: allTestCases,
          quality,
          feedback,
          iterations: 1,
          generationTime: Date.now() - startTime,
          contextPrompt,
          usage: totalUsage
        }
      }
      
    } catch (error) {
      console.error('Enhanced generation failed:', error)
      throw error
    }
  }
  
  /**
   * Generate test cases using smart parallel chunking
   */
  static async generateWithParallelChunking(
    documents: string[],
    template: string,
    config: EnhancedGenerationConfig,
    testContext: TestCaseContext,
    documentAnalysis: DocumentContext | null,
    aiConfig: any,
    progressCallback?: (progress: GenerationProgress) => void
  ): Promise<EnhancedGenerationResult> {
    
    if (!config.enableParallelGeneration || documents.length === 1) {
      // Use standard enhanced generation
      return this.generateEnhanced(documents, template, config, testContext, documentAnalysis, aiConfig, progressCallback)
    }
    
    // Implement parallel generation for multiple documents/chunks
    const startTime = Date.now()
    let allTestCases: TestCase[] = []
    let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    
    progressCallback?.({
      stage: 'analyzing',
      progress: 10,
      message: 'Preparing parallel generation for document chunks...'
    })
    
    // Split documents into chunks for parallel processing
    const chunks = this.createDocumentChunks(documents, config.chunkSize)
    const chunkConfigs = chunks.map(chunk => ({
      ...config,
      maxTestCases: Math.floor(config.maxTestCases / chunks.length)
    }))
    
    progressCallback?.({
      stage: 'generating',
      progress: 30,
      message: `Processing ${chunks.length} document chunks in parallel...`
    })
    
    // Process chunks in parallel
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        const result = await this.generateEnhanced(
          chunk,
          template,
          chunkConfigs[index],
          testContext,
          documentAnalysis,
          aiConfig
        )
        return result
      } catch (error) {
        console.error(`Chunk ${index} failed:`, error)
        return null
      }
    })
    
    const chunkResults = await Promise.allSettled(chunkPromises)
    
    // Combine results
    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allTestCases = [...allTestCases, ...result.value.testCases]
        if (result.value.usage) {
          totalUsage.inputTokens += result.value.usage.inputTokens
          totalUsage.outputTokens += result.value.usage.outputTokens
          totalUsage.totalTokens += result.value.usage.totalTokens
        }
      }
    })
    
    // Deduplicate and analyze final quality
    allTestCases = this.deduplicateTestCases(allTestCases)
    const finalQuality = ProgressiveTestCaseGenerator.analyzeTestCaseQuality(allTestCases, testContext)
    const finalFeedback = ProgressiveTestCaseGenerator.generateFeedback(allTestCases, finalQuality, testContext)
    
    const contextPrompt = ContextualPromptGenerator.generateContextualPrompt(
      testContext,
      documentAnalysis || undefined,
      config.customInstructions
    )
    
    progressCallback?.({
      stage: 'complete',
      progress: 100,
      message: `Parallel generation complete! ${allTestCases.length} test cases from ${chunks.length} chunks`,
      quality: finalQuality
    })
    
    return {
      testCases: allTestCases,
      quality: finalQuality,
      feedback: finalFeedback,
      iterations: 1,
      generationTime: Date.now() - startTime,
      contextPrompt,
      usage: totalUsage
    }
  }
  
  /**
   * Calculate overall quality score
   */
  private static calculateOverallQuality(metrics: QualityMetrics): number {
    return (metrics.coverage * 0.3 + 
            metrics.specificity * 0.2 + 
            metrics.diversity * 0.2 + 
            metrics.domainRelevance * 0.2 + 
            metrics.completeness * 0.1)
  }
  
  /**
   * Create document chunks for parallel processing
   */
  private static createDocumentChunks(documents: string[], chunkSize: number): string[][] {
    const chunks: string[][] = []
    
    for (let i = 0; i < documents.length; i += chunkSize) {
      chunks.push(documents.slice(i, i + chunkSize))
    }
    
    return chunks
  }
  
  /**
   * Remove duplicate test cases based on similarity
   */
  private static deduplicateTestCases(testCases: TestCase[]): TestCase[] {
    const unique: TestCase[] = []
    const seen = new Set<string>()
    
    testCases.forEach(tc => {
      const signature = this.createTestCaseSignature(tc)
      if (!seen.has(signature)) {
        seen.add(signature)
        unique.push(tc)
      }
    })
    
    return unique
  }
  
  /**
   * Create a signature for test case deduplication
   */
  private static createTestCaseSignature(testCase: TestCase): string {
    const normalizedTitle = testCase.testCase.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normalizedModule = testCase.module.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `${normalizedModule}-${normalizedTitle}`
  }
}