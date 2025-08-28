import { TestCase, TestStep, Template, TemplateField } from '@/types'

export interface ImportOptions {
  format: 'excel' | 'csv' | 'json' | 'testrail' | 'jira' 
  projectId: string
  templateId?: string
  skipDuplicates?: boolean
  validateData?: boolean
  fieldMappings?: FieldMapping[]
}

export interface FieldMapping {
  sourceField: string // Column name from import file
  targetField: string // Template field ID or system field
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'custom' | 'parseSteps' | 'parseTags'
  customTransformation?: string
  defaultValue?: string
  required: boolean
  isSystemField?: boolean // true for fields like status, priority, tags
}

export interface ImportPreview {
  totalRows: number
  sampleData: Record<string, any>[]
  availableFields: string[]
  suggestedMappings: FieldMapping[]
  validationErrors: string[]
}

export interface ImportResult {
  success: boolean
  importedCount: number
  skippedCount: number
  errorCount: number
  errors: string[]
  warnings: string[]
}


// Parse different file formats
export async function parseImportFile(file: File, format: string): Promise<Record<string, any>[]> {
  try {
    if (format === 'csv') {
      return await parseCSV(file)
    } else if (format === 'excel') {
      return await parseExcel(file)
    } else if (format === 'json') {
      return await parseJSON(file)
    }
    throw new Error(`Unsupported format: ${format}`)
  } catch (error) {
    throw new Error(`Failed to parse file: ${error}`)
  }
}

// Parse CSV files
async function parseCSV(file: File): Promise<Record<string, any>[]> {
  console.log('🔍 CSV Debug - Starting CSV parse for file:', file.name, file.size)
  
  const text = await file.text()
  console.log('🔍 CSV Debug - File text length:', text.length)
  console.log('🔍 CSV Debug - First 500 chars:', text.substring(0, 500))
  
  const lines = text.split('\n').filter(line => line.trim())
  console.log('🔍 CSV Debug - Total lines after filtering:', lines.length)
  console.log('🔍 CSV Debug - First few lines:', lines.slice(0, 3))
  
  if (lines.length < 2) {
    console.error('❌ CSV Debug - Not enough lines:', lines.length)
    throw new Error('CSV must have at least a header and one data row')
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  console.log('🔍 CSV Debug - Detected headers:', headers)
  
  const data: Record<string, any>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    console.log(`🔍 CSV Debug - Row ${i} values:`, values)
    
    const row: Record<string, any> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    console.log(`🔍 CSV Debug - Row ${i} object:`, row)
    data.push(row)
  }
  
  console.log('✅ CSV Debug - Final parsed data:', data)
  
  // Apply smart-detect filtering: only keep rows with valid Test Case IDs
  const filteredData = smartDetectValidTestCases(data, headers)
  console.log('✅ CSV Debug - After smart detection:', filteredData)
  
  return filteredData
}

// Smart-detect valid test cases: only rows with non-empty Test Case ID become test cases
function smartDetectValidTestCases(data: Record<string, any>[], headers: string[]): Record<string, any>[] {
  console.log('🔍 Smart Detect - Starting smart detection of valid test cases')
  console.log('🔍 Smart Detect - Input data length:', data.length)
  
  function isNonEmpty(v?: string): boolean {
    return !!(v && v.trim().length > 0)
  }
  
  // Find the Test Case ID field
  const testCaseIdField = headers.find(h => 
    h.toLowerCase().includes('test case id') ||
    h.toLowerCase().includes('testcaseid') ||
    h.toLowerCase().includes('test case') ||
    h.toLowerCase().includes('testcase') ||
    h.toLowerCase().includes('tc') ||
    h.toLowerCase().includes('id')
  ) || headers[0]
  
  console.log('🔍 Smart Detect - Using Test Case ID field:', testCaseIdField)
  
  const validTestCases: Record<string, any>[] = []
  const seenIds = new Set<string>()
  let skippedCount = 0
  
  for (const row of data) {
    const testCaseId = (row[testCaseIdField] || "").trim()
    
    // SMART DETECT: Only process rows with non-empty Test Case ID
    if (!isNonEmpty(testCaseId)) {
      console.log('🔍 Smart Detect - Skipping row with empty Test Case ID:', row)
      skippedCount++
      continue
    }
    
    // Normalize all fields and preserve line breaks
    const normalizedRow = { ...row }
    Object.keys(normalizedRow).forEach(key => {
      if (typeof normalizedRow[key] === 'string') {
        // Remove non-breaking spaces and normalize line breaks
        normalizedRow[key] = normalizedRow[key]
          .replace(/\u00A0/g, " ") // Remove non-breaking spaces
          .replace(/\r\n?/g, "\n") // Normalize line breaks
      }
    })
    
    // Check for duplicate IDs
    if (seenIds.has(testCaseId)) {
      console.warn(`🔍 Smart Detect - Duplicate Test Case ID: ${testCaseId} — skipping duplicate`)
      continue
    }
    
    seenIds.add(testCaseId)
    validTestCases.push(normalizedRow)
    
    console.log(`✅ Smart Detect - Added valid test case: ${testCaseId}`)
  }
  
  console.log(`✅ Smart Detect - Filtered ${data.length} rows to ${validTestCases.length} valid test cases`)
  console.log(`✅ Smart Detect - Skipped ${skippedCount} rows with empty Test Case IDs`)
  
  return validTestCases
}

// Group related rows that belong to the same test case (DEPRECATED - replaced by smart detect)
function groupRelatedRows(data: Record<string, any>[], headers: string[]): Record<string, any>[] {
  console.log('🔍 Grouping Debug - Starting row grouping for related rows')
  console.log('🔍 Grouping Debug - Input data:', data)
  console.log('🔍 Grouping Debug - Headers:', headers)
  
  if (data.length <= 1) return data
  
  // Find the test case ID field
  const testCaseField = headers.find(h => 
    h.toLowerCase().includes('test case') || 
    h.toLowerCase().includes('testcase') ||
    h.toLowerCase().includes('tc') ||
    h.toLowerCase().includes('id')
  ) || headers[0]
  
  console.log('🔍 Grouping Debug - Using test case field:', testCaseField)
  
  // Check for patterns that indicate grouping is needed
  const testCaseIds = data.map(row => row[testCaseField]).filter(id => id && id.trim() !== '')
  const uniqueTestCaseIds = [...new Set(testCaseIds.filter(id => /^TC_\d+$/.test(id.trim())))]
  const stepContinuations = testCaseIds.filter(id => /^\d+\.\s/.test(id))
  
  console.log('🔍 Grouping Debug - All test case values:', testCaseIds)
  console.log('🔍 Grouping Debug - Unique TC_ IDs found:', uniqueTestCaseIds)
  console.log('🔍 Grouping Debug - Step continuations found:', stepContinuations)
  console.log('🔍 Grouping Debug - Total rows:', data.length)
  
  // If we have TC_ IDs and other content, we need grouping
  if (uniqueTestCaseIds.length > 0 && (stepContinuations.length > 0 || data.length > uniqueTestCaseIds.length)) {
    console.log('🔍 Grouping Debug - Grouping needed - TC IDs with continuation content detected')
  } else if (uniqueTestCaseIds.length === 1 && data.length > 1) {
    console.log('🔍 Grouping Debug - FORCE GROUPING - Only 1 TC_ ID but multiple rows detected')
  } else {
    console.log('🔍 Grouping Debug - No grouping needed, returning original data')
    return data
  }
  
  // Group rows by test case
  const groupedTestCases: Record<string, any>[] = []
  let currentTestCase: Record<string, any> | null = null
  
  data.forEach((row, index) => {
    console.log(`🔍 Grouping Debug - Processing row ${index + 1}:`, row)
    
    const testCaseValue = row[testCaseField]
    const hasTestCaseId = testCaseValue && testCaseValue.trim() !== ''
    
    // Check if this looks like a step continuation (starts with number and period)
    const isStepContinuation = hasTestCaseId && /^\d+\.\s/.test(testCaseValue.trim())
    // Check if this is a real test case ID (TC_xxx format)
    const isRealTestCaseId = hasTestCaseId && /^TC_\d+$/.test(testCaseValue.trim())
    
    console.log(`🔍 Grouping Debug - Test case value: "${testCaseValue}"`)
    console.log(`🔍 Grouping Debug - Has test case ID: ${hasTestCaseId}`)
    console.log(`🔍 Grouping Debug - Is step continuation: ${isStepContinuation}`)
    console.log(`🔍 Grouping Debug - Is real test case ID: ${isRealTestCaseId}`)
    
    if (isRealTestCaseId) {
      // This is a real test case ID (like TC_001), start new test case
      if (currentTestCase) {
        console.log('✅ Grouping Debug - Completed test case:', currentTestCase)
        groupedTestCases.push(currentTestCase)
      }
      
      // Start new test case
      currentTestCase = { ...row }
      console.log('🔍 Grouping Debug - Started new test case with ID:', testCaseValue)
    } else if (!isRealTestCaseId && currentTestCase) {
      // This is a continuation row (either empty, step number, or any other content that's not a real TC_ ID)
      console.log('🔍 Grouping Debug - Merging continuation row (not a real TC_ ID)')
      
      // If it's a step continuation, use the step description as content
      if (isStepContinuation) {
        const stepDescription = testCaseValue.trim()
        const expectedResult = row['Expected Result'] || row['expectedResult'] || ''
        const testData = row['Test Data'] || row['testData'] || ''
        
        // Add to test step description
        if (currentTestCase['Test Step Description'] || currentTestCase['testStepDescription']) {
          const currentDesc = currentTestCase['Test Step Description'] || currentTestCase['testStepDescription'] || ''
          currentTestCase['Test Step Description'] = currentDesc + '\n' + stepDescription
        } else {
          currentTestCase['Test Step Description'] = stepDescription
        }
        
        // Add to expected result
        if (expectedResult && expectedResult.trim() !== '') {
          if (currentTestCase['Expected Result'] || currentTestCase['expectedResult']) {
            const currentExpected = currentTestCase['Expected Result'] || currentTestCase['expectedResult'] || ''
            currentTestCase['Expected Result'] = currentExpected + '\n' + expectedResult
          } else {
            currentTestCase['Expected Result'] = expectedResult
          }
        }
        
        // Add to test data
        if (testData && testData.trim() !== '') {
          if (currentTestCase['Test Data'] || currentTestCase['testData']) {
            const currentData = currentTestCase['Test Data'] || currentTestCase['testData'] || ''
            currentTestCase['Test Data'] = currentData + '\n' + testData
          } else {
            currentTestCase['Test Data'] = testData
          }
        }
        
        console.log(`🔍 Grouping Debug - Added step: "${stepDescription}"`)
        console.log(`🔍 Grouping Debug - Current test case after merge:`, currentTestCase)
      } else {
        // Regular field merging for empty test case rows
        const fieldsToMerge = [
          'Test Step Description', 'testStepDescription', 'description', 'Description',
          'Test Data', 'testData', 'data', 'Data',
          'Expected Result', 'expectedResult', 'expected', 'Expected'
        ]
        
        fieldsToMerge.forEach(field => {
          if (headers.includes(field) && row[field] && row[field].trim() !== '') {
            if (currentTestCase![field] && currentTestCase![field].trim() !== '') {
              currentTestCase![field] += '\n' + row[field]
            } else {
              currentTestCase![field] = row[field]
            }
            console.log(`🔍 Grouping Debug - Merged field "${field}": ${currentTestCase![field]}`)
          }
        })
      }
    }
  })
  
  // Don't forget the last test case
  if (currentTestCase) {
    console.log('✅ Grouping Debug - Final test case:', currentTestCase)
    groupedTestCases.push(currentTestCase)
  }
  
  console.log(`✅ Grouping Debug - Grouped ${data.length} rows into ${groupedTestCases.length} test cases`)
  
  // Debug: Show what we're returning
  console.log('🔍 Final Grouping Result:')
  groupedTestCases.forEach((tc, index) => {
    console.log(`  Test Case ${index + 1}:`, tc[testCaseField] || 'NO ID')
  })
  
  // If we still have too many test cases, force debug the issue
  if (groupedTestCases.length > 3) {
    console.error('❌ GROUPING FAILED - Still have too many test cases!')
    console.error('❌ Expected: 1 test case, Got:', groupedTestCases.length)
    console.error('❌ This suggests the grouping logic is not working properly')
    
    // Show all the test case values that were detected
    console.error('❌ All detected test case values:')
    data.forEach((row, i) => {
      console.error(`  Row ${i + 1}: "${row[testCaseField]}" (${typeof row[testCaseField]})`)
    })
  }
  
  return groupedTestCases
}

// Group CSV rows that belong to the same test case
function groupTestCaseRows(rawData: Record<string, any>[]): Record<string, any>[] {
  console.log('🔍 Grouping Debug - Starting row grouping analysis')
  
  if (rawData.length === 0) return rawData
  
  // Detect if we need grouping by checking for patterns
  const testCaseFields = ['Test Case', 'testCase', 'TestCase', 'test_case', 'ID', 'TC']
  const moduleFields = ['Module', 'module', 'Component', 'component', 'Feature', 'feature']
  
  const sampleRow = rawData[0]
  const availableFields = Object.keys(sampleRow)
  console.log('🔍 Grouping Debug - Available fields:', availableFields)
  
  // Find the likely test case ID field
  const testCaseField = availableFields.find(field => 
    testCaseFields.some(tcField => 
      field.toLowerCase().includes(tcField.toLowerCase())
    )
  )
  
  const moduleField = availableFields.find(field =>
    moduleFields.some(modField =>
      field.toLowerCase().includes(modField.toLowerCase())
    )
  )
  
  console.log('🔍 Grouping Debug - Detected test case field:', testCaseField)
  console.log('🔍 Grouping Debug - Detected module field:', moduleField)
  
  // Check if we have rows with empty test case IDs (indicates multi-step format)
  const emptyTestCaseRows = rawData.filter(row => 
    !row[testCaseField] || row[testCaseField].trim() === ''
  )
  
  console.log('🔍 Grouping Debug - Empty test case ID rows:', emptyTestCaseRows.length)
  
  if (emptyTestCaseRows.length > rawData.length * 0.3) { // More than 30% empty IDs
    console.log('🔍 Grouping Debug - Detected multi-step format, grouping rows...')
    return groupMultiStepTestCases(rawData, testCaseField, moduleField, availableFields)
  } else {
    console.log('🔍 Grouping Debug - Standard format detected, no grouping needed')
    return rawData
  }
}

// Group multi-step test case rows into single test cases
function groupMultiStepTestCases(
  rawData: Record<string, any>[],
  testCaseField: string,
  moduleField: string,
  availableFields: string[]
): Record<string, any>[] {
  console.log('🔍 MultiStep Debug - Starting multi-step grouping')
  
  const groupedTestCases: Record<string, any>[] = []
  let currentTestCase: Record<string, any> | null = null
  let stepCounter = 1
  
  rawData.forEach((row, index) => {
    console.log(`🔍 MultiStep Debug - Processing row ${index + 1}:`, row)
    
    // Check if this row starts a new test case (has test case ID)
    const hasTestCaseId = row[testCaseField] && row[testCaseField].trim() !== ''
    
    if (hasTestCaseId) {
      // Save previous test case if exists
      if (currentTestCase) {
        console.log('✅ MultiStep Debug - Completed test case:', currentTestCase)
        groupedTestCases.push(currentTestCase)
      }
      
      // Start new test case
      currentTestCase = {
        [testCaseField]: row[testCaseField],
        [moduleField]: row[moduleField] || 'General',
        testStepDescription: '',
        testData: '',
        expectedResult: '',
        testResult: row.testResult || row['Test Result'] || 'Not Executed',
        qa: row.qa || row.QA || '',
        remarks: row.remarks || row.Remarks || '',
        // Preserve other fields
        ...Object.fromEntries(
          availableFields.filter(field => 
            field !== testCaseField && 
            field !== moduleField &&
            !['testStepDescription', 'testData', 'expectedResult'].includes(field)
          ).map(field => [field, row[field]])
        )
      }
      
      stepCounter = 1
      console.log('🔍 MultiStep Debug - Started new test case:', currentTestCase)
    }
    
    // Add this row's content to the current test case as a step
    if (currentTestCase) {
      const stepDescription = row.testStepDescription || 
                            row['Test Step Description'] || 
                            row.description || 
                            row.Description ||
                            row[testCaseField] || // Sometimes the step is in the test case field
                            ''
      
      const testData = row.testData || row['Test Data'] || row.data || ''
      const expectedResult = row.expectedResult || 
                           row['Expected Result'] || 
                           row.expected || 
                           row[testCaseField] || // Sometimes expected result is in test case field
                           ''
      
      if (stepDescription && stepDescription.trim() !== '') {
        // Add step number if not already present
        const numberedDescription = stepDescription.match(/^\d+\./) ? 
          stepDescription : 
          `${stepCounter}. ${stepDescription}`
        
        const numberedExpected = expectedResult.match(/^\d+\./) ?
          expectedResult :
          `${stepCounter}. ${expectedResult}`
        
        // Append to existing content
        if (currentTestCase.testStepDescription) {
          currentTestCase.testStepDescription += '\n' + numberedDescription
        } else {
          currentTestCase.testStepDescription = numberedDescription
        }
        
        if (testData && testData.trim() !== '') {
          if (currentTestCase.testData) {
            currentTestCase.testData += '\n' + `${stepCounter}. ${testData}`
          } else {
            currentTestCase.testData = `${stepCounter}. ${testData}`
          }
        }
        
        if (expectedResult && expectedResult.trim() !== '') {
          if (currentTestCase.expectedResult) {
            currentTestCase.expectedResult += '\n' + numberedExpected
          } else {
            currentTestCase.expectedResult = numberedExpected
          }
        }
        
        stepCounter++
        console.log(`🔍 MultiStep Debug - Added step ${stepCounter - 1} to current test case`)
      }
    }
  })
  
  // Don't forget the last test case
  if (currentTestCase) {
    console.log('✅ MultiStep Debug - Final test case:', currentTestCase)
    groupedTestCases.push(currentTestCase)
  }
  
  console.log(`✅ MultiStep Debug - Grouped ${rawData.length} rows into ${groupedTestCases.length} test cases`)
  return groupedTestCases
}

// Parse Excel files (basic implementation)
async function parseExcel(file: File): Promise<Record<string, any>[]> {
  // For now, we'll use a simple approach
  // In production, you'd want to use a library like xlsx
  throw new Error('Excel parsing not yet implemented. Please convert to CSV first.')
}

// Parse JSON files
async function parseJSON(file: File): Promise<Record<string, any>[]> {
  const text = await file.text()
  const data = JSON.parse(text)
  
  if (Array.isArray(data)) {
    return data
  } else if (data.testCases && Array.isArray(data.testCases)) {
    return data.testCases
  } else {
    throw new Error('JSON must contain an array of test cases or a testCases array')
  }
}

// Generate preview of import data
export function generateImportPreview(
  data: Record<string, any>[],
  template: Template
): ImportPreview {
  const availableFields = Object.keys(data[0] || {})
  const sampleData = data.slice(0, 5) // First 5 rows
  
  // Generate suggested mappings based on field names
  const suggestedMappings = generateSuggestedMappings(availableFields, template)
  
  // Validate data structure - now pass the suggested mappings
  const validationErrors = validateImportData(data, template, suggestedMappings)
  
  return {
    totalRows: data.length,
    sampleData,
    availableFields,
    suggestedMappings,
    validationErrors
  }
}

// Generate suggested field mappings
function generateSuggestedMappings(
  availableFields: string[],
  template: Template
): FieldMapping[] {
  const mappings: FieldMapping[] = []
  
  // Map common system fields based on the new standard template format
  const systemFieldMappings: Record<string, string> = {
    // Standard template format mappings
    'testcase': 'testCase',
    'testcaseid': 'testCase',
    'testid': 'testCase',
    'caseid': 'testCase',
    'tcid': 'testCase',
    'tc': 'testCase',
    'id': 'testCase',
    
    'module': 'module',
    'component': 'module',
    'feature': 'module',
    'area': 'module',
    
    'teststep': 'testStep',
    'step': 'testStep',
    'stepnumber': 'testStep',
    'stepno': 'testStep',
    
    'teststepdescription': 'testStepDescription',
    'stepdescription': 'testStepDescription',
    'description': 'testStepDescription',
    'steps': 'testStepDescription',
    'procedure': 'testStepDescription',
    'actions': 'testStepDescription',
    
    'testdata': 'testData',
    'data': 'testData',
    'input': 'testData',
    'inputdata': 'testData',
    'parameters': 'testData',
    
    'expectedresult': 'expectedResult',
    'expected': 'expectedResult',
    'expectedoutcome': 'expectedResult',
    'expectation': 'expectedResult',
    'criteria': 'expectedResult',
    
    'testresult': 'testResult',
    'result': 'testResult',
    'actualresult': 'testResult',
    'outcome': 'testResult',
    'status': 'testResult',
    'passfail': 'testResult',
    'verdict': 'testResult',
    
    'qa': 'qa',
    'tester': 'qa',
    'assignee': 'qa',
    'owner': 'qa',
    'executor': 'qa',
    
    'remarks': 'remarks',
    'notes': 'remarks',
    'comments': 'remarks',
    'observations': 'remarks',
    'issues': 'remarks',
    'links': 'remarks',
    
    // Legacy/additional mappings for backward compatibility
    'priority': 'priority',
    'tags': 'tags',
    'ticket': 'ticketId',
    'ticketid': 'ticketId',
    'enhancement': 'enhancement',
    'epic': 'epic'
  }
  
  availableFields.forEach(field => {
    const normalizedField = field.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Check for exact matches
    if (systemFieldMappings[normalizedField]) {
      mappings.push({
        sourceField: field,
        targetField: systemFieldMappings[normalizedField],
        required: false,
        isSystemField: true
      })
      return
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(systemFieldMappings)) {
      if (normalizedField.includes(key) || key.includes(normalizedField)) {
        mappings.push({
          sourceField: field,
          targetField: value,
          required: false,
          isSystemField: true
        })
        break
      }
    }
    
    // Map to template fields if no system field match
    const templateField = template.fields.find(tf => 
      tf.label.toLowerCase().includes(normalizedField) ||
      normalizedField.includes(tf.label.toLowerCase())
    )
    
    if (templateField) {
      mappings.push({
        sourceField: field,
        targetField: templateField.id,
        required: templateField.required,
        isSystemField: false
      })
    }
  })
  
  return mappings
}

// Validate import data with suggested mappings
export function validateImportData(
  data: Record<string, any>[], 
  template: Template, 
  suggestedMappings: FieldMapping[] = []
): string[] {
  console.log('🔍 Validation Debug - Starting validation')
  console.log('🔍 Validation Debug - Data length:', data.length)
  console.log('🔍 Validation Debug - Template:', template)
  console.log('🔍 Validation Debug - Suggested mappings:', suggestedMappings)
  
  const errors: string[] = []
  
  if (data.length === 0) {
    console.error('❌ Validation Debug - No data rows')
    errors.push('No data rows found in import file')
    return errors
  }
  
  // Check if essential fields can be mapped from available data
  const availableFields = Object.keys(data[0] || {})
  const essentialFields = ['testCase', 'module', 'testStepDescription', 'expectedResult']
  const missingEssentialMappings: string[] = []
  
  essentialFields.forEach(essentialField => {
    // Check if any suggested mapping maps to this essential field
    const hasMappingToEssential = suggestedMappings.some(mapping => 
      mapping.targetField === essentialField && mapping.sourceField
    )
    
    // Also check if any available field name directly matches
    const hasDirectMatch = availableFields.some(field => {
      const normalized = field.toLowerCase().replace(/[^a-z0-9]/g, '')
      return normalized.includes(essentialField.toLowerCase()) || 
             essentialField.toLowerCase().includes(normalized)
    })
    
    if (!hasMappingToEssential && !hasDirectMatch) {
      const fieldLabels = {
        'testCase': 'Test Case ID',
        'module': 'Module',
        'testStepDescription': 'Test Step Description',
        'expectedResult': 'Expected Result'
      }
      missingEssentialMappings.push(fieldLabels[essentialField] || essentialField)
    }
  })
  
  if (missingEssentialMappings.length > 0) {
    errors.push(`Cannot find these essential fields in your file: ${missingEssentialMappings.join(', ')}. Please check your column headers or add manual mappings.`)
  }
  
  // Check for template-specific required fields
  const requiredTemplateFields = template.fields.filter(f => f.required)
  const missingTemplateFields: string[] = []
  
  requiredTemplateFields.forEach(field => {
    const hasMapping = suggestedMappings.some(mapping => 
      mapping.targetField === field.id && mapping.sourceField
    )
    
    if (!hasMapping) {
      missingTemplateFields.push(field.label)
    }
  })
  
  if (missingTemplateFields.length > 0) {
    errors.push(`Template requires these fields that weren't found: ${missingTemplateFields.join(', ')}`)
  }
  
  // Validate data quality
  const emptyRowCount = data.filter(row => {
    const values = Object.values(row)
    return values.every(val => !val || String(val).trim() === '')
  }).length
  
  if (emptyRowCount > 0) {
    errors.push(`Found ${emptyRowCount} empty rows that will be skipped during import`)
  }
  
  // Check if no mappings were suggested
  if (suggestedMappings.length === 0) {
    errors.push(`No automatic field mappings could be created. Your column headers: [${availableFields.join(', ')}]. Please set up mappings manually.`)
  }
  
  // Check for potential encoding issues
  const hasSpecialChars = data.some(row => {
    return Object.values(row).some(val => {
      if (typeof val === 'string') {
        return /[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/.test(val)
      }
      return false
    })
  })
  
  if (hasSpecialChars) {
    errors.push('File may contain encoding issues - some special characters detected')
  }
  
  return errors
}

// Transform imported data according to mappings
export function transformImportData(
  row: Record<string, any>,
  mappings: FieldMapping[]
): Record<string, any> {
  console.log('🔍 Transform Debug - Starting transformation')
  console.log('🔍 Transform Debug - Input row:', row)
  console.log('🔍 Transform Debug - Mappings:', mappings)
  
  const transformed: Record<string, any> = {}
  
  mappings.forEach((mapping, index) => {
    console.log(`🔍 Transform Debug - Processing mapping ${index + 1}:`, mapping)
    
    const sourceValue = row[mapping.sourceField]
    console.log(`🔍 Transform Debug - Source value for "${mapping.sourceField}":`, sourceValue)
    
    if (sourceValue !== undefined && sourceValue !== '') {
      let transformedValue = sourceValue
      
      // Apply transformations
      if (mapping.transformation) {
        console.log(`🔍 Transform Debug - Applying transformation "${mapping.transformation}" to:`, sourceValue)
        transformedValue = applyTransformation(sourceValue, mapping.transformation, mapping.customTransformation)
        console.log(`🔍 Transform Debug - Transformed value:`, transformedValue)
      }
      
      transformed[mapping.targetField] = transformedValue
      console.log(`🔍 Transform Debug - Set "${mapping.targetField}" = "${transformedValue}"`)
    } else if (mapping.defaultValue) {
      transformed[mapping.targetField] = mapping.defaultValue
      console.log(`🔍 Transform Debug - Used default value for "${mapping.targetField}":`, mapping.defaultValue)
    } else {
      console.log(`🔍 Transform Debug - No value or default for "${mapping.targetField}"`)
    }
  })
  
  console.log('✅ Transform Debug - Final transformed data:', transformed)
  return transformed
}

// Apply field transformations
function applyTransformation(
  value: any,
  transformation: string,
  customTransformation?: string
): any {
  switch (transformation) {
    case 'uppercase':
      return String(value).toUpperCase()
    case 'lowercase':
      return String(value).toLowerCase()
    case 'trim':
      return String(value).trim()
    case 'parseSteps':
      return parseTestSteps(value)
    case 'parseTags':
      return parseTags(value)
    case 'custom':
      if (customTransformation) {
        try {
          // Note: In production, you'd want to sandbox this
          return new Function('value', customTransformation)(value)
        } catch (error) {
          console.error('Custom transformation failed:', error)
          return value
        }
      }
      return value
    default:
      return value
  }
}

// Parse test steps from string
function parseTestSteps(stepsText: string): TestStep[] {
  console.log('🔍 ParseSteps Debug - Input text:', stepsText)
  
  if (!stepsText) return []
  
  const steps: TestStep[] = []
  const lines = stepsText.split('\n').filter(line => line.trim())
  
  console.log('🔍 ParseSteps Debug - Split lines:', lines)
  
  lines.forEach((line, index) => {
    // Try to parse step number and description
    const stepMatch = line.match(/^(\d+)[\.\)]\s*(.+)/)
    if (stepMatch) {
      steps.push({
        step: parseInt(stepMatch[1]),
        description: stepMatch[2].trim(),
        expectedResult: '',
        testData: ''
      })
      console.log(`🔍 ParseSteps Debug - Matched numbered step ${stepMatch[1]}: ${stepMatch[2]}`)
    } else {
      // If no step number, use index + 1
      steps.push({
        step: index + 1,
        description: line.trim(),
        expectedResult: '',
        testData: ''
      })
      console.log(`🔍 ParseSteps Debug - Added unnumbered step ${index + 1}: ${line.trim()}`)
    }
  })
  
  console.log('✅ ParseSteps Debug - Final steps:', steps)
  return steps
}

// Parse tags from string
function parseTags(tagsText: string): string[] {
  if (!tagsText) return []
  
  // Split by common delimiters
  return tagsText
    .split(/[,;|]/)
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
}

// Enhanced function to parse multi-line content and create proper test steps
function parseMultiLineTestCase(
  testStepDescription: string,
  expectedResult: string,
  testData: string = ''
): TestStep[] {
  console.log('🔍 MultiLine Debug - Parsing multi-line test case')
  console.log('🔍 MultiLine Debug - Step descriptions:', testStepDescription)
  console.log('🔍 MultiLine Debug - Expected results:', expectedResult)
  console.log('🔍 MultiLine Debug - Test data:', testData)
  
  const steps: TestStep[] = []
  
  // Split by newlines and clean up
  const stepLines = testStepDescription.split('\n').filter(line => line.trim())
  const expectedLines = expectedResult.split('\n').filter(line => line.trim())
  const dataLines = testData.split('\n').filter(line => line.trim())
  
  console.log('🔍 MultiLine Debug - Step lines:', stepLines)
  console.log('🔍 MultiLine Debug - Expected lines:', expectedLines)
  console.log('🔍 MultiLine Debug - Data lines:', dataLines)
  
  // Use the maximum length to ensure we don't miss any content
  const maxLength = Math.max(stepLines.length, expectedLines.length, dataLines.length)
  
  for (let i = 0; i < maxLength; i++) {
    const stepText = stepLines[i] || ''
    const expectedText = expectedLines[i] || ''
    const dataText = dataLines[i] || ''
    
    if (stepText.trim() || expectedText.trim()) {
      // Clean up step numbering if present
      const cleanStepText = stepText.replace(/^\d+[\.\)]\s*/, '').trim()
      const cleanExpectedText = expectedText.replace(/^\d+[\.\)]\s*/, '').trim()
      const cleanDataText = dataText.replace(/^\d+[\.\)]\s*/, '').trim()
      
      steps.push({
        step: i + 1,
        description: cleanStepText || `Step ${i + 1}`,
        expectedResult: cleanExpectedText || 'Expected result not specified',
        testData: cleanDataText || ''
      })
      
      console.log(`🔍 MultiLine Debug - Created step ${i + 1}:`, {
        description: cleanStepText,
        expectedResult: cleanExpectedText,
        testData: cleanDataText
      })
    }
  }
  
  console.log('✅ MultiLine Debug - Final test steps:', steps)
  return steps
}

// Create test case from transformed data
export function createTestCaseFromImport(
  transformedData: Record<string, any>,
  templateId: string,
  projectId: string,
  userId: string
): TestCase {
  console.log('🔍 TestCase Debug - Creating test case from transformed data')
  console.log('🔍 TestCase Debug - Transformed data:', transformedData)
  console.log('🔍 TestCase Debug - Template ID:', templateId)
  console.log('🔍 TestCase Debug - Project ID:', projectId)
  console.log('🔍 TestCase Debug - User ID:', userId)
  
  const now = new Date()
  const testCaseId = crypto.randomUUID()
  
  // Create test steps from multi-line content
  let testSteps: TestStep[] = []
  
  if (transformedData.testStepDescription || transformedData.expectedResult) {
    testSteps = parseMultiLineTestCase(
      transformedData.testStepDescription || '',
      transformedData.expectedResult || '',
      transformedData.testData || ''
    )
    console.log('🔍 TestCase Debug - Generated test steps:', testSteps)
  }
  
  const testCase: TestCase = {
    id: testCaseId,
    templateId,
    projectId,
    data: transformedData,
    status: transformedData.status || 'draft',
    priority: transformedData.priority || 'medium',
    tags: transformedData.tags || [],
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    lastModifiedBy: userId,
    
    // Legacy field mappings
    module: transformedData.module || 'General',
    testCase: transformedData.testCase || 'No description',
    testSteps: testSteps, // Use the parsed test steps
    testResult: transformedData.testResult || 'Not Executed',
    qa: transformedData.qa || '',
    remarks: transformedData.remarks || '',
    
    // New fields
    enhancement: transformedData.enhancement,
    ticketId: transformedData.ticketId,
    epic: transformedData.epic,
    feature: transformedData.feature,
    estimatedTime: transformedData.estimatedTime,
    actualTime: transformedData.actualTime
  }
  
  console.log('✅ TestCase Debug - Created test case with steps:', testCase)
  return testCase
}

// Generate CSV template for import
export function generateCSVTemplate(): string {
  const headers = [
    'Test Case Title',
    'Description',
    'Test Steps',
    'Expected Result',
    'Module',
    'Priority',
    'Status',
    'Tags',
    'Ticket ID',
    'Enhancement',
    'Epic',
    'Feature',
    'QA Notes',
    'Remarks'
  ]
  
  const sampleData = [
    'Login with valid credentials',
    'Verify user can login with valid username and password',
    '1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click login button',
    'User should be logged in successfully and redirected to dashboard',
    'Authentication',
    'High',
    'Draft',
    'login,security,authentication',
    'TICKET-001',
    'ENH-001',
    'User Management',
    'Login System',
    'Test with different browsers',
    'Critical path test case'
  ]
  
  return [headers.join(','), sampleData.join(',')].join('\n')
}

// Generate JSON template for import
export function generateJSONTemplate(): string {
  const template = {
    testCases: [
      {
        testCase: 'Login with valid credentials',
        description: 'Verify user can login with valid username and password',
        testSteps: [
          {
            step: 1,
            description: 'Navigate to login page',
            expectedResult: 'Login page should load',
            testData: 'Valid URL'
          },
          {
            step: 2,
            description: 'Enter valid credentials and login',
            expectedResult: 'User should be logged in successfully',
            testData: 'username: test@example.com, password: validpass123'
          }
        ],
        module: 'Authentication',
        priority: 'high',
        status: 'draft',
        tags: ['login', 'security', 'authentication'],
        ticketId: 'TICKET-001',
        enhancement: 'ENH-001',
        epic: 'User Management',
        feature: 'Login System',
        qa: 'Test with different browsers',
        remarks: 'Critical path test case'
      }
    ]
  }
  
  return JSON.stringify(template, null, 2)
}