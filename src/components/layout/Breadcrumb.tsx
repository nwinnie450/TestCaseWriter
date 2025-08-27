'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="flex-shrink-0 h-4 w-4 text-gray-400 mx-1" />
            )}
            
            {item.href && index < items.length - 1 ? (
              <Link 
                href={item.href}
                className="font-medium hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className={cn(
                  'font-medium',
                  index === items.length - 1 
                    ? 'text-gray-900' 
                    : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}