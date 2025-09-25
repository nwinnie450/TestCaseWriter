'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Wrench, Database, HardDrive, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface IdAnalysis {
  source: 'database' | 'localStorage'
  totalTestCases: number
  uniqueIds: number
  duplicateIds: Array<{ id: string; count: number }>
  allIds: string[]
  needsUpdate: boolean
}

export function TestCaseIdFixer() {
  const [analysis, setAnalysis] = useState<{
    database?: IdAnalysis
    localStorage?: IdAnalysis
  }>({})
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const analyzeDatabase = async () => {
    try {
      const response = await fetch('/api/fix-test-case-ids')
      const data = await response.json()
      return {
        source: 'database' as const,
        ...data
      }
    } catch (error) {
      console.error('Failed to analyze database:', error)
      return null
    }
  }

  const analyzeLocalStorage = () => {
    try {
      const stored = localStorage.getItem('testCaseWriterLibrary')
      if (!stored) {
        return {
          source: 'localStorage' as const,
          totalTestCases: 0,
          uniqueIds: 0,
          duplicateIds: [],
          allIds: [],
          needsUpdate: false
        }
      }

      const testCases = JSON.parse(stored)
      const idGroups = new Map<string, any[]>()

      testCases.forEach((tc: any) => {
        if (!idGroups.has(tc.id)) {
          idGroups.set(tc.id, [])
        }
        idGroups.get(tc.id)!.push(tc)
      })

      const duplicateIds = Array.from(idGroups.entries())
        .filter(([_, cases]) => cases.length > 1)
        .map(([id, cases]) => ({ id, count: cases.length }))

      return {
        source: 'localStorage' as const,
        totalTestCases: testCases.length,
        uniqueIds: idGroups.size,
        duplicateIds,
        allIds: Array.from(idGroups.keys()).sort(),
        needsUpdate: duplicateIds.length > 0
      }
    } catch (error) {
      console.error('Failed to analyze localStorage:', error)
      return null
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    try {
      const [dbAnalysis, lsAnalysis] = await Promise.all([
        analyzeDatabase(),
        analyzeLocalStorage()
      ])

      setAnalysis({
        database: dbAnalysis || undefined,
        localStorage: lsAnalysis || undefined
      })
    } finally {
      setLoading(false)
    }
  }

  const fixDatabaseIds = async () => {
    try {
      const response = await fetch('/api/fix-test-case-ids', {
        method: 'POST'
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to fix database IDs:', error)
      return { success: false, error: 'Failed to fix database IDs' }
    }
  }

  const fixLocalStorageIds = () => {
    try {
      const stored = localStorage.getItem('testCaseWriterLibrary')
      if (!stored) return { success: true, message: 'No localStorage test cases to fix', updated: 0 }

      const testCases = JSON.parse(stored)
      let updateCount = 0

      // Sort by creation date to maintain order
      testCases.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime())

      // Assign new sequential IDs
      testCases.forEach((tc: any, index: number) => {
        const newId = `TC-${String(index + 1).padStart(3, '0')}`
        if (tc.id !== newId) {
          tc.id = newId
          updateCount++
        }
      })

      localStorage.setItem('testCaseWriterLibrary', JSON.stringify(testCases))

      return {
        success: true,
        message: `Successfully updated ${updateCount} localStorage test case IDs`,
        updated: updateCount,
        total: testCases.length
      }
    } catch (error) {
      console.error('Failed to fix localStorage IDs:', error)
      return { success: false, error: 'Failed to fix localStorage IDs' }
    }
  }

  const fixAllIds = async () => {
    setFixing(true)
    try {
      const [dbResult, lsResult] = await Promise.all([
        fixDatabaseIds(),
        fixLocalStorageIds()
      ])

      setResults({
        database: dbResult,
        localStorage: lsResult
      })

      // Re-run analysis to show updated state
      await runAnalysis()
    } finally {
      setFixing(false)
    }
  }

  const renderAnalysis = (data: IdAnalysis) => (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 font-medium">
        {data.source === 'database' ? (
          <Database className="h-4 w-4 text-blue-600" />
        ) : (
          <HardDrive className="h-4 w-4 text-purple-600" />
        )}
        {data.source === 'database' ? 'Database' : 'localStorage'}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>Total Test Cases: <span className="font-medium">{data.totalTestCases}</span></div>
        <div>Unique IDs: <span className="font-medium">{data.uniqueIds}</span></div>
      </div>

      {data.duplicateIds.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-1 text-amber-700 text-sm font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            Duplicate IDs Found ({data.duplicateIds.length})
          </div>
          <div className="space-y-1">
            {data.duplicateIds.map(({ id, count }) => (
              <div key={id} className="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded">
                <code>{id}</code> appears {count} times
              </div>
            ))}
          </div>
        </div>
      )}

      {data.duplicateIds.length === 0 && data.totalTestCases > 0 && (
        <div className="flex items-center gap-1 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4" />
          All test case IDs are unique
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-orange-600 rounded-full flex items-center justify-center">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Test Case ID Fixer</h2>
          <p className="text-sm text-gray-600">
            Analyze and fix duplicate test case IDs in database and localStorage
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={runAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze Test Case IDs'}
        </Button>

        {(analysis.database?.needsUpdate || analysis.localStorage?.needsUpdate) && (
          <Button onClick={fixAllIds} disabled={fixing} variant="primary">
            {fixing ? 'Fixing...' : 'Fix All Duplicate IDs'}
          </Button>
        )}
      </div>

      {analysis.database && (
        <div>
          <h3 className="text-lg font-medium mb-3">Analysis Results</h3>
          <div className="space-y-4">
            {renderAnalysis(analysis.database)}
            {analysis.localStorage && renderAnalysis(analysis.localStorage)}
          </div>
        </div>
      )}

      {results && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800 font-medium mb-3">
            <Info className="h-4 w-4" />
            Fix Results
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Database:</span>{' '}
              {results.database.success ? (
                <span className="text-green-700">✅ {results.database.message}</span>
              ) : (
                <span className="text-red-700">❌ {results.database.error}</span>
              )}
            </div>

            <div>
              <span className="font-medium">localStorage:</span>{' '}
              {results.localStorage.success ? (
                <span className="text-green-700">✅ {results.localStorage.message}</span>
              ) : (
                <span className="text-red-700">❌ {results.localStorage.error}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Analyzes both database and localStorage for duplicate test case IDs</li>
          <li>• Assigns new sequential IDs (TC-001, TC-002, etc.) based on creation date</li>
          <li>• Preserves all test case data, only updates the ID field</li>
          <li>• Safe operation with comprehensive error handling</li>
        </ul>
      </div>
    </div>
  )
}