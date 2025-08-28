'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Download, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react'

interface DemoDataLoaderProps {
  onDataLoaded?: () => void
}

export function DemoDataLoader({ onDataLoaded }: DemoDataLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  const loadDemoData = async () => {
    setLoading(true)
    setStatus('loading')
    setMessage('Loading demo data...')
    setDebugInfo('')

    try {
      console.log('🚀 Starting to load demo data...')
      
      // Call the mock data API
      const response = await fetch('/api/v1/mock-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'populate' }),
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('📡 API Response data:', result)

      if (result.success) {
        // Store projects in localStorage
        localStorage.setItem('testCaseWriter_projects', JSON.stringify(result.data.projects))
        console.log('💾 Projects stored in localStorage:', result.data.projects)
        
        // Store test cases in the expected format that matches the storage system
        const testCaseSessions = [{
          id: 'session-001',
          generatedAt: new Date().toISOString(),
          testCases: result.data.testCases,
          documentNames: ['Mock Test Case Generation Session'],
          model: 'mock-generator',
          totalCount: result.data.testCases.length,
          projectId: 'mock-project',
          projectName: 'Mock Project'
        }]
        
        localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(testCaseSessions))
        console.log('💾 Test cases stored in localStorage:', testCaseSessions)

        setStatus('success')
        setMessage(`✅ Demo data loaded successfully! ${result.data.projects.length} projects and ${result.data.testCases.length} test cases added.`)
        
        // Show debug info
        setDebugInfo(`
📊 Loaded Data Summary:
• Projects: ${result.data.projects.length}
• Test Cases: ${result.data.testCases.length}

🔍 Sample Test Case Fields:
• First TC ID: ${result.data.testCases[0]?.id}
• First TC Feature: ${result.data.testCases[0]?.feature || result.data.testCases[0]?.data?.feature || 'N/A'}
• First TC Enhancement: ${result.data.testCases[0]?.enhancement || result.data.testCases[0]?.data?.enhancement || 'N/A'}
• First TC Ticket: ${result.data.testCases[0]?.ticketId || result.data.testCases[0]?.data?.ticketId || 'N/A'}
• First TC Project: ${result.data.testCases[0]?.projectId || result.data.testCases[0]?.data?.projectId || 'N/A'}
        `.trim())
        
        // Notify parent component that data was loaded
        onDataLoaded?.()
        
        // Auto-refresh the page after a short delay to show the new data
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        throw new Error(result.message || 'Failed to load demo data')
      }
    } catch (error) {
      console.error('❌ Error loading demo data:', error)
      setStatus('error')
      setMessage(`❌ Error loading demo data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Show debug info for errors
      setDebugInfo(`
❌ Error Details:
• Error: ${error instanceof Error ? error.message : 'Unknown error'}
• Stack: ${error instanceof Error ? error.stack : 'N/A'}
      `.trim())
    } finally {
      setLoading(false)
    }
  }

  const clearDemoData = () => {
    if (confirm('Are you sure you want to clear all demo data? This cannot be undone.')) {
      localStorage.removeItem('testCaseWriter_projects')
      localStorage.removeItem('testCaseWriter_generatedTestCases')
      setStatus('idle')
      setMessage('🧹 Demo data cleared successfully!')
      setDebugInfo('')
      
      // Auto-refresh the page after clearing
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const checkDemoData = () => {
    const projects = localStorage.getItem('testCaseWriter_projects')
    const testCases = localStorage.getItem('testCaseWriter_generatedTestCases')
    
    if (projects && testCases) {
      const parsedProjects = JSON.parse(projects)
      const parsedTestCases = JSON.parse(testCases)
      const totalTestCases = parsedTestCases.reduce((sum: number, session: any) => sum + session.testCases.length, 0)
      
      setStatus('success')
      setMessage(`📊 Current demo data: ${parsedProjects.length} projects and ${totalTestCases} test cases`)
      
      // Show detailed debug info
      if (parsedTestCases.length > 0 && parsedTestCases[0].testCases.length > 0) {
        const firstTC = parsedTestCases[0].testCases[0]
        setDebugInfo(`
📊 Current Data Details:
• Projects: ${parsedProjects.length}
• Test Cases: ${totalTestCases}

🔍 First Test Case Fields:
• ID: ${firstTC.id}
• Feature: ${firstTC.feature || firstTC.data?.feature || 'N/A'}
• Enhancement: ${firstTC.enhancement || firstTC.data?.enhancement || 'N/A'}
• Ticket: ${firstTC.ticketId || firstTC.data?.ticketId || 'N/A'}
• Project: ${firstTC.projectId || firstTC.data?.projectId || 'N/A'}
• Tags: ${firstTC.tags ? firstTC.tags.join(', ') : 'N/A'}
        `.trim())
      }
    } else {
      setStatus('idle')
      setMessage('📭 No demo data found. Click "Load Demo Data" to get started!')
      setDebugInfo('')
    }
  }

  const inspectLocalStorage = () => {
    const allKeys = Object.keys(localStorage)
    const relevantKeys = allKeys.filter(key => key.includes('testCase') || key.includes('project'))
    
    let debugOutput = `🔍 localStorage Inspection:\n`
    debugOutput += `• Total keys: ${allKeys.length}\n`
    debugOutput += `• Relevant keys: ${relevantKeys.length}\n\n`
    
    relevantKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        const parsed = JSON.parse(value || '{}')
        debugOutput += `📁 ${key}:\n`
        debugOutput += `   • Type: ${typeof parsed}\n`
        if (Array.isArray(parsed)) {
          debugOutput += `   • Length: ${parsed.length}\n`
          if (parsed.length > 0) {
            debugOutput += `   • First item keys: ${Object.keys(parsed[0]).join(', ')}\n`
          }
        } else if (typeof parsed === 'object') {
          debugOutput += `   • Keys: ${Object.keys(parsed).join(', ')}\n`
        }
        debugOutput += '\n'
      } catch (e) {
        debugOutput += `📁 ${key}: Error parsing - ${e}\n\n`
      }
    })
    
    setDebugInfo(debugOutput)
    setMessage('🔍 localStorage inspection completed. Check debug info below.')
  }

  const checkCurrentData = () => {
    try {
      const testCases = localStorage.getItem('testCaseWriter_generatedTestCases')
      const projects = localStorage.getItem('testCaseWriter_projects')
      
      if (testCases) {
        const parsed = JSON.parse(testCases)
        console.log('🔍 Current localStorage test cases:', parsed)
        
        // Count total test cases across all sessions
        let totalCount = 0
        if (Array.isArray(parsed)) {
          parsed.forEach((session: any, index: number) => {
            console.log(`📁 Session ${index + 1}:`, {
              id: session.id,
              name: session.name || session.documentNames,
              testCaseCount: session.testCases?.length || 0,
              totalCount: session.totalCount,
              firstTestCase: session.testCases?.[0] ? {
                id: session.testCases[0].id,
                title: session.testCases[0].data?.title || session.testCases[0].testCase,
                testStepsCount: session.testCases[0].testSteps?.length || 0
              } : null
            })
            totalCount += session.testCases?.length || 0
          })
        }
        
        setDebugInfo(`📊 Total test cases found: ${totalCount}\n\n${JSON.stringify(parsed, null, 2)}`)
        setStatus('success')
        setMessage(`Found ${totalCount} test cases in localStorage`)
      } else {
        setDebugInfo('No test cases found in localStorage')
        setStatus('idle')
        setMessage('No test cases found')
      }
      
      if (projects) {
        const parsedProjects = JSON.parse(projects)
        console.log('🔍 Current localStorage projects:', parsedProjects)
      }
    } catch (error) {
      console.error('Error checking current data:', error)
      setDebugInfo(`Error: ${error}`)
      setStatus('error')
      setMessage('Error checking data')
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-blue-900 flex items-center gap-2">
          <Download className="h-5 w-5" />
          Demo Data Loader
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={checkDemoData}
            disabled={loading}
          >
            Check Data
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={inspectLocalStorage}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-1" />
            Inspect
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={clearDemoData}
            disabled={loading}
          >
            Clear Data
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Load demo data to test the enhanced filtering system with projects, enhancements, tickets, and test cases.
      </p>
      
      <div className="flex items-center gap-3">
        <Button
          onClick={loadDemoData}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Load Demo Data
            </>
          )}
        </Button>
        
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Success!</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Error!</span>
          </div>
        )}
      </div>
      
      {message && (
        <div className={`mt-3 p-3 rounded-md text-sm ${
          status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          status === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          status === 'loading' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
          'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {message}
        </div>
      )}
      
      {debugInfo && (
        <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-800 mb-2">Debug Information:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-xs text-blue-600">
        <strong>What gets loaded:</strong> 4 Projects, 5 Test Cases with enhanced fields (Feature, Enhancement, Ticket, Tags)
      </div>
    </div>
  )
}
