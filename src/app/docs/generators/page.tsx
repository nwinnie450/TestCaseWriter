'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import {
  Zap,
  Bot,
  Database,
  ShoppingCart,
  Search,
  LogIn,
  CreditCard,
  Shield,
  ArrowRight,
  CheckCircle,
  Copy,
  Download
} from 'lucide-react'

export default function TestCaseGenerators() {
  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Test Case Generators' }
  ]

  const generators = [
    {
      name: 'Login (Basic)',
      icon: LogIn,
      description: 'Happy path + invalid + locked account scenarios',
      useFor: 'Web app sign-in pages',
      features: ['Valid/Invalid/Locked flows', 'Steps or Gherkin output', 'Preconditions supported'],
      color: 'green'
    },
    {
      name: 'Sign-up (Email)',
      icon: Bot,
      description: 'Create account, invalid email, duplicate email',
      useFor: 'Email/password registration',
      features: ['Valid + invalid paths', 'Field validations', 'Email edge cases'],
      color: 'blue'
    },
    {
      name: 'Search (Basic)',
      icon: Search,
      description: 'Search functionality with various inputs and filters',
      useFor: 'Search boxes and filters',
      features: ['Valid/empty/special char searches', 'Result validation', 'Filter combinations'],
      color: 'purple'
    },
    {
      name: 'API CRUD Operations',
      icon: Database,
      description: 'Create, Read, Update, Delete API endpoint testing',
      useFor: 'REST API endpoints',
      features: ['CRUD operations', 'Status code validation', 'Error handling'],
      color: 'yellow'
    },
    {
      name: 'Shopping Cart',
      icon: ShoppingCart,
      description: 'E-commerce cart functionality with add/remove/update',
      useFor: 'E-commerce shopping flows',
      features: ['Add/remove items', 'Quantity updates', 'Cart persistence'],
      color: 'orange'
    },
    {
      name: 'Payment Processing',
      icon: CreditCard,
      description: 'Complex payment flow with multiple payment methods',
      useFor: 'Checkout and payment systems',
      features: ['Credit card flows', 'Declined card handling', 'Payment validation'],
      color: 'red'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'border-green-200 bg-green-50 text-green-700',
      blue: 'border-blue-200 bg-blue-50 text-blue-700',
      purple: 'border-purple-200 bg-purple-50 text-purple-700',
      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700',
      orange: 'border-orange-200 bg-orange-50 text-orange-700',
      red: 'border-red-200 bg-red-50 text-red-700'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <Layout
      breadcrumbs={breadcrumbs}
      title="Test Case Generators Guide"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Test Case Generators</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                🚀 <strong>Test Case Generators</strong> are pre-built templates that automatically create comprehensive test cases for common scenarios. Instead of writing test cases from scratch, you fill in basic details and get complete test suites instantly.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">1️⃣</div>
                <h3 className="font-semibold mb-1">Choose Generator</h3>
                <p className="text-sm text-gray-600">Pick from Simple, Advanced, or your custom generators</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">2️⃣</div>
                <h3 className="font-semibold mb-1">Fill Basics</h3>
                <p className="text-sm text-gray-600">Enter feature name, preconditions, and preferences</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">3️⃣</div>
                <h3 className="font-semibold mb-1">Preview Results</h3>
                <p className="text-sm text-gray-600">Review generated test cases before saving</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">4️⃣</div>
                <h3 className="font-semibold mb-1">Export or Run</h3>
                <p className="text-sm text-gray-600">Download CSV or create test run immediately</p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/simple-templates">
                <Button variant="primary">
                  <Zap className="h-4 w-4 mr-2" />
                  Try Generators Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Available Generators */}
        <Card>
          <CardHeader>
            <CardTitle>📚 Available Generators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generators.map((generator, index) => {
                const Icon = generator.icon
                return (
                  <div key={index} className={`border-2 rounded-lg p-4 ${getColorClasses(generator.color)}`}>
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="h-6 w-6" />
                      <h3 className="font-semibold">{generator.name}</h3>
                    </div>

                    <p className="text-sm mb-2">{generator.description}</p>
                    <p className="text-xs font-medium mb-3">Use for: {generator.useFor}</p>

                    <div className="space-y-1">
                      {generator.features.map((feature, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs">
                          <CheckCircle className="h-3 w-3" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Usage */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Step-by-Step Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Access Generators</h3>
              <p className="text-gray-600 mb-3">Navigate to the Generators section to see available options.</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm">Go to <strong>Generators</strong> in the main navigation (⚡ icon) or visit <code>/simple-templates</code></p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Choose Your Tab</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <h4 className="font-semibold text-green-800">Simple</h4>
                  <p className="text-xs text-green-600">Beginner-friendly generators for common scenarios</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <h4 className="font-semibold text-blue-800">Advanced</h4>
                  <p className="text-xs text-blue-600">Complex scenarios requiring detailed configuration</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <h4 className="font-semibold text-purple-800">Mine</h4>
                  <p className="text-xs text-purple-600">Your custom saved generators</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 3: Fill Generator Form</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Required Fields:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <strong>Feature/Module</strong>: What you're testing</li>
                      <li>• <strong>Output Style</strong>: Steps or Gherkin format</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Optional Fields:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Scope/URL for API testing</li>
                      <li>• Preconditions</li>
                      <li>• Priority, Component, Owner, Tags</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Step 4: Preview & Export</h3>
              <p className="text-gray-600 mb-3">Review the generated test cases and choose your next action.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <h4 className="font-semibold text-blue-800 flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    Add to Library (CSV)
                  </h4>
                  <p className="text-xs text-blue-600">Downloads CSV file that imports directly into your Library</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <Bot className="h-4 w-4 mr-1" />
                    Create Run Now
                  </h4>
                  <p className="text-xs text-green-600">Immediately creates a test run for execution</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Usage */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Example: Login Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your Input:</h4>
                <div className="bg-gray-100 p-4 rounded-lg space-y-2 text-sm">
                  <div><strong>Feature:</strong> User Login</div>
                  <div><strong>Scope:</strong> /login</div>
                  <div><strong>Preconditions:</strong> User account exists</div>
                  <div><strong>Output Style:</strong> Steps</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Generated Test Cases:</h4>
                <div className="bg-green-100 p-4 rounded-lg text-sm space-y-2">
                  <div><strong>1. User Login: valid user can sign in</strong></div>
                  <div><strong>2. User Login: invalid password shows error</strong></div>
                  <div><strong>3. User Login: locked account is blocked</strong></div>
                  <div className="text-xs text-green-700 mt-2">Each with detailed steps and expected results!</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle>✨ Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">✅ Do:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Be specific with feature names (e.g., "User Registration" not "Register")</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Include relevant preconditions for better context</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Use Scope/URL field for API endpoint testing</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Preview test cases before exporting</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">💡 Tips:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Start with Simple generators for quick results</li>
                  <li>• Use tags to categorize test cases (smoke, regression, etc.)</li>
                  <li>• Choose Steps format for manual testing, Gherkin for automation</li>
                  <li>• CSV exports work seamlessly with Import templates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Integration with Your Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold mb-1">Library Integration</h3>
                <p className="text-sm text-gray-600">Generated CSV files import directly into your Test Case Library</p>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Bot className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold mb-1">Execution Runs</h3>
                <p className="text-sm text-gray-600">"Create Run now" instantly sets up test execution</p>
              </div>

              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold mb-1">Template Compatibility</h3>
                <p className="text-sm text-gray-600">Works with existing Import/Export templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Started */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Ready to Start?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">Try Test Case Generators now and create comprehensive test suites in minutes!</p>
              <div className="flex justify-center space-x-3">
                <Link href="/simple-templates">
                  <Button variant="primary">
                    <Zap className="h-4 w-4 mr-2" />
                    Start with Generators
                  </Button>
                </Link>
                <Link href="/docs/getting-started">
                  <Button variant="secondary">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Full Getting Started Guide
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