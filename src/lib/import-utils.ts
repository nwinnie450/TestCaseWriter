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
  const text = await file.text()
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row')
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data: Record<string, any>[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, any> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    data.push(row)
  }
  
  return data
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
  
  // Validate data structure
  const validationErrors = validateImportData(data, template)
  
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
  
  // Map common system fields
  const systemFieldMappings: Record<string, string> = {
    'title': 'testCase',
    'description': 'testCase',
    'steps': 'testSteps',
    'expected': 'testResult',
    'priority': 'priority',
    'status': 'status',
    'tags': 'tags',
    'module': 'module',
    'ticket': 'ticketId',
    'enhancement': 'enhancement',
    'epic': 'epic',
    'feature': 'feature'
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

// Validate import data
function validateImportData(data: Record<string, any>[], template: Template): string[] {
  const errors: string[] = []
  
  if (data.length === 0) {
    errors.push('No data rows found in import file')
    return errors
  }
  
  // Check for required template fields
  const requiredFields = template.fields.filter(f => f.required)
  const hasRequiredData = requiredFields.every(field => {
    return data.some(row => row[field.label] || row[field.id])
  })
  
  if (!hasRequiredData) {
    errors.push('Missing required template fields in import data')
  }
  
  return errors
}

// Transform imported data according to mappings
export function transformImportData(
  row: Record<string, any>,
  mappings: FieldMapping[]
): Record<string, any> {
  const transformed: Record<string, any> = {}
  
  mappings.forEach(mapping => {
    const sourceValue = row[mapping.sourceField]
    
    if (sourceValue !== undefined && sourceValue !== '') {
      let transformedValue = sourceValue
      
      // Apply transformations
      if (mapping.transformation) {
        transformedValue = applyTransformation(sourceValue, mapping.transformation, mapping.customTransformation)
      }
      
      transformed[mapping.targetField] = transformedValue
    } else if (mapping.defaultValue) {
      transformed[mapping.targetField] = mapping.defaultValue
    }
  })
  
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
  if (!stepsText) return []
  
  const steps: TestStep[] = []
  const lines = stepsText.split('\n').filter(line => line.trim())
  
  lines.forEach((line, index) => {
    // Try to parse step number and description
    const stepMatch = line.match(/^(\d+)[\.\)]\s*(.+)/)
    if (stepMatch) {
      steps.push({
        step: parseInt(stepMatch[1]),
        description: stepMatch[2].trim(),
        expectedResult: ''
      })
    } else {
      // If no step number, use index + 1
      steps.push({
        step: index + 1,
        description: line.trim(),
        expectedResult: ''
      })
    }
  })
  
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

// Create test case from transformed data
export function createTestCaseFromImport(
  transformedData: Record<string, any>,
  templateId: string,
  projectId: string,
  userId: string
): TestCase {
  const now = new Date()
  
  return {
    id: crypto.randomUUID(),
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
    module: transformedData.module,
    testCase: transformedData.testCase,
    testSteps: transformedData.testSteps,
    testResult: transformedData.testResult,
    qa: transformedData.qa,
    remarks: transformedData.remarks,
    
    // New fields
    enhancement: transformedData.enhancement,
    ticketId: transformedData.ticketId,
    epic: transformedData.epic,
    feature: transformedData.feature,
    estimatedTime: transformedData.estimatedTime,
    actualTime: transformedData.actualTime
  }
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