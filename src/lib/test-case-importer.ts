import { TestCase } from '@/types'
import * as XLSX from 'xlsx'
import { FEAI94_PRESET, extractFieldValue, normalizeValue, parseStepsFromText } from './presets/feai94-preset'

export interface ImportResult {
  success: boolean
  testCases: TestCase[]
  errors: string[]
  skipped: number
}

export interface ImportOptions {
  skipDuplicates?: boolean
  validateRequired?: boolean
  defaultProject?: string
  selectedSheet?: string
  existingTestCases?: TestCase[]
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
        console.log(`📄 CSV Parser - Parsed row ${result.length}:`, currentRow.slice(0, 3).map(f => f.substring(0, 30) + (f.length > 30 ? '...' : '')))
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

  // Handle the last row if it doesn't end with a newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim())
    if (currentRow.some(field => field.length > 0)) {
      result.push(currentRow)
      console.log(`📄 CSV Parser - Parsed final row ${result.length}:`, currentRow.slice(0, 3).map(f => f.substring(0, 30) + (f.length > 30 ? '...' : '')))
    }
  }

  console.log('📄 CSV Parser - Final parsed rows:', result.length)
  console.log('📄 CSV Parser - Expected 6 rows (1 header + 5 data), got:', result.length)

  return result
}

// FEAI-94 specific mapping function for better Excel compatibility
export function mapFEAI94RowToTestCase(rowData: any, options: ImportOptions = {}): TestCase | null {
  try {
    console.log('🎯 FEAI-94 Mapper - Processing row:', Object.keys(rowData))

    // Extract values using FEAI-94 preset mappings
    const id = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.id) ||
               `TC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const title = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.title) || 'Imported Test Case'
    const module = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.module)
    const stepsText = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.steps_description)
    const testData = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.test_data)
    const expectedResult = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.expected_result)
    const qaOwner = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.qa_owner)
    const remarks = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.remarks)

    // Normalize values
    const priority = normalizeValue(
      extractFieldValue(rowData, FEAI94_PRESET.columnMappings.priority),
      FEAI94_PRESET.normalizers.priority
    ) || 'Medium'

    const status = normalizeValue(
      extractFieldValue(rowData, FEAI94_PRESET.columnMappings.test_result),
      FEAI94_PRESET.normalizers.status
    ) || 'Not Run'

    const isRegression = normalizeValue(
      extractFieldValue(rowData, FEAI94_PRESET.columnMappings.regression),
      FEAI94_PRESET.normalizers.boolean
    ) || false

    const isAutomation = normalizeValue(
      extractFieldValue(rowData, FEAI94_PRESET.columnMappings.automation_enabled),
      FEAI94_PRESET.normalizers.boolean
    ) || false

    // Parse test steps from description
    const parsedSteps = parseStepsFromText(stepsText)
    const testSteps = parsedSteps.map(step => ({
      step: step.step,
      description: step.description,
      expectedResult: step.expectedResult || expectedResult,
      testData: step.testData || testData
    }))

    // Create test case object
    const testCase: TestCase = {
      id,
      templateId: 'feai94-template',
      projectId: options.defaultProject || 'default',
      title,
      description: stepsText || title,
      category: module || 'General',
      priority,
      status,
      tags: [module, priority].filter(Boolean),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'FEAI-94-importer',
      version: 1,

      // FEAI-94 specific data structure
      data: {
        title,
        description: stepsText || title,
        preconditions: '',
        steps: testSteps,
        expectedResult: expectedResult,
        testData: testData,
        module: module,
        qaOwner: qaOwner,
        remarks: remarks,
        isRegression: isRegression,
        isAutomation: isAutomation,
        automationId: extractFieldValue(rowData, FEAI94_PRESET.columnMappings.automation_id),
        automationPreset: extractFieldValue(rowData, FEAI94_PRESET.columnMappings.automation_preset),
        automationLoop: extractFieldValue(rowData, FEAI94_PRESET.columnMappings.automation_loop),
        automationNote: extractFieldValue(rowData, FEAI94_PRESET.columnMappings.automation_note)
      },

      // Legacy fields for backward compatibility
      module: module || '',
      testCase: title,
      testSteps: testSteps,
      testData: testData,
      testResult: expectedResult,
      qa: qaOwner || '',
      remarks: remarks || ''
    }

    console.log('🎯 FEAI-94 Mapper - Successfully mapped test case:', {
      id: testCase.id,
      title: testCase.title,
      module: testCase.module,
      stepsCount: testCase.testSteps?.length || 0,
      hasTestData: !!testData,
      hasExpectedResult: !!expectedResult,
      priority: priority,
      status: status
    })

    return testCase

  } catch (error) {
    console.error('❌ FEAI-94 Mapper - Error mapping row to test case:', error)
    return null
  }
}

// Original CSV mapping function (kept for backward compatibility)
export function mapCSVToTestCase(headers: string[], row: string[], options: ImportOptions = {}): TestCase | null {
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

      // If no exact match, try contains match
      if (index === -1) {
        index = headers.findIndex(h =>
          h.toLowerCase().includes(header.toLowerCase()) ||
          header.toLowerCase().includes(h.toLowerCase())
        )
      }

      if (index !== -1 && row[index] && row[index].trim()) {
        console.log(`📄 CSV Mapper - Found value for "${header}": "${row[index].trim().substring(0, 50)}..."`)
        return row[index].trim()
      }
    }
    return ''
  }

  try {
    console.log('🔍 CSV Mapper - Available headers:', headers)

    // Handle both old format, standard CSV headers, and Excel specific headers
    const testCaseId = getValue(['test case id', 'id', 'testcase id', 'case id'])
    const testCaseTitle = getValue(['test case', 'title', 'name', 'test name', 'case name'])
    const testStepDescription = getValue(['test step description', 'steps', 'test steps', 'step description', '*test steps'])
    const description = getValue(['description', 'desc', 'test description'])
    const expectedResult = getValue(['expected result', 'expected', 'expectedresult'])
    const preconditions = getValue(['preconditions', 'prerequisites', 'precondition', 'pre-conditions'])
    const testData = getValue(['test data', 'data', 'testdata'])
    const module = getValue(['module', 'category', 'type'])
    const qa = getValue(['qa', 'assignee', 'tester'])
    const remarks = getValue(['remarks', 'notes', 'comment', 'comments'])
    const testResult = getValue(['test result', 'status', 'result'])
    const requirements = getValue(['requirements', 'requirement', 'req'])
    const tags = getValue(['tags', 'tag'])

    console.log('🔍 CSV Mapper - Field values extracted:', {
      id: testCaseId?.substring(0, 20),
      title: testCaseTitle?.substring(0, 50),
      stepDescription: testStepDescription?.substring(0, 100),
      description: description?.substring(0, 50),
      expectedResult: expectedResult?.substring(0, 50),
      module: module,
      qa: qa,
      testResult: testResult
    })

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

    console.log('🔍 CSV Mapper - Final processing:', {
      finalDescription: finalDescription.substring(0, 100),
      stepsCount: finalSteps.length,
      stepsSample: finalSteps.slice(0, 2)
    })

    const testCase: TestCase = {
      id: testCaseId || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: 'imported-template',
      projectId: options.defaultProject || 'default',
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
      status: parseStatus(testResult || ''),
      priority: 'medium' as const,
      tags: [...new Set(allTags)],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'importer',
      version: 1,
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
        console.log('📄 CSV Mapper - Skipping row: no valid title. Title found:', `"${testCase.testCase}"`)
        return null
      }
    } else {
      console.log('📄 CSV Mapper - Validation disabled, importing test case with title:', `"${testCase.testCase}"`)
    }

    console.log('📄 CSV Mapper - Successfully mapped test case:', {
      id: testCase.id,
      title: testCase.testCase,
      hasSteps: testCase.testSteps && testCase.testSteps.length > 0,
      hasExpectedResult: !!testCase.data.expectedResult
    })

    return testCase
  } catch (error) {
    console.error('Error mapping CSV row to test case:', error)
    return null
  }
}

// Detect if Excel data is in vertical key-value format
function detectVerticalFormat(rows: string[][]): boolean {
  if (rows.length < 10) {
    console.log('📄 Format Detection - Not enough rows for vertical format detection')
    return false
  }

  // Look for key patterns in first column that indicate vertical format
  const keyPatterns = [
    'test case id',
    'module',
    'test case',
    'test steps',
    'test step description',
    'expected result',
    'test data'
  ]

  const firstColumnValues = rows.slice(0, 20).map(row => row[0]?.toLowerCase().trim() || '')
  const matchCount = keyPatterns.filter(pattern =>
    firstColumnValues.some(value => value.includes(pattern))
  ).length

  // Check if first row looks like headers (horizontal format)
  const firstRowValues = rows[0]?.map(cell => cell?.toLowerCase().trim() || '') || []
  const headerMatchCount = keyPatterns.filter(pattern =>
    firstRowValues.some(value => value.includes(pattern))
  ).length

  console.log('📄 Format Detection - Analysis:', {
    totalRows: rows.length,
    keyPatternsInFirstColumn: matchCount,
    keyPatternsInFirstRow: headerMatchCount,
    sampleFirstColumn: firstColumnValues.slice(0, 5),
    sampleFirstRow: firstRowValues.slice(0, 5)
  })

  // If first row has more key patterns, it's likely horizontal format with headers
  if (headerMatchCount >= 3) {
    console.log('📄 Format Detection - Detected HORIZONTAL format (headers in first row)')
    return false
  }

  // If we find most of the key patterns in first column, it's likely vertical format
  const isVertical = matchCount >= 4
  console.log('📄 Format Detection - Final decision:', isVertical ? 'VERTICAL' : 'HORIZONTAL')
  return isVertical
}

// Parse vertical key-value format Excel data
export function parseVerticalKeyValueFormat(rows: string[][]): TestCase[] {
  console.log('📄 Vertical Parser - Starting vertical key-value parsing...')
  console.log('📄 Vertical Parser - Total rows to process:', rows.length)

  const testCases: TestCase[] = []
  let currentTestCase: any = {}

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < 2) continue // Skip rows without key-value pairs

    const key = row[0]?.trim().toLowerCase().replace(/[:\s]+$/, '') // Remove trailing colon and spaces
    const value = row[1]?.trim() || ''

    console.log(`📄 Vertical Parser - Row ${i + 1}: "${key}" = "${value.substring(0, 50)}..."`)

    // Check if this is the start of a new test case
    if (key.includes('test case id') || key.includes('testcase id') || key === 'test case id') {
      // Save previous test case if it exists
      if (currentTestCase.id) {
        const testCase = buildTestCaseFromKeyValue(currentTestCase)
        if (testCase) {
          testCases.push(testCase)
          console.log('📄 Vertical Parser - Completed test case:', testCase.id)
        }
      }

      // Start new test case
      currentTestCase = { id: value }
      console.log('📄 Vertical Parser - Starting new test case:', value)
      continue
    }

    // Map keys to test case properties
    if (key.includes('module')) {
      currentTestCase.module = value
    } else if (key.includes('test case') && !key.includes('id')) {
      currentTestCase.title = value
    } else if (key.includes('test steps') && key.length < 15) { // Just the count
      currentTestCase.stepCount = value
    } else if (key.includes('test step description') || key.includes('teststep description')) {
      currentTestCase.steps = value
    } else if (key.includes('test data')) {
      currentTestCase.testData = value
    } else if (key.includes('expected result')) {
      currentTestCase.expectedResult = value
    } else if (key.includes('test result')) {
      currentTestCase.status = value
    } else if (key === 'qa') {
      currentTestCase.assignee = value
    } else if (key.includes('remarks') || key.includes('remark')) {
      currentTestCase.remarks = value
    }
  }

  // Don't forget the last test case
  if (currentTestCase.id) {
    const testCase = buildTestCaseFromKeyValue(currentTestCase)
    if (testCase) {
      testCases.push(testCase)
      console.log('📄 Vertical Parser - Completed final test case:', testCase.id)
    }
  }

  console.log('📄 Vertical Parser - Total test cases parsed:', testCases.length)
  return testCases
}

// Build TestCase object from key-value data
function buildTestCaseFromKeyValue(kvData: any): TestCase | null {
  if (!kvData.id && !kvData.title) {
    console.log('📄 Vertical Parser - Skipping invalid test case: no ID or title')
    return null
  }

  const steps = kvData.steps ? parseSteps(kvData.steps) : []

  return {
    id: kvData.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: 'imported-template',
    projectId: 'default',
    data: {
      title: kvData.title || 'Imported Test Case',
      description: kvData.description || '',
      preconditions: kvData.preconditions || '',
      steps: steps,
      expectedResult: kvData.expectedResult || '',
      actualResult: ''
    },
    priority: 'medium' as const,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'importer',
    version: 1,
    // Legacy fields for backward compatibility
    module: kvData.module || kvData.category || '',
    testCase: kvData.title || 'Imported Test Case',
    testSteps: steps,
    testData: kvData.testData || '',
    testResult: '',
    qa: kvData.assignee || '',
    remarks: kvData.remarks || ''
  }
}

// Parse test steps (support multiple formats)
function parseSteps(stepsText: string): string[] {
  if (!stepsText) return []

  // Try different step formats
  const formats = [
    /^\d+\.\s*/gm,  // "1. Step", "2. Step"
    /^Step\s*\d+:\s*/gmi,  // "Step 1: ...", "Step 2: ..."
    /^\d+\)\s*/gm,  // "1) Step", "2) Step"
    /^-\s*/gm,      // "- Step"
    /^\*\s*/gm,     // "* Step"
    /\n/g           // Simple newline separation
  ]

  for (const format of formats) {
    const steps = stepsText.split(format).filter(step => step.trim())
    if (steps.length > 1) {
      return steps.map(step => step.trim())
    }
  }

  // If no format matches, return as single step
  return [stepsText.trim()]
}

// Parse status with common variations
function parseStatus(statusText: string): 'pass' | 'fail' | 'pending' | 'skipped' {
  if (!statusText) return 'pending'

  const status = statusText.toLowerCase().trim()

  if (['pass', 'passed', 'success', 'ok', 'green'].includes(status)) return 'pass'
  if (['fail', 'failed', 'failure', 'error', 'red'].includes(status)) return 'fail'
  if (['skip', 'skipped', 'ignore', 'ignored', 'yellow'].includes(status)) return 'skipped'

  return 'pending'
}

// Parse priority with common variations
function parsePriority(priorityText: string): 'low' | 'medium' | 'high' | 'critical' {
  if (!priorityText) return 'medium'

  const priority = priorityText.toLowerCase().trim()

  if (['low', '1', 'minor'].includes(priority)) return 'low'
  if (['high', '3', 'major'].includes(priority)) return 'high'
  if (['critical', '4', 'blocker', 'urgent'].includes(priority)) return 'critical'

  return 'medium'
}

// Parse tags from comma-separated or space-separated text
function parseTags(tagsText: string): string[] {
  if (!tagsText) return []

  // Try comma separation first, then space
  let tags = tagsText.split(',').map(tag => tag.trim())
  if (tags.length === 1) {
    tags = tagsText.split(/\s+/).map(tag => tag.trim())
  }

  return tags.filter(tag => tag.length > 0)
}

// Import test cases from CSV content
export async function importTestCasesFromCSV(
  csvContent: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  console.log('📄 CSV Import - Starting CSV import process', {
    contentLength: csvContent.length,
    options,
    firstLine: csvContent.split('\n')[0]?.substring(0, 100)
  })

  const result: ImportResult = {
    success: false,
    testCases: [],
    errors: [],
    skipped: 0
  }

  try {
    console.log('📄 CSV Import - Parsing CSV content...')
    const rows = parseCSV(csvContent)
    console.log('📄 CSV Import - Parsed rows:', rows.length)

    if (rows.length === 0) {
      console.error('❌ CSV Import - CSV file is empty')
      result.errors.push('CSV file is empty')
      return result
    }

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)
    console.log('📄 CSV Import - Headers detected:', headers)
    console.log('📄 CSV Import - Data rows to process:', dataRows.length)

    console.log(`📄 CSV Import - Processing ${dataRows.length} data rows...`)
    console.log(`📄 CSV Import - Headers found:`, headers)

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i]
        console.log(`📄 CSV Import - Processing row ${i + 2} (${row.length} fields):`, row.slice(0, 3).map(f => f.substring(0, 30) + (f.length > 30 ? '...' : '')))

        const testCase = mapCSVToTestCase(headers, row, options)

        if (testCase) {
          console.log(`📄 CSV Import - ✅ Successfully mapped test case:`, {
            id: testCase.id,
            title: testCase.title?.substring(0, 50),
            steps: testCase.steps?.length || 0,
            hasDescription: !!testCase.description,
            category: testCase.category
          })

          // Check for duplicates if option is enabled
          if (options.skipDuplicates) {
            console.log(`📄 CSV Import - Checking duplicates for: "${testCase.title}" (ID: ${testCase.id})`)
            console.log(`📄 CSV Import - Existing test cases count: ${options.existingTestCases?.length || 0}`)
            console.log(`📄 CSV Import - Current batch count: ${result.testCases.length}`)

            // Check against already imported test cases in this batch
            const duplicateInBatch = result.testCases.find(tc => {
              const titleMatch = tc.title.toLowerCase().trim() === testCase.title.toLowerCase().trim()
              const idMatch = tc.id === testCase.id && !testCase.id.startsWith('imported_')
              return titleMatch || idMatch
            })

            // Check against existing test cases in the system
            const duplicateInExisting = options.existingTestCases?.find(tc => {
              const titleMatch = tc.title.toLowerCase().trim() === testCase.title.toLowerCase().trim()
              const idMatch = tc.id === testCase.id && !testCase.id.startsWith('imported_')

              if (titleMatch || idMatch) {
                console.log(`📄 CSV Import - Found potential duplicate:`, {
                  newTitle: testCase.title,
                  existingTitle: tc.title,
                  titleMatch,
                  newId: testCase.id,
                  existingId: tc.id,
                  idMatch
                })
              }

              return titleMatch || idMatch
            })

            if (duplicateInBatch) {
              console.log(`📄 CSV Import - ⚠️ Skipping duplicate (found in batch): "${testCase.title}"`)
              result.skipped++
              continue
            }

            if (duplicateInExisting) {
              console.log(`📄 CSV Import - ⚠️ Skipping duplicate (found in existing): "${testCase.title}" matches "${duplicateInExisting.title}"`)
              result.skipped++
              continue
            }

            console.log(`📄 CSV Import - No duplicates found, proceeding with import`)
          }

          result.testCases.push(testCase)
          console.log(`📄 CSV Import - ✅ Added test case ${result.testCases.length}: ${testCase.title}`)
        } else {
          console.log(`📄 CSV Import - ❌ Row ${i + 2} produced null test case, skipping`)
          result.skipped++
        }
      } catch (error) {
        const errorMsg = `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(`❌ CSV Import - Error processing row ${i + 2}:`, error)
        result.errors.push(errorMsg)
      }
    }

    console.log(`📄 CSV Import - Final results:`, {
      totalRowsProcessed: dataRows.length,
      successfullyMapped: result.testCases.length,
      skipped: result.skipped,
      errors: result.errors.length
    })

    result.success = result.testCases.length > 0
    console.log('📄 CSV Import - Import completed', {
      success: result.success,
      testCases: result.testCases.length,
      errors: result.errors.length,
      skipped: result.skipped
    })

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
  console.log('📊 Excel Import - Starting import process', {
    fileName: file.name,
    fileSize: file.size,
    options
  })

  const result: ImportResult = {
    success: false,
    testCases: [],
    errors: [],
    skipped: 0
  }

  try {
    console.log('📊 Excel Import - Reading file as array buffer...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('📊 Excel Import - Array buffer size:', arrayBuffer.byteLength)

    console.log('📊 Excel Import - Parsing workbook...')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📊 Excel Import - Workbook parsed. Sheet names:', workbook.SheetNames)

    if (workbook.SheetNames.length === 0) {
      console.error('❌ Excel Import - No worksheets found')
      result.errors.push('Excel file contains no worksheets')
      return result
    }

    // If no specific sheet selected, use the first sheet
    const sheetName = options.selectedSheet || workbook.SheetNames[0]
    console.log('📊 Excel Import - Selected sheet:', sheetName)

    if (!workbook.Sheets[sheetName]) {
      console.error(`❌ Excel Import - Sheet "${sheetName}" not found`)
      result.errors.push(`Worksheet "${sheetName}" not found in Excel file`)
      return result
    }

    const worksheet = workbook.Sheets[sheetName]
    console.log('📊 Excel Import - Worksheet loaded, range:', worksheet['!ref'])

    // Convert worksheet to array of arrays
    console.log('📊 Excel Import - Converting worksheet to array...')
    const rawWorksheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as string[][]
    console.log('📊 Excel Import - Raw worksheet data rows:', rawWorksheetData.length)

    // Filter out completely empty rows to avoid processing thousands of empty cells
    const worksheetData = rawWorksheetData.filter((row, index) => {
      const hasData = row && row.some(cell => cell && cell.toString().trim() !== '')
      if (!hasData && index < 10) {
        console.log(`📊 Excel Import - Filtered out empty row ${index + 1}`)
      }
      return hasData
    })

    console.log('📊 Excel Import - Filtered worksheet data rows:', worksheetData.length)
    console.log('📊 Excel Import - Sample rows:', worksheetData.slice(0, 3).map(row =>
      row.slice(0, 3).map(cell => typeof cell === 'string' ? cell.substring(0, 30) : cell)
    ))

    if (worksheetData.length === 0) {
      console.error(`❌ Excel Import - Sheet "${sheetName}" is empty`)
      result.errors.push(`Worksheet "${sheetName}" is empty`)
      return result
    }

    // Check if this is a vertical key-value format
    const isVerticalFormat = detectVerticalFormat(worksheetData)
    console.log('📊 Excel Import - Detected vertical format:', isVerticalFormat)

    if (isVerticalFormat) {
      console.log('📊 Excel Import - Using vertical key-value parser...')
      const testCases = parseVerticalKeyValueFormat(worksheetData)
      console.log('📊 Excel Import - Vertical parser results:', {
        testCasesFound: testCases.length,
        sampleTitles: testCases.slice(0, 3).map(tc => tc.title)
      })

      result.success = testCases.length > 0
      result.testCases = testCases
      if (testCases.length === 0) {
        result.errors.push('No valid test cases found in vertical format')
      }
      return result
    } else {
      // Use FEAI-94 specific horizontal parser for better Excel compatibility
      console.log('📊 Excel Import - Using FEAI-94 optimized horizontal parser...')

      // Convert worksheet to JSON for easier processing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',  // Default value for empty cells
        raw: false   // Keep everything as strings for consistent processing
      })

      console.log('📊 Excel Import - JSON conversion completed:', {
        rowsFound: jsonData.length,
        sampleKeys: jsonData.length > 0 ? Object.keys(jsonData[0]).slice(0, 5) : []
      })

      if (jsonData.length === 0) {
        result.errors.push('No data rows found in Excel sheet')
        return result
      }

      // Process each row using FEAI-94 specific mapping
      for (let i = 0; i < jsonData.length; i++) {
        try {
          const rowData = jsonData[i]
          console.log(`📊 Excel Import - Processing row ${i + 1}:`, Object.keys(rowData))

          const testCase = mapFEAI94RowToTestCase(rowData, options)

          if (testCase) {
            console.log(`📊 Excel Import - ✅ Successfully mapped FEAI-94 test case:`, {
              id: testCase.id,
              title: testCase.title?.substring(0, 50),
              module: testCase.module,
              stepsCount: testCase.testSteps?.length || 0
            })

            // Check for duplicates if option is enabled
            if (options.skipDuplicates) {
              const isDuplicate = result.testCases.some(existing =>
                existing.id === testCase.id ||
                (existing.title === testCase.title && existing.module === testCase.module)
              )

              if (isDuplicate) {
                console.log(`📊 Excel Import - 🚫 Skipping duplicate test case: ${testCase.title}`)
                result.skipped++
                continue
              }
            }

            result.testCases.push(testCase)
          } else {
            console.log(`📊 Excel Import - ⚠️ Failed to map row ${i + 1}`)
            result.skipped++
          }
        } catch (error) {
          console.error(`📊 Excel Import - ❌ Error processing row ${i + 1}:`, error)
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      console.log('📊 Excel Import - FEAI-94 import completed', {
        success: result.testCases.length > 0,
        testCasesCount: result.testCases.length,
        errorsCount: result.errors.length,
        skipped: result.skipped
      })

      result.success = result.testCases.length > 0
      return result
    }

  } catch (error) {
    console.error('❌ Excel Import - Failed to parse Excel file:', error)
    result.errors.push(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}

// Check if sheet name indicates it contains test cases
function isTestCaseSheet(sheetName: string): boolean {
  // Sheets starting with underscore are typically summary/metadata sheets
  if (sheetName.startsWith('_')) {
    return false
  }

  // Common non-test-case sheet names
  const nonTestCasePatterns = [
    /^summary$/i,
    /^overview$/i,
    /^index$/i,
    /^contents$/i,
    /^template$/i,
    /^instructions$/i,
    /^readme$/i,
    /^config/i,
    /^setup/i,
    /^metadata/i
  ]

  return !nonTestCasePatterns.some(pattern => pattern.test(sheetName.trim()))
}

// Get Excel sheet information for preview
export async function getExcelSheetInfo(file: File): Promise<ExcelSheetInfo[]> {
  console.log('📋 Sheet Analysis - Starting analysis of Excel file', {
    fileName: file.name,
    fileSize: file.size
  })

  try {
    console.log('📋 Sheet Analysis - Reading array buffer...')
    const arrayBuffer = await file.arrayBuffer()
    console.log('📋 Sheet Analysis - Array buffer size:', arrayBuffer.byteLength)

    console.log('📋 Sheet Analysis - Parsing workbook...')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    console.log('📋 Sheet Analysis - Found sheets:', workbook.SheetNames)

    const sheetInfos = workbook.SheetNames.map(sheetName => {
      console.log(`📋 Sheet Analysis - Analyzing sheet: ${sheetName}`)

      const worksheet = workbook.Sheets[sheetName]
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1')
      const rowCount = range.e.r + 1
      const isTestCase = isTestCaseSheet(sheetName)

      console.log(`📋 Sheet Analysis - Sheet "${sheetName}" details:`, {
        range: worksheet['!ref'],
        rowCount,
        isTestCase
      })

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

      console.log(`📋 Sheet Analysis - Preview data for "${sheetName}":`, previewData)

      // Check if first row looks like headers (enhanced detection)
      const hasHeaders = previewData.length > 0 &&
        previewData[0].some(cell => {
          const cellLower = cell.toLowerCase().trim()
          return cellLower.includes('title') ||
                 cellLower.includes('name') ||
                 cellLower.includes('steps') ||
                 cellLower.includes('expected') ||
                 cellLower.includes('test case') ||
                 cellLower.includes('description') ||
                 cellLower.includes('precondition') ||
                 cellLower.includes('result') ||
                 cellLower.includes('priority') ||
                 cellLower.includes('category')
        })

      console.log(`📋 Sheet Analysis - Sheet "${sheetName}" has headers:`, hasHeaders)

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
        rowCount: sheet.rowCount,
        isTestCase: sheet.isTestCaseSheet,
        hasHeaders: sheet.hasHeaders
      }))
    )

    return sheetInfos
  } catch (error) {
    console.error('❌ Sheet Analysis - Failed to analyze Excel file:', error)
    return []
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
    const data = JSON.parse(jsonContent)
    let testCases: any[]

    // Handle different JSON structures
    if (Array.isArray(data)) {
      testCases = data
    } else if (data.testCases && Array.isArray(data.testCases)) {
      testCases = data.testCases
    } else if (data.tests && Array.isArray(data.tests)) {
      testCases = data.tests
    } else {
      result.errors.push('JSON format not recognized. Expected array of test cases or object with testCases/tests property.')
      return result
    }

    for (let i = 0; i < testCases.length; i++) {
      try {
        const rawTestCase = testCases[i]

        const stepsArray = Array.isArray(rawTestCase.steps) ? rawTestCase.steps :
                          typeof rawTestCase.steps === 'string' ? parseSteps(rawTestCase.steps) : []

        const testCase: TestCase = {
          id: rawTestCase.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          templateId: 'imported-template',
          projectId: options.defaultProject || 'default',
          data: {
            title: rawTestCase.title || rawTestCase.name || `Imported Test Case ${i + 1}`,
            description: rawTestCase.description || rawTestCase.desc || '',
            preconditions: rawTestCase.preconditions || rawTestCase.prerequisites || '',
            steps: stepsArray,
            expectedResult: rawTestCase.expectedResult || rawTestCase.expected || '',
            actualResult: rawTestCase.actualResult || rawTestCase.actual || '',
            category: rawTestCase.category || rawTestCase.type || '',
            assignee: rawTestCase.assignee || rawTestCase.tester || '',
            estimatedTime: rawTestCase.estimatedTime || rawTestCase.duration || ''
          },
          status: parseStatus(rawTestCase.status || ''),
          priority: parsePriority(rawTestCase.priority || ''),
          tags: Array.isArray(rawTestCase.tags) ? rawTestCase.tags : parseTags(rawTestCase.tags || ''),
          createdAt: rawTestCase.createdAt ? new Date(rawTestCase.createdAt) : new Date(),
          updatedAt: new Date(),
          createdBy: 'importer',
          version: 1,
          // Legacy fields for backward compatibility
          module: rawTestCase.category || rawTestCase.type || '',
          testCase: rawTestCase.title || rawTestCase.name || `Imported Test Case ${i + 1}`,
          testSteps: stepsArray,
          testData: rawTestCase.testData || '',
          testResult: rawTestCase.testResult || '',
          qa: rawTestCase.assignee || rawTestCase.tester || '',
          remarks: rawTestCase.remarks || rawTestCase.notes || ''
        }

        // Validate required fields if option is enabled
        if (options.validateRequired) {
          if (!testCase.testCase || !testCase.testSteps || testCase.testSteps.length === 0) {
            result.skipped++
            continue
          }
        }

        // Check for duplicates if option is enabled
        if (options.skipDuplicates) {
          // Check against already imported test cases in this batch
          const duplicateInBatch = result.testCases.find(tc =>
            tc.title.toLowerCase().trim() === testCase.title.toLowerCase().trim() ||
            (tc.id === testCase.id && !testCase.id.startsWith('imported_'))
          )

          // Check against existing test cases in the system
          const duplicateInExisting = options.existingTestCases?.find(tc =>
            tc.title.toLowerCase().trim() === testCase.title.toLowerCase().trim() ||
            (tc.id === testCase.id && !testCase.id.startsWith('imported_'))
          )

          if (duplicateInBatch || duplicateInExisting) {
            result.skipped++
            continue
          }
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
}