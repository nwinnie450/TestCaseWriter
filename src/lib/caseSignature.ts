import { TestCase, TestStep } from '@/types'

// Clean and normalize text for consistent comparison
const clean = (s = "") => s.trim().toLowerCase().replace(/\s+/g, " ")

export type Step = { 
  action: string
  data?: string 
  expected: string 
}

export interface CaseSignatureInput {
  title: string
  module?: string
  priority?: string
  steps: Step[]
  preconditions?: string[]
  acceptance?: string[]
}

/**
 * Build a deterministic signature for a test case to prevent duplicates
 * Based on normalized content (case-insensitive, whitespace-normalized)
 */
export function buildCaseSignature(input: CaseSignatureInput): string {
  // Normalize steps into a consistent signature string
  const stepsSig = input.steps
    .map(s => `${clean(s.action)}|${clean(s.data)}|${clean(s.expected)}`)
    .join("||")

  // Build canonical string from all key fields
  const canonical = [
    clean(input.title),
    clean(input.module),
    clean(input.priority),
    stepsSig,
    (input.preconditions ?? []).map(clean).join("|"),
    (input.acceptance ?? []).map(clean).join("|"),
  ].join("##")

  // Use a simple hash implementation for localStorage compatibility
  return simpleHash(canonical)
}

/**
 * Convert a TestCase object to signature input format
 */
export function testCaseToSignatureInput(testCase: TestCase): CaseSignatureInput {
  const steps: Step[] = testCase.testSteps?.map((step: TestStep) => ({
    action: step.description || '',
    data: step.testData || '',
    expected: step.expectedResult || ''
  })) || []

  return {
    title: testCase.testCase || testCase.data?.title || '',
    module: testCase.module || testCase.data?.module || '',
    priority: testCase.priority || '',
    steps,
    preconditions: [], // Can be extended later
    acceptance: []     // Can be extended later
  }
}

/**
 * Simple hash function for deterministic signatures
 * (Alternative to crypto.createHash for browser compatibility)
 */
export function simpleHash(str: string): string {
  let hash = 0
  if (str.length === 0) return hash.toString(36)
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to base36 string for compact representation
  return Math.abs(hash).toString(36)
}

/**
 * Generate signature directly from TestCase
 */
export function getTestCaseSignature(testCase: TestCase): string {
  const input = testCaseToSignatureInput(testCase)
  return buildCaseSignature(input)
}

/**
 * Check if two test cases are duplicates based on signature
 */
export function areTestCasesDuplicates(testCase1: TestCase, testCase2: TestCase): boolean {
  const sig1 = getTestCaseSignature(testCase1)
  const sig2 = getTestCaseSignature(testCase2)
  return sig1 === sig2
}