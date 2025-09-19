import { TestCase } from '@/types'

export type ExportFormat = 'excel' | 'csv' | 'json' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeHeaders?: boolean
  selectedFields?: string[]
}

// Convert test case to CSV row
function testCaseToCSVRow(testCase: TestCase, includeHeaders: boolean = false): string {
  const headers = [
    'Test Case',
    'Module',
    'Test Step',
    'Test Step Description',
    'Test Data',
    'Expected Result',
    'Test Result',
    'QA',
    'Remarks'
  ]
  
  if (includeHeaders) {
    return headers.join(',')
  }
  
  // Extract field values with proper fallbacks
  const testCaseId = testCase.data?.testCase || testCase.id || 'TC_001'
  const module = testCase.data?.module || testCase.module || 'General'
  const testStep = testCase.data?.testStep || 1
  
  // Format test step description (multi-line in one cell)
  let testStepDescription = ''
  if (testCase.data?.testStepDescription) {
    testStepDescription = testCase.data.testStepDescription
  } else if (testCase.testSteps && testCase.testSteps.length > 0) {
    testStepDescription = testCase.testSteps
      .map((step, index) => `${index + 1}. ${step.description}`)
      .join('\n')
  } else {
    testStepDescription = testCase.testCase || 'No description'
  }
  
  // Test data (can be blank, with numbering if multiple items)
  let testData = ''
  if (testCase.data?.testData) {
    testData = testCase.data.testData
  } else if (testCase.testSteps && testCase.testSteps.length > 0) {
    const dataItems = testCase.testSteps
      .map((step, index) => {
        if (step.testData && step.testData.trim() !== '' && step.testData !== 'N/A') {
          return `${index + 1}. ${step.testData}`
        }
        return null
      })
      .filter(item => item !== null)
    testData = dataItems.join('\n')
  }
  
  // Expected result (multi-line in one cell with numbering)
  let expectedResult = ''
  if (testCase.data?.expectedResult) {
    expectedResult = testCase.data.expectedResult
  } else if (testCase.testSteps && testCase.testSteps.length > 0) {
    expectedResult = testCase.testSteps
      .map((step, index) => `${index + 1}. ${step.expectedResult}`)
      .join('\n')
  } else {
    expectedResult = 'Expected result not specified'
  }
  
  const testResult = testCase.data?.testResult || testCase.testResult || 'Not Executed'
  const qa = testCase.data?.qa || testCase.qa || ''
  const remarks = testCase.data?.remarks || testCase.remarks || ''
  
  // Escape and format for CSV
  const row = [
    testCaseId,
    module,
    testStep,
    `"${testStepDescription.replace(/"/g, '""')}"`,
    `"${testData.replace(/"/g, '""')}"`,
    `"${expectedResult.replace(/"/g, '""')}"`,
    testResult,
    qa,
    `"${remarks.replace(/"/g, '""')}"`
  ]
  
  return row.join(',')
}

// Export to CSV format
function exportToCSV(testCases: TestCase[], filename: string): void {
  if (testCases.length === 0) {
    throw new Error('No test cases to export')
  }
  
  const headers = testCaseToCSVRow(testCases[0], true).split('\n')[0]
  const rows = testCases.map(testCase => testCaseToCSVRow(testCase, false))
  const csvContent = `${headers}\n${rows.join('\n')}`
  
  downloadFile(csvContent, filename, 'text/csv')
}

// Export to JSON format  
function exportToJSON(testCases: TestCase[], filename: string): void {
  if (testCases.length === 0) {
    throw new Error('No test cases to export')
  }
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    totalTestCases: testCases.length,
    testCases: testCases.map(testCase => ({
      ...testCase,
      testSteps: testCase.testSteps || []
    }))
  }
  
  const jsonContent = JSON.stringify(exportData, null, 2)
  downloadFile(jsonContent, filename, 'application/json')
}

// Export to Excel format (simplified - creates CSV with .xlsx extension)
function exportToExcel(testCases: TestCase[], filename: string): void {
  console.log('⚠️ Excel export: Using CSV format with Excel-compatible formatting')
  
  if (testCases.length === 0) {
    throw new Error('No test cases to export')
  }
  
  // Create Excel-compatible CSV headers
  const headers = [
    'Test Steps', // Number column (defaults to 1)
    'Test Case',  // Contains only test steps
    'Test Result' // Contains only results
  ]
  
  const rows = testCases.map(testCase => {
    // Default test step number to 1
    const testStepNumber = 1
    
    // Test case column contains only the test steps (clean format)
    const testCaseSteps = testCase.testSteps
      ?.map(step => step.description)
      .join('\n') || testCase.testCase || 'No test steps defined'
    
    // Test result column contains only the expected results
    const testResults = testCase.testSteps
      ?.map(step => step.expectedResult)
      .join('\n') || testCase.testResult || ''
      
    return [
      testStepNumber,
      testCaseSteps,
      testResults
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`) // Escape quotes for Excel
  })
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadFile(csvContent, filename, 'application/vnd.ms-excel')
}

// Utility function to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  setTimeout(() => window.URL.revokeObjectURL(url), 100)
  
  console.log('✅ File downloaded:', filename)
}

// Main export function
export function exportTestCases(testCases: TestCase[], options: ExportOptions): void {
  if (!testCases || testCases.length === 0) {
    throw new Error('No test cases selected for export')
  }
  
  const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const defaultFilename = `test-cases-${timestamp}`
  const filename = options.filename || defaultFilename
  
  console.log('📤 Exporting test cases:', { 
    count: testCases.length, 
    format: options.format, 
    filename 
  })
  
  try {
    switch (options.format) {
      case 'csv':
        exportToCSV(testCases, `${filename}.csv`)
        break
        
      case 'json':
        exportToJSON(testCases, `${filename}.json`)
        break
        
      case 'excel':
        exportToExcel(testCases, `${filename}.csv`) // CSV format but Excel compatible
        break
        
      case 'pdf':
        throw new Error('PDF export not yet implemented. Please use CSV or JSON format.')
        
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
    
    // Success notification could be added here
    console.log(`✅ Successfully exported ${testCases.length} test cases as ${options.format.toUpperCase()}`)
    
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw new Error(`Export failed: ${error.message}`)
  }
}

// Quick export functions for common formats
export const quickExportCSV = (testCases: TestCase[], filename?: string) => 
  exportTestCases(testCases, { format: 'csv', filename })

export const quickExportJSON = (testCases: TestCase[], filename?: string) => 
  exportTestCases(testCases, { format: 'json', filename })

export const quickExportExcel = (testCases: TestCase[], filename?: string) => 
  exportTestCases(testCases, { format: 'excel', filename })