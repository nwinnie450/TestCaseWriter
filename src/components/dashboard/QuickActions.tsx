import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileText, Wand2, Upload, Download, Settings, Plus, Folder } from 'lucide-react'

const quickActions = [
  {
    title: 'Generate Test Cases',
    description: 'AI-powered test case generation',
    icon: Wand2,
    href: '/generate',
    color: 'success'
  },
  {
    title: 'Manage Projects',
    description: 'Create and organize projects',
    icon: Folder,
    href: '/projects',
    color: 'primary'
  },
  {
    title: 'Test Case Library',
    description: 'View and manage test cases',
    icon: FileText,
    href: '/library',
    color: 'info'
  },
  {
    title: 'Export Center',
    description: 'Export to testing tools',
    icon: Download,
    href: '/export',
    color: 'warning'
  },
  {
    title: 'Templates',
    description: 'Manage test case templates',
    icon: Settings,
    href: '/templates',
    color: 'secondary'
  },
  {
    title: 'Settings',
    description: 'Configure AI and app settings',
    icon: Settings,
    href: '/settings',
    color: 'secondary'
  },
]

export function QuickActions() {
  const router = useRouter()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            
            return (
              <Button
                key={action.title}
                variant="secondary"
                className="h-auto p-4 flex-col items-start space-y-2 text-left hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <div className="flex items-center space-x-3 w-full">
                  <Icon className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">{action.title}</span>
                </div>
                <span className="text-sm text-gray-500 font-normal">
                  {action.description}
                </span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}