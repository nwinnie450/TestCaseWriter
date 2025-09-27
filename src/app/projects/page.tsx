'use client'

import React, { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AddUserModal } from '@/components/projects/AddUserModal'
import { ProjectMembersModal } from '@/components/projects/ProjectMembersModal'
import { LoginModal } from '@/components/auth/LoginModal'
import { getCurrentUser, addUserToProject } from '@/lib/user-storage'
import { ProjectsAPI } from '@/lib/api-client'
import { 
  Plus,
  Folder,
  FileText,
  Users,
  Calendar,
  Edit,
  Trash2,
  Search,
  Filter,
  Archive,
  FolderOpen,
  Settings,
  UserPlus
} from 'lucide-react'
import { UserAssignment, AssignedUsersSummary } from '@/components/user-management/UserAssignment'

interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'draft'
  createdAt: Date
  updatedAt: Date
  testCaseCount: number
  templateCount: number
  memberCount: number
  ownerId?: string // User ID of the project owner
}

// No default projects for production - start clean
const defaultProjects: Project[] = []

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectForUsers, setSelectedProjectForUsers] = useState<Project | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active' as const
  })

  // Load projects from MongoDB API on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await ProjectsAPI.getAll()
        const parsedProjects = projectsData.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }))
        setProjects(parsedProjects)
      } catch (error) {
        console.error('Failed to load projects:', error)
        // Try localStorage as fallback
        try {
          const stored = localStorage.getItem('testCaseWriter_projects')
          if (stored) {
            const parsedProjects = JSON.parse(stored).map((p: any) => ({
              ...p,
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt)
            }))
            setProjects(parsedProjects)
          } else {
            setProjects([])
          }
        } catch (fallbackError) {
          console.error('Failed to load projects from fallback:', fallbackError)
          setProjects([])
        }
      }
    }

    loadProjects()
  }, [])

  // Load current user
  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUser(user)
  }, [])

  // Update project ownership when user is loaded (legacy cleanup)
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      // Update projects to have the current user as owner if they don't have an ownerId
      const updatedProjects = projects.map(project => ({
        ...project,
        ownerId: project.ownerId === 'current-user' ? currentUser.id : project.ownerId
      }))

      // Check if any changes were made
      const hasChanges = updatedProjects.some((project, index) =>
        project.ownerId !== projects[index].ownerId
      )

      if (hasChanges) {
        setProjects(updatedProjects)
        // Update in database if needed
        updatedProjects.forEach(async (project) => {
          if (project.ownerId !== projects.find(p => p.id === project.id)?.ownerId) {
            try {
              await ProjectsAPI.update(project.id, { ownerId: project.ownerId })
            } catch (error) {
              console.error('Failed to update project ownership:', error)
            }
          }
        })
        console.log('Updated project ownership for current user:', currentUser.id)
      }
    }
  }, [currentUser, projects.length]) // Re-run when user loads or projects change

  // Update project test case counts with real data
  useEffect(() => {
    const updateProjectStats = async () => {
      if (projects.length === 0) return
      
      try {
        const { getProjectTestCaseStats } = await import('@/lib/test-case-storage')
        
        const updatedProjects = projects.map(project => {
          const stats = getProjectTestCaseStats(project.id)
          return {
            ...project,
            testCaseCount: stats.total
          }
        })
        
        setProjects(updatedProjects)
      } catch (error) {
        console.error('Failed to update project stats:', error)
      }
    }
    
    updateProjectStats()
  }, [projects.length]) // Run when projects are loaded

  // Filter projects
  useEffect(() => {
    let filtered = projects

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, statusFilter])

  const handleCreateProject = async () => {
    if (!currentUser) {
      setShowLoginModal(true)
      return
    }

    if (!newProject.name.trim()) return

    try {
      const projectData = {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        status: newProject.status,
        ownerId: currentUser.id,
        testCaseCount: 0,
        templateCount: 0,
        memberCount: 1
      }

      const createdProject = await ProjectsAPI.create(projectData)

      // Update local state with the new project
      const project: Project = {
        ...createdProject,
        createdAt: new Date(createdProject.createdAt),
        updatedAt: new Date(createdProject.updatedAt)
      }

      const updatedProjects = [...projects, project]
      setProjects(updatedProjects)

      // Add the current user as the project owner
      try {
        await addUserToProject(project.id, currentUser.email, 'owner', currentUser.id)
      } catch (error) {
        console.error('Failed to add owner to project members:', error)
      }

      setNewProject({ name: '', description: '', status: 'active' })
      setShowNewProjectModal(false)

      alert(`✅ Project "${project.name}" created successfully!`)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert(`❌ Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const updateData = {
        name: updatedProject.name,
        description: updatedProject.description,
        status: updatedProject.status
      }

      const updated = await ProjectsAPI.update(updatedProject.id, updateData)

      // Update local state
      const updatedProjects = projects.map(p =>
        p.id === updatedProject.id
          ? { ...updated, createdAt: new Date(updated.createdAt), updatedAt: new Date(updated.updatedAt) }
          : p
      )
      setProjects(updatedProjects)
      setEditingProject(null)

      alert(`✅ Project "${updatedProject.name}" updated successfully!`)
    } catch (error) {
      console.error('Failed to update project:', error)
      alert(`❌ Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    // Check if project has test cases
    const projectTestCases = getProjectTestCases(projectId)
    const testCaseCount = projectTestCases.length

    if (testCaseCount > 0) {
      // Project has test cases - show warning and require confirmation
      const confirmMessage = `⚠️ WARNING: This project contains ${testCaseCount} test case(s)!\n\n` +
        `Project: "${project.name}"\n` +
        `Test Cases: ${testCaseCount}\n\n` +
        `Deleting this project will also permanently delete all associated test cases.\n\n` +
        `Are you absolutely sure you want to continue?\n\n` +
        `This action CANNOT be undone!`

      if (confirm(confirmMessage)) {
        // User confirmed deletion despite having test cases
        deleteProjectAndTestCases(projectId, project.name, testCaseCount)
      } else {
        console.log('Project deletion cancelled - contains test cases')
      }
    } else {
      // Project is empty - simple confirmation
      if (confirm(`Delete empty project "${project.name}"?\n\nThis action cannot be undone.`)) {
        deleteProjectAndTestCases(projectId, project.name, 0)
      }
    }
  }

  const deleteProjectAndTestCases = async (projectId: string, projectName: string, testCaseCount: number) => {
    try {
      // Delete project from database
      const success = await ProjectsAPI.delete(projectId)

      if (success) {
        // Remove project from local state
        const updatedProjects = projects.filter(p => p.id !== projectId)
        setProjects(updatedProjects)

        // Remove associated test cases
        if (testCaseCount > 0) {
          const projectTestCases = getProjectTestCases(projectId)
          const testCaseIds = projectTestCases.map((tc: any) => tc.id)

          // Use existing delete function from test-case-storage
          const { deleteTestCasesByIds } = require('@/lib/test-case-storage')
          deleteTestCasesByIds(testCaseIds)

          console.log(`🗑️ Deleted ${testCaseCount} test cases from project ${projectName}`)
        }

        // Show success message and add notification
        if (testCaseCount > 0) {
          alert(`🗑️ Project "${projectName}" and ${testCaseCount} test case(s) deleted successfully!`)

          // Add notification about project deletion
          try {
            const { addNotification } = require('@/lib/notification-utils')
            addNotification({
              type: 'export_complete', // Using existing type, could add 'project_deleted' later
              title: 'Project Deleted',
              description: `Project "${projectName}" and ${testCaseCount} test cases were permanently deleted.`
            })
          } catch (error) {
            console.warn('Could not add notification:', error)
          }
        } else {
          alert(`🗑️ Project "${projectName}" deleted successfully!`)

          // Add notification about project deletion
          try {
            const { addNotification } = require('@/lib/notification-utils')
            addNotification({
              type: 'export_complete',
              title: 'Project Deleted',
              description: `Empty project "${projectName}" was deleted successfully.`
            })
          } catch (error) {
            console.warn('Could not add notification:', error)
          }
        }

        console.log(`✅ Project ${projectName} (${projectId}) deleted successfully`)
      } else {
        throw new Error('Failed to delete project from database')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(`❌ Error deleting project "${projectName}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getProjectTestCases = (projectId: string) => {
    try {
      const { getTestCasesByProjectId } = require('@/lib/test-case-storage')
      return getTestCasesByProjectId(projectId)
    } catch (error) {
      console.warn('Could not load project test cases:', error)
      return []
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800' 
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return FolderOpen
      case 'archived': return Archive
      case 'draft': return Edit
      default: return Folder
    }
  }

  const breadcrumbs = [
    { label: 'Projects' }
  ]

  const actions = (
    <Button 
      variant="primary" 
      onClick={() => {
        if (!currentUser) {
          setShowLoginModal(true)
        } else {
          setShowNewProjectModal(true)
        }
      }}
    >
      <Plus className="h-4 w-4 mr-2" />
      New Project
    </Button>
  )

  return (
    <Layout 
      breadcrumbs={breadcrumbs}
      title="Projects" 
      actions={actions}
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
                <Folder className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <FolderOpen className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Test Cases</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.reduce((sum, p) => sum + p.testCaseCount, 0)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.reduce((sum, p) => sum + p.memberCount, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const StatusIcon = getStatusIcon(project.status)
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <StatusIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectForUsers(project)
                          setShowMembersModal(true)
                        }}
                        title="Manage Members"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      {currentUser && currentUser.id === project.ownerId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProjectForUsers(project)
                            setShowAddUserModal(true)
                          }}
                          title="Add User"
                          className="text-green-600 hover:text-green-800"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingProject(project)}
                        title="Edit Project"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {currentUser && (currentUser.id === project.ownerId || !project.ownerId) && (
                        (() => {
                          const projectTestCases = getProjectTestCases(project.id)
                          const hasTestCases = projectTestCases.length > 0
                          
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                              className={`text-red-600 hover:text-red-800 ${hasTestCases ? 'ring-1 ring-red-200 bg-red-50' : ''}`}
                              title={hasTestCases ? 
                                `⚠️ Delete Project (Contains ${projectTestCases.length} test cases)` : 
                                "Delete Project"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                              {hasTestCases && (
                                <span className="ml-1 text-xs font-medium bg-red-100 text-red-700 px-1 rounded">
                                  {projectTestCases.length}
                                </span>
                              )}
                            </Button>
                          )
                        })()
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* User Assignment Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Assigned QA:</span>
                      <AssignedUsersSummary type="project" targetId={project.id} />
                    </div>
                    <UserAssignment
                      type="project"
                      targetId={project.id}
                      targetName={project.name}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>{project.testCaseCount} test cases</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{project.memberCount} members</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Updated {project.updatedAt.toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter 
                  ? 'No projects match your current filters.' 
                  : 'Create your first project to get started.'
                }
              </p>
              <Button variant="primary" onClick={() => setShowNewProjectModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Project Modal */}
      <Modal isOpen={showNewProjectModal} onClose={() => setShowNewProjectModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Project description (optional)"
                className="input min-h-[100px] w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newProject.status}
                onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                className="input w-full"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      {editingProject && (
        <Modal isOpen={true} onClose={() => setEditingProject(null)}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <Input
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="Project description (optional)"
                  className="input min-h-[100px] w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingProject.status}
                  onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleUpdateProject(editingProject)}>
                Update Project
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      {selectedProjectForUsers && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => {
            setShowAddUserModal(false)
            setSelectedProjectForUsers(null)
          }}
          projectId={selectedProjectForUsers.id}
          projectName={selectedProjectForUsers.name}
          onSuccess={() => {
            // Refresh project data if needed
            console.log('User added successfully')
          }}
        />
      )}

      {/* Members Modal */}
      {selectedProjectForUsers && (
        <ProjectMembersModal
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false)
            setSelectedProjectForUsers(null)
          }}
          projectId={selectedProjectForUsers.id}
          projectName={selectedProjectForUsers.name}
          onAddUser={() => {
            setShowMembersModal(false)
            setShowAddUserModal(true)
          }}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user)
          setShowLoginModal(false)
        }}
      />
    </Layout>
  )
}

export default ProjectsPage