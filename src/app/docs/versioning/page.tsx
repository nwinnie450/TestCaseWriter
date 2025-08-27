'use client'

import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import Link from 'next/link'
import { 
  History, 
  GitPullRequest, 
  Settings, 
  BookOpen,
  HelpCircle,
  CheckCircle,
  Info,
  ArrowRight
} from 'lucide-react'

export default function VersioningGuide() {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    { label: 'Versioning Guide' }
  ]

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const faqs = [
    {
      id: 'what-is-versioning',
      question: 'What is Test Case Versioning?',
      answer: 'Test Case Versioning is a system that automatically tracks all changes made to your test cases. Every time a test case is modified, a new version is created with a complete record of what changed, who made the changes, and when they were made.'
    },
    {
      id: 'why-use-versioning',
      question: 'Why should I use versioning?',
      answer: 'Versioning provides several key benefits: 1) **Audit Trail** - Complete history of all changes, 2) **Quality Control** - Review and approval process for changes, 3) **Rollback Capability** - Ability to revert to previous versions if needed, 4) **Team Collaboration** - Track who made what changes and when.'
    },
    {
      id: 'how-versions-created',
      question: 'How are versions created?',
      answer: 'Versions are created automatically when: 1) A test case is first created (Version 1), 2) Any field in a test case is modified, 3) A change request is approved and applied, 4) The status or priority of a test case is changed.'
    },
    {
      id: 'change-requests',
      question: 'What are Change Requests?',
      answer: 'Change Requests are proposals to modify existing test cases. They go through a review and approval process before being applied. This ensures quality control and prevents unauthorized changes.'
    },
    {
      id: 'approval-process',
      question: 'How does the approval process work?',
      answer: 'The approval process follows these steps: 1) **Submit** - User creates a change request, 2) **Review** - Assigned reviewer examines the proposed changes, 3) **Approve/Reject** - Reviewer approves or rejects with comments, 4) **Apply** - If approved, changes are applied and a new version is created.'
    }
  ]

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Test Case Versioning Guide"
    >
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Test Case Versioning Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Master the versioning system to track changes, maintain quality, and ensure complete audit trails for your test cases
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>What is Versioning?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Test Case Versioning is an automated system that creates a complete audit trail of all changes made to your test cases. Every modification creates a new version with detailed tracking.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Automatic version creation on changes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Complete change history and audit trail</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>User attribution and timestamp tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Request System</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Submit and manage change requests for test case modifications through a structured approval workflow.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Propose changes with detailed reasoning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Review and approval workflow</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Complete tracking of all test case versions with detailed change information and metadata.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Automatic version numbering</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Detailed changelog entries</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Request Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-blue-600">1</span>
                      </div>
                      <h4 className="text-sm font-medium">Submit</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-yellow-600">2</span>
                      </div>
                      <h4 className="text-sm font-medium">Review</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-green-600">3</span>
                      </div>
                      <h4 className="text-sm font-medium">Approve</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-purple-600">4</span>
                      </div>
                      <h4 className="text-sm font-medium">Apply</h4>
                    </div>
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-sm font-bold text-gray-600">5</span>
                      </div>
                      <h4 className="text-sm font-medium">Notify</h4>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{faq.question}</h4>
                          <div className={`transform transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-4 pb-4">
                          <div className="border-t border-gray-200 pt-4">
                            <p className="text-gray-600">{faq.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tooltip Verification Section */}
        <Card>
          <CardHeader>
            <CardTitle>Versioning Tooltips - Where to Verify</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                You can verify the versioning tooltips in these locations throughout the application:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📚 Test Case Library</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Version column info button</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Version History dropdown menu</span>
                    </div>
                  </div>
                  <Link href="/library">
                    <Button size="sm" className="mt-3">
                      Go to Library
                    </Button>
                  </Link>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Management Dashboard</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Statistics tooltips</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Settings toggles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Quick action buttons</span>
                    </div>
                  </div>
                  <Link href="/management">
                    <Button size="sm" className="mt-3">
                      Go to Management
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔍 How to Test Tooltips:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Navigate to the specified pages</li>
                  <li>Hover over elements with tooltips (look for cursor changes)</li>
                  <li>Wait for tooltip text to appear</li>
                  <li>Verify the tooltip content matches the descriptions above</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 