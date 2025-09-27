'use client'

import React, { useState } from 'react'
import { TestCase } from '@/types'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpandableRowProps {
  testCase: TestCase
  forceExpanded?: boolean
  onToggle?: (id: string, isExpanded: boolean) => void
}

export function ExpandableRow({ testCase, forceExpanded = false, onToggle }: ExpandableRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Use forceExpanded if provided, otherwise use local state
  const expanded = forceExpanded || isExpanded
  

  const title = testCase.testCase || testCase.data?.title || 'Test Case'
  const description = testCase.data?.description || testCase.data?.preconditions || 'No description'
  const steps = testCase.testSteps || testCase.data?.steps || []
  const stepCount = steps.length
  
  const toggleExpanded = () => {
    const newExpanded = !expanded
    if (!forceExpanded) {
      setIsExpanded(newExpanded)
    }
    onToggle?.(testCase.id, newExpanded)
  }
  
  return (
    <div className="max-w-2xl space-y-2">
      {/* Header with Title and Toggle Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium text-gray-900", expanded ? "" : "line-clamp-2")}>
            {title}
          </p>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title={expanded ? "Collapse" : "Expand"}
          type="button"
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Steps - Always show in collapsed state, show all when expanded */}
      {stepCount > 0 && (
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-gray-700">
              {stepCount} Test Step{stepCount !== 1 ? 's' : ''}:
            </p>
            {!expanded && stepCount > 2 && (
              <button
                onClick={toggleExpanded}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                type="button"
              >
                View All
              </button>
            )}
          </div>
          
          {/* Test Steps Section */}
          <div className="space-y-1 mb-3">
            <p className="text-xs font-medium text-blue-700 mb-2">📋 Test Steps:</p>
            {(expanded ? steps : steps.slice(0, 2)).map((step, index) => (
              <div key={index} className="text-gray-600 pl-2 border-l-2 border-blue-200">
                <p className={expanded ? "" : "line-clamp-1"}>
                  <span className="font-medium text-blue-600">{step.step}.</span> {step.description}
                </p>
                {step.testData && expanded && (
                  <p className="text-xs text-gray-500 ml-4 mt-1">
                    <span className="font-medium">📊 Test Data:</span> {step.testData}
                  </p>
                )}
              </div>
            ))}
            
            {!expanded && stepCount > 2 && (
              <p className="text-gray-500 italic ml-2">
                +{stepCount - 2} more steps...
              </p>
            )}
          </div>

        </div>
      )}
      
      
    </div>
  )
}