'use client'

import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Globe, 
  Key, 
  Code, 
  Bot, 
  FileText,
  ArrowRight,
  Book,
  Zap,
  History
} from 'lucide-react'

export default function DocumentationIndex() {
  const breadcrumbs = [
    { label: 'Documentation' }
  ]

  const docs = [
    {
      title: 'Getting Started Guide',
      description: 'Step-by-step guide to set up your first test case generation project with AI and generators',
      href: '/docs/getting-started',
      icon: Zap,
      color: 'green',
      tags: ['Beginner', 'Setup', 'Tutorial', 'Generators']
    },
    {
      title: 'Test Case Generators Guide',
      description: 'Complete guide to using pre-built generators for Login, API, E-commerce, and custom scenarios',
      href: '/docs/generators',
      icon: Bot,
      color: 'purple',
      tags: ['Generators', 'Templates', 'Quick Start', 'Automation']
    },
    {
      title: 'Test Case Versioning Guide',
      description: 'Complete guide to the versioning system, change requests, and audit trail management',
      href: '/docs/versioning',
      icon: History,
      color: 'blue',
      tags: ['Versioning', 'Change Requests', 'Audit Trail', 'Quality Control']
    },
    {
      title: 'Widget API Documentation',
      description: 'Complete guide for integrating Test Case Manager as a widget or plugin in other AI platforms',
      href: '/docs/widget-api',
      icon: Code,
      color: 'purple',
      tags: ['ChatGPT', 'Claude', 'Notion', 'Plugins']
    },
    {
      title: 'REST API Documentation',
      description: 'Full API reference for building applications and services that interact with Test Case Manager',
      href: '/docs/api',
      icon: Globe,
      color: 'blue',
      tags: ['REST API', 'Mobile Apps', 'Web Services']
    },
    {
      title: 'Authentication Guide',
      description: 'Learn how to authenticate and manage API keys for different access levels',
      href: '/docs/authentication',
      icon: Key,
      color: 'yellow',
      tags: ['Security', 'API Keys', 'OAuth']
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
      blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
      yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Documentation"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary-100 rounded-full">
              <Book className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Test Case Manager Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to integrate, extend, and build with Test Case Manager
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Start</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold mb-1">1. Try Generators</h3>
                <p className="text-sm text-gray-600">Start with pre-built test case generators</p>
                <Link href="/simple-templates">
                  <Button size="sm" className="mt-2">Try Generators</Button>
                </Link>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold mb-1">2. AI Generation</h3>
                <p className="text-sm text-gray-600">Upload docs for AI-powered generation</p>
                <Link href="/generate">
                  <Button size="sm" className="mt-2">Generate</Button>
                </Link>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">3. Manage Library</h3>
                <p className="text-sm text-gray-600">Organize and export test cases</p>
                <Link href="/library">
                  <Button size="sm" className="mt-2">View Library</Button>
                </Link>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🔧</div>
                <h3 className="font-semibold mb-1">4. Advanced Setup</h3>
                <p className="text-sm text-gray-600">API integration and customization</p>
                <Link href="/docs/api">
                  <Button size="sm" className="mt-2">API Docs</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docs.map((doc) => {
            const Icon = doc.icon
            return (
              <Card key={doc.href} className={`border-2 transition-all hover:shadow-lg ${getColorClasses(doc.color)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Icon className="h-6 w-6" />
                    <span>{doc.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{doc.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {doc.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="pt-2">
                    <Link href={doc.href}>
                      <Button variant="ghost" size="sm" className="group">
                        Read Documentation
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🔒</span>
              <span>Security & Best Practices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-semibold mb-1">API Key Security</h3>
                <p className="text-sm text-gray-600 mb-3">Learn how to securely handle API keys and sensitive information</p>
                <Link href="/SECURITY_GUIDE.md">
                  <Button variant="secondary" size="sm">
                    View Security Guide
                  </Button>
                </Link>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">🛡️</div>
                <h3 className="font-semibold mb-1">Best Practices</h3>
                <p className="text-sm text-gray-600 mb-3">Security guidelines and development best practices</p>
                <Button variant="secondary" size="sm">
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💬</span>
              <span>Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">📧</div>
                <h3 className="font-semibold mb-1">Email Support</h3>
                <p className="text-sm text-gray-600 mb-3">Get help from our team</p>
                <Button variant="secondary" size="sm">
                  Contact Support
                </Button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-gray-600 mb-3">Join our Discord community</p>
                <Button variant="secondary" size="sm">
                  Join Discord
                </Button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">🐛</div>
                <h3 className="font-semibold mb-1">Bug Reports</h3>
                <p className="text-sm text-gray-600 mb-3">Report issues on GitHub</p>
                <Button variant="secondary" size="sm">
                  Report Issue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>API Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-green-600 font-semibold">✅ Operational</div>
                <div className="text-sm text-gray-600">Widget API</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 font-semibold">✅ Operational</div>
                <div className="text-sm text-gray-600">REST API</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 font-semibold">✅ Operational</div>
                <div className="text-sm text-gray-600">AI Generation</div>
              </div>
              <div className="text-center">
                <div className="text-green-600 font-semibold">✅ Operational</div>
                <div className="text-sm text-gray-600">Export Services</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}