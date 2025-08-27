'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav className={cn('mb-12', className)}>
      <ol className="flex items-center justify-between max-w-6xl mx-auto">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep
          
          return (
            <li key={step.id} className="flex-1">
              <div className="flex items-center">
                {/* Step Circle */}
                <div className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-full border-2 text-sm font-medium transition-all',
                      {
                        'bg-primary-600 border-primary-600 text-white': isComplete,
                        'bg-primary-100 border-primary-600 text-primary-600': isCurrent,
                        'bg-white border-gray-300 text-gray-500': isUpcoming
                      }
                    )}
                  >
                    {isComplete ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="ml-6 min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-base font-medium transition-all',
                        {
                          'text-primary-600': isComplete || isCurrent,
                          'text-gray-500': isUpcoming
                        }
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-8 transition-all',
                      {
                        'bg-primary-600': isComplete,
                        'bg-gray-200': !isComplete
                      }
                    )}
                  />
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}