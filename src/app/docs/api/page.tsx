'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Globe, 
  Key, 
  Code, 
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function APIDocumentation() {
  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'REST API' }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="REST API Documentation"
    >
      <div className="space-y-8 max-w-4xl">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
                              <span>Test Case Manager REST API</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Full System API Access</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete REST API for building applications that need full access to Test Case Manager functionality.
                    Perfect for mobile apps, web applications, and backend services.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Authentication</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Base URL</h4>
              <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                                        <span>https://api.testcasemanager.com/v1</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('https://api.testcasemanager.com/v1')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Authorization Header</h4>
              <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                <span>Authorization: Bearer tcw_prod_your_api_key_here</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('Authorization: Bearer tcw_prod_your_api_key_here')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Replace <code>tcw_prod_your_api_key_here</code> with your actual API key from Settings → API Management
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Core Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Core Endpoints</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Projects */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
                  <span className="font-mono text-gray-800">/projects</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('GET /projects')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">List all projects for the authenticated user</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Response</h5>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "id": "proj_123",
      "name": "E-commerce Testing",
      "description": "Test cases for online store",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T15:45:00Z",
      "test_cases_count": 45,
      "status": "active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 12
  }
}`}
                </pre>
              </div>
            </div>

            {/* Test Cases */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
                  <span className="font-mono text-gray-800">/test-cases</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('GET /test-cases')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">List test cases with optional filtering</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Query Parameters</h5>
                <div className="bg-gray-50 p-3 rounded-lg text-sm mb-3">
                  <div className="space-y-1">
                    <div><code>project_id</code> - Filter by project ID</div>
                    <div><code>status</code> - Filter by status (active, draft, archived)</div>
                    <div><code>priority</code> - Filter by priority (low, medium, high)</div>
                    <div><code>page</code> - Page number (default: 1)</div>
                    <div><code>limit</code> - Items per page (default: 25, max: 100)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Test Case */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">POST</span>
                  <span className="font-mono text-gray-800">/test-cases</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('POST /test-cases')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Create a new test case</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Request Body</h5>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "project_id": "proj_123",
  "title": "User Login Test",
  "description": "Test user authentication flow",
  "priority": "high",
  "status": "active",
  "steps": [
    {
      "step_number": 1,
      "action": "Navigate to login page",
      "expected_result": "Login form is displayed",
      "test_data": "Valid user credentials"
    }
  ],
  "tags": ["authentication", "login", "security"]
}`}
                </pre>
              </div>
            </div>

            {/* Generate Test Cases */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">POST</span>
                  <span className="font-mono text-gray-800">/generate</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('POST /generate')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Generate test cases using AI from uploaded documents or text</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Request Body</h5>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "project_id": "proj_123",
  "input": {
    "text": "User requirements for login system...",
    "documents": ["requirements.pdf", "user_stories.docx"]
  },
  "options": {
    "count": 10,
    "priority": "medium",
    "include_edge_cases": true,
    "test_types": ["functional", "security", "usability"]
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Response Status Codes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <span className="font-mono text-green-800 font-bold">200 OK</span>
                  <p className="text-sm text-green-700">Request successful</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <span className="font-mono text-blue-800 font-bold">201 Created</span>
                  <p className="text-sm text-blue-700">Resource created successfully</p>
                </div>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <span className="font-mono text-red-800 font-bold">400 Bad Request</span>
                  <p className="text-sm text-red-700">Invalid request data</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <span className="font-mono text-red-800 font-bold">401 Unauthorized</span>
                  <p className="text-sm text-red-700">Invalid or missing API key</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <span className="font-mono text-yellow-800 font-bold">429 Rate Limited</span>
                  <p className="text-sm text-yellow-700">Too many requests</p>
                </div>
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDKs and Examples */}
        <Card>
          <CardHeader>
            <CardTitle>SDKs & Code Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🔗 Official SDKs</h4>
                <div className="space-y-2 text-sm">
                  <div>JavaScript/Node.js SDK</div>
                  <div>Python SDK</div>
                  <div>PHP SDK</div>
                  <div>Ruby SDK</div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Globe className="h-4 w-4 mr-2" />
                  View SDKs
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📋 Code Examples</h4>
                <div className="space-y-2 text-sm">
                  <div>React Integration</div>
                  <div>Vue.js Integration</div>
                  <div>Mobile App Examples</div>
                  <div>Webhook Handlers</div>
                </div>
                <Button variant="secondary" size="sm" className="mt-3">
                  <Code className="h-4 w-4 mr-2" />
                  View Examples
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}