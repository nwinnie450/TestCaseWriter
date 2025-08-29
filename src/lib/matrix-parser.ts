/**
 * Matrix Parser Library
 * Handles parsing of test matrices from Excel/CSV files
 */

export interface MatrixRow {
  id?: string
  testScenario: string
  parameters: Record<string, string>
  expectedBehavior: string
  priority?: 'high' | 'medium' | 'low'
  category?: string
}

export interface ParsedMatrix {
  fileName: string
  headers: string[]
  rows: MatrixRow[]
  metadata: {
    totalScenarios: number
    categories: string[]
    parameters: string[]
    fileType: 'csv' | 'excel'
  }
}

/**
 * Parse CSV content into matrix format
 */
export function parseCSVMatrix(csvContent: string, fileName: string): ParsedMatrix {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('Matrix file must have at least a header row and one data row')
  }

  // Better CSV parsing that handles quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"' && !inQuotes) {
        inQuotes = true
      } else if (char === '"' && inQuotes) {
        if (nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = false
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  // Parse headers
  const headers = parseCSVLine(lines[0])
  
  // Parse rows
  const rows: MatrixRow[] = []
  const categories = new Set<string>()
  const parameterKeys = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) continue

    const row: MatrixRow = {
      testScenario: '',
      parameters: {},
      expectedBehavior: ''
    }

    // Map values to structure
    headers.forEach((header, index) => {
      const value = values[index]
      const headerLower = header.toLowerCase()

      if (headerLower.includes('scenario') || headerLower.includes('test case') || headerLower.includes('description')) {
        row.testScenario = value
      } else if (headerLower.includes('expected') || headerLower.includes('result') || headerLower.includes('behavior')) {
        row.expectedBehavior = value
      } else if (headerLower.includes('priority')) {
        row.priority = (value.toLowerCase() as 'high' | 'medium' | 'low') || 'medium'
      } else if (headerLower.includes('category') || headerLower.includes('type') || headerLower.includes('module')) {
        row.category = value
        categories.add(value)
      } else if (headerLower.includes('id')) {
        row.id = value
      } else {
        // Treat as parameter
        row.parameters[header] = value
        parameterKeys.add(header)
      }
    })

    if (row.testScenario) {
      rows.push(row)
    }
  }

  return {
    fileName,
    headers,
    rows,
    metadata: {
      totalScenarios: rows.length,
      categories: Array.from(categories),
      parameters: Array.from(parameterKeys),
      fileType: 'csv'
    }
  }
}

/**
 * Parse Excel file content
 */
export async function parseExcelMatrix(file: File): Promise<ParsedMatrix> {
  const XLSX = await import('xlsx')
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          throw new Error('No worksheets found in Excel file')
        }
        
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to CSV format and use existing CSV parser
        const csvData = XLSX.utils.sheet_to_csv(worksheet)
        
        if (!csvData.trim()) {
          throw new Error('Excel worksheet is empty')
        }
        
        const result = parseCSVMatrix(csvData, file.name)
        result.metadata.fileType = 'excel'
        
        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Validate matrix structure
 */
export function validateMatrix(matrix: ParsedMatrix): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (matrix.rows.length === 0) {
    errors.push('Matrix contains no valid test scenarios')
  }

  const rowsWithoutScenario = matrix.rows.filter(row => !row.testScenario.trim())
  if (rowsWithoutScenario.length > 0) {
    errors.push(`${rowsWithoutScenario.length} rows missing test scenario description`)
  }

  const rowsWithoutExpected = matrix.rows.filter(row => !row.expectedBehavior.trim())
  if (rowsWithoutExpected.length > 0) {
    errors.push(`${rowsWithoutExpected.length} rows missing expected behavior`)
  }

  if (matrix.metadata.parameters.length === 0) {
    errors.push('No test parameters detected in matrix')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate test combinations from matrix
 */
export function generateTestCombinations(matrix: ParsedMatrix): Array<{
  scenario: string
  parameters: Record<string, string>
  expected: string
  priority: string
  category?: string
}> {
  return matrix.rows.map(row => ({
    scenario: row.testScenario,
    parameters: row.parameters,
    expected: row.expectedBehavior,
    priority: row.priority || 'medium',
    category: row.category
  }))
}

/**
 * Parse matrix file based on file type
 */
export async function parseMatrixFile(file: File): Promise<ParsedMatrix> {
  const fileName = file.name
  const fileExtension = fileName.split('.').pop()?.toLowerCase()

  if (!fileExtension || !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
    throw new Error('Unsupported file type. Please upload CSV or Excel files.')
  }

  if (fileExtension === 'csv') {
    const content = await file.text()
    return parseCSVMatrix(content, fileName)
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return await parseExcelMatrix(file)
  } else {
    throw new Error('Unsupported file format. Please use CSV, XLSX, or XLS files.')
  }
}