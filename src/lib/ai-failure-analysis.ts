interface TestCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  currentStatus: string;
  linkedRequirements?: string[];
  steps: Array<{
    stepNumber: number;
    action: string;
    expected: string;
  }>;
}

interface FailureAnalysis {
  relatedTestCases: TestCase[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  impactCategory: string;
  blockingRecommendation: {
    shouldBlock: boolean;
    reason: string;
    testCasesToBlock: string[];
  };
  suggestedActions: string[];
  testingImpact: string;
}

export class AIFailureAnalyzer {
  /**
   * Analyzes a test failure and suggests related test cases to block
   */
  async analyzeFailure(
    failedTestCase: TestCase,
    failureDescription: string,
    allTestCases: TestCase[]
  ): Promise<FailureAnalysis> {
    
    // Extract key components from failure description
    const failureKeywords = this.extractKeywords(failureDescription);
    const failureType = this.categorizeFailure(failureDescription);
    
    // Find related test cases
    const relatedTests = this.findRelatedTestCases(
      failedTestCase,
      failureKeywords,
      allTestCases
    );
    
    // Assess risk level
    const riskLevel = this.assessRiskLevel(
      failedTestCase,
      failureDescription,
      relatedTests
    );
    
    // Generate blocking recommendations
    const blockingRecommendation = this.generateBlockingRecommendation(
      failedTestCase,
      failureType,
      relatedTests,
      riskLevel
    );
    
    // Generate actionable insights
    const suggestedActions = this.generateSuggestedActions(
      failedTestCase,
      failureType,
      riskLevel
    );
    
    const testingImpact = this.analyzeTestingImpact(
      failedTestCase,
      failureDescription,
      relatedTests
    );
    
    return {
      relatedTestCases: relatedTests,
      riskLevel,
      impactCategory: failureType,
      blockingRecommendation,
      suggestedActions,
      testingImpact
    };
  }
  
  /**
   * Extract meaningful keywords from failure description
   */
  private extractKeywords(failureDescription: string): string[] {
    const text = failureDescription.toLowerCase();
    
    // Technical keywords that often indicate related failures
    const technicalPatterns = [
      /database|db|sql/g,
      /api|endpoint|service/g,
      /authentication|auth|login|session/g,
      /permission|authorization|access/g,
      /network|connection|timeout/g,
      /ui|interface|frontend|button|form/g,
      /backend|server|500|502|503/g,
      /validation|error|exception/g,
      /performance|slow|lag|loading/g,
      /security|ssl|https|certificate/g
    ];
    
    const keywords: string[] = [];
    
    technicalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });
    
    // Add specific component mentions
    const componentKeywords = text.match(/\b(login|dashboard|profile|settings|search|cart|checkout|payment|upload|download)\b/g);
    if (componentKeywords) {
      keywords.push(...componentKeywords);
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }
  
  /**
   * Categorize the type of failure
   */
  private categorizeFailure(failureDescription: string): string {
    const text = failureDescription.toLowerCase();
    
    if (text.includes('auth') || text.includes('login') || text.includes('permission')) {
      return 'Authentication/Authorization';
    }
    if (text.includes('api') || text.includes('endpoint') || text.includes('service')) {
      return 'API/Service';
    }
    if (text.includes('database') || text.includes('data') || text.includes('sql')) {
      return 'Database/Data';
    }
    if (text.includes('ui') || text.includes('interface') || text.includes('button')) {
      return 'User Interface';
    }
    if (text.includes('performance') || text.includes('slow') || text.includes('timeout')) {
      return 'Performance';
    }
    if (text.includes('security') || text.includes('ssl') || text.includes('certificate')) {
      return 'Security';
    }
    if (text.includes('network') || text.includes('connection')) {
      return 'Network/Infrastructure';
    }
    
    return 'General';
  }
  
  /**
   * Find test cases that might be affected by the same root cause
   */
  private findRelatedTestCases(
    failedTestCase: TestCase,
    failureKeywords: string[],
    allTestCases: TestCase[]
  ): TestCase[] {
    const related: Array<{ testCase: TestCase; score: number }> = [];
    
    allTestCases.forEach(testCase => {
      if (testCase.id === failedTestCase.id) return; // Skip the failed test itself
      
      let score = 0;
      
      // Same category gets high score
      if (testCase.category === failedTestCase.category) {
        score += 30;
      }
      
      // Same requirements get high score
      if (failedTestCase.linkedRequirements && testCase.linkedRequirements) {
        const commonRequirements = failedTestCase.linkedRequirements.filter(req =>
          testCase.linkedRequirements!.includes(req)
        );
        score += commonRequirements.length * 25;
      }
      
      // Keyword matches in title/description
      const testText = `${testCase.title} ${testCase.description}`.toLowerCase();
      failureKeywords.forEach(keyword => {
        if (testText.includes(keyword)) {
          score += 15;
        }
      });
      
      // Similar test steps
      const stepSimilarity = this.calculateStepSimilarity(
        failedTestCase.steps,
        testCase.steps
      );
      score += stepSimilarity * 10;
      
      if (score > 20) { // Threshold for relatedness
        related.push({ testCase, score });
      }
    });
    
    // Sort by score and return top matches
    return related
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.testCase);
  }
  
  /**
   * Calculate similarity between test steps
   */
  private calculateStepSimilarity(steps1: any[], steps2: any[]): number {
    if (!steps1.length || !steps2.length) return 0;
    
    let similarSteps = 0;
    const totalSteps = Math.max(steps1.length, steps2.length);
    
    steps1.forEach(step1 => {
      const hasMatch = steps2.some(step2 => {
        const text1 = step1.action.toLowerCase();
        const text2 = step2.action.toLowerCase();
        return text1.includes(text2.split(' ')[0]) || text2.includes(text1.split(' ')[0]);
      });
      if (hasMatch) similarSteps++;
    });
    
    return similarSteps / totalSteps;
  }
  
  /**
   * Assess the risk level of the failure
   */
  private assessRiskLevel(
    failedTestCase: TestCase,
    failureDescription: string,
    relatedTests: TestCase[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;
    
    // Priority of failed test
    if (failedTestCase.priority === 'Critical') riskScore += 40;
    else if (failedTestCase.priority === 'High') riskScore += 30;
    else if (failedTestCase.priority === 'Medium') riskScore += 20;
    else riskScore += 10;
    
    // Number of related tests
    riskScore += Math.min(relatedTests.length * 5, 30);
    
    // Failure description severity
    const text = failureDescription.toLowerCase();
    if (text.includes('crash') || text.includes('exception') || text.includes('error 500')) {
      riskScore += 30;
    } else if (text.includes('timeout') || text.includes('failed') || text.includes('broken')) {
      riskScore += 20;
    } else if (text.includes('slow') || text.includes('issue')) {
      riskScore += 10;
    }
    
    // Category-specific risk
    if (failedTestCase.category === 'Authentication' || failedTestCase.category === 'Security') {
      riskScore += 25;
    } else if (failedTestCase.category === 'API' || failedTestCase.category === 'Database') {
      riskScore += 20;
    }
    
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Generate blocking recommendations
   */
  private generateBlockingRecommendation(
    failedTestCase: TestCase,
    failureType: string,
    relatedTests: TestCase[],
    riskLevel: string
  ) {
    const shouldBlock = riskLevel === 'high' || riskLevel === 'critical' || relatedTests.length > 5;
    
    let reason = '';
    let testCasesToBlock: string[] = [];
    
    if (shouldBlock) {
      if (riskLevel === 'critical') {
        reason = `Critical failure in ${failureType} component. High risk of cascade failures.`;
        testCasesToBlock = relatedTests.slice(0, 8).map(tc => tc.id);
      } else if (riskLevel === 'high') {
        reason = `High-impact failure affecting ${relatedTests.length} related test cases.`;
        testCasesToBlock = relatedTests.slice(0, 5).map(tc => tc.id);
      } else {
        reason = `Multiple related test cases detected. Recommend blocking to prevent redundant failures.`;
        testCasesToBlock = relatedTests.slice(0, 3).map(tc => tc.id);
      }
    } else {
      reason = `Low risk failure. Continue testing but monitor related cases.`;
    }
    
    return {
      shouldBlock,
      reason,
      testCasesToBlock
    };
  }
  
  /**
   * Generate QA-focused actionable suggestions
   */
  private generateSuggestedActions(
    failedTestCase: TestCase,
    failureType: string,
    riskLevel: string
  ): string[] {
    const actions: string[] = [];

    // Risk-based QA actions
    if (riskLevel === 'critical') {
      actions.push('🚨 Report critical failure with detailed test evidence');
      actions.push('🔒 Recommend halting testing until critical issue is resolved');
      actions.push('📋 Document exact reproduction steps with screenshots/videos');
    } else if (riskLevel === 'high') {
      actions.push('⚡ Prioritize re-testing this area in next test cycle');
      actions.push('📊 Increase test coverage and add boundary test cases');
      actions.push('🔍 Perform exploratory testing around this functionality');
    }

    // Category-specific QA actions
    switch (failureType) {
      case 'Authentication/Authorization':
        actions.push('👥 Test all user roles and permission combinations');
        actions.push('🔐 Verify login/logout flows across different browsers');
        actions.push('📱 Test authentication on mobile and desktop devices');
        actions.push('⏱️ Test session timeout and renewal scenarios');
        break;
      case 'API/Service':
        actions.push('🔗 Test API with valid, invalid, and edge case data inputs');
        actions.push('📊 Verify proper error messages are displayed to users');
        actions.push('⚡ Test API response times with realistic user scenarios');
        actions.push('🔄 Validate data accuracy and consistency in API responses');
        break;
      case 'Database/Data':
        actions.push('📊 Test data validation with boundary values and special characters');
        actions.push('🔍 Verify create, read, update, delete operations work correctly');
        actions.push('💾 Test data saves correctly and displays accurately after refresh');
        actions.push('🔄 Validate data appears consistently across different screens');
        break;
      case 'User Interface':
        actions.push('🖥️ Test UI on Chrome, Firefox, Safari, and Edge browsers');
        actions.push('📱 Verify responsive design on tablets and mobile devices');
        actions.push('♿ Check accessibility features and keyboard navigation');
        actions.push('🎨 Validate visual consistency and layout alignment');
        break;
      case 'Performance':
        actions.push('⚡ Test page load times on slow and fast internet connections');
        actions.push('📈 Test with multiple users performing actions simultaneously');
        actions.push('💾 Test system responsiveness during long testing sessions');
        actions.push('⏱️ Record performance benchmarks for comparison in future tests');
        break;
      case 'Security':
        actions.push('🛡️ Test input fields with malicious scripts and SQL injection attempts');
        actions.push('🔒 Verify sensitive data is not exposed in browser or network tabs');
        actions.push('👤 Test that users cannot access features without proper permissions');
        actions.push('📝 Document all security test scenarios and results for audit trail');
        break;
    }

    // Always include these QA-specific actions
    actions.push('📝 Update test case with detailed failure evidence and environment info');
    actions.push('🔄 Schedule comprehensive re-testing after fix deployment');
    actions.push('📊 Add this failure scenario to regression test suite');
    actions.push('🎯 Create additional test cases to prevent similar issues');

    return actions;
  }
  
  /**
   * Analyze testing impact for QA teams
   */
  private analyzeTestingImpact(failedTestCase: TestCase, failureDescription: string, relatedTests: TestCase[]): string {
    const text = failureDescription.toLowerCase();
    const category = failedTestCase.category;
    const relatedCount = relatedTests.length;

    if (text.includes('timeout') || text.includes('slow')) {
      return `Performance issues detected. Consider testing all ${category.toLowerCase()} features under various load conditions. ${relatedCount > 0 ? `${relatedCount} related tests may also experience timing issues.` : ''} Recommend running performance regression tests.`;
    }

    if (text.includes('404') || text.includes('not found')) {
      return `Resource availability issue identified. Test all navigation paths and verify all links/endpoints in ${category.toLowerCase()} category work correctly. ${relatedCount > 0 ? `Check ${relatedCount} related test cases for similar navigation issues.` : ''}`;
    }

    if (text.includes('500') || text.includes('server error')) {
      return `Server-side failure detected. This may affect multiple user workflows. Prioritize testing core functionalities after deployment. ${relatedCount > 0 ? `Monitor ${relatedCount} related tests closely as they may fail due to the same server issues.` : ''}`;
    }

    if (text.includes('auth') || text.includes('permission') || text.includes('unauthorized')) {
      return `Authentication/authorization failure identified. Test all user roles and permission levels thoroughly. Verify login flows across different user types. ${relatedCount > 0 ? `${relatedCount} related authentication tests should be re-executed after fix.` : ''}`;
    }

    if (text.includes('validation') || text.includes('invalid')) {
      return `Input validation issue detected. Test all form inputs with various data types including edge cases and boundary values. ${relatedCount > 0 ? `Review ${relatedCount} related tests for similar validation scenarios.` : ''}`;
    }

    if (category === 'Security') {
      return `Security vulnerability identified. This requires immediate attention and comprehensive security testing. Test all input fields, authentication flows, and data handling processes. ${relatedCount > 0 ? `Block ${relatedCount} related tests until security fix is verified.` : ''}`;
    }

    if (category === 'UI/UX') {
      return `User interface issue detected. Test across multiple browsers, devices, and screen resolutions. Verify responsive design and accessibility features. ${relatedCount > 0 ? `${relatedCount} related UI tests may have similar layout or interaction issues.` : ''}`;
    }

    return `${category} functionality failure detected. This may impact user experience and related workflows. ${relatedCount > 0 ? `Consider testing ${relatedCount} related test cases to verify scope of impact.` : ''} Prioritize regression testing after fix implementation.`;
  }
}

export const aiFailureAnalyzer = new AIFailureAnalyzer();