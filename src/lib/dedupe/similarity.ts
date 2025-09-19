import { TestCase } from '@/types';
import { extractTokens, jaccardSimilarity } from './fingerprint';

export interface SimilarityResult {
  score: number;
  titleSimilarity: number;
  stepsSimilarity: number;
  moduleSimilarity: number;
  breakdown: {
    title: number;
    steps: number;
    module: number;
  };
}

/**
 * Calculate weighted similarity between two test cases
 * Returns a score between 0 and 1
 */
export function calculateCaseSimilarity(testCase1: TestCase, testCase2: TestCase): SimilarityResult {
  // Extract titles
  const title1 = testCase1.testCase || testCase1.title || '';
  const title2 = testCase2.testCase || testCase2.title || '';

  // Extract modules/sections
  const module1 = testCase1.module || testCase1.category || '';
  const module2 = testCase2.module || testCase2.category || '';

  // Extract step descriptions
  const steps1 = (testCase1.testSteps || testCase1.data?.steps || [])
    .map(step => step.description || step.action || '')
    .join(' ');
  const steps2 = (testCase2.testSteps || testCase2.data?.steps || [])
    .map(step => step.description || step.action || '')
    .join(' ');

  // Calculate individual similarities
  const titleSimilarity = jaccardSimilarity(extractTokens(title1), extractTokens(title2));
  const stepsSimilarity = jaccardSimilarity(extractTokens(steps1), extractTokens(steps2));
  const moduleSimilarity = jaccardSimilarity(extractTokens(module1), extractTokens(module2));

  // Weighted scoring (title is most important, then steps, then module)
  const weights = {
    title: 0.5,
    steps: 0.4,
    module: 0.1
  };

  const score = (
    weights.title * titleSimilarity +
    weights.steps * stepsSimilarity +
    weights.module * moduleSimilarity
  );


  return {
    score,
    titleSimilarity,
    stepsSimilarity,
    moduleSimilarity,
    breakdown: {
      title: weights.title * titleSimilarity,
      steps: weights.steps * stepsSimilarity,
      module: weights.module * moduleSimilarity
    }
  };
}

/**
 * Find similar test cases from a collection
 */
export function findSimilarCases(
  targetCase: TestCase,
  candidateCases: TestCase[],
  minSimilarity: number = 0.7
): Array<{ testCase: TestCase; similarity: SimilarityResult }> {
  const results: Array<{ testCase: TestCase; similarity: SimilarityResult }> = [];

  for (const candidate of candidateCases) {
    // Skip if same ID
    if (candidate.id === targetCase.id) {
      continue;
    }

    const similarity = calculateCaseSimilarity(targetCase, candidate);

    if (similarity.score >= minSimilarity) {
      results.push({
        testCase: candidate,
        similarity
      });
    }
  }

  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarity.score - a.similarity.score);
}

/**
 * Categorize similarity level
 */
export function categorizeSimilarity(score: number): 'identical' | 'very_high' | 'high' | 'medium' | 'low' {
  if (score >= 0.97) return 'identical';
  if (score >= 0.88) return 'very_high';
  if (score >= 0.75) return 'high';
  if (score >= 0.60) return 'medium';
  return 'low';
}

/**
 * Get recommended action based on similarity score
 */
export function getRecommendedAction(score: number): {
  action: 'auto_merge' | 'review_merge' | 'keep_separate';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
} {
  if (score >= 0.97) {
    return {
      action: 'auto_merge',
      confidence: 'high',
      reason: 'Test cases are virtually identical (97%+ similarity)'
    };
  }

  if (score >= 0.88) {
    return {
      action: 'review_merge',
      confidence: 'medium',
      reason: 'Test cases are very similar (88%+ similarity) - human review recommended'
    };
  }

  return {
    action: 'keep_separate',
    confidence: 'high',
    reason: 'Test cases are sufficiently different (<88% similarity)'
  };
}