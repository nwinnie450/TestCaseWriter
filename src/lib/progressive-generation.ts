import { TestCase } from '@/types'
import { TestCaseContext } from '@/components/generate/EnhancedConfigForm'
import { ContextualPromptGenerator } from './context-aware-prompts'

export interface QualityMetrics {
  coverage: number // 0-1 scale
  specificity: number // How specific are the test cases
  diversity: number // How diverse are the scenarios
  domainRelevance: number // How relevant to the business domain
  completeness: number // How complete are the test steps
}

export interface GenerationFeedback {
  quality: QualityMetrics
  suggestions: string[]
  missingScenarios: string[]
  improvementAreas: string[]
}

export interface ProgressiveGenerationResult {
  testCases: TestCase[]
  quality: QualityMetrics
  feedback: GenerationFeedback
  iteration: number
  shouldContinue: boolean
}

export class ProgressiveTestCaseGenerator {
  
  /**
   * Analyze quality of generated test cases
   */
  static analyzeTestCaseQuality(testCases: TestCase[], context: TestCaseContext): QualityMetrics {
    const coverage = this.calculateCoverage(testCases, context)
    const specificity = this.calculateSpecificity(testCases)
    const diversity = this.calculateDiversity(testCases)
    const domainRelevance = this.calculateDomainRelevance(testCases, context)
    const completeness = this.calculateCompleteness(testCases)
    
    return {
      coverage,
      specificity,
      diversity,
      domainRelevance,
      completeness
    }
  }

  /**
   * Generate feedback and improvement suggestions
   */
  static generateFeedback(testCases: TestCase[], quality: QualityMetrics, context: TestCaseContext): GenerationFeedback {
    const suggestions: string[] = []
    const missingScenarios: string[] = []
    const improvementAreas: string[] = []

    // Coverage feedback
    if (quality.coverage < 0.7) {
      suggestions.push("Increase test scenario coverage to include more edge cases")
      improvementAreas.push("coverage")
      
      // Suggest specific missing scenarios based on context
      const missing = this.identifyMissingScenarios(testCases, context)
      missingScenarios.push(...missing)
    }

    // Specificity feedback
    if (quality.specificity < 0.6) {
      suggestions.push("Make test cases more specific with detailed test data and expected results")
      improvementAreas.push("specificity")
    }

    // Diversity feedback
    if (quality.diversity < 0.5) {
      suggestions.push("Add more diverse test scenarios covering different user paths")
      improvementAreas.push("diversity")
    }

    // Domain relevance feedback
    if (quality.domainRelevance < 0.7) {
      suggestions.push(`Include more ${context.businessDomain}-specific test scenarios and terminology`)
      improvementAreas.push("domain-relevance")
    }

    // Completeness feedback
    if (quality.completeness < 0.8) {
      suggestions.push("Provide more detailed test steps with clear preconditions and expected results")
      improvementAreas.push("completeness")
    }

    return {
      quality,
      suggestions,
      missingScenarios,
      improvementAreas
    }
  }

  /**
   * Generate improvement prompt for next iteration
   */
  static generateImprovementPrompt(
    existingTestCases: TestCase[],
    feedback: GenerationFeedback,
    context: TestCaseContext,
    targetCount: number = 10
  ): string {
    return `
IMPROVE AND EXPAND TEST CASES

CURRENT TEST CASES ANALYSIS:
- Total existing test cases: ${existingTestCases.length}
- Coverage score: ${Math.round(feedback.quality.coverage * 100)}%
- Specificity score: ${Math.round(feedback.quality.specificity * 100)}%
- Diversity score: ${Math.round(feedback.quality.diversity * 100)}%
- Domain relevance score: ${Math.round(feedback.quality.domainRelevance * 100)}%

IMPROVEMENT AREAS:
${feedback.suggestions.map(s => `- ${s}`).join('\n')}

MISSING SCENARIOS TO INCLUDE:
${feedback.missingScenarios.map(s => `- ${s}`).join('\n')}

EXISTING TEST CASE SUMMARIES:
${existingTestCases.map((tc, i) => `${i + 1}. ${tc.testCase} (Module: ${tc.module})`).join('\n')}

INSTRUCTIONS:
1. Generate ${targetCount} NEW test cases that address the improvement areas
2. Focus on the missing scenarios listed above
3. Avoid duplicating existing test cases
4. Ensure new test cases are more specific and detailed than existing ones
5. Use ${context.businessDomain} domain terminology and concepts
6. Target ${context.userRole} user perspective
7. Priority level: ${context.testPriority}

Generate the improved test cases now.
`
  }

  /**
   * Calculate coverage based on test scenario types
   */
  private static calculateCoverage(testCases: TestCase[], context: TestCaseContext): number {
    const requiredScenarios = this.getRequiredScenarios(context)
    const coveredScenarios = new Set<string>()
    
    testCases.forEach(tc => {
      const testCaseText = (tc.testCase + ' ' + tc.testSteps.map(s => s.description).join(' ')).toLowerCase()
      
      requiredScenarios.forEach(scenario => {
        if (testCaseText.includes(scenario.toLowerCase())) {
          coveredScenarios.add(scenario)
        }
      })
    })
    
    return coveredScenarios.size / requiredScenarios.length
  }

  /**
   * Calculate specificity based on test step detail
   */
  private static calculateSpecificity(testCases: TestCase[]): number {
    if (testCases.length === 0) return 0
    
    const avgStepsPerTest = testCases.reduce((sum, tc) => sum + tc.testSteps.length, 0) / testCases.length
    const avgStepLength = testCases.reduce((sum, tc) => {
      return sum + tc.testSteps.reduce((stepSum, step) => stepSum + step.description.length, 0) / tc.testSteps.length
    }, 0) / testCases.length
    
    // Normalize based on reasonable expectations
    const stepScore = Math.min(avgStepsPerTest / 5, 1) // Expect ~5 steps per test
    const detailScore = Math.min(avgStepLength / 100, 1) // Expect ~100 chars per step
    
    return (stepScore + detailScore) / 2
  }

  /**
   * Calculate diversity based on unique modules and test types
   */
  private static calculateDiversity(testCases: TestCase[]): number {
    if (testCases.length === 0) return 0
    
    const uniqueModules = new Set(testCases.map(tc => tc.module)).size
    const uniqueTestTypes = new Set(testCases.map(tc => this.classifyTestType(tc))).size
    
    // Normalize based on test count
    const moduleScore = Math.min(uniqueModules / Math.max(testCases.length * 0.3, 1), 1)
    const typeScore = Math.min(uniqueTestTypes / 5, 1) // Expect up to 5 different test types
    
    return (moduleScore + typeScore) / 2
  }

  /**
   * Calculate domain relevance based on domain-specific keywords
   */
  private static calculateDomainRelevance(testCases: TestCase[], context: TestCaseContext): number {
    const domainKeywords = this.getDomainKeywords(context.businessDomain)
    const featureKeywords = this.getFeatureKeywords(context.featureCategory)
    
    const allKeywords = [...domainKeywords, ...featureKeywords]
    let totalRelevanceScore = 0
    
    testCases.forEach(tc => {
      const testContent = (tc.testCase + ' ' + tc.testSteps.map(s => s.description).join(' ')).toLowerCase()
      
      const matchedKeywords = allKeywords.filter(keyword => 
        testContent.includes(keyword.toLowerCase())
      ).length
      
      totalRelevanceScore += Math.min(matchedKeywords / allKeywords.length, 1)
    })
    
    return testCases.length > 0 ? totalRelevanceScore / testCases.length : 0
  }

  /**
   * Calculate completeness based on test structure
   */
  private static calculateCompleteness(testCases: TestCase[]): number {
    if (testCases.length === 0) return 0
    
    let completenessScore = 0
    
    testCases.forEach(tc => {
      let score = 0
      
      // Check if test case has meaningful title
      if (tc.testCase && tc.testCase.length > 10) score += 0.2
      
      // Check if has multiple test steps
      if (tc.testSteps.length >= 3) score += 0.3
      
      // Check if steps have detailed descriptions
      const avgStepLength = tc.testSteps.reduce((sum, step) => sum + step.description.length, 0) / tc.testSteps.length
      if (avgStepLength > 50) score += 0.3
      
      // Check if has expected results
      const hasExpectedResults = tc.testSteps.some(step => 
        step.expectedResult && step.expectedResult.length > 10
      )
      if (hasExpectedResults) score += 0.2
      
      completenessScore += score
    })
    
    return completenessScore / testCases.length
  }

  /**
   * Classify test type based on content
   */
  private static classifyTestType(testCase: TestCase): string {
    const content = (testCase.testCase + ' ' + testCase.testSteps.map(s => s.description).join(' ')).toLowerCase()
    
    if (content.includes('invalid') || content.includes('error') || content.includes('fail')) return 'negative'
    if (content.includes('boundary') || content.includes('edge') || content.includes('limit')) return 'boundary'
    if (content.includes('performance') || content.includes('load') || content.includes('stress')) return 'performance'
    if (content.includes('security') || content.includes('unauthorized') || content.includes('hack')) return 'security'
    return 'positive'
  }

  /**
   * Get required scenarios based on context
   */
  private static getRequiredScenarios(context: TestCaseContext): string[] {
    const base = ['positive flow', 'negative flow', 'boundary conditions']
    
    // Add domain-specific scenarios
    if (context.businessDomain === 'blockchain') {
      base.push('transaction failure', 'gas optimization', 'security vulnerability')
    }
    if (context.businessDomain === 'gaming') {
      base.push('multiplayer interaction', 'game state persistence', 'cheating prevention')
    }
    if (context.businessDomain === 'ai') {
      base.push('model accuracy', 'bias detection', 'adversarial input')
    }
    
    return base
  }

  /**
   * Identify missing scenarios from current test cases
   */
  private static identifyMissingScenarios(testCases: TestCase[], context: TestCaseContext): string[] {
    const required = this.getRequiredScenarios(context)
    const existing = testCases.map(tc => tc.testCase.toLowerCase())
    
    return required.filter(scenario => 
      !existing.some(test => test.includes(scenario.toLowerCase()))
    )
  }

  /**
   * Get domain-specific keywords
   */
  private static getDomainKeywords(domain: string): string[] {
    const keywords = {
      blockchain: ['wallet', 'transaction', 'gas', 'token', 'smart contract', 'defi', 'nft'],
      gaming: ['player', 'game', 'score', 'level', 'achievement', 'inventory', 'multiplayer'],
      ai: ['model', 'prediction', 'training', 'dataset', 'accuracy', 'bias', 'inference']
    }
    
    return keywords[domain as keyof typeof keywords] || []
  }

  /**
   * Get feature-specific keywords
   */
  private static getFeatureKeywords(feature: string): string[] {
    const keywords = {
      smartcontract: ['deploy', 'execute', 'revert', 'emit', 'modifier', 'state'],
      gamelogic: ['play', 'move', 'turn', 'win', 'lose', 'progress'],
      aimodel: ['predict', 'train', 'validate', 'optimize', 'evaluate', 'monitor']
    }
    
    return keywords[feature as keyof typeof keywords] || []
  }
}