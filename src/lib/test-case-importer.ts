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

    // Extract values using FEAI-94 preset mappings
    const id = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.id) ||
               `TC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const title = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.title) || 'Imported Test Case'
    const module = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.module)
    const stepsText = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.steps_description)
    const testData = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.test_data)
    const expectedResult = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.expected_result)
    const qa = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.qa)
    const remarks = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.remarks)

    // Priority and status extraction
    const priorityValue = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.priority)
    const statusValue = extractFieldValue(rowData, FEAI94_PRESET.columnMappings.status)

    // Map and normalize priority
    const priority = normalizeValue(priorityValue, 'medium', ['critical', 'high', 'medium', 'low'])
    const status = normalizeValue(statusValue, 'Not Run', ['Passed', 'Failed', 'Blocked', 'Skipped', 'Not Run'])

    // Parse test steps
    const testSteps = stepsText ? parseStepsFromText(stepsText) : []

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
      projectId: options.defaultProject || 'default',
      title,
      description: stepsText || title,
      category: module || 'General',
      priority: priority as any,
      status: status as any,
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
        expectedResult: expectedResult || '',
        actualResult: '',
        category: module || '',
        assignee: qa || '',
        estimatedTime: '',
        testData: testData || '',
        remarks: remarks || '',

        // FEAI-94 specific fields
        module: module || '',
        qaOwner: qa || '',
        isRegression: false,
        isAutomation: false,
        automationId: '',
        automationPreset: '',
        automationLoop: '',
        automationNote: ''
      },

      // Legacy fields for backward compatibility
      module: module || '',
      testCase: title,
      testSteps: testSteps,
      testData: testData || '',
      testResult: expectedResult || '',
      qa: qa || '',
      remarks: remarks || ''
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
      id: testCaseId || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: 'imported-template',
      projectId: options.defaultProject || 'default',
      title: testCaseTitle || 'Imported Test Case',
      description: finalDescription,
      category: module || 'General',
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
    id: data.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: 'vertical-template',
    projectId: options.defaultProject || 'default',
    title: data.title || 'Imported Test Case',
    description: data.description || '',
    category: data.module || 'General',
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

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i]
        const testCase = mapCSVToTestCase(headers, row, options)

        if (!testCase) {
          result.skipped++
          continue
        }

        // Check for duplicates if option is enabled
        if (options.skipDuplicates) {
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
            return titleMatch || idMatch
          })

          if (duplicateInBatch || duplicateInExisting) {
            result.skipped++
            continue
          }
        }

        result.testCases.push(testCase)
      } catch (error) {
        result.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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

          // Check for duplicates if option is enabled
          if (options.skipDuplicates) {
            const isDuplicate = result.testCases.some(existing =>
              existing.id === testCase.id ||
              (existing.title === testCase.title && existing.module === testCase.module)
            )

            if (isDuplicate) {
              result.skipped++
              continue
            }
          }

          result.testCases.push(testCase)
        } catch (error) {
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
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
          id: rawTestCase.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          title: rawTestCase.title || rawTestCase.name || `Imported Test Case ${i + 1}`,
          description: rawTestCase.description || rawTestCase.desc || '',
          category: rawTestCase.category || rawTestCase.module || 'General',
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