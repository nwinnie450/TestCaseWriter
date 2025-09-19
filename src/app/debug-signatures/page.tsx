'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { getTestCaseSignature } from '@/lib/caseSignature'
import { getAllStoredTestCases } from '@/lib/test-case-storage'

export default function DebugSignatures() {
  const [results, setResults] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const clearAllData = () => {
    localStorage.removeItem('testCaseWriter_generatedTestCases')
    localStorage.removeItem('testCaseWriter_testCases')
    localStorage.removeItem('testCaseWriter_projects')
    setResults(prev => prev + '\n✅ All localStorage data cleared!')
  }

  const analyzeWithAI = async () => {
    if (!apiKey.trim()) {
      setResults('❌ Please enter your OpenAI API key first')
      return
    }

    setIsAnalyzing(true)
    setResults('🤖 Starting AI analysis of duplicate detection issue...\n')

    try {
      // Get existing test cases
      const existingTestCases = getAllStoredTestCases()

      // Simulate imported test cases (these would be the problematic ones)
      const simulatedImportedTestCases = [
        {
          id: 'TC_001',
          testCase: 'Verify Add Department modal shows Usage Controls section',
          module: 'Merchant App',
          priority: 'medium',
          data: {
            title: 'Verify Add Department modal shows Usage Controls section',
            description: '1) Login as Super Admin\n2) Open Add Department modal\n3) Verify Usage Controls section visible'
          },
          testSteps: [
            { step: 1, description: 'Login as Super Admin', expectedResult: 'Successfully logged in' },
            { step: 2, description: 'Open Add Department modal', expectedResult: 'Modal opens' }
          ]
        },
        {
          id: 'TC_002',
          testCase: 'Create new Department with valid name',
          module: 'Merchant App',
          priority: 'medium',
          data: {
            title: 'Create new Department with valid name',
            description: '1) Enter valid department name\n2) Configure settings\n3) Save department'
          },
          testSteps: [
            { step: 1, description: 'Enter valid department name', expectedResult: 'Name is accepted' },
            { step: 2, description: 'Save department', expectedResult: 'Department created' }
          ]
        }
      ]

      // Simulate duplicate detection results
      const mockDuplicateResults = {
        saved: 1,
        skipped: 59,
        duplicateSignatures: existingTestCases.map(tc => getTestCaseSignature(tc))
      }

      // Call AI analysis API
      const response = await fetch('/api/debug-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importedTestCases: simulatedImportedTestCases,
          existingTestCases: existingTestCases,
          duplicateResults: mockDuplicateResults,
          apiKey: apiKey
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const analysisResult = await response.json()

      if (analysisResult.success) {
        setResults(prev => prev + '\n🎯 AI Analysis Complete!\n\n' + analysisResult.analysis + '\n\n📊 Metadata:\n' + JSON.stringify(analysisResult.metadata, null, 2))
      } else {
        throw new Error('Analysis failed')
      }

    } catch (error) {
      setResults(prev => prev + `\n❌ AI Analysis failed: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const testSignatures = () => {
    // Test cases similar to imported ones
    const testCase1 = {
      id: 'TC_001',
      testCase: 'Verify Add Department modal shows Usage Controls section',
      module: 'Merchant App',
      priority: 'medium',
      data: {
        title: 'Verify Add Department modal shows Usage Controls section',
        description: '1) Login as Super Admin\n2) Open Add Department modal\n3) Verify Usage Controls section visible'
      },
      testSteps: [
        { step: 1, description: 'Login as Super Admin', expectedResult: 'Successfully logged in' },
        { step: 2, description: 'Open Add Department modal', expectedResult: 'Modal opens' }
      ]
    }

    const testCase2 = {
      id: 'TC_002',
      testCase: 'Create new Department with valid name',
      module: 'Merchant App',
      priority: 'medium',
      data: {
        title: 'Create new Department with valid name',
        description: '1) Enter valid department name\n2) Configure settings\n3) Save department'
      },
      testSteps: [
        { step: 1, description: 'Enter valid department name', expectedResult: 'Name is accepted' },
        { step: 2, description: 'Save department', expectedResult: 'Department created' }
      ]
    }

    const testCase3 = {
      id: 'TC_003',
      testCase: 'Verify Add Department modal shows Usage Controls section', // Same as TC_001
      module: 'Merchant App',
      priority: 'medium',
      data: {
        title: 'Verify Add Department modal shows Usage Controls section',
        description: '1) Login as Super Admin\n2) Open Add Department modal\n3) Verify Usage Controls section visible'
      },
      testSteps: [
        { step: 1, description: 'Login as Super Admin', expectedResult: 'Successfully logged in' },
        { step: 2, description: 'Open Add Department modal', expectedResult: 'Modal opens' }
      ]
    }

    try {
      const sig1 = getTestCaseSignature(testCase1)
      const sig2 = getTestCaseSignature(testCase2)
      const sig3 = getTestCaseSignature(testCase3)

      const results = `
🔍 Signature Testing Results:

TC_001 (${testCase1.testCase}):
Signature: ${sig1}

TC_002 (${testCase2.testCase}):
Signature: ${sig2}

TC_003 (${testCase3.testCase}) [Should match TC_001]:
Signature: ${sig3}

Comparisons:
TC_001 === TC_002 (should be false): ${sig1 === sig2}
TC_001 === TC_003 (should be true): ${sig1 === sig3}
TC_002 === TC_003 (should be false): ${sig2 === sig3}

Analysis:
- Different test cases should have different signatures
- Identical test cases should have identical signatures
- If all signatures are the same, there's a bug in signature generation
      `

      setResults(results)
    } catch (error) {
      setResults(`❌ Error testing signatures: ${error.message}`)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Signature Generation</h1>

      <div className="space-y-4 mb-6">
        <Button onClick={clearAllData} variant="secondary">
          Clear All localStorage Data
        </Button>

        <Button onClick={testSignatures} variant="primary">
          Test Signature Generation
        </Button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="whitespace-pre-wrap text-sm">{results}</pre>
      </div>
    </div>
  )
}