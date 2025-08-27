'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Globe, 
  Key, 
  Code, 
  Zap, 
  Shield, 
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function WidgetAPIDocumentation() {
  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Widget API' }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Widget API Documentation"
    >
      <div className="space-y-8 max-w-4xl">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
                              <span>Test Case Manager Widget API</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Embed Test Case Generation</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    The Test Case Manager Widget API allows other AI platforms and applications to integrate 
                    test case generation capabilities directly into their interface.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">✨ Key Features</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• AI-powered test case generation</li>
                  <li>• Document upload and analysis</li>
                  <li>• Multiple export formats</li>
                  <li>• Real-time generation status</li>
                  <li>• Customizable UI themes</li>
                </ul>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Use Cases</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ChatGPT plugins</li>
                  <li>• Claude integrations</li>
                  <li>• Notion widgets</li>
                  <li>• Custom AI platforms</li>
                  <li>• No-code tools</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Getting Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900">Get Your API Key</h4>
                  <p className="text-sm text-gray-600">Generate a widget API key from your settings page.</p>
                  <div className="bg-gray-100 rounded-lg p-2 mt-2 font-mono text-sm">
                    tcw_widget_sk-your_api_key_here
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900">Add Authentication</h4>
                  <p className="text-sm text-gray-600">Include your API key in the Authorization header.</p>
                  <div className="bg-gray-100 rounded-lg p-2 mt-2 font-mono text-sm">
                    Authorization: Bearer tcw_widget_sk-your_api_key_here
                  </div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900">Make API Calls</h4>
                  <p className="text-sm text-gray-600">Use our endpoints to generate and manage test cases.</p>
                  <div className="bg-gray-100 rounded-lg p-2 mt-2 font-mono text-sm">
                    POST https://api.testcasemanager.com/v1/widget/generate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>API Endpoints</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generate Test Cases */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">POST</span>
                  <span className="font-mono text-gray-800">/v1/widget/generate</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('POST /v1/widget/generate')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Generate test cases from uploaded documents or text input.</p>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Request Body</h5>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "input": {
    "text": "User login requirements...",
    "documents": ["file1.pdf", "file2.docx"]
  },
  "options": {
    "count": 10,
    "priority": "high",
    "format": "detailed",
    "theme": "light"
  }
}`}
                  </pre>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Response</h5>
                  <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "status": "completed",
    "testCases": [
      {
        "id": "tc_001",
        "title": "User Login - Valid Credentials",
        "description": "Test successful login with valid credentials",
        "steps": [
          {
            "step": 1,
            "action": "Navigate to login page",
            "expected": "Login form is displayed"
          }
        ]
      }
    ],
    "metadata": {
      "generated_at": "2024-01-15T10:30:00Z",
      "count": 10,
      "processing_time": "2.3s"
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Get Generation Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">GET</span>
                  <span className="font-mono text-gray-800">/v1/widget/status/{`{id}`}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('GET /v1/widget/status/{id}')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Check the status of test case generation.</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Response</h5>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "status": "processing", // "queued", "processing", "completed", "failed"
    "progress": 75,
    "estimated_time": "30s",
    "message": "Analyzing documents..."
  }
}`}
                </pre>
              </div>
            </div>

            {/* Export Test Cases */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">POST</span>
                  <span className="font-mono text-gray-800">/v1/widget/export</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyToClipboard('POST /v1/widget/export')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">Export generated test cases in various formats.</p>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Request Body</h5>
                <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`{
  "generation_id": "gen_abc123",
  "format": "xlsx", // "csv", "xlsx", "json", "pdf"
  "options": {
    "include_metadata": true,
    "template": "standard"
  }
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Widget Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Theme Options</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Light Theme</span>
                    <code className="text-gray-800">"light"</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dark Theme</span>
                    <code className="text-gray-800">"dark"</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auto (System)</span>
                    <code className="text-gray-800">"auto"</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custom Branding</span>
                    <code className="text-gray-800">"custom"</code>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Generation Options</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Test Case Count</span>
                    <code className="text-gray-800">5-50</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority Level</span>
                    <code className="text-gray-800">"low" | "medium" | "high"</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detail Level</span>
                    <code className="text-gray-800">"basic" | "detailed"</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Include Steps</span>
                    <code className="text-gray-800">true | false</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Error Handling</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">401</span>
                  <span className="font-medium text-red-900">Unauthorized</span>
                </div>
                <p className="text-sm text-red-700">Invalid or missing API key. Check your authorization header.</p>
              </div>
              
              <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono">429</span>
                  <span className="font-medium text-yellow-900">Rate Limited</span>
                </div>
                <p className="text-sm text-yellow-700">Too many requests. Check your rate limits in settings.</p>
              </div>
              
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">500</span>
                  <span className="font-medium text-red-900">Server Error</span>
                </div>
                <p className="text-sm text-red-700">Internal server error. Try again later or contact support.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Integration Examples</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* JavaScript Example */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">JavaScript (ChatGPT Plugin)</h4>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`// ChatGPT Plugin Integration
async function generateTestCases(requirements) {
  const response = await fetch('https://api.testcasemanager.com/v1/widget/generate', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer tcw_widget_sk-your_key_here',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: {
        text: requirements
      },
      options: {
        count: 10,
        format: 'detailed',
        theme: 'light'
      }
    })
  });
  
  const data = await response.json();
  return data.data.testCases;
}`}
              </pre>
            </div>

            {/* Python Example */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Python (Claude Integration)</h4>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
{`# Claude Tool Integration
import requests

def generate_test_cases_tool(requirements_text):
    """Generate test cases from requirements text"""
    
    url = "https://api.testcasemanager.com/v1/widget/generate"
    headers = {
        "Authorization": "Bearer tcw_widget_sk-your_key_here",
        "Content-Type": "application/json"
    }
    
    payload = {
        "input": {
            "text": requirements_text
        },
        "options": {
            "count": 15,
            "priority": "high",
            "format": "detailed"
        }
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        return data['data']['testCases']
    else:
        return f"Error: {response.status_code} - {response.text}"`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Support & Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">🔧 Technical Support</h4>
                <p className="text-sm text-gray-600 mb-3">Get help with integration issues</p>
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📚 More Examples</h4>
                <p className="text-sm text-gray-600 mb-3">View additional integration examples</p>
                <Button variant="secondary" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub Repository
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Security Best Practices</h4>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Never expose your API key in client-side code</li>
                    <li>• Use environment variables to store API keys</li>
                    <li>• Implement proper rate limiting in your application</li>
                    <li>• Regularly rotate your API keys</li>
                    <li>• Monitor API usage and set up alerts for unusual activity</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}