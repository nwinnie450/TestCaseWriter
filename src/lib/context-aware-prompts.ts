import { TestCaseContext } from '@/components/generate/EnhancedConfigForm'
import { DocumentContext } from './document-analyzer'

export interface ContextualPromptConfig {
  basePrompt: string
  domainSpecificInstructions: string
  featureSpecificInstructions: string
  userRoleInstructions: string
  priorityInstructions: string
  exampleFormats: string
}

export class ContextualPromptGenerator {
  
  // Domain-specific instruction templates
  private static readonly DOMAIN_INSTRUCTIONS = {
    blockchain: `
BLOCKCHAIN/WEB3 CONTEXT:
- Focus on smart contract interactions, gas optimization, and security
- Include wallet connection, transaction signing, and blockchain state validation
- Test for MEV attacks, reentrancy, and overflow/underflow vulnerabilities  
- Consider network congestion and gas price variations
- Validate token transfers, approvals, and allowances
- Test cross-chain bridge functionality if applicable`,

    gaming: `
GAMING CONTEXT:
- Focus on game mechanics, player progression, and in-game economies
- Include leaderboards, achievements, inventory management
- Test for cheating prevention and anti-griefing measures
- Consider multiplayer synchronization and lag compensation
- Validate reward distribution and randomization fairness
- Test save/load game state functionality`,

    ai: `
AI/ML CONTEXT:
- Focus on model inference, training data validation, and bias detection
- Include edge cases for data preprocessing and feature engineering
- Test model performance across different demographic groups
- Consider model versioning, A/B testing scenarios
- Validate input sanitization and output filtering
- Test for adversarial inputs and model robustness`
  }

  // Feature-specific test patterns
  private static readonly FEATURE_INSTRUCTIONS = {
    smartcontract: `
SMART CONTRACT TESTING:
- Test contract deployment with different constructor parameters
- Validate function access controls and modifiers
- Test state changes and event emissions
- Include gas limit and optimization scenarios
- Test contract upgrades and proxy patterns`,

    gamelogic: `
GAME MECHANICS TESTING:
- Test player actions and state transitions
- Validate scoring algorithms and progression systems
- Test multiplayer interactions and turn-based logic
- Include edge cases for game rules and win conditions
- Test save/load and checkpoint systems`,

    aimodel: `
AI MODEL TESTING:
- Test model predictions with various input distributions
- Validate model confidence scores and uncertainty quantification
- Test batch processing and real-time inference
- Include data drift detection and model monitoring
- Test model explainability and feature importance`,

    nft: `
NFT TESTING:
- Test minting with metadata validation
- Validate ownership transfers and marketplace interactions
- Test royalty calculations and distribution
- Include batch operations and gas optimization
- Test metadata updates and IPFS integration`,

    wallet: `
WALLET INTEGRATION TESTING:
- Test wallet connection and disconnection flows
- Validate signature verification and message signing
- Test transaction building and broadcast
- Include multi-signature and hardware wallet support
- Test network switching and chain validation`
  }

  // User role specific scenarios
  private static readonly ROLE_INSTRUCTIONS = {
    player: `
PLAYER PERSPECTIVE:
- Focus on intuitive gameplay and user experience
- Test tutorial flows and onboarding
- Include accessibility and mobile-friendly scenarios
- Test social features and community interactions`,

    trader: `
TRADER PERSPECTIVE: 
- Focus on trading interfaces and market data accuracy
- Test order placement, execution, and cancellation
- Include portfolio management and risk assessment
- Test real-time price feeds and market volatility scenarios`,

    developer: `
DEVELOPER PERSPECTIVE:
- Focus on API integrations and technical workflows
- Test development tools and debugging capabilities
- Include deployment and configuration scenarios
- Test error handling and logging mechanisms`,

    admin: `
ADMIN PERSPECTIVE:
- Focus on system administration and user management
- Test access controls and permission systems
- Include monitoring, analytics, and reporting features
- Test backup/restore and system maintenance tasks`
  }

  /**
   * Generate context-aware prompt based on analysis and user context
   */
  static generateContextualPrompt(
    testContext: TestCaseContext,
    documentAnalysis?: DocumentContext,
    baseInstructions?: string
  ): ContextualPromptConfig {
    
    // Build domain-specific instructions
    const domainInstructions = this.DOMAIN_INSTRUCTIONS[testContext.businessDomain as keyof typeof this.DOMAIN_INSTRUCTIONS] || ''
    
    // Build feature-specific instructions
    const featureInstructions = this.FEATURE_INSTRUCTIONS[testContext.featureCategory as keyof typeof this.FEATURE_INSTRUCTIONS] || ''
    
    // Build role-specific instructions
    const roleInstructions = this.ROLE_INSTRUCTIONS[testContext.userRole as keyof typeof this.ROLE_INSTRUCTIONS] || ''
    
    // Priority-based instructions
    const priorityInstructions = this.getPriorityInstructions(testContext.testPriority)
    
    // Application type specific examples
    const exampleFormats = this.getApplicationExamples(testContext.applicationType)
    
    // Enhanced base prompt incorporating context
    const basePrompt = `
Generate focused, high-quality test cases for a ${testContext.businessDomain} ${testContext.applicationType} application.

CONTEXT:
- Application Type: ${testContext.applicationType}
- Feature Category: ${testContext.featureCategory}  
- Primary User Role: ${testContext.userRole}
- Business Domain: ${testContext.businessDomain}
- Test Priority: ${testContext.testPriority}
- Environment: ${testContext.testEnvironment}

${documentAnalysis ? `
DOCUMENT ANALYSIS INSIGHTS:
- Detected Features: ${documentAnalysis.detectedFeatures.join(', ')}
- Identified User Roles: ${documentAnalysis.identifiedUserRoles.join(', ')}
- Complexity Level: ${documentAnalysis.complexityLevel}
- Confidence Score: ${Math.round(documentAnalysis.confidenceScore * 100)}%
` : ''}

${baseInstructions || ''}
`

    return {
      basePrompt,
      domainSpecificInstructions: domainInstructions,
      featureSpecificInstructions: featureInstructions,
      userRoleInstructions: roleInstructions,
      priorityInstructions,
      exampleFormats
    }
  }

  private static getPriorityInstructions(priority: string): string {
    switch (priority) {
      case 'critical':
        return `
CRITICAL PRIORITY FOCUS:
- Prioritize security vulnerabilities and data loss scenarios
- Include system availability and disaster recovery tests
- Focus on financial impact and compliance requirements
- Test core business logic and revenue-critical paths`

      case 'high':
        return `
HIGH PRIORITY FOCUS:
- Focus on main user workflows and core features
- Include integration points and external dependencies
- Test performance under normal load conditions
- Cover primary error scenarios and recovery paths`

      case 'medium':
        return `
MEDIUM PRIORITY FOCUS:
- Balance positive and negative test scenarios
- Include edge cases for main workflows
- Test secondary features and nice-to-have functionality
- Cover usability and user experience aspects`

      case 'low':
        return `
LOW PRIORITY FOCUS:
- Focus on edge cases and unusual scenarios
- Test optional features and enhancements
- Include exploratory and experimental test cases
- Cover accessibility and compatibility testing`

      default:
        return ''
    }
  }

  private static getApplicationExamples(appType: string): string {
    switch (appType) {
      case 'web':
        return `
WEB APPLICATION TEST EXAMPLES:
- Cross-browser compatibility testing
- Responsive design validation
- Session management and cookies
- Form validation and submission
- AJAX calls and real-time updates`

      case 'mobile':
        return `
MOBILE APPLICATION TEST EXAMPLES:
- Device-specific functionality (camera, GPS, etc.)
- App lifecycle and background processing
- Push notifications and deep linking
- Offline functionality and sync
- Performance on different device specs`

      case 'api':
        return `
API/SERVICE TEST EXAMPLES:
- Endpoint response validation
- Authentication and authorization
- Rate limiting and throttling
- Error handling and status codes
- Data serialization and deserialization`

      case 'desktop':
        return `
DESKTOP APPLICATION TEST EXAMPLES:
- OS-specific functionality and integrations
- File system operations and permissions
- Multi-window and multi-process scenarios
- System resource usage and performance
- Installation and update procedures`

      default:
        return ''
    }
  }

  /**
   * Combine all prompt components into final generation prompt
   */
  static buildFinalPrompt(config: ContextualPromptConfig): string {
    return `
${config.basePrompt}

${config.domainSpecificInstructions}

${config.featureSpecificInstructions}

${config.userRoleInstructions}

${config.priorityInstructions}

TEST CASE EXAMPLES AND PATTERNS:
${config.exampleFormats}

GENERATION RULES:
1. Generate test cases that are specific to the context and domain
2. Use domain-appropriate terminology and concepts
3. Include both positive and negative scenarios relevant to the feature
4. Focus on the specified user role's perspective and needs
5. Prioritize test cases based on the specified priority level
6. Ensure test cases are actionable and include clear expected results
7. Use realistic test data appropriate for the business domain

Generate the test cases now.
`
  }
}