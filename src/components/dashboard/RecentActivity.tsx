import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'
import { 
  FileText, 
  Wand2, 
  Download, 
  Edit, 
  Plus, 
  Trash2,
  Clock,
  ArrowRight 
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ActivityItem {
  id: string
  type: 'create' | 'update' | 'delete' | 'export' | 'generate'
  entityType: 'testcase' | 'template' | 'project' | 'document'
  entityName: string
  userId: string
  userName: string
  description: string
  createdAt: Date
}

// Empty state - no mock data for production
const recentActivities: ActivityItem[] = []

const activityIcons = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  export: Download,
  generate: Wand2,
}

const activityColors = {
  create: 'text-success-600 bg-success-50',
  update: 'text-warning-600 bg-warning-50',
  delete: 'text-error-600 bg-error-50',
  export: 'text-primary-600 bg-primary-50',
  generate: 'text-purple-600 bg-purple-50',
}

function getRelativeTime(date: Date) {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return formatDate(date)
}

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activityIcons[activity.type]
            const colorClass = activityColors[activity.type]
            
            return (
              <div key={activity.id} className="flex space-x-3">
                <div className={`rounded-full p-2 flex-shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.entityName}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <span>{activity.userName}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{getRelativeTime(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {recentActivities.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}