'use client'

import React from 'react'
import { Header } from './Header'
import { Breadcrumb } from './Breadcrumb'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface LayoutProps {
  children: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  title?: string
  actions?: React.ReactNode
}

export function Layout({ children, breadcrumbs, title, actions }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="w-full px-6">
        {/* Breadcrumb and Page Header */}
        {(breadcrumbs || title || actions) && (
          <div className="py-4 border-b border-gray-200 bg-white -mx-6 px-6">
            {breadcrumbs && (
              <Breadcrumb items={breadcrumbs} className="mb-2" />
            )}
            
            {(title || actions) && (
              <div className="flex items-center justify-between">
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                )}
                {actions && (
                  <div className="flex items-center space-x-3">{actions}</div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Page Content */}
        <div className="py-6">
          {children}
        </div>
      </main>
    </div>
  )
}