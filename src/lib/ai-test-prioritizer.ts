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
  lastExecution?: {
    date: string;
    tester: string;
    status: string;
    notes: string;
  };
  executionHistory?: Array<{
    executionId: string;
    date: string;
    tester: string;
    status: string;
    notes: string;
    environment?: string;
    duration?: string;
    jiraTicket?: string;
  }>;
}

interface PrioritizedTestCase extends TestCase {
  aiScore: {
    failureProbability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number;
    priorityReason: string;
    recommendedOrder: number;
    insights: string[];
  };
}

interface PrioritizationAnalysis {
  totalTests: number;
  highRiskTests: number;
  recommendedExecutionOrder: string[];
  insights: {
    summary: string;
    patterns: string[];
    recommendations: string[];
  };
}

export class AITestPrioritizer {
  /**
   * Analyze and prioritize test cases using AI scoring
   */
  async prioritizeTestCases(testCases: TestCase[]): Promise<{
    prioritizedTests: PrioritizedTestCase[];
    analysis: PrioritizationAnalysis;
  }> {
    const prioritizedTests: PrioritizedTestCase[] = [];

    // Calculate AI scores for each test case
    for (const testCase of testCases) {
      const aiScore = this.calculateAIScore(testCase, testCases);
      prioritizedTests.push({
        ...testCase,
        aiScore
      });
    }

    // Sort by AI recommendation (highest risk/priority first)
    prioritizedTests.sort((a, b) => {
      // Primary sort: Risk level (critical > high > medium > low)
      const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const riskDiff = riskOrder[b.aiScore.riskLevel] - riskOrder[a.aiScore.riskLevel];
      if (riskDiff !== 0) return riskDiff;

      // Secondary sort: Failure probability
      const probDiff = b.aiScore.failureProbability - a.aiScore.failureProbability;
      if (probDiff !== 0) return probDiff;

      // Tertiary sort: Priority
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });

    // Assign recommended order
    prioritizedTests.forEach((test, index) => {
      test.aiScore.recommendedOrder = index + 1;
    });

    // Generate analysis
    const analysis = this.generateAnalysis(prioritizedTests);

    return {
      prioritizedTests,
      analysis
    };
  }

  /**
   * Calculate comprehensive AI score for a test case
   */
  private calculateAIScore(testCase: TestCase, allTestCases: TestCase[]) {
    // Base scores
    let failureProbability = 0;
    let confidenceScore = 0.5; // Base confidence
    const insights: string[] = [];

    // 1. Historical Failure Rate Analysis
    const failureRate = this.calculateHistoricalFailureRate(testCase);
    failureProbability += failureRate * 0.4; // 40% weight
    confidenceScore += failureRate > 0 ? 0.2 : 0.1;

    if (failureRate > 0.5) {
      insights.push(`📈 High failure rate: ${Math.round(failureRate * 100)}% in recent executions`);
    }

    // 2. Recency and Execution Patterns
    const recencyScore = this.calculateRecencyScore(testCase);
    failureProbability += recencyScore * 0.25; // 25% weight
    confidenceScore += recencyScore > 0.5 ? 0.15 : 0.05;

    if (recencyScore > 0.7) {
      insights.push('⏱️ Recently failed or not executed in a while');
    }

    // 3. Category and Priority Weight
    const categoryRisk = this.getCategoryRiskScore(testCase.category);
    const priorityWeight = this.getPriorityWeight(testCase.priority);
    failureProbability += (categoryRisk + priorityWeight) * 0.2; // 20% weight
    confidenceScore += 0.1;

    if (categoryRisk > 0.7) {
      insights.push(`🔒 High-risk category: ${testCase.category}`);
    }

    // 4. Related Test Impact
    const relatedTestsScore = this.calculateRelatedTestsImpact(testCase, allTestCases);
    failureProbability += relatedTestsScore * 0.15; // 15% weight
    confidenceScore += relatedTestsScore > 0 ? 0.1 : 0;

    if (relatedTestsScore > 0.5) {
      insights.push('🔗 High impact on related test cases');
    }

    // 5. Execution Environment Stability
    const environmentScore = this.calculateEnvironmentStability(testCase);
    failureProbability += environmentScore * 0.1; // 10% weight (new factor)

    if (environmentScore > 0.6) {
      insights.push('⚠️ Environment stability concerns detected');
    }

    // Cap probability at 1.0
    failureProbability = Math.min(failureProbability, 1.0);
    confidenceScore = Math.min(confidenceScore, 1.0);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(failureProbability, testCase);

    // Generate priority reason
    const priorityReason = this.generatePriorityReason(failureProbability, riskLevel, testCase);

    // Add strategic insights
    if (failureProbability > 0.8) {
      insights.push('🚨 Immediate attention required - very high failure risk');
    } else if (failureProbability > 0.6) {
      insights.push('⚡ Execute early to catch issues quickly');
    } else if (failureProbability < 0.2) {
      insights.push('✅ Low risk - can be executed later in cycle');
    }

    return {
      failureProbability: Math.round(failureProbability * 100) / 100,
      riskLevel,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      priorityReason,
      recommendedOrder: 0, // Will be set later
      insights
    };
  }

  /**
   * Calculate historical failure rate from execution history
   */
  private calculateHistoricalFailureRate(testCase: TestCase): number {
    if (!testCase.executionHistory || testCase.executionHistory.length === 0) {
      // No history - moderate risk for new tests
      return testCase.currentStatus === 'Not_Executed' ? 0.4 : 0.2;
    }

    // Look at recent executions (last 10 or all if less)
    const recentExecutions = testCase.executionHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    const failures = recentExecutions.filter(exec =>
      exec.status === 'Fail' || exec.status === 'Blocked'
    ).length;

    const failureRate = failures / recentExecutions.length;

    // Weight recent failures more heavily
    const recentFailures = recentExecutions.slice(0, 3).filter(exec =>
      exec.status === 'Fail' || exec.status === 'Blocked'
    ).length;

    const recentWeight = recentFailures > 0 ? 0.3 : 0;

    return Math.min(failureRate + recentWeight, 1.0);
  }

  /**
   * Calculate recency score based on last execution
   */
  private calculateRecencyScore(testCase: TestCase): number {
    if (!testCase.lastExecution) {
      return 0.6; // Never executed = moderate risk
    }

    const lastExecutionDate = new Date(testCase.lastExecution.date);
    const daysSinceExecution = (Date.now() - lastExecutionDate.getTime()) / (1000 * 60 * 60 * 24);

    // Recent failure = high risk
    if (testCase.lastExecution.status === 'Fail' && daysSinceExecution < 7) {
      return 0.8;
    }

    // Blocked recently = high risk
    if (testCase.lastExecution.status === 'Blocked' && daysSinceExecution < 14) {
      return 0.7;
    }

    // Long time since execution = moderate risk
    if (daysSinceExecution > 30) {
      return 0.5;
    }

    // Recent pass = low risk
    if (testCase.lastExecution.status === 'Pass' && daysSinceExecution < 7) {
      return 0.1;
    }

    return 0.3; // Default moderate-low risk
  }

  /**
   * Get category-based risk score
   */
  private getCategoryRiskScore(category: string): number {
    const categoryRisks = {
      'Security': 0.8,
      'Authentication': 0.7,
      'API': 0.6,
      'Integration': 0.6,
      'Performance': 0.5,
      'UI/UX': 0.4,
      'Functional': 0.3,
      'Mobile': 0.5
    };

    return categoryRisks[category] || 0.4;
  }

  /**
   * Get priority-based weight
   */
  private getPriorityWeight(priority: string): number {
    const priorityWeights = {
      'Critical': 0.8,
      'High': 0.6,
      'Medium': 0.4,
      'Low': 0.2
    };

    return priorityWeights[priority] || 0.4;
  }

  /**
   * Calculate impact on related test cases
   */
  private calculateRelatedTestsImpact(testCase: TestCase, allTestCases: TestCase[]): number {
    let impactScore = 0;

    // Same category tests
    const sameCategoryTests = allTestCases.filter(tc =>
      tc.id !== testCase.id && tc.category === testCase.category
    );

    // Same requirements
    const sameRequirementTests = allTestCases.filter(tc =>
      tc.id !== testCase.id &&
      tc.linkedRequirements?.some(req => testCase.linkedRequirements?.includes(req))
    );

    // High-priority tests in same category
    const highPriorityRelated = sameCategoryTests.filter(tc =>
      tc.priority === 'Critical' || tc.priority === 'High'
    );

    impactScore += Math.min(sameCategoryTests.length * 0.1, 0.4);
    impactScore += Math.min(sameRequirementTests.length * 0.15, 0.3);
    impactScore += Math.min(highPriorityRelated.length * 0.2, 0.3);

    return Math.min(impactScore, 1.0);
  }

  /**
   * Calculate environment stability score
   */
  private calculateEnvironmentStability(testCase: TestCase): number {
    if (!testCase.executionHistory) return 0.3;

    // Look for environment-related patterns in execution history
    const recentExecutions = testCase.executionHistory
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    let environmentIssues = 0;

    recentExecutions.forEach(exec => {
      const notes = exec.notes?.toLowerCase() || '';
      if (notes.includes('timeout') ||
          notes.includes('connection') ||
          notes.includes('server') ||
          notes.includes('network') ||
          notes.includes('environment')) {
        environmentIssues++;
      }
    });

    return environmentIssues > 0 ? Math.min(environmentIssues * 0.3, 0.8) : 0.1;
  }

  /**
   * Determine overall risk level
   */
  private determineRiskLevel(failureProbability: number, testCase: TestCase): 'low' | 'medium' | 'high' | 'critical' {
    if (failureProbability >= 0.8 || (testCase.priority === 'Critical' && failureProbability >= 0.6)) {
      return 'critical';
    }
    if (failureProbability >= 0.6 || (testCase.priority === 'High' && failureProbability >= 0.4)) {
      return 'high';
    }
    if (failureProbability >= 0.4) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Generate human-readable priority reason
   */
  private generatePriorityReason(failureProbability: number, riskLevel: string, testCase: TestCase): string {
    if (riskLevel === 'critical') {
      return `Critical risk (${Math.round(failureProbability * 100)}% failure probability) - Execute immediately`;
    }
    if (riskLevel === 'high') {
      return `High risk (${Math.round(failureProbability * 100)}% failure probability) - Execute early`;
    }
    if (riskLevel === 'medium') {
      return `Moderate risk (${Math.round(failureProbability * 100)}% failure probability) - Standard priority`;
    }
    return `Low risk (${Math.round(failureProbability * 100)}% failure probability) - Can execute later`;
  }

  /**
   * Generate comprehensive analysis
   */
  private generateAnalysis(prioritizedTests: PrioritizedTestCase[]): PrioritizationAnalysis {
    const totalTests = prioritizedTests.length;
    const highRiskTests = prioritizedTests.filter(test =>
      test.aiScore.riskLevel === 'high' || test.aiScore.riskLevel === 'critical'
    ).length;

    const recommendedExecutionOrder = prioritizedTests
      .slice(0, 10) // Top 10 recommendations
      .map(test => test.id);

    // Generate insights
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // Risk distribution
    const riskDistribution = {
      critical: prioritizedTests.filter(t => t.aiScore.riskLevel === 'critical').length,
      high: prioritizedTests.filter(t => t.aiScore.riskLevel === 'high').length,
      medium: prioritizedTests.filter(t => t.aiScore.riskLevel === 'medium').length,
      low: prioritizedTests.filter(t => t.aiScore.riskLevel === 'low').length
    };

    if (riskDistribution.critical > 0) {
      patterns.push(`🚨 ${riskDistribution.critical} critical risk test(s) detected`);
      recommendations.push('Execute critical risk tests immediately to prevent cascading failures');
    }

    if (riskDistribution.high > totalTests * 0.3) {
      patterns.push(`⚠️ High proportion of risky tests (${Math.round((riskDistribution.high / totalTests) * 100)}%)`);
      recommendations.push('Consider additional testing environment stabilization');
    }

    // Category analysis
    const categoryRisks = new Map<string, number>();
    prioritizedTests.forEach(test => {
      const current = categoryRisks.get(test.category) || 0;
      categoryRisks.set(test.category, current + test.aiScore.failureProbability);
    });

    const riskiestCategory = Array.from(categoryRisks.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (riskiestCategory && riskiestCategory[1] > 0.5) {
      patterns.push(`🎯 Highest risk category: ${riskiestCategory[0]}`);
      recommendations.push(`Focus additional attention on ${riskiestCategory[0]} test cases`);
    }

    // Execution strategy
    if (highRiskTests > totalTests * 0.2) {
      recommendations.push('Execute high-risk tests first to identify blocking issues early');
    }

    recommendations.push('Run AI-recommended tests in suggested order for optimal coverage');

    const summary = `AI analyzed ${totalTests} test cases. ${highRiskTests} high-risk tests identified. Recommended execution order optimizes for early failure detection and efficient test coverage.`;

    return {
      totalTests,
      highRiskTests,
      recommendedExecutionOrder,
      insights: {
        summary,
        patterns,
        recommendations
      }
    };
  }

  /**
   * Get quick risk assessment for a single test
   */
  async getQuickRiskAssessment(testCase: TestCase): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    failureProbability: number;
    quickInsight: string;
  }> {
    const aiScore = this.calculateAIScore(testCase, [testCase]);

    return {
      riskLevel: aiScore.riskLevel,
      failureProbability: aiScore.failureProbability,
      quickInsight: aiScore.priorityReason
    };
  }
}

export const aiTestPrioritizer = new AITestPrioritizer();