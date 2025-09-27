import { TestCase } from '@/types/index'
import * as XLSX from 'xlsx'
import { FEAI94_PRESET, extractFieldValue, normalizeValue, parseStepsFromText } from './presets/feai94-preset'

// Generate unique import ID: TC_IMPORT_{MODULE}_{RUNNING_NUMBER}
// Checks existing test cases to ensure no duplicates across multiple imports
function generateImportId(existingTestCases: TestCase[] = [], module: string = ''): string {
  // Clean module name for ID (remove spaces, special chars, make uppercase)
  const cleanModule = module
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .substring(0, 8) || 'GEN' // Use 'GEN' for general if no module

  // Find the highest import number for this module
  let maxImportNumber = 0
  const pattern = new RegExp(`^TC_IMPORT_${cleanModule}_(\\d+)$`)

  existingTestCases.forEach(tc => {
    const match = tc.id.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxImportNumber) {
        maxImportNumber = num
      }
    }
  })

  // Generate next sequential number for this module
  const nextNumber = maxImportNumber + 1
  return `TC_IMPORT_${cleanModule}_${String(nextNumber).padStart(3, '0')}`
}

export interface ImportResult {
  success: boolean
  testCases: TestCase[]
  errors: string[]
  skipped: number
  auditReport?: ImportAuditReport
  duplicateDetection?: DuplicateDetectionResult
}

export interface ImportAuditReport {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicatesFound: number
  fieldAnalysis: FieldAnalysis
  dataQualityIssues: DataQualityIssue[]
  recommendations: string[]
  timestamp: string
}

export interface FieldAnalysis {
  [fieldName: string]: {
    coverage: number // percentage of rows with this field populated
    uniqueValues: number
    avgLength: number
    dataTypes: string[]
    samples: string[]
  }
}

export interface DataQualityIssue {
  type: 'missing_required' | 'invalid_format' | 'duplicate' | 'inconsistent' | 'empty_value'
  field: string
  rowIndex: number
  value: string
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}

export interface DuplicateDetectionResult {
  exactDuplicates: DuplicateGroup[]
  similarCases: SimilarGroup[]
  uniqueCases: TestCase[]
  deduplicationStats: {
    originalCount: number
    duplicatesRemoved: number
    finalCount: number
    duplicateRate: number
  }
}

export interface DuplicateGroup {
  signature: string
  cases: TestCase[]
  keepCase: TestCase
  duplicateType: 'exact' | 'title' | 'content'
}

export interface SimilarGroup {
  cases: TestCase[]
  similarityScore: number
  differences: string[]
}

export interface ImportOptions {
  skipDuplicates?: boolean
  validateRequired?: boolean
  defaultProject?: string
  selectedSheet?: string
  existingTestCases?: TestCase[]
  enableAudit?: boolean
  deduplicationMode?: 'strict' | 'smart' | 'off'
  generateAuditCSV?: boolean
}

export interface ExcelSheetInfo {
  name: string
  rowCount: number
  hasHeaders: boolean
  preview: string[][]
  isTestCaseSheet: boolean
}

// Proper CSV parser that handles multi-line quoted fields
export function parseCSV(content: string): string[][] {
  console.log('📄 CSV Parser - Starting CSV parsing...')

  const result: string[][] = []
  let currentRow: string[] = []
  let currentField = ''
  let inQuotes = false
  let i = 0

  while (i < content.length) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within quoted field
        currentField += '"'
        i += 2 // Skip both quotes
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row (handle both \n and \r\n)
      if (char === '\r' && nextChar === '\n') {
        i++ // Skip the \n in \r\n
      }

      // Add the last field and complete the row
      currentRow.push(currentField.trim())

      // Only add non-empty rows
      if (currentRow.some(field => field.length > 0)) {
        result.push([...currentRow])
      }

      // Reset for next row
      currentRow = []
      currentField = ''
    } else {
      // Regular character
      currentField += char
    }

    i++
  }

  // Handle the last field and row if file doesn't end with newline
  currentRow.push(currentField.trim())
  if (currentRow.some(field => field.length > 0)) {
    result.push([...currentRow])
  }

  return result
}

export function mapRowToFEAI94TestCase(rowData: any, options: ImportOptions = {}): TestCase | null {
  try {
    console.log('🎯 FEAI-94 Mapper - Processing row:', Object.keys(rowData))

    const title = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.title) || 'Imported Test Case'
    const description = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.description)
    const module = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.module) || 'General'

    // Use existing ID if provided, otherwise generate new one with module
    const existingId = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.id)
    const id = existingId || generateImportId(options.existingTestCases, module)
    const stepsText = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.steps_description)
    const testData = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.test_data)
    const expectedResult = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.expected_result)
    const qa = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.qa_owner)
    const remarks = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.remarks)

    // Additional fields
    const project = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.project)
    const feature = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.feature)
    const enhancement = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.enhancement)
    const ticket = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.ticket)
    const tagsText = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.tags)
    const complexity = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.complexity)

    // Priority and status extraction
    const priorityValue = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.priority)
    const statusValue = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.test_result)

    // Map and normalize priority
    const priority = normalizeValue(priorityValue, FEAI94_PRESET.normalizers.priority) || 'medium'
    const status = normalizeValue(statusValue, FEAI94_PRESET.normalizers.status) || 'draft'

    // Parse tags - only use explicit tags, don't add module/priority automatically
    const tags = tagsText ? tagsText.split(/[,;|]/).map(tag => tag.trim()).filter(Boolean) : []

    // Get individual step expected results if available
    const stepExpectedResults = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.step_expected_results)

    // Parse test steps - FEAI-94 format: can have individual or overall expected results
    const parsedSteps = stepsText ? parseStepsFromText(stepsText, stepExpectedResults) : []
    const testSteps = parsedSteps.map((step) => ({
      step: step.step,
      description: step.description,
      expectedResult: step.expectedResult || '', // Can be empty if using overall expected result
      testData: step.testData || ''
    }))

    console.log('🎯 FEAI-94 Mapper - Extracted values:', {
      id,
      title,
      module,
      priority,
      status,
      stepsCount: testSteps.length
    })

    // Create test case object
    const testCase: TestCase = {
      id,
      templateId: 'feai94-template',
      projectId: project || options.defaultProject || 'default',
      priority: priority as any,
      status: status as any,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'FEAI-94-importer',
      lastModifiedBy: 'FEAI-94-importer',
      version: 1,

      // Enhanced fields
      enhancement: enhancement || '',
      ticketId: ticket || '',
      feature: feature || '',
      module: module || '',
      testCase: title,
      testSteps: testSteps,
      testData: testData || '',
      testResult: expectedResult || '',
      qa: qa || '',
      remarks: remarks || '',

      // FEAI-94 specific data structure
      data: {
        title,
        description: description || '', // Use separate description field or empty if not available
        preconditions: '',
        steps: testSteps,
        expectedResult: expectedResult || '',
        actualResult: '',
        category: module || '',
        assignee: qa || '',
        estimatedTime: '',
        testData: testData || '',
        remarks: remarks || '',
        complexity: complexity || 'Medium',

        // FEAI-94 specific fields
        module: module || '',
        feature: feature || '',
        enhancement: enhancement || '',
        ticketId: ticket || '',
        qaOwner: qa || '',
        isRegression: false,
        isAutomation: false,
        automationId: '',
        automationPreset: '',
        automationLoop: '',
        automationNote: ''
      }
    }

    console.log('🎯 FEAI-94 Mapper - Created test case:', testCase.id)
    return testCase

  } catch (error) {
    console.error('❌ FEAI-94 Mapper - Error mapping row to test case:', error)
    return null
  }
}

// Original CSV mapping function (kept for backward compatibility)
export function mapCSVToTestCase(headers: string[], row: string[], options: ImportOptions = {}): TestCase | null {
  try {
    if (row.length === 0 || row.every(cell => !cell.trim())) {
      return null // Skip empty rows
    }

    console.log('📄 CSV Mapper - Processing row with headers:', headers)
    console.log('📄 CSV Mapper - Row data:', row.slice(0, 5).map(cell => cell?.substring(0, 30)))

    const getValue = (possibleHeaders: string[]) => {
      for (const header of possibleHeaders) {
        // First try exact match (case insensitive)
        let index = headers.findIndex(h =>
          h.toLowerCase().trim() === header.toLowerCase().trim()
        )

        if (index === -1) {
          index = headers.findIndex(h =>
            h.toLowerCase().includes(header.toLowerCase()) ||
            header.toLowerCase().includes(h.toLowerCase())
          )
        }

        if (index !== -1 && row[index] && row[index].trim()) {
          return row[index].trim()
        }
      }
      return ''
    }

    // Helper function to parse tags
    const parseTags = (tagsString: string): string[] => {
      if (!tagsString) return []
      return tagsString.split(/[,;]/).map(tag => tag.trim()).filter(Boolean)
    }

    // Helper function to parse steps
    const parseSteps = (stepsString: string): any[] => {
      if (!stepsString) return []
      const lines = stepsString.split('\n').filter(line => line.trim())
      return lines.map((line, index) => ({
        step: index + 1,
        description: line.trim(),
        expectedResult: '',
        testData: ''
      }))
    }

    // Helper function to parse status
    const parseStatus = (statusString: string): string => {
      if (!statusString) return 'Not Run'
      const status = statusString.toLowerCase().trim()
      if (status.includes('pass')) return 'Passed'
      if (status.includes('fail')) return 'Failed'
      if (status.includes('skip')) return 'Skipped'
      if (status.includes('block')) return 'Blocked'
      return 'Not Run'
    }

    // Extract values from row
    const testCaseId = getValue(['test case id', 'id', 'test id', 'case id'])
    const testCaseTitle = getValue(['test case', 'title', 'test case title', 'name', 'test name'])
    const module = getValue(['module', 'component', 'area', 'feature'])
    const description = getValue(['description', 'desc', 'summary'])
    const testStepDescription = getValue(['test step description', 'steps', 'test steps', 'step description'])
    const expectedResult = getValue(['expected result', 'expected', 'result', 'expected outcome'])
    const testData = getValue(['test data', 'data', 'input data', 'inputs'])
    const testResult = getValue(['test result', 'actual result', 'status', 'outcome'])
    const qa = getValue(['qa', 'tester', 'assignee', 'owner'])
    const remarks = getValue(['remarks', 'notes', 'comments', 'note'])
    const preconditions = getValue(['preconditions', 'prerequisites', 'setup'])
    const tags = getValue(['tags', 'labels', 'categories'])
    const requirements = getValue(['requirements', 'requirement', 'req'])

    // More flexible validation - accept if we have either a title or valid ID
    const hasValidTitle = testCaseTitle && testCaseTitle.trim().length > 0
    const hasValidId = testCaseId && testCaseId.trim().length > 0

    if (!hasValidTitle && !hasValidId) {
      console.log(`📄 CSV Mapper - Skipping row: no valid title or ID`)
      return null
    }

    // Construct tags from available sources
    const allTags = []
    if (tags) allTags.push(...parseTags(tags))
    if (requirements) allTags.push(...parseTags(requirements))

    // Use Test Step Description as both description and steps source
    const finalDescription = description || testStepDescription || testCaseTitle || ''
    const finalSteps = testStepDescription ? parseSteps(testStepDescription) : []

    const testCase: TestCase = {
      id: generateImportId(), // Always generate unique ID
      templateId: 'imported-template',
      projectId: options.defaultProject || 'default',
      priority: 'medium' as any,
      status: parseStatus(testResult || '') as any,
      tags: Array.from(new Set(allTags)),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'importer',
      version: 1,
      data: {
        title: testCaseTitle || 'Imported Test Case',
        description: finalDescription,
        preconditions: preconditions || '',
        steps: finalSteps,
        expectedResult: expectedResult || '',
        actualResult: '',
        category: module || '',
        assignee: qa || '',
        estimatedTime: '',
        testData: testData || '',
        remarks: remarks || ''
      },
      // Legacy fields for backward compatibility
      module: module || '',
      testCase: testCaseTitle || 'Imported Test Case',
      testSteps: finalSteps,
      testData: testData || '',
      testResult: testResult || '',
      qa: qa || '',
      remarks: remarks || ''
    }

    // Validate required fields if option is enabled
    if (options.validateRequired) {
      // Require at least a title for standard CSV import
      if (!testCase.testCase || testCase.testCase.trim() === '' || testCase.testCase.trim() === 'Imported Test Case') {
        console.log('📄 CSV Mapper - Skipping row: missing required title')
        return null
      }
    }

    return testCase
  } catch (error) {
    console.error('Error mapping CSV row to test case:', error)
    return null
  }
}

// Detect if Excel data is in vertical key-value format
function detectVerticalFormat(rows: string[][]): boolean {
  console.log('📄 Format Detection - Starting vertical format detection...')
  console.log('📄 Format Detection - Rows to analyze:', Math.min(rows.length, 10))

  if (rows.length < 3) {
    console.log('📄 Format Detection - Too few rows for vertical format')
    return false
  }

  const keyPatterns = [
    'test case id', 'test case', 'module', 'description',
    'expected result', 'test data', 'qa', 'remarks'
  ]

  let matchCount = 0
  const sampleRows = rows.slice(0, Math.min(rows.length, 15))

  for (const row of sampleRows) {
    if (row.length < 2) continue
    const firstCell = row[0]?.toString().toLowerCase().trim() || ''

    // Check if first cell looks like a key pattern
    const isKeyPattern = keyPatterns.some(pattern =>
      firstCell.includes(pattern) || pattern.includes(firstCell)
    )

    if (isKeyPattern) {
      matchCount++
      console.log('📄 Format Detection - Found key pattern:', firstCell)
    }
  }

  console.log('📄 Format Detection - Pattern matches found:', matchCount)

  // If we find most of the key patterns in first column, it's likely vertical format
  const isVertical = matchCount >= 4
  console.log('📄 Format Detection - Final decision:', isVertical ? 'VERTICAL' : 'HORIZONTAL')
  return isVertical
}

// Parse vertical key-value format Excel data
export function parseVerticalKeyValueFormat(rows: string[][], options: ImportOptions = {}): TestCase[] {
  console.log('📄 Vertical Parser - Starting vertical key-value parsing...')
  console.log('📄 Vertical Parser - Total rows to process:', rows.length)

  const testCases: TestCase[] = []
  let currentTestCase: any = {}

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2) continue // Skip rows without key-value pairs

    const key = row[0]?.trim().toLowerCase().replace(/[:\s]+$/, '') // Remove trailing colon and spaces
    const value = row[1]?.trim() || ''

    // Map common keys to test case properties
    if (key.includes('test case id') || key === 'id') {
      if (currentTestCase.id && value) {
        // Save current test case if it has an ID and we're starting a new one
        if (currentTestCase.title || currentTestCase.description) {
          testCases.push(createTestCaseFromVerticalData(currentTestCase, options))
        }
        currentTestCase = { id: value }
      } else {
        currentTestCase.id = value
      }
    } else if (key.includes('test case') && !key.includes('id')) {
      currentTestCase.title = value
    } else if (key.includes('module')) {
      currentTestCase.module = value
    } else if (key.includes('description') || key.includes('step description')) {
      currentTestCase.description = value
    } else if (key.includes('expected result')) {
      currentTestCase.expectedResult = value
    } else if (key.includes('test data')) {
      currentTestCase.testData = value
    } else if (key.includes('qa') || key.includes('owner')) {
      currentTestCase.qa = value
    } else if (key.includes('remark')) {
      currentTestCase.remarks = value
    } else if (key.includes('priority')) {
      currentTestCase.priority = value
    } else if (key.includes('status') || key.includes('result')) {
      currentTestCase.status = value
    }
  }

  // Add the last test case if it has content
  if (currentTestCase.id || currentTestCase.title) {
    testCases.push(createTestCaseFromVerticalData(currentTestCase, options))
  }

  console.log('📄 Vertical Parser - Parsed test cases:', testCases.length)
  return testCases.filter(Boolean)
}

// Helper function to create TestCase from vertical data
function createTestCaseFromVerticalData(data: any, options: ImportOptions): TestCase {
  const steps = data.description ? parseStepsFromVertical(data.description) : []

  return {
    id: generateImportId(), // Always generate unique ID
    templateId: 'vertical-template',
    projectId: options.defaultProject || 'default',
    priority: (data.priority || 'medium') as any,
    status: (parseStatusFromVertical(data.status) || 'Not Run') as any,
    tags: [data.module, data.priority].filter(Boolean),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'vertical-importer',
    version: 1,
    data: {
      title: data.title || 'Imported Test Case',
      description: data.description || '',
      preconditions: '',
      steps: steps,
      expectedResult: data.expectedResult || '',
      actualResult: '',
      category: data.module || '',
      assignee: data.qa || '',
      estimatedTime: '',
      testData: data.testData || '',
      remarks: data.remarks || ''
    },
    // Legacy fields
    module: data.module || '',
    testCase: data.title || 'Imported Test Case',
    testSteps: steps,
    testData: data.testData || '',
    testResult: data.expectedResult || '',
    qa: data.qa || '',
    remarks: data.remarks || ''
  }
}

// Helper functions for vertical parsing
function parseStepsFromVertical(stepsText: string): any[] {
  if (!stepsText) return []
  const lines = stepsText.split('\n').filter(line => line.trim())
  return lines.map((line, index) => ({
    step: index + 1,
    description: line.trim(),
    expectedResult: '',
    testData: ''
  }))
}

function parseStatusFromVertical(statusString: string): string {
  if (!statusString) return 'Not Run'
  const status = statusString.toLowerCase().trim()
  if (status.includes('pass')) return 'Passed'
  if (status.includes('fail')) return 'Failed'
  if (status.includes('skip')) return 'Skipped'
  if (status.includes('block')) return 'Blocked'
  return 'Not Run'
}

// Enhanced duplicate detection with multiple strategies
export function detectDuplicates(testCases: TestCase[], options: ImportOptions = {}): DuplicateDetectionResult {
  const exactDuplicates: DuplicateGroup[] = []
  const similarCases: SimilarGroup[] = []
  const uniqueCases: TestCase[] = []
  const processedIds = new Set<string>()

  // Create signatures for duplicate detection
  const caseSignatures = new Map<string, TestCase[]>()

  for (const testCase of testCases) {
    if (processedIds.has(testCase.id)) continue

    // Generate multiple signatures for different types of duplicates
    const exactSignature = generateExactSignature(testCase)
    const titleSignature = generateTitleSignature(testCase)
    const contentSignature = generateContentSignature(testCase)

    // Check for exact duplicates first
    if (caseSignatures.has(exactSignature)) {
      caseSignatures.get(exactSignature)!.push(testCase)
    } else {
      caseSignatures.set(exactSignature, [testCase])
    }
  }

  // Process signatures to identify duplicates
  for (const [signature, cases] of Array.from(caseSignatures.entries())) {
    if (cases.length > 1) {
      // Found duplicates
      const duplicateGroup: DuplicateGroup = {
        signature,
        cases,
        keepCase: selectBestCase(cases),
        duplicateType: 'exact'
      }
      exactDuplicates.push(duplicateGroup)
      cases.forEach(c => processedIds.add(c.id))
    } else {
      uniqueCases.push(cases[0])
      processedIds.add(cases[0].id)
    }
  }

  // Smart similarity detection for remaining cases
  if (options.deduplicationMode === 'smart') {
    const similarGroups = findSimilarCases(uniqueCases)
    similarCases.push(...similarGroups)
  }

  const originalCount = testCases.length
  const duplicatesRemoved = exactDuplicates.reduce((acc, group) => acc + (group.cases.length - 1), 0)
  const finalCount = originalCount - duplicatesRemoved

  return {
    exactDuplicates,
    similarCases,
    uniqueCases,
    deduplicationStats: {
      originalCount,
      duplicatesRemoved,
      finalCount,
      duplicateRate: duplicatesRemoved / originalCount
    }
  }
}

// Generate exact signature for a test case
function generateExactSignature(testCase: TestCase): string {
  const normalizeText = (text: string) => text.toLowerCase().trim().replace(/\s+/g, ' ')

  const title = normalizeText(testCase.data?.title || testCase.testCase || '')
  const category = normalizeText(testCase.data?.category || testCase.module || '')
  const steps = (testCase.testSteps || testCase.data?.steps || [])
    .map((step: any) => normalizeText(typeof step === 'string' ? step : step.description || ''))
    .join('|')

  return `${title}:${category}:${steps}`
}

// Generate title-based signature
function generateTitleSignature(testCase: TestCase): string {
  const title = (testCase.data?.title || testCase.testCase || '').toLowerCase().trim().replace(/\s+/g, ' ')
  const category = (testCase.data?.category || testCase.module || '').toLowerCase().trim()
  return `${title}:${category}`
}

// Generate content-based signature
function generateContentSignature(testCase: TestCase): string {
  const description = (testCase.data?.description || '').toLowerCase().trim().replace(/\s+/g, ' ')
  const expectedResult = (testCase.testResult || testCase.data?.expectedResult || '').toLowerCase().trim()
  return `${description}:${expectedResult}`.substring(0, 200) // Limit length
}

// Select the best case from duplicates (most complete data)
function selectBestCase(cases: TestCase[]): TestCase {
  return cases.reduce((best, current) => {
    const bestScore = calculateCompletenessScore(best)
    const currentScore = calculateCompletenessScore(current)
    return currentScore > bestScore ? current : best
  })
}

// Calculate completeness score for a test case
function calculateCompletenessScore(testCase: TestCase): number {
  let score = 0

  if (testCase.data?.title || testCase.testCase) score += 10
  if (testCase.data?.description) score += 5
  if (testCase.data?.category || testCase.module) score += 3
  if (testCase.priority && testCase.priority !== 'medium') score += 2
  if (testCase.testSteps?.length || testCase.data?.steps?.length) {
    score += Math.min((testCase.testSteps?.length || testCase.data?.steps?.length || 0) * 2, 10)
  }
  if (testCase.testData || testCase.data?.testData) score += 3
  if (testCase.testResult || testCase.data?.expectedResult) score += 3
  if (testCase.tags?.length) score += testCase.tags.length

  return score
}

// Find similar cases using fuzzy matching
function findSimilarCases(testCases: TestCase[]): SimilarGroup[] {
  const similarGroups: SimilarGroup[] = []
  const processed = new Set<string>()

  for (let i = 0; i < testCases.length; i++) {
    if (processed.has(testCases[i].id)) continue

    const similarCases = [testCases[i]]

    for (let j = i + 1; j < testCases.length; j++) {
      if (processed.has(testCases[j].id)) continue

      const similarity = calculateSimilarity(testCases[i], testCases[j])

      if (similarity > 0.85) { // 85% similarity threshold
        similarCases.push(testCases[j])
        processed.add(testCases[j].id)
      }
    }

    if (similarCases.length > 1) {
      similarGroups.push({
        cases: similarCases,
        similarityScore: calculateGroupSimilarity(similarCases),
        differences: identifyDifferences(similarCases)
      })
    }

    processed.add(testCases[i].id)
  }

  return similarGroups
}

// Calculate similarity between two test cases
function calculateSimilarity(case1: TestCase, case2: TestCase): number {
  const title1 = (case1.data?.title || case1.testCase || '').toLowerCase()
  const title2 = (case2.data?.title || case2.testCase || '').toLowerCase()

  const titleSimilarity = levenshteinSimilarity(title1, title2)

  const steps1 = (case1.testSteps || case1.data?.steps || []).map((s: any) =>
    typeof s === 'string' ? s : s.description || ''
  ).join(' ').toLowerCase()

  const steps2 = (case2.testSteps || case2.data?.steps || []).map((s: any) =>
    typeof s === 'string' ? s : s.description || ''
  ).join(' ').toLowerCase()

  const stepsSimilarity = levenshteinSimilarity(steps1, steps2)

  // Weighted average: title is more important
  return titleSimilarity * 0.6 + stepsSimilarity * 0.4
}

// Calculate Levenshtein similarity (0-1)
function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(str1, str2)
  return (maxLength - distance) / maxLength
}

// Calculate Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

// Calculate average similarity for a group
function calculateGroupSimilarity(cases: TestCase[]): number {
  if (cases.length < 2) return 1

  let totalSimilarity = 0
  let comparisons = 0

  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      totalSimilarity += calculateSimilarity(cases[i], cases[j])
      comparisons++
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 1
}

// Identify key differences between similar cases
function identifyDifferences(cases: TestCase[]): string[] {
  const differences: string[] = []

  if (cases.length < 2) return differences

  const firstCase = cases[0]

  for (let i = 1; i < cases.length; i++) {
    const currentCase = cases[i]

    // Check title differences
    const title1 = firstCase.data?.title || firstCase.testCase || ''
    const title2 = currentCase.data?.title || currentCase.testCase || ''
    if (title1 !== title2) {
      differences.push(`Title variation: "${title1}" vs "${title2}"`)
    }

    // Check priority differences
    if (firstCase.priority !== currentCase.priority) {
      differences.push(`Priority: ${firstCase.priority} vs ${currentCase.priority}`)
    }

    // Check category differences
    const cat1 = firstCase.data?.category || firstCase.module || ''
    const cat2 = currentCase.data?.category || currentCase.module || ''
    if (cat1 !== cat2) {
      differences.push(`Category: "${cat1}" vs "${cat2}"`)
    }
  }

  return Array.from(new Set(differences)) // Remove duplicates
}

// Generate comprehensive audit report
export function generateAuditReport(
  rawData: any[],
  testCases: TestCase[],
  errors: string[],
  duplicateDetection: DuplicateDetectionResult
): ImportAuditReport {
  const fieldAnalysis = analyzeFields(rawData)
  const dataQualityIssues = identifyDataQualityIssues(rawData, testCases)
  const recommendations = generateRecommendations(fieldAnalysis, dataQualityIssues, duplicateDetection)

  return {
    totalRows: rawData.length,
    validRows: testCases.length,
    invalidRows: rawData.length - testCases.length,
    duplicatesFound: duplicateDetection.exactDuplicates.length,
    fieldAnalysis,
    dataQualityIssues,
    recommendations,
    timestamp: new Date().toISOString()
  }
}

// Analyze field coverage and quality
function analyzeFields(rawData: any[]): FieldAnalysis {
  const analysis: FieldAnalysis = {}

  if (rawData.length === 0) return analysis

  // Get all possible field names
  const allFields = new Set<string>()
  rawData.forEach(row => {
    if (typeof row === 'object' && row !== null) {
      Object.keys(row).forEach(key => allFields.add(key))
    }
  })

  // Analyze each field
  allFields.forEach(fieldName => {
    const values: string[] = []
    const dataTypes = new Set<string>()
    let totalLength = 0
    let populatedCount = 0

    rawData.forEach(row => {
      const value = row[fieldName]
      if (value !== undefined && value !== null && value !== '') {
        const strValue = String(value).trim()
        if (strValue) {
          values.push(strValue)
          totalLength += strValue.length
          populatedCount++
          dataTypes.add(typeof value)
        }
      }
    })

    const uniqueValues = new Set(values).size
    const coverage = (populatedCount / rawData.length) * 100
    const avgLength = populatedCount > 0 ? totalLength / populatedCount : 0

    analysis[fieldName] = {
      coverage,
      uniqueValues,
      avgLength,
      dataTypes: Array.from(dataTypes),
      samples: values.slice(0, 3) // First 3 samples
    }
  })

  return analysis
}

// Identify data quality issues
function identifyDataQualityIssues(rawData: any[], testCases: TestCase[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = []
  const requiredFields = ['title', 'test case', 'testcase', 'name']

  rawData.forEach((row, index) => {
    // Check for missing required fields
    const hasTitle = requiredFields.some(field => {
      const value = row[field] || row[field.toLowerCase()] || row[field.toUpperCase()]
      return value && String(value).trim()
    })

    if (!hasTitle) {
      issues.push({
        type: 'missing_required',
        field: 'title',
        rowIndex: index + 1,
        value: '',
        severity: 'high',
        suggestion: 'Add a test case title or name field'
      })
    }

    // Check for empty values in important fields
    const importantFields = ['description', 'steps', 'expected result']
    importantFields.forEach(field => {
      const value = row[field] || row[field.toLowerCase()] || row[field.replace(' ', '_')]
      if (!value || !String(value).trim()) {
        issues.push({
          type: 'empty_value',
          field,
          rowIndex: index + 1,
          value: '',
          severity: 'medium',
          suggestion: `Consider adding ${field} for better test case clarity`
        })
      }
    })

    // Check for inconsistent data formats
    if (row.priority) {
      const priority = String(row.priority).toLowerCase()
      const validPriorities = ['critical', 'high', 'medium', 'low', 'p0', 'p1', 'p2', 'p3']
      if (!validPriorities.includes(priority)) {
        issues.push({
          type: 'invalid_format',
          field: 'priority',
          rowIndex: index + 1,
          value: String(row.priority),
          severity: 'low',
          suggestion: 'Use standard priority values: Critical, High, Medium, Low'
        })
      }
    }
  })

  return issues
}

// Generate recommendations based on analysis
function generateRecommendations(
  fieldAnalysis: FieldAnalysis,
  issues: DataQualityIssue[],
  duplicateDetection: DuplicateDetectionResult
): string[] {
  const recommendations: string[] = []

  // Field coverage recommendations
  Object.entries(fieldAnalysis).forEach(([field, analysis]) => {
    if (analysis.coverage < 50) {
      recommendations.push(`Consider improving data quality: ${field} is only ${analysis.coverage.toFixed(1)}% populated`)
    }
  })

  // Duplicate recommendations
  if (duplicateDetection.deduplicationStats.duplicateRate > 0.3) {
    recommendations.push('High duplicate rate detected - consider reviewing data source for potential data entry issues')
  }

  // Data quality recommendations
  const highSeverityIssues = issues.filter(i => i.severity === 'high').length
  if (highSeverityIssues > 0) {
    recommendations.push(`${highSeverityIssues} high-severity data quality issues found - review before final import`)
  }

  // General recommendations
  if (Object.keys(fieldAnalysis).length > 20) {
    recommendations.push('Large number of fields detected - consider using field mapping to focus on essential test case data')
  }

  return recommendations
}

// Generate audit CSV export
export function generateAuditCSV(auditReport: ImportAuditReport, duplicateDetection: DuplicateDetectionResult): string {
  const csvRows: string[] = []

  // Header
  csvRows.push('Import Audit Report')
  csvRows.push(`Generated: ${auditReport.timestamp}`)
  csvRows.push('')

  // Summary statistics
  csvRows.push('SUMMARY STATISTICS')
  csvRows.push('Metric,Value')
  csvRows.push(`Total Rows Processed,${auditReport.totalRows}`)
  csvRows.push(`Valid Test Cases,${auditReport.validRows}`)
  csvRows.push(`Invalid Rows,${auditReport.invalidRows}`)
  csvRows.push(`Exact Duplicates Found,${auditReport.duplicatesFound}`)
  csvRows.push(`Duplicate Rate,${(duplicateDetection.deduplicationStats.duplicateRate * 100).toFixed(2)}%`)
  csvRows.push('')

  // Field analysis
  csvRows.push('FIELD ANALYSIS')
  csvRows.push('Field Name,Coverage %,Unique Values,Avg Length,Data Types,Sample Values')
  Object.entries(auditReport.fieldAnalysis).forEach(([field, analysis]) => {
    const sampleValues = analysis.samples.map(s => `"${s.replace(/"/g, '""')}"`).join('; ')
    csvRows.push(`"${field}",${analysis.coverage.toFixed(1)},${analysis.uniqueValues},${analysis.avgLength.toFixed(1)},"${analysis.dataTypes.join(', ')}","${sampleValues}"`)
  })
  csvRows.push('')

  // Data quality issues
  csvRows.push('DATA QUALITY ISSUES')
  csvRows.push('Row,Field,Issue Type,Severity,Value,Suggestion')
  auditReport.dataQualityIssues.forEach(issue => {
    csvRows.push(`${issue.rowIndex},"${issue.field}","${issue.type}","${issue.severity}","${issue.value.replace(/"/g, '""')}","${issue.suggestion.replace(/"/g, '""')}"`)
  })
  csvRows.push('')

  // Duplicate groups
  csvRows.push('DUPLICATE GROUPS')
  csvRows.push('Group,Duplicate Type,Cases Count,Keep Case ID,Keep Case Title')
  duplicateDetection.exactDuplicates.forEach((group, index) => {
    const keepCase = group.keepCase
    csvRows.push(`${index + 1},"${group.duplicateType}",${group.cases.length},"${keepCase.id}","${(keepCase.data?.title || keepCase.testCase || '').replace(/"/g, '""')}"`)
  })
  csvRows.push('')

  // Recommendations
  csvRows.push('RECOMMENDATIONS')
  auditReport.recommendations.forEach((rec, index) => {
    csvRows.push(`${index + 1},"${rec.replace(/"/g, '""')}"`)
  })

  return csvRows.join('\n')
}

// Import test cases from CSV content
export async function importTestCasesFromCSV(
  csvContent: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    testCases: [],
    errors: [],
    skipped: 0
  }

  try {
    console.log('📄 CSV Import - Starting CSV import process...')
    const rows = parseCSV(csvContent)
    console.log('📄 CSV Import - Parsed CSV rows:', rows.length)

    if (rows.length === 0) {
      result.errors.push('CSV file appears to be empty or invalid')
      return result
    }

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)
    console.log('📄 CSV Import - Headers detected:', headers)
    console.log('📄 CSV Import - Data rows to process:', dataRows.length)

    // Convert rows to objects for audit analysis
    const rawData = dataRows.map(row => {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i]
        const testCase = mapCSVToTestCase(headers, row, options)

        if (!testCase) {
          result.skipped++
          continue
        }

        result.testCases.push(testCase)
      } catch (error) {
        result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Enhanced duplicate detection
    if (options.deduplicationMode !== 'off' && result.testCases.length > 0) {
      console.log('📄 CSV Import - Running enhanced duplicate detection...')
      const duplicateDetection = detectDuplicates(result.testCases, options)

      // Apply deduplication based on mode
      if (options.deduplicationMode === 'strict' || options.deduplicationMode === 'smart') {
        // Remove exact duplicates, keep the best case from each group
        const duplicateIds = new Set<string>()
        duplicateDetection.exactDuplicates.forEach(group => {
          group.cases.forEach(testCase => {
            if (testCase.id !== group.keepCase.id) {
              duplicateIds.add(testCase.id)
            }
          })
        })

        result.testCases = result.testCases.filter(tc => !duplicateIds.has(tc.id))
        result.skipped += duplicateIds.size
      }

      result.duplicateDetection = duplicateDetection
    }

    // Generate audit report if enabled
    if (options.enableAudit) {
      console.log('📄 CSV Import - Generating audit report...')
      const auditReport = generateAuditReport(
        rawData,
        result.testCases,
        result.errors,
        result.duplicateDetection || {
          exactDuplicates: [],
          similarCases: [],
          uniqueCases: result.testCases,
          deduplicationStats: {
            originalCount: result.testCases.length,
            duplicatesRemoved: 0,
            finalCount: result.testCases.length,
            duplicateRate: 0
          }
        }
      )
      result.auditReport = auditReport
    }

    result.success = result.testCases.length > 0

  } catch (error) {
    console.error('❌ CSV Import - Failed to parse CSV:', error)
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Import test cases from Excel content
export async function importTestCasesFromExcel(
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    testCases: [],
    errors: [],
    skipped: 0
  }

  try {
    console.log('📊 Excel Import - Starting Excel import process...')
    console.log('📊 Excel Import - File details:', { name: file.name, size: file.size })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📊 Excel Import - Available sheets:', workbook.SheetNames)

    // Select the sheet to process
    const sheetName = options.selectedSheet || workbook.SheetNames[0]
    console.log('📊 Excel Import - Selected sheet:', sheetName)

    if (!workbook.Sheets[sheetName]) {
      result.errors.push(`Sheet "${sheetName}" not found in Excel file`)
      return result
    }

    const worksheet = workbook.Sheets[sheetName]
    console.log('📊 Excel Import - Converting worksheet to array...')
    const rawWorksheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][]
    console.log('📊 Excel Import - Raw worksheet data rows:', rawWorksheetData.length)

    // Filter out completely empty rows to avoid processing thousands of empty cells
    const worksheetData = rawWorksheetData.filter((row, index) => {
      const hasData = row && row.some(cell => cell && cell.toString().trim() !== '')
      if (!hasData && index < 10) {
        console.log(`📊 Excel Import - Skipping empty row ${index}`)
      }
      return hasData
    })

    console.log('📊 Excel Import - Filtered worksheet data rows:', worksheetData.length)
    console.log('📊 Excel Import - Sample rows:', worksheetData.slice(0, 3).map(row =>
      row.slice(0, 3).map(cell => typeof cell === 'string' ? cell.substring(0, 30) : cell)
    ))

    if (worksheetData.length === 0) {
      console.error(`❌ Excel Import - Sheet "${sheetName}" is empty`)
      result.errors.push(`Sheet "${sheetName}" appears to be empty`)
      return result
    }

    // Check if this is a vertical key-value format
    const isVerticalFormat = detectVerticalFormat(worksheetData)
    console.log('📊 Excel Import - Detected vertical format:', isVerticalFormat)

    if (isVerticalFormat) {
      console.log('📊 Excel Import - Using vertical key-value parser...')
      const testCases = parseVerticalKeyValueFormat(worksheetData, options)

      result.success = testCases.length > 0
      result.testCases = testCases
      if (testCases.length === 0) {
        result.errors.push('No valid test cases found in vertical format')
      }
      return result
    } else {
      console.log('📊 Excel Import - Using horizontal (standard) parser...')
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
      console.log('📊 Excel Import - Converted to JSON objects:', jsonData.length)

      if (jsonData.length === 0) {
        result.errors.push('No data rows found in Excel sheet')
        return result
      }

      // Process each row using FEAI-94 specific mapping
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const rowData = jsonData[i]
          const testCase = mapRowToFEAI94TestCase(rowData, options)

          if (!testCase) {
            result.skipped++
            continue
          }

          result.testCases.push(testCase)
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Enhanced duplicate detection for Excel
      if (options.deduplicationMode !== 'off' && result.testCases.length > 0) {
        console.log('📊 Excel Import - Running enhanced duplicate detection...')
        const duplicateDetection = detectDuplicates(result.testCases, options)

        // Apply deduplication based on mode
        if (options.deduplicationMode === 'strict' || options.deduplicationMode === 'smart') {
          // Remove exact duplicates, keep the best case from each group
          const duplicateIds = new Set<string>()
          duplicateDetection.exactDuplicates.forEach(group => {
            group.cases.forEach(testCase => {
              if (testCase.id !== group.keepCase.id) {
                duplicateIds.add(testCase.id)
              }
            })
          })

          result.testCases = result.testCases.filter(tc => !duplicateIds.has(tc.id))
          result.skipped += duplicateIds.size
        }

        result.duplicateDetection = duplicateDetection
      }

      // Generate audit report if enabled
      if (options.enableAudit) {
        console.log('📊 Excel Import - Generating audit report...')
        const auditReport = generateAuditReport(
          jsonData,
          result.testCases,
          result.errors,
          result.duplicateDetection || {
            exactDuplicates: [],
            similarCases: [],
            uniqueCases: result.testCases,
            deduplicationStats: {
              originalCount: result.testCases.length,
              duplicatesRemoved: 0,
              finalCount: result.testCases.length,
              duplicateRate: 0
            }
          }
        )
        result.auditReport = auditReport
      }

      result.success = result.testCases.length > 0
      return result
    }

  } catch (error) {
    console.error('❌ Excel Import - Failed to parse Excel file:', error)
    result.errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Helper function to determine if a sheet name suggests it contains test cases
function isTestCaseSheet(sheetName: string): boolean {
  const testCaseKeywords = ['test', 'case', 'tc', 'scenario', 'spec', 'requirement']
  const normalizedName = sheetName.toLowerCase()
  return testCaseKeywords.some(keyword => normalizedName.includes(keyword))
}

// Get Excel sheet information for preview
export async function getExcelSheetInfo(file: File): Promise<ExcelSheetInfo[]> {
  try {
    console.log('📋 Sheet Analysis - Starting Excel sheet analysis...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('📋 Sheet Analysis - Array buffer size:', arrayBuffer.byteLength)

    console.log('📋 Sheet Analysis - Parsing workbook...')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📋 Sheet Analysis - Found sheets:', workbook.SheetNames)

    const sheetInfos = workbook.SheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName]
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
      const rowCount = range.e.r + 1

      // Check if first row has headers
      const hasHeaders = range.e.r > 0

      // Get first few rows for preview
      const previewData: string[][] = []
      const maxPreviewRows = Math.min(3, rowCount)

      for (let row = 0; row < maxPreviewRows; row++) {
        const rowData: string[] = []
        for (let col = range.s.c; col <= Math.min(range.e.c, range.s.c + 7); col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = worksheet[cellAddress]
          rowData.push(cell ? String(cell.v || '') : '')
        }
        previewData.push(rowData)
      }

      const isTestCase = isTestCaseSheet(sheetName)

      return {
        name: sheetName,
        rowCount,
        hasHeaders,
        preview: previewData,
        isTestCaseSheet: isTestCase
      }
    }).sort((a, b) => {
      // Sort test case sheets first, then by name
      if (a.isTestCaseSheet && !b.isTestCaseSheet) return -1
      if (!a.isTestCaseSheet && b.isTestCaseSheet) return 1
      return a.name.localeCompare(b.name)
    })

    console.log('📋 Sheet Analysis - Final sheet analysis results:',
      sheetInfos.map(sheet => ({
        name: sheet.name,
        rows: sheet.rowCount,
        isTestCase: sheet.isTestCaseSheet
      }))
    )

    return sheetInfos
  } catch (error) {
    console.error('❌ Sheet Analysis - Failed to analyze Excel file:', error)
    throw error
  }
}

// Import test cases from JSON content
export async function importTestCasesFromJSON(
  jsonContent: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    testCases: [],
    errors: [],
    skipped: 0
  }

  try {
    const jsonData = JSON.parse(jsonContent)
    let testCases: any[]

    if (Array.isArray(jsonData)) {
      testCases = jsonData
    } else if (jsonData.testCases && Array.isArray(jsonData.testCases)) {
      testCases = jsonData.testCases
    } else if (jsonData.tests && Array.isArray(jsonData.tests)) {
      testCases = jsonData.tests
    } else {
      result.errors.push('JSON format not recognized. Expected array of test cases or object with testCases/tests property.')
      return result
    }

    for (let i = 0; i < testCases.length; i++) {
      try {
        const rawTestCase = testCases[i]

        // Helper function for parsing steps in JSON import
        const parseStepsFromJSON = (stepsData: any): any[] => {
          if (Array.isArray(stepsData)) return stepsData
          if (typeof stepsData === 'string') {
            const lines = stepsData.split('\n').filter(line => line.trim())
            return lines.map((line, index) => ({
              step: index + 1,
              description: line.trim(),
              expectedResult: '',
              testData: ''
            }))
          }
          return []
        }

        // Helper function for parsing priority in JSON import
        const parsePriority = (priorityString: string): string => {
          if (!priorityString) return 'medium'
          const priority = priorityString.toLowerCase().trim()
          if (priority.includes('high') || priority.includes('critical')) return 'high'
          if (priority.includes('low')) return 'low'
          return 'medium'
        }

        // Helper function for parsing status in JSON import
        const parseStatus = (statusString: string): string => {
          if (!statusString) return 'Not Run'
          const status = statusString.toLowerCase().trim()
          if (status.includes('pass')) return 'Passed'
          if (status.includes('fail')) return 'Failed'
          if (status.includes('skip')) return 'Skipped'
          if (status.includes('block')) return 'Blocked'
          return 'Not Run'
        }

        // Helper function for parsing tags in JSON import
        const parseTags = (tagsString: string): string[] => {
          if (!tagsString) return []
          return tagsString.split(/[,;]/).map(tag => tag.trim()).filter(Boolean)
        }

        const stepsArray = parseStepsFromJSON(rawTestCase.steps)

        const testCase: TestCase = {
          id: generateImportId(), // Always generate unique ID
          templateId: 'imported-template',
          projectId: options.defaultProject || 'default',
          data: {
            title: rawTestCase.title || rawTestCase.name || `Imported Test Case ${i + 1}`,
            description: rawTestCase.description || rawTestCase.desc || '',
            preconditions: rawTestCase.preconditions || rawTestCase.prerequisites || '',
            steps: stepsArray,
            expectedResult: rawTestCase.expectedResult || rawTestCase.expected || '',
            actualResult: '',
            category: rawTestCase.category || rawTestCase.module || '',
            assignee: rawTestCase.assignee || rawTestCase.qa || '',
            estimatedTime: rawTestCase.estimatedTime || '',
            testData: rawTestCase.testData || rawTestCase.data || '',
            remarks: rawTestCase.remarks || rawTestCase.notes || ''
          },
          priority: parsePriority(rawTestCase.priority) as any,
          status: parseStatus(rawTestCase.status) as any,
          tags: Array.isArray(rawTestCase.tags) ? rawTestCase.tags : parseTags(rawTestCase.tags || ''),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'json-importer',
          version: 1,
          // Legacy fields
          module: rawTestCase.category || rawTestCase.module || '',
          testCase: rawTestCase.title || rawTestCase.name || `Imported Test Case ${i + 1}`,
          testSteps: stepsArray,
          testData: rawTestCase.testData || rawTestCase.data || '',
          testResult: rawTestCase.expectedResult || rawTestCase.expected || '',
          qa: rawTestCase.assignee || rawTestCase.qa || '',
          remarks: rawTestCase.remarks || rawTestCase.notes || ''
        }

        result.testCases.push(testCase)
      } catch (error) {
        result.errors.push(`Test case ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    result.success = result.testCases.length > 0
  } catch (error) {
    result.errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Main import function that detects file type
export async function importTestCases(
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult> {
  try {
    console.log('🎯 Main Import - Starting import process', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      options
    })

    const fileName = file.name.toLowerCase()
    console.log('🎯 Main Import - Detected file extension:', fileName)

    if (fileName.endsWith('.csv')) {
      console.log('🎯 Main Import - Processing as CSV file')
      const content = await file.text()
      return importTestCasesFromCSV(content, options)
    } else if (fileName.endsWith('.json')) {
      console.log('🎯 Main Import - Processing as JSON file')
      const content = await file.text()
      return importTestCasesFromJSON(content, options)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('🎯 Main Import - Processing as Excel file')
      return importTestCasesFromExcel(file, options)
    } else {
      console.error('❌ Main Import - Unsupported file format:', fileName)
      return {
        success: false,
        testCases: [],
        errors: [`Unsupported file format: ${file.name}. Supported formats: CSV, JSON, Excel (.xlsx/.xls)`],
        skipped: 0
      }
    }
  } catch (error) {
    console.error('❌ Main Import - Unexpected error:', error)
    return {
      success: false,
      testCases: [],
      errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      skipped: 0
    }
  }
}