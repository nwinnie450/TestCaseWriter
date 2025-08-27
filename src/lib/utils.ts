import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string) {
  if (!date) return 'Never'
  
  let d: Date
  
  if (typeof date === 'string') {
    // Try parsing the string date
    d = new Date(date)
  } else if (date instanceof Date) {
    d = date
  } else {
    // Fallback for any other type
    d = new Date(date)
  }
  
  // Check if date is valid
  if (isNaN(d.getTime())) {
    console.warn('Invalid date encountered:', date)
    return 'Just now' // Return a more user-friendly message than 'Invalid Date'
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// Smart Test Case ID Generation
export function generateSmartTestCaseId(options: {
  module: string
  project: string
  type: 'functional' | 'integration' | 'negative' | 'edge' | 'api' | 'ui'
  existingIds: string[]
}): string {
  const { module, project, type, existingIds } = options
  
  // Create a base ID with module and type
  const modulePrefix = module.substring(0, 3).toUpperCase()
  const typePrefix = type.substring(0, 2).toUpperCase()
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 5)
  
  let baseId = `${modulePrefix}-${typePrefix}-${timestamp}-${randomSuffix}`
  
  // Ensure uniqueness by checking against existing IDs
  let counter = 1
  while (existingIds.includes(baseId)) {
    baseId = `${modulePrefix}-${typePrefix}-${timestamp}-${randomSuffix}-${counter}`
    counter++
  }
  
  return baseId
}

// Content Duplicate Detection
export function detectContentDuplicates(
  newTestCases: any[],
  existingTestCases: any[],
  similarityThreshold: number = 0.7
): {
  duplicates: Array<{
    newCase: any
    similarCase: any
    similarity: number
  }>
  potentialDuplicates: Array<{
    newCase: any
    similarCase: any
    similarity: number
  }>
} {
  const duplicates: Array<{ newCase: any; similarCase: any; similarity: number }> = []
  const potentialDuplicates: Array<{ newCase: any; similarCase: any; similarity: number }> = []
  
  newTestCases.forEach(newCase => {
    existingTestCases.forEach(existingCase => {
      const similarity = calculateSimilarity(newCase, existingCase)
      
      if (similarity >= similarityThreshold) {
        duplicates.push({
          newCase,
          similarCase: existingCase,
          similarity
        })
      } else if (similarity >= 0.5) {
        potentialDuplicates.push({
          newCase,
          similarCase: existingCase,
          similarity
        })
      }
    })
  })
  
  return { duplicates, potentialDuplicates }
}

// Simple similarity calculation based on test case title and description
function calculateSimilarity(testCase1: any, testCase2: any): number {
  const text1 = `${testCase1.testCase || ''} ${testCase1.module || ''}`.toLowerCase()
  const text2 = `${testCase2.testCase || ''} ${testCase2.module || ''}`.toLowerCase()
  
  if (text1 === text2) return 1.0
  
  const words1 = text1.split(/\s+/).filter((word: string) => word.length > 2)
  const words2 = text2.split(/\s+/).filter((word: string) => word.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0.0
  
  const commonWords = words1.filter((word: string) => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return commonWords.length / totalWords
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}