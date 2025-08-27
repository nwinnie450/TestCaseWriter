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
    'Test Case ID',
    'Module',
    'Test Case Description', 
    'Test Steps',
    'Expected Results',
    'Test Result',
    'QA Notes',
    'Remarks'
  ]
  
  // Format test steps as numbered list
  const formattedSteps = testCase.testSteps
    ?.map(step => `${step.step}. ${step.description} | Test Data: ${step.testData} | Expected: ${step.expectedResult}`)
    .join('; ') || 'No steps defined'
  
  const row = [
    testCase.id,
    testCase.module,
    testCase.testCase,
    `"${formattedSteps}"`, // Wrap in quotes to handle commas
    `"${testCase.testSteps?.map(s => s.expectedResult).join('; ') || 'Not specified'}"`,
    testCase.testResult,
    testCase.qa,
    testCase.remarks
  ]
  
  if (includeHeaders) {
    return `${headers.join(',')}\n${row.join(',')}`
  }
  
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
  
  // Create Excel-compatible CSV with tab separators
  const headers = [
    'Test Case ID',
    'Module', 
    'Test Case Description',
    'Test Steps (Step | Description | Test Data | Expected Result)',
    'Final Expected Result',
    'Test Result',
    'QA Notes',
    'Remarks'
  ]
  
  const rows = testCases.map(testCase => {
    const formattedSteps = testCase.testSteps
      ?.map(step => `Step ${step.step}: ${step.description} | Test Data: ${step.testData} | Expected: ${step.expectedResult}`)
      .join('\n') || 'No steps defined'
      
    return [
      testCase.id,
      testCase.module,
      testCase.testCase,
      formattedSteps,
      testCase.testSteps?.map(s => s.expectedResult).join('\n') || 'Not specified',
      testCase.testResult,
      testCase.qa,
      testCase.remarks
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