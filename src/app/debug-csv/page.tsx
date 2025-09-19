'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function DebugCSV() {
  const [csvContent, setCsvContent] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCsvContent(content)
        analyzeCSV(content)
      }
      reader.readAsText(file)
    }
  }

  const analyzeCSV = (content: string) => {
    const lines = content.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)

    // Basic analysis
    const analysis = {
      totalLines: lines.length,
      nonEmptyLines: nonEmptyLines.length,
      firstLine: lines[0],
      sampleLines: lines.slice(0, 10),
      lastLine: lines[lines.length - 1],
      hasMultilineFields: content.includes('\n') && content.includes('"')
    }

    setAnalysis(analysis)
  }

  const downloadAnalysis = () => {
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uploaded-test-cases.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CSV Analysis Debug</h1>

      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mb-4"
          />
          {csvContent && (
            <Button onClick={downloadAnalysis} variant="secondary" size="sm">
              Download Uploaded File
            </Button>
          )}
        </div>

        {analysis && (
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">File Analysis</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Total Lines:</strong> {analysis.totalLines}</div>
              <div><strong>Non-Empty Lines:</strong> {analysis.nonEmptyLines}</div>
              <div><strong>Has Multi-line Fields:</strong> {analysis.hasMultilineFields ? 'Yes' : 'No'}</div>

              <div className="mt-4">
                <strong>First Line (Header):</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">{analysis.firstLine}</pre>
              </div>

              <div className="mt-4">
                <strong>Sample Lines (first 10):</strong>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {analysis.sampleLines.map((line: string, index: number) =>
                    `${index + 1}: ${line}\n`
                  ).join('')}
                </pre>
              </div>
            </div>
          </div>
        )}

        {csvContent && (
          <div className="bg-white border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Raw Content Preview</h2>
            <textarea
              value={csvContent.substring(0, 2000) + (csvContent.length > 2000 ? '\n...(truncated)' : '')}
              readOnly
              className="w-full h-64 text-xs font-mono border rounded p-2"
            />
            <div className="mt-2 text-sm text-gray-600">
              Total characters: {csvContent.length}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}