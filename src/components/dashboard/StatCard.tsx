import React from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'error'
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = 'primary',
  className 
}: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    error: 'text-error-600 bg-error-50',
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn('rounded-lg p-3', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              
              {trend && (
                <div className="ml-2 flex items-baseline">
                  <span 
                    className={cn(
                      'text-sm font-medium',
                      trend.positive ? 'text-success-600' : 'text-error-600'
                    )}
                  >
                    {trend.positive ? '+' : ''}{trend.value}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">{trend.label}</span>
                </div>
              )}
            </div>
            
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}