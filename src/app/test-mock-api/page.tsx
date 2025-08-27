'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function TestMockAPI() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const testGetAPI = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/v1/mock-data')
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testPostAPI = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/v1/mock-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'populate' }),
      })
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mock Data API Test</h1>
          <p className="text-gray-600">Test the mock data API endpoints</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Test GET Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the GET /api/v1/mock-data endpoint
              </p>
              <Button 
                onClick={testGetAPI} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test GET API'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test POST Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test the POST /api/v1/mock-data endpoint with populate action
              </p>
              <Button 
                onClick={testPostAPI} 
                disabled={loading}
                className="w-full"
                variant="secondary"
              >
                {loading ? 'Testing...' : 'Test POST API'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h3 className="text-red-800 font-medium mb-2">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>API Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto max-h-96">
                <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <a 
            href="/library" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Library
          </a>
        </div>
      </div>
    </div>
  )
}
