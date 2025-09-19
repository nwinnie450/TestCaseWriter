export interface DocumentContext {
  detectedFeatures: string[]
  suggestedDomains: string[]
  identifiedUserRoles: string[]
  complexityLevel: 'simple' | 'moderate' | 'complex'
  confidenceScore: number
}

export interface RequirementSection {
  title: string
  content: string
  suggestedContext: {
    applicationType: string
    featureCategory: string
    userRole: string
    businessDomain: string
  }
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export class DocumentAnalyzer {
  
  // Keyword mapping for different contexts
  private static readonly FEATURE_KEYWORDS = {
    smartcontract: ['smart contract', 'solidity', 'token', 'defi', 'mint', 'burn', 'transfer', 'approve', 'allowance', 'stake', 'yield', 'contract address', 'gas limit'],
    gamelogic: ['game', 'player', 'level', 'score', 'reward', 'achievement', 'inventory', 'battle', 'quest', 'experience', 'character', 'gameplay', 'leaderboard'],
    aimodel: ['model', 'prediction', 'training', 'inference', 'dataset', 'accuracy', 'bias', 'ml', 'ai', 'neural', 'algorithm', 'classification', 'regression'],
    nft: ['nft', 'token', 'metadata', 'collection', 'mint', 'marketplace', 'opensea', 'rarity', 'trait', 'tokenid', 'ipfs'],
    wallet: ['wallet', 'metamask', 'connect', 'signature', 'transaction', 'gas', 'balance', 'address', 'private key', 'public key'],
    authentication: ['login', 'register', 'password', 'oauth', 'jwt', 'session', 'authentication', 'authorize', 'username', 'email', 'signin'],
    payment: ['payment', 'checkout', 'subscription', 'billing', 'refund', 'invoice', 'stripe', 'paypal', 'credit card', 'amount'],
    ui: ['button', 'form', 'input', 'dropdown', 'modal', 'page', 'navigation', 'menu', 'interface', 'click', 'display'],
    crud: ['create', 'read', 'update', 'delete', 'insert', 'select', 'modify', 'remove', 'add', 'edit', 'save'],
    integration: ['api', 'endpoint', 'request', 'response', 'webhook', 'integration', 'external', 'third party', 'service']
  }

  private static readonly DOMAIN_KEYWORDS = {
    blockchain: ['blockchain', 'ethereum', 'bitcoin', 'crypto', 'defi', 'web3', 'dapp', 'smart contract'],
    gaming: ['game', 'gaming', 'player', 'gamefi', 'play-to-earn', 'metaverse', 'avatar'],
    ai: ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'model', 'algorithm']
  }

  private static readonly USER_ROLE_KEYWORDS = {
    player: ['player', 'gamer', 'user plays', 'game user', 'participant'],
    trader: ['trader', 'investor', 'buyer', 'seller', 'holder', 'liquidity provider'],
    developer: ['developer', 'api', 'integration', 'technical', 'contract deployer'],
    admin: ['admin', 'administrator', 'moderator', 'owner', 'governance']
  }

  /**
   * Analyze document content and suggest contexts
   */
  static analyzeDocument(content: string): DocumentContext {
    const text = content.toLowerCase()
    const detectedFeatures: string[] = []
    const suggestedDomains: string[] = []
    const identifiedUserRoles: string[] = []

    // Detect feature categories
    Object.entries(this.FEATURE_KEYWORDS).forEach(([feature, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      if (matches > 0) {
        detectedFeatures.push(feature)
      }
    })

    // Detect business domains
    Object.entries(this.DOMAIN_KEYWORDS).forEach(([domain, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      if (matches > 0) {
        suggestedDomains.push(domain)
      }
    })

    // Detect user roles
    Object.entries(this.USER_ROLE_KEYWORDS).forEach(([role, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      if (matches > 0) {
        identifiedUserRoles.push(role)
      }
    })

    // Calculate complexity based on number of features detected
    const complexityLevel = detectedFeatures.length > 5 ? 'complex' : 
                           detectedFeatures.length > 2 ? 'moderate' : 'simple'

    // Calculate confidence score
    const totalKeywords = detectedFeatures.length + suggestedDomains.length + identifiedUserRoles.length
    const confidenceScore = Math.min(totalKeywords * 0.15, 1.0)

    return {
      detectedFeatures,
      suggestedDomains,
      identifiedUserRoles,
      complexityLevel,
      confidenceScore
    }
  }

  /**
   * Split document into logical sections and suggest context for each
   */
  static parseRequirementSections(content: string): RequirementSection[] {
    const sections: RequirementSection[] = []
    
    // Split by headers (## or ### or numbered sections)
    const sectionPattern = /(?:^|\n)(?:#{1,3}\s+(.+)|(\d+\.?\s+.+))$/gm
    const parts = content.split(sectionPattern).filter(part => part && part.trim())

    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i]?.trim() || `Section ${i/2 + 1}`
      const sectionContent = parts[i + 1]?.trim() || ''

      if (sectionContent) {
        const analysis = this.analyzeDocument(sectionContent)
        
        sections.push({
          title,
          content: sectionContent,
          suggestedContext: {
            applicationType: this.suggestApplicationType(sectionContent),
            featureCategory: analysis.detectedFeatures[0] || 'other',
            userRole: analysis.identifiedUserRoles[0] || 'customer',
            businessDomain: analysis.suggestedDomains[0] || 'other'
          },
          priority: this.suggestPriority(sectionContent, title)
        })
      }
    }

    return sections
  }

  private static suggestApplicationType(content: string): string {
    const text = content.toLowerCase()
    if (text.includes('mobile') || text.includes('app') || text.includes('ios') || text.includes('android')) {
      return 'mobile'
    }
    if (text.includes('api') || text.includes('backend') || text.includes('service') || text.includes('endpoint')) {
      return 'api'
    }
    if (text.includes('desktop') || text.includes('electron')) {
      return 'desktop'
    }
    return 'web'
  }

  private static suggestPriority(content: string, title: string): 'critical' | 'high' | 'medium' | 'low' {
    const text = (content + title).toLowerCase()
    
    if (text.includes('critical') || text.includes('security') || text.includes('payment') || text.includes('authentication')) {
      return 'critical'
    }
    if (text.includes('important') || text.includes('core') || text.includes('essential') || text.includes('main')) {
      return 'high'
    }
    if (text.includes('nice to have') || text.includes('optional') || text.includes('enhancement')) {
      return 'low'
    }
    return 'medium'
  }

  /**
   * Generate multiple context configurations for complex documents
   */
  static generateMultipleContexts(analysis: DocumentContext): any[] {
    const contexts = []

    // Create context for each detected feature category
    analysis.detectedFeatures.forEach(feature => {
      analysis.suggestedDomains.forEach(domain => {
        analysis.identifiedUserRoles.forEach(role => {
          contexts.push({
            applicationType: 'web',
            featureCategory: feature,
            userRole: role,
            businessDomain: domain,
            testPriority: 'medium',
            testEnvironment: 'staging'
          })
        })
      })
    })

    return contexts.slice(0, 5) // Limit to 5 most relevant contexts
  }
}