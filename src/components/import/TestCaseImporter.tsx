'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Upload,
  FileText,
  Table,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Settings,
  Eye,
  X
} from 'lucide-react'
import { importTestCases, ImportResult, ImportOptions, getExcelSheetInfo, ExcelSheetInfo } from '@/lib/test-case-importer'
import { TestCase } from '@/types'
import { saveGeneratedTestCasesWithIntelligentDedup } from '@/lib/test-case-storage'
import { MergeReviewModal } from './MergeReviewModal'

interface TestCaseImporterProps {
  onImport: (testCases: TestCase[], options: ImportOptions) => void
  onClose?: () => void
  defaultProject?: string
}

export function TestCaseImporter({ onImport, onClose, defaultProject }: TestCaseImporterProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [excelSheets, setExcelSheets] = useState<ExcelSheetInfo[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [showSheetSelection, setShowSheetSelection] = useState(false)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    validateRequired: false, // Temporarily disabled for debugging
    defaultProject: defaultProject || '',
    existingTestCases: []
  })
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('')
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false)
  const [deduplicationMode, setDeduplicationMode] = useState<'strict' | 'smart' | 'off'>('smart')
  const [showMergeReview, setShowMergeReview] = useState(false)
  const [mergeConflicts, setMergeConflicts] = useState<any[]>([])
  const [intelligentResult, setIntelligentResult] = useState<any>(null)

  // Load projects and existing test cases from localStorage
  useEffect(() => {
    try {
      // Load projects
      const storedProjects = localStorage.getItem('testCaseWriter_projects')
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects)
        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active')
        setProjects(activeProjects)
      } else {
        setProjects([])
      }

      // Load existing test cases for duplicate detection
      const storedTestCases = localStorage.getItem('testCaseWriter_testCases')
      if (storedTestCases) {
        const existingTestCases = JSON.parse(storedTestCases)
        setImportOptions(prev => ({
          ...prev,
          existingTestCases: Array.isArray(existingTestCases) ? existingTestCases : []
        }))
        console.log('📋 TestCaseImporter - Loaded existing test cases:', existingTestCases.length)
      } else {
        console.log('📋 TestCaseImporter - No existing test cases found')
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error)
      setProjects([])
      setImportOptions(prev => ({ ...prev, existingTestCases: [] }))
    }
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    console.log('📁 File Handler - File selected', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    })

    const validTypes = ['text/csv', 'application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', '.csv', '.json', '.xlsx', '.xls']
    const isValid = validTypes.some(type =>
      file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''))
    )

    console.log('📁 File Handler - File validation', {
      isValid,
      detectedType: file.type,
      validTypes: validTypes.filter(type =>
        file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''))
      )
    })

    if (!isValid) {
      console.error('❌ File Handler - Invalid file type')
      alert('Please select a CSV, JSON, or Excel file')
      return
    }

    console.log('📁 File Handler - Resetting component state')
    setSelectedFile(file)
    setImportResult(null)
    setExcelSheets([])
    setSelectedSheet('')
    setShowSheetSelection(false)

    // If it's an Excel file, analyze sheets
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      console.log('📁 File Handler - Excel file detected, analyzing sheets...')
      try {
        const sheets = await getExcelSheetInfo(file)
        console.log('📁 File Handler - Sheet analysis completed', {
          totalSheets: sheets.length,
          sheetNames: sheets.map(s => s.name)
        })
        setExcelSheets(sheets)

        // Filter to show only likely test case sheets first
        const testCaseSheets = sheets.filter(sheet => sheet.isTestCaseSheet)
        console.log('📁 File Handler - Test case sheet detection', {
          testCaseSheets: testCaseSheets.map(s => s.name),
          nonTestCaseSheets: sheets.filter(s => !s.isTestCaseSheet).map(s => s.name)
        })

        if (testCaseSheets.length === 1 && sheets.length > 1) {
          // Auto-select the only test case sheet if there are other non-test-case sheets
          console.log('📁 File Handler - Auto-selecting single test case sheet:', testCaseSheets[0].name)
          setSelectedSheet(testCaseSheets[0].name)
          setImportOptions(prev => ({ ...prev, selectedSheet: testCaseSheets[0].name }))
          setShowSheetSelection(true) // Still show selection so user can see what's available
        } else if (sheets.length > 1) {
          console.log('📁 File Handler - Multiple sheets found, showing selection UI')
          setShowSheetSelection(true)
        } else if (sheets.length === 1) {
          console.log('📁 File Handler - Single sheet found, auto-selecting:', sheets[0].name)
          setSelectedSheet(sheets[0].name)
          setImportOptions(prev => ({ ...prev, selectedSheet: sheets[0].name }))
        }
      } catch (error) {
        console.error('❌ File Handler - Failed to analyze Excel file:', error)
        alert('Failed to analyze Excel file structure')
      }
    } else {
      console.log('📁 File Handler - Non-Excel file, ready for import')
    }
  }

  const handleImport = async () => {
    console.log('▶️ Import Handler - Starting import process', {
      hasFile: !!selectedFile,
      fileName: selectedFile?.name,
      selectedSheet,
      importOptions
    })

    if (!selectedFile) {
      console.error('❌ Import Handler - No file selected')
      return
    }

    // For Excel files, ensure a sheet is selected
    if ((selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls')) && !selectedSheet) {
      console.error('❌ Import Handler - Excel file requires sheet selection')
      alert('Please select a worksheet to import from')
      return
    }

    console.log('▶️ Import Handler - Setting importing state to true')
    setImporting(true)

    try {
      const optionsWithSheet = {
        ...importOptions,
        selectedSheet: selectedSheet || undefined
      }

      console.log('▶️ Import Handler - Calling importTestCases with options:', optionsWithSheet)
      const result = await importTestCases(selectedFile, optionsWithSheet)

      console.log('▶️ Import Handler - Import completed', {
        success: result.success,
        testCasesCount: result.testCases.length,
        errorsCount: result.errors.length,
        skipped: result.skipped,
        errors: result.errors
      })

      setImportResult(result)

      if (result.success && result.testCases.length > 0) {
        console.log('▶️ Import Handler - Showing preview with', result.testCases.length, 'test cases')
        setShowPreview(true)
      } else {
        console.log('▶️ Import Handler - Import failed or no test cases found')
      }
    } catch (error) {
      console.error('❌ Import Handler - Import process failed:', error)
      setImportResult({
        success: false,
        testCases: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
        skipped: 0
      })
    }

    console.log('▶️ Import Handler - Setting importing state to false')
    setImporting(false)
  }

  const handleConfirmImport = async () => {
    if (importResult?.testCases) {
      console.log('🧠 Starting intelligent import with mode:', deduplicationMode)

      try {
        // Use intelligent deduplication
        const result = saveGeneratedTestCasesWithIntelligentDedup(
          importResult.testCases,
          [],
          'imported',
          importOptions.defaultProject,
          importOptions.defaultProject,
          undefined,
          deduplicationMode
        )

        setIntelligentResult(result)

        // Check if there are merge conflicts that need review
        if (result.mergeConflicts && result.mergeConflicts.length > 0) {
          setMergeConflicts(result.mergeConflicts)
          setShowMergeReview(true)
          return // Don't close modal yet, wait for merge review
        }

        // Show import summary
        const message = `✅ Import completed!

📊 Results:
• ${result.saved} new test cases imported
• ${result.exactDuplicates} exact duplicates skipped
• ${result.autoMerged} cases auto-merged
• ${result.reviewRequired} cases need review

Total processed: ${importResult.testCases.length} test cases`

        alert(message)

        // Check for suspicious patterns and offer AI analysis
        const totalImported = result.saved
        const duplicateRate = result.exactDuplicates / importResult.testCases.length

        if (duplicateRate > 0.5 && importResult.testCases.length > 10) {
          console.log('🚨 High duplicate rate detected, suggesting AI analysis...')
          const useAI = confirm('High duplicate rate detected. Would you like AI analysis to help optimize the import?')
          if (useAI) {
            await runAIAnalysis()
          }
        }

        onImport(importResult.testCases, importOptions)
        onClose?.()

      } catch (error) {
        console.error('❌ Intelligent import failed:', error)
        // Fallback to original import
        onImport(importResult.testCases, importOptions)
        onClose?.()
      }
    }
  }

  const runAIAnalysis = async () => {
    setAnalyzingWithAI(true)
    setShowAiAnalysis(true)
    setAiAnalysisResult('🤖 Starting AI analysis of duplicate detection issue...\n')

    try {
      // Get API key from localStorage (user should have set it in settings)
      const apiKey = localStorage.getItem('openai_api_key') || ''

      if (!apiKey) {
        setAiAnalysisResult('❌ OpenAI API key not found. Please set it in Settings first.')
        setAnalyzingWithAI(false)
        return
      }

      // Call AI analysis API with actual import data
      const response = await fetch('/api/debug-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importedTestCases: importResult?.testCases || [],
          existingTestCases: importOptions.existingTestCases || [],
          duplicateResults: {
            saved: importResult?.testCases.length || 0,
            skipped: importResult?.skipped || 0,
            duplicateSignatures: []
          },
          apiKey: apiKey
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const analysisResult = await response.json()

      if (analysisResult.success) {
        setAiAnalysisResult(prev => prev + '\n🎯 AI Analysis Complete!\n\n' + analysisResult.analysis)
      } else {
        throw new Error('Analysis failed')
      }

    } catch (error) {
      setAiAnalysisResult(prev => prev + `\n❌ AI Analysis failed: ${error.message}`)
    } finally {
      setAnalyzingWithAI(false)
    }
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      ['Title', 'Description', 'Preconditions', 'Steps', 'Expected Result', 'Priority', 'Category', 'Tags'],
      ['Login with valid credentials', 'Test successful login flow', 'User has valid account', '1. Open login page\n2. Enter username\n3. Enter password\n4. Click login', 'User is redirected to dashboard', 'High', 'Authentication', 'login,auth'],
      ['Login with invalid password', 'Test login with wrong password', 'User has valid username', '1. Open login page\n2. Enter valid username\n3. Enter invalid password\n4. Click login', 'Error message is displayed', 'Medium', 'Authentication', 'login,negative']
    ]

    const csvContent = sampleData.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-test-cases.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().endsWith('.csv')) {
      return <Table className="w-6 h-6 text-green-500" />
    } else if (fileName.toLowerCase().endsWith('.json')) {
      return <FileText className="w-6 h-6 text-blue-500" />
    }
    return <FileText className="w-6 h-6 text-gray-500" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import Test Cases</h2>
            <p className="text-sm text-gray-600">
              Import test cases from CSV, JSON, or Excel files
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                🎯 FEAI-94 Optimized
              </span>
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!showPreview ? (
          <div className="space-y-6">
            {/* Import Options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Import Options
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    🧠 Duplicate Detection Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dedupMode"
                        value="smart"
                        checked={deduplicationMode === 'smart'}
                        onChange={(e) => setDeduplicationMode(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Smart (Recommended)</span> - Auto-merge similar cases, review conflicts
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dedupMode"
                        value="strict"
                        checked={deduplicationMode === 'strict'}
                        onChange={(e) => setDeduplicationMode(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Strict</span> - Only skip exact duplicates ({importOptions.existingTestCases?.length || 0} existing)
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="dedupMode"
                        value="off"
                        checked={deduplicationMode === 'off'}
                        onChange={(e) => setDeduplicationMode(e.target.value as any)}
                        className="text-blue-600"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Off</span> - Import all test cases
                      </span>
                    </label>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  {deduplicationMode === 'smart' && (
                    <>🧠 <strong>Smart mode:</strong> Automatically merges very similar cases (97%+), sends moderately similar cases (88-97%) for review, and imports unique cases.</>
                  )}
                  {deduplicationMode === 'strict' && (
                    <>🎯 <strong>Strict mode:</strong> Only skips exact duplicates. Different test data or slight variations will be imported as separate cases.</>
                  )}
                  {deduplicationMode === 'off' && (
                    <>📥 <strong>Import all:</strong> No duplicate checking. All test cases will be imported regardless of similarity.</>
                  )}
                </div>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.validateRequired}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, validateRequired: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Validate required fields</span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Project</label>
                <select
                  value={importOptions.defaultProject || ''}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, defaultProject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">No Project Assignment</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No projects available. Create a project first in the Generate page.</p>
                )}
              </div>
            </div>

            {/* File Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile ? 'File Selected' : 'Choose a file or drag it here'}
              </h3>

              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {getFileIcon(selectedFile.name)}
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <p className="text-gray-600 mb-4">Supports CSV and JSON formats</p>
              )}

              <input
                type="file"
                onChange={handleFileInput}
                accept=".csv,.json,.xlsx,.xls"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? 'Choose Different File' : 'Browse Files'}
              </label>
            </div>

            {/* Sample Download */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Need a template?</h3>
              <p className="text-sm text-blue-700 mb-3">
                Download a sample CSV file to see the expected format for importing test cases.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadSampleCSV}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample CSV</span>
              </Button>
            </div>

            {/* Import Button */}
            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={importing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="flex items-center space-x-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Test Cases</span>
                  </>
                )}
              </Button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  {importResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <h3 className="font-medium">
                    {importResult.success ? 'Import Preview' : 'Import Failed'}
                  </h3>
                </div>

                {importResult.success && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResult.testCases.length}</div>
                      <div className="text-sm text-gray-600">Test Cases</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                  </div>
                )}

                {importResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {importResult.success && importResult.testCases.length > 0 && (
                  <Button
                    variant="primary"
                    onClick={() => setShowPreview(true)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Test Cases</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Preview Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Preview Imported Test Cases
                <span className="ml-2 text-sm font-normal text-blue-600">(FEAI-94 Format)</span>
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Back to Import
              </Button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{importResult?.testCases.length || 0}</div>
                  <div className="text-sm text-gray-600">Test Cases Ready</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{importResult?.skipped || 0}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">{importResult?.errors.length || 0}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 border-b">Title</th>
                    <th className="text-left p-3 border-b">Priority</th>
                    <th className="text-left p-3 border-b">Category</th>
                    <th className="text-left p-3 border-b">Steps</th>
                  </tr>
                </thead>
                <tbody>
                  {importResult?.testCases.map((testCase, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{testCase.testCase || testCase.data?.title || 'Untitled'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          testCase.priority === 'critical' ? 'bg-red-100 text-red-800' :
                          testCase.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          testCase.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {testCase.priority}
                        </span>
                      </td>
                      <td className="p-3">{testCase.module || testCase.data?.category || '-'}</td>
                      <td className="p-3">{(testCase.testSteps || testCase.data?.steps || []).length} step(s)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                >
                  Back to Import
                </Button>
                <Button
                  onClick={runAIAnalysis}
                  variant="secondary"
                  className="flex items-center space-x-2"
                  disabled={analyzingWithAI}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{analyzingWithAI ? 'Analyzing...' : '🤖 Analyze with AI'}</span>
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={handleConfirmImport}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Import {importResult?.testCases.length} Test Cases</span>
              </Button>
            </div>
          </div>
        )}

        {/* Merge Review Modal */}
        {showMergeReview && (
          <MergeReviewModal
            conflicts={mergeConflicts}
            onResolve={(resolutions) => {
              console.log('🔄 Processing merge resolutions:', resolutions)

              // Apply the resolutions and complete import
              resolutions.forEach(resolution => {
                if (resolution.action === 'merge' && resolution.mergedCase) {
                  // The merge was already applied in the intelligent dedup function
                  console.log('✅ Merge applied:', resolution.mergedCase.testCase?.substring(0, 30))
                }
                // Other actions (keep_both, skip) are handled automatically
              })

              setShowMergeReview(false)

              // Show final results
              if (intelligentResult) {
                const message = `✅ Import with merge review completed!

📊 Final Results:
• ${intelligentResult.saved} new test cases imported
• ${intelligentResult.exactDuplicates} exact duplicates skipped
• ${intelligentResult.autoMerged} cases auto-merged
• ${resolutions.filter(r => r.action === 'merge').length} conflicts resolved by merge
• ${resolutions.filter(r => r.action === 'keep_both').length} conflicts resolved by keeping both

Total processed: ${mergeConflicts.length + intelligentResult.saved + intelligentResult.exactDuplicates} test cases`

                alert(message)
              }

              onImport(importResult?.testCases || [], importOptions)
              onClose?.()
            }}
            onClose={() => {
              setShowMergeReview(false)
              // Still close the import modal even if user cancels merge review
              onImport(importResult?.testCases || [], importOptions)
              onClose?.()
            }}
          />
        )}

        {/* AI Analysis Modal */}
        {showAiAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900">
                    🤖 AI Duplicate Detection Analysis
                  </h3>
                </div>
                <button
                  onClick={() => setShowAiAnalysis(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {aiAnalysisResult}
                  </pre>
                  {analyzingWithAI && (
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-600">Analyzing with AI...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowAiAnalysis(false)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}