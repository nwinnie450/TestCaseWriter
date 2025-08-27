'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Key, 
  Shield, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Lock,
  Globe,
  Bot
} from 'lucide-react'

export default function AuthenticationGuide() {
  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Authentication' }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Authentication Guide"
    >
      <div className="space-y-8 max-w-4xl">
        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>API Authentication Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Test Case Manager uses <strong>API key authentication</strong> to secure access to your data and services. 
                We provide different types of API keys for different use cases.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">External API Keys</h4>
                </div>
                <p className="text-sm text-gray-600">For your apps and services that need full system access</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Widget API Keys</h4>
                </div>
                <p className="text-sm text-gray-600">For other platforms to embed Test Case Manager features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key Types */}
        <Card>
          <CardHeader>
            <CardTitle>🔑 API Key Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* External API Keys */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">External API Keys</h4>
              </div>
              
              <div className="space-y-3 text-sm text-blue-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Format:</strong> <code>tcw_prod_*</code> or <code>tcw_dev_*</code></p>
                    <p><strong>Purpose:</strong> Full system access for your applications</p>
                    <p><strong>Permissions:</strong> CRUD operations, user management, admin functions</p>
                  </div>
                  <div>
                    <p><strong>Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Mobile applications</li>
                      <li>Web dashboards</li>
                      <li>CI/CD pipelines</li>
                      <li>Backend services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Widget API Keys */}
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center space-x-2 mb-3">
                <Bot className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Widget API Keys</h4>
              </div>
              
              <div className="space-y-3 text-sm text-purple-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Format:</strong> <code>tcw_widget_sk-*</code></p>
                    <p><strong>Purpose:</strong> Limited access for widget embedding</p>
                    <p><strong>Permissions:</strong> Generate test cases, export, read-only access</p>
                  </div>
                  <div>
                    <p><strong>Use Cases:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>ChatGPT plugins</li>
                      <li>Claude tool integrations</li>
                      <li>Notion widgets</li>
                      <li>Custom AI assistants</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Getting Your API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Step-by-Step:</h4>
              <ol className="list-decimal list-inside text-green-800 space-y-1 text-sm">
                <li>Navigate to <strong>Settings → API Management</strong></li>
                <li>Choose the appropriate section (External API or Widget Integration)</li>
                <li>Click <strong>"Generate API Key"</strong> or <strong>"Generate Widget Key"</strong></li>
                <li>Fill in the key details (name, access level, expiration, etc.)</li>
                <li>Copy the generated key immediately (it won't be shown again!)</li>
                <li>Store the key securely in your application</li>
              </ol>
            </div>
            
            <div className="flex space-x-3">
              <Link href="/settings">
                <Button variant="primary">
                  <Key className="h-4 w-4 mr-2" />
                  Manage API Keys
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Using API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Using API Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* External API Example */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">External API Authentication</h4>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">HTTP Header</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard('Authorization: Bearer tcw_prod_your_api_key_here')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm">
{`Authorization: Bearer tcw_prod_your_api_key_here`}
                </pre>
              </div>
              
              <div className="mt-3">
                <h5 className="font-medium text-gray-900 mb-2">JavaScript Example</h5>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Fetch Request</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(`const response = await fetch('https://api.testcasemanager.com/v1/test-cases', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer tcw_prod_your_api_key_here',
    'Content-Type': 'application/json'
  }
})`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`const response = await fetch('https://api.testcasemanager.com/v1/test-cases', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer tcw_prod_your_api_key_here',
    'Content-Type': 'application/json'
  }
})`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Widget API Example */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Widget API Authentication</h4>
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Widget Generation Request</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(`const response = await fetch('https://api.testcasemanager.com/v1/widget/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tcw_widget_sk-your_widget_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: { text: "User login requirements..." },
    options: { count: 5, priority: "high" }
  })
})`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto">
{`const response = await fetch('https://api.testcasemanager.com/v1/widget/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tcw_widget_sk-your_widget_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    input: { text: "User login requirements..." },
    options: { count: 5, priority: "high" }
  })
})`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Best Practices</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-red-800 text-sm">
                  <p className="font-semibold mb-1">Never expose API keys in client-side code!</p>
                  <p>API keys should only be used in server-side applications or secure environments.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-semibold text-green-800">✅ Do</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Store keys in environment variables</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Use different keys for development and production</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Regularly rotate your API keys</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Monitor API usage and set up alerts</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Use IP restrictions when possible</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-semibold text-red-800">❌ Don't</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Commit keys to version control</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Include keys in client-side JavaScript</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Share keys via email or chat</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Use the same key across multiple applications</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>Ignore rate limits and usage monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">The recommended way to store API keys is using environment variables:</p>
            
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">.env file</h5>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Environment Variables</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(`# Test Case Manager API Keys
TCW_EXTERNAL_API_KEY=tcw_prod_your_api_key_here
TCW_WIDGET_API_KEY=tcw_widget_sk-your_widget_key_here

# Environment
NODE_ENV=production`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-sm">
{`# Test Case Manager API Keys
TCW_EXTERNAL_API_KEY=tcw_prod_your_api_key_here
TCW_WIDGET_API_KEY=tcw_widget_sk-your_widget_key_here

# Environment
NODE_ENV=production`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Using in Node.js</h5>
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">JavaScript Code</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(`require('dotenv').config()

const apiKey = process.env.TCW_EXTERNAL_API_KEY

const response = await fetch('https://api.testcasemanager.com/v1/test-cases', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
{`require('dotenv').config()

const apiKey = process.env.TCW_EXTERNAL_API_KEY

const response = await fetch('https://api.testcasemanager.com/v1/test-cases', {
  headers: {
    'Authorization': \`Bearer \${apiKey}\`,
    'Content-Type': 'application/json'
  }
})`}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Common Authentication Errors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">401</span>
                  <span className="font-medium text-red-900">Unauthorized</span>
                </div>
                <p className="text-sm text-red-700 mb-2">Missing or invalid API key</p>
                <p className="text-xs text-red-600">Check that your Authorization header is correctly formatted and the API key is valid.</p>
              </div>
              
              <div className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-mono">403</span>
                  <span className="font-medium text-yellow-900">Forbidden</span>
                </div>
                <p className="text-sm text-yellow-700 mb-2">API key doesn't have required permissions</p>
                <p className="text-xs text-yellow-600">Widget keys can't access admin endpoints. Use an External API key for full access.</p>
              </div>
              
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">429</span>
                  <span className="font-medium text-blue-900">Rate Limited</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">Too many requests</p>
                <p className="text-xs text-blue-600">Implement exponential backoff and respect rate limits. Consider upgrading your plan.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Need Help */}
        <Card>
          <CardHeader>
            <CardTitle>💬 Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">📧</div>
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-3">Get help with API authentication</p>
                <Button variant="secondary" size="sm">
                  Contact Support
                </Button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-semibold mb-1">More Documentation</h3>
                <p className="text-sm text-gray-600 mb-3">Explore our API guides</p>
                <Link href="/docs">
                  <Button variant="secondary" size="sm">
                    Browse Docs
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}