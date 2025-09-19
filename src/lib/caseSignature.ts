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

  // Debug log the canonical string to see what's being hashed
  console.log('🔑 Signature Debug - Canonical string:', {
    title: clean(input.title),
    module: clean(input.module),
    priority: clean(input.priority),
    stepsCount: input.steps.length,
    stepsSig: stepsSig.substring(0, 100) + (stepsSig.length > 100 ? '...' : ''),
    fullCanonical: canonical.substring(0, 200) + (canonical.length > 200 ? '...' : '')
  })

  // Check for empty canonical strings which would cause signature collisions
  if (!canonical || canonical.trim() === '' || canonical === '######') {
    console.warn('⚠️ Empty canonical signature detected, using fallback')
    // Use a more robust fallback that includes any available content
    const fallback = JSON.stringify(input).replace(/\s+/g, ' ').trim()
    return simpleHash(fallback || 'empty-' + Date.now())
  }

  // Use a simple hash implementation for localStorage compatibility
  return simpleHash(canonical)
}

/**
 * Convert a TestCase object to signature input format
 */
export function testCaseToSignatureInput(testCase: TestCase): CaseSignatureInput {
  // Extract steps from multiple possible sources
  let steps: Step[] = []

  // Check for testSteps array
  if (testCase.testSteps && Array.isArray(testCase.testSteps) && testCase.testSteps.length > 0) {
    steps = testCase.testSteps.map((step: TestStep) => ({
      action: step.description || '',
      data: step.testData || '',
      expected: step.expectedResult || ''
    }))
  } else {
    // Check for step data in description or other fields
    const stepDescription = testCase.description || testCase.data?.description || testCase.data?.testSteps || testCase.data?.['Test Step Description'] || testCase.data?.['*Test Steps'] || ''
    const expectedResult = testCase.expectedResult || testCase.data?.expectedResult || testCase.data?.['Expected Result'] || testCase.data?.['Test Result'] || ''
    const testData = testCase.data?.testData || testCase.data?.['Test Data'] || ''

    // Also check for steps array in different locations
    const stepsArray = testCase.steps || testCase.data?.steps
    if (stepsArray && Array.isArray(stepsArray) && stepsArray.length > 0) {
      steps = stepsArray.map((step: any) => ({
        action: step.action || step.description || step.step || '',
        data: step.data || step.testData || '',
        expected: step.expected || step.expectedResult || ''
      }))
    } else if (stepDescription || expectedResult) {
      // If we have step description or expected result, create a single step
      steps = [{
        action: stepDescription,
        data: testData,
        expected: expectedResult
      }]
    }
  }

  // Check legacy fields first, then data fields
  const title = testCase.testCase || testCase.data?.title || testCase.data?.testCase || testCase.data?.['Test Case'] || testCase.title || ''
  const module = testCase.module || testCase.data?.module || testCase.data?.['Module'] || testCase.data?.category || testCase.category || ''
  const priority = testCase.priority || testCase.data?.priority || testCase.data?.['Priority'] || ''

  // Debug log the extracted fields
  console.log('🔍 Signature Extract Debug:', {
    testCaseId: testCase.id,
    extractedTitle: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
    extractedModule: module,
    extractedPriority: priority,
    stepsFound: steps.length,
    rawTestCase: JSON.stringify(testCase).substring(0, 300) + '...'
  })

  return {
    title,
    module,
    priority,
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