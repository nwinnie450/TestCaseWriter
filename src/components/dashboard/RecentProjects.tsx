import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ClientOnly } from '@/components/ui/ClientOnly'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'
import { 
  Folder, 
  Clock, 
  FileText, 
  Users,
  ArrowRight,
  MoreHorizontal 
} from 'lucide-react'

interface ProjectItem {
  id: string
  name: string
  description?: string
  testCaseCount: number
  templateCount: number
  lastModified: Date
  status: 'active' | 'archived'
  memberCount: number
}

// Empty state - no mock data for production
const recentProjects: ProjectItem[] = []

export function RecentProjects() {
  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Projects</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
          View All <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div 
              key={project.id} 
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-primary-200 hover:bg-primary-50/50 transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Folder className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{project.testCaseCount} cases</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{project.memberCount} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <ClientOnly>
                          <span>Updated {formatDate(project.lastModified)}</span>
                        </ClientOnly>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" className="ml-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentProjects.length === 0 && (
          <div className="text-center py-8">
            <Folder className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-4">No projects yet</p>
            <Button variant="primary" size="sm">
              Create Your First Project
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}