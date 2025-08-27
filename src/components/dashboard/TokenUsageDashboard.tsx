'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTokenUsage } from '@/contexts/TokenUsageContext'
import { 
  Zap, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  FileText,
  Download,
  Trash2,
  AlertCircle
} from 'lucide-react'

export function TokenUsageDashboard() {
  const { usageHistory, stats, clearUsage } = useTokenUsage()
  const [showHistory, setShowHistory] = useState(false)

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'generate_test_cases': return 'Test Case Generation'
      case 'analyze_document': return 'Document Analysis'
      case 'export_processing': return 'Export Processing'
      default: return operation
    }
  }

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case 'openai': return 'OpenAI'
      case 'claude': return 'Claude'
      case 'gemini': return 'Gemini'
      case 'grok': return 'Grok'
      case 'azure': return 'Azure OpenAI'
      default: return providerId
    }
  }

  const exportUsageData = () => {
    const csvData = [
      ['Date', 'Operation', 'Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)', 'File Name', 'Test Cases'],
      ...usageHistory.map(usage => [
        usage.date.toISOString(),
        getOperationLabel(usage.operation),
        usage.model,
        usage.inputTokens,
        usage.outputTokens,
        usage.totalTokens,
        usage.cost.toFixed(6),
        usage.fileName || '',
        usage.testCasesGenerated || ''
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `token-usage-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalTokens)}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCost(stats.totalCost)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatCost(stats.thisMonth.cost)}</p>
                <p className="text-xs text-gray-500">{formatNumber(stats.thisMonth.tokens)} tokens</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{formatCost(stats.today.cost)}</p>
                <p className="text-xs text-gray-500">{formatNumber(stats.today.tokens)} tokens</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by AI Model</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.byModel).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.byModel).map(([model, data]) => (
                <div key={model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{model}</p>
                      <p className="text-sm text-gray-500">{data.count} operations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCost(data.cost)}</p>
                    <p className="text-sm text-gray-500">{formatNumber(data.tokens)} tokens</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p>No token usage data yet</p>
              <p className="text-sm">Generate some test cases to see your usage!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Usage History</CardTitle>
          <div className="flex items-center space-x-2">
            {usageHistory.length > 0 && (
              <>
                <Button variant="secondary" size="sm" onClick={exportUsageData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all usage data? This cannot be undone.')) {
                      clearUsage()
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {usageHistory.length > 0 ? (
            <>
              {/* Quick Summary */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {usageHistory.length} total operations recorded
                    </p>
                    <p className="text-sm text-blue-700">
                      Average cost per operation: {formatCost(stats.totalCost / usageHistory.length)}
                    </p>
                  </div>
                </div>
              </div>

              {showHistory && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Operation</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Model</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Tokens</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Cost</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {usageHistory.slice().reverse().slice(0, 10).map((usage) => (
                        <tr key={usage.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">
                            {usage.date.toLocaleDateString()} {usage.date.toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {getOperationLabel(usage.operation)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div className="font-mono">{usage.model}</div>
                            <div className="text-xs text-gray-500">
                              {getProviderName(usage.providerId || 'openai')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatNumber(usage.totalTokens)}
                            <div className="text-xs text-gray-500">
                              {formatNumber(usage.inputTokens)}+{formatNumber(usage.outputTokens)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCost(usage.cost)}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {usage.fileName && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span className="text-xs truncate max-w-[120px]">{usage.fileName}</span>
                              </div>
                            )}
                            {usage.testCasesGenerated && (
                              <div className="text-xs text-gray-500">
                                {usage.testCasesGenerated} test cases
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usageHistory.length > 10 && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Showing latest 10 of {usageHistory.length} operations
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Usage Data</h3>
              <p className="text-gray-600 mb-4">Start generating test cases to track your token usage and costs.</p>
              <Button variant="primary" onClick={() => window.location.href = '/generate'}>
                Generate Test Cases
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}