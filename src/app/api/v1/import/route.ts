import { NextRequest, NextResponse } from 'next/server'
import { parseImportFile, transformImportData, createTestCaseFromImport } from '@/lib/import-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const templateId = formData.get('templateId') as string
    const fieldMappings = JSON.parse(formData.get('fieldMappings') as string)
    const userId = formData.get('userId') as string || 'anonymous'

    if (!file || !projectId || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, projectId, templateId' },
        { status: 400 }
      )
    }

    // Parse the file
    const fileFormat = file.name.endsWith('.csv') ? 'csv' : 'json'
    const importData = await parseImportFile(file, fileFormat)

    // Transform and create test cases
    const testCases = []
    let importedCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (let i = 0; i < importData.length; i++) {
      try {
        const row = importData[i]
        const transformedData = transformImportData(row, fieldMappings)
        
        const testCase = createTestCaseFromImport(
          transformedData,
          templateId,
          projectId,
          userId
        )
        
        testCases.push(testCase)
        importedCount++
      } catch (error) {
        errorCount++
        errors.push(`Row ${i + 1}: ${error}`)
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      importedCount,
      errorCount,
      errors,
      testCases
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: `Import failed: ${error}` },
      { status: 500 }
    )
  }
} 