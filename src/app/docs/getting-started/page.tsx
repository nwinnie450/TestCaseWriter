'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Zap, 
  Key, 
  FileText, 
  Bot, 
  CheckCircle,
  ArrowRight,
  Copy,
  Play
} from 'lucide-react'

export default function GettingStarted() {
  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Getting Started' }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Getting Started Guide"
    >
      <div className="space-y-8 max-w-4xl">
        {/* Welcome */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
                              <span>Welcome to Test Case Manager</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                🎉 <strong>Welcome!</strong> This guide will help you set up your first AI-powered test case generation project in under 5 minutes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <div className="space-y-6">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span>Configure Your AI Provider</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                First, you'll need to configure an AI provider (OpenAI, Claude, etc.) to generate test cases.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📍 Steps:</h4>
                <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                  <li>Go to <strong>Settings → AI Providers</strong></li>
                  <li>Select your preferred AI provider (OpenAI recommended)</li>
                  <li>Enter your API key</li>
                  <li>Test the connection</li>
                  <li>Save your configuration</li>
                </ol>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/settings">
                  <Button variant="primary">
                    <Key className="h-4 w-4 mr-2" />
                    Configure AI Provider
                  </Button>
                </Link>
                <Link href="/docs/authentication">
                  <Button variant="secondary">
                    Learn about API Keys
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span>Create Your First Project</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Organize your test cases by creating a project. This helps you manage different applications or features.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">📍 Steps:</h4>
                <ol className="list-decimal list-inside text-green-800 space-y-1 text-sm">
                  <li>Go to <strong>Projects</strong> in the main navigation</li>
                  <li>Click <strong>"Create New Project"</strong></li>
                  <li>Enter a project name (e.g., "E-commerce Website")</li>
                  <li>Add a description of what you're testing</li>
                  <li>Save your project</li>
                </ol>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/projects">
                  <Button variant="primary">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span>Generate Your First Test Cases</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Now the fun part! Upload your requirements document or write a description to generate AI-powered test cases.
              </p>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">📍 Steps:</h4>
                <ol className="list-decimal list-inside text-purple-800 space-y-1 text-sm">
                  <li>Go to <strong>Generate</strong> in the main navigation</li>
                  <li>Select your project</li>
                  <li>Upload a requirements document (PDF, Word, etc.) OR write a description</li>
                  <li>Choose generation options (number of test cases, priority level)</li>
                  <li>Click <strong>"Generate Test Cases"</strong></li>
                  <li>Review and save the generated test cases</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  💡 <strong>Pro Tip:</strong> The more detailed your requirements, the better your test cases will be!
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/generate">
                  <Button variant="primary">
                    <Bot className="h-4 w-4 mr-2" />
                    Generate Test Cases
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <span>Review and Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Review your generated test cases, make any necessary edits, and export them to your preferred format.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">📍 Steps:</h4>
                <ol className="list-decimal list-inside text-orange-800 space-y-1 text-sm">
                  <li>Go to <strong>Library</strong> to view all your test cases</li>
                  <li>Review and edit test cases as needed</li>
                  <li>Select test cases you want to export</li>
                  <li>Go to <strong>Export</strong></li>
                  <li>Choose your format (Excel, CSV, PDF, Jira, etc.)</li>
                  <li>Download or send to your test management tool</li>
                </ol>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/library">
                  <Button variant="primary">
                    <FileText className="h-4 w-4 mr-2" />
                    View Test Cases
                  </Button>
                </Link>
                <Link href="/export">
                  <Button variant="secondary">
                    Export Test Cases
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Example */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Example</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Here's what you might input and what you'll get:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">📝 Your Input:</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  "Test the user login functionality. Users should be able to log in with email and password, stay logged in, and see appropriate error messages for invalid credentials."
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🤖 AI Generated:</h4>
                <div className="bg-green-100 p-3 rounded-lg text-sm">
                  <ul className="space-y-1">
                    <li>• Valid login with correct credentials</li>
                    <li>• Invalid email format handling</li>
                    <li>• Incorrect password error message</li>
                    <li>• Remember me functionality</li>
                    <li>• Session persistence testing</li>
                    <li>• Account lockout after failed attempts</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📚 Learn More</h4>
                <div className="space-y-2">
                  <Link href="/docs/widget-api">
                    <Button variant="ghost" size="sm" className="justify-start w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Widget API for Integrations
                    </Button>
                  </Link>
                  <Link href="/docs/api">
                    <Button variant="ghost" size="sm" className="justify-start w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      REST API Documentation
                    </Button>
                  </Link>
                  <Link href="/templates">
                    <Button variant="ghost" size="sm" className="justify-start w-full">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Explore Templates
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Advanced Features</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Custom test case templates</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Bulk export to multiple formats</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>API integration with JIRA/Azure</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Team collaboration features</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Success Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">AI Provider configured and tested</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">First project created</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">Test cases generated from requirements</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">Test cases reviewed and exported</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                🎉 <strong>Congratulations!</strong> Once you complete these steps, you'll be ready to scale your test case generation and boost your QA productivity!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}