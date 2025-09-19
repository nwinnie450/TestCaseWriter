import crypto from 'crypto';
import { TestCase } from '@/types';

/**
 * Normalize string for consistent comparison
 */
function normalize(s: any): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\r?\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate deterministic fingerprint for test case identity
 * Based on core fields that define the test's uniqueness
 */
export function generateFingerprint(testCase: TestCase): string {
  const core = {
    // Core identity fields
    section: normalize(testCase.module || testCase.category),
    title: normalize(testCase.testCase || testCase.title),

    // Normalized step actions (ignore expected/data for identity)
    steps: (testCase.testSteps || testCase.data?.steps || [])
      .map(step => normalize(step.description || step.action))
      .filter(Boolean)
      .join('|'),

    // Include expected result and test data for strict matching
    expected: normalize(testCase.data?.expectedResult || testCase.testResult),
    data: normalize(testCase.testData || testCase.data?.testData),

    // Include preconditions if present
    preconditions: normalize(testCase.data?.preconditions)
  };

  // Create deterministic JSON string
  const canonicalJson = JSON.stringify(core, Object.keys(core).sort());

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex');

  console.log('🔑 Fingerprint generated:', {
    testCaseId: testCase.id,
    title: testCase.testCase?.substring(0, 50),
    fingerprint: hash.substring(0, 16) + '...',
    coreFields: {
      section: core.section,
      titleLength: core.title.length,
      stepsCount: core.steps.split('|').filter(Boolean).length,
      hasExpected: !!core.expected,
      hasData: !!core.data
    }
  });

  return hash;
}

/**
 * Generate loose fingerprint (ignores test data and expected results)
 * Useful for finding cases that are functionally the same but have different data
 */
export function generateLooseFingerprint(testCase: TestCase): string {
  const core = {
    section: normalize(testCase.module || testCase.category),
    title: normalize(testCase.testCase || testCase.title),
    steps: (testCase.testSteps || testCase.data?.steps || [])
      .map(step => normalize(step.description || step.action))
      .filter(Boolean)
      .join('|'),
    preconditions: normalize(testCase.data?.preconditions)
  };

  const canonicalJson = JSON.stringify(core, Object.keys(core).sort());
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

/**
 * Extract tokens from text for similarity comparison
 */
export function extractTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Calculate Jaccard similarity between two token arrays
 */
export function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection = [...setA].filter(token => setB.has(token)).length;
  const union = new Set([...tokensA, ...tokensB]).size;

  return union > 0 ? intersection / union : 0;
}

/**
 * Check if two test cases are exact duplicates (same fingerprint)
 */
export function areExactDuplicates(testCase1: TestCase, testCase2: TestCase): boolean {
  return generateFingerprint(testCase1) === generateFingerprint(testCase2);
}

/**
 * Check if two test cases are loose duplicates (same loose fingerprint)
 */
export function areLooseDuplicates(testCase1: TestCase, testCase2: TestCase): boolean {
  return generateLooseFingerprint(testCase1) === generateLooseFingerprint(testCase2);
}