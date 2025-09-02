'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  createColumnHelper
} from '@tanstack/react-table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TestCase, TableColumn } from '@/types'
import { ExpandableRow } from './ExpandableRow'
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Settings,
  Maximize2,
  Minimize2,
  Copy,
  FileText
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { getCurrentUser } from '@/lib/user-storage'
import { hasPermission, isGuest } from '@/lib/access-control'

interface DataGridProps {
  data: TestCase[]
  onSelectionChange?: (selectedIds: string[]) => void
  onEdit?: (testCase: TestCase) => void
  onView?: (testCase: TestCase) => void
  onDelete?: (testCaseIds: string[]) => void
  onExport?: (testCaseIds: string[]) => void
  onBulkEdit?: (testCaseIds: string[]) => void
  onVersionHistory?: (testCase: TestCase) => void
  loading?: boolean
  projects?: Record<string, string>
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  deprecated: 'bg-red-100 text-red-700',
  review: 'bg-blue-100 text-blue-700'
}

const columnHelper = createColumnHelper<TestCase>()

// Completely isolated ActionButtons component
function ActionButtons({ testCase, onEdit, onView, onVersionHistory }: { 
  testCase: TestCase, 
  onEdit?: (testCase: TestCase) => void,
  onView?: (testCase: TestCase) => void,
  onVersionHistory?: (testCase: TestCase) => void
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const currentUser = getCurrentUser()
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showDropdown && !target.closest('.relative')) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('🔵 Edit test case:', testCase.id)
    
    // Directly call the onEdit handler to open the edit modal
    if (onEdit) {
      onEdit(testCase)
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('🟢 View test case details:', testCase.id)
    
    // Call the onView handler to open the detail modal
    if (onView) {
      onView(testCase)
    } else {
      // Fallback: show basic info if modal isn't available
      alert(`Test Case: ${testCase.id}\nTitle: ${testCase.data?.title || testCase.testCase}\nSteps: ${testCase.testSteps?.length || 0}`)
    }
  }

  const handleCopyId = (e: React.MouseEvent) => {
    console.log('🟡 Copy ID clicked for:', testCase.id)
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(testCase.id).then(() => {
      alert(`✅ Test case ID "${testCase.id}" copied to clipboard!`)
    }).catch(() => {
      alert(`Test case ID: ${testCase.id}`)
    })
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      // Create a duplicate of the test case with a new ID
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 5)
      const duplicateTestCase = {
        ...testCase,
        id: `${testCase.id}-COPY-${timestamp}-${randomSuffix}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft' as const,
        // Update the title/name to indicate it's a copy
        testCase: testCase.testCase ? `${testCase.testCase} (Copy)` : 'Test Case (Copy)',
        data: {
          ...testCase.data,
          title: testCase.data?.title ? `${testCase.data.title} (Copy)` : 'Test Case (Copy)'
        }
      }
      
      // Get existing test cases from localStorage
      const stored = localStorage.getItem('testCaseWriter_generatedTestCases')
      if (stored) {
        const sessions = JSON.parse(stored)
        if (sessions && sessions.length > 0) {
          // Add to the most recent session
          sessions[0].testCases.push(duplicateTestCase)
          sessions[0].totalCount = sessions[0].testCases.length
          localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(sessions))
          
          alert(`✅ Test case "${testCase.data?.title || testCase.testCase}" has been duplicated successfully!`)
          
          // Refresh the page to show the new test case
          window.location.reload()
        } else {
          // Create a new session with just this test case
          const { saveGeneratedTestCases } = require('@/lib/test-case-storage')
          const result = saveGeneratedTestCases([duplicateTestCase], [], 'manual-duplicate')
          if (result.saved > 0) {
            alert(`✅ Test case duplicated and saved as a new session!`)
          } else {
            alert(`ℹ️ Test case was not duplicated - it already exists!`)
          }
          window.location.reload()
        }
      } else {
        // No existing sessions, create a new one
        const { saveGeneratedTestCases } = require('@/lib/test-case-storage')
        const result = saveGeneratedTestCases([duplicateTestCase], [], 'manual-duplicate')
        if (result.saved > 0) {
          alert(`✅ Test case duplicated and saved!`)
        } else {
          alert(`ℹ️ Test case was not duplicated - it already exists!`)
        }
        window.location.reload()
      }
    } catch (error) {
      console.error('Error duplicating test case:', error)
      alert('❌ Error duplicating test case. Please try again.')
    }
  }

  const handleExportSingle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Create a simple CSV export for single test case
    const csvData = [
      ['Test Case ID', 'Title', 'Priority', 'Status', 'Steps Count', 'Module', 'Test Result'],
      [
        testCase.id,
        testCase.data?.title || testCase.testCase || 'Untitled',
        testCase.priority || 'medium',
        testCase.status || 'draft',
        testCase.testSteps?.length || 0,
        testCase.module || 'General',
        testCase.testResult || 'Not Executed'
      ]
    ]
    
    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-case-${testCase.id}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    alert(`✅ Test case "${testCase.data?.title || testCase.testCase}" exported as CSV!`)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    const testCaseTitle = testCase.data?.title || testCase.testCase || testCase.id
    
    if (confirm(`⚠️ Are you sure you want to delete test case "${testCaseTitle}"?\n\nThis action cannot be undone.`)) {
      try {
        // Import and use the delete function
        const { deleteTestCasesByIds } = require('@/lib/test-case-storage')
        deleteTestCasesByIds([testCase.id])
        
        alert(`✅ Test case "${testCaseTitle}" has been deleted successfully!`)
        
        // Refresh the page to update the list
        window.location.reload()
      } catch (error) {
        console.error('Error deleting test case:', error)
        alert('❌ Error deleting test case. Please try again.')
      }
    }
  }

  return (
    <div 
      className="flex items-center gap-2" 
      onClick={(e) => e.stopPropagation()}
      style={{ 
        position: 'relative', 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {hasPermission(currentUser, 'canEditTestCases') && (
        <button 
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md border border-gray-200 hover:border-blue-300 bg-white shadow-sm transition-all duration-200"
          onMouseDown={handleEdit}
          title="Edit test case"
          type="button"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      
      <button 
        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-md border border-gray-200 hover:border-green-300 bg-white shadow-sm transition-all duration-200"
        onMouseDown={handleView}
        title="View test case"
        type="button"
      >
        <Eye className="h-4 w-4" />
      </button>
      
      <div className="relative">
        <button 
          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-100 rounded-md border border-gray-200 hover:border-orange-300 bg-white shadow-sm transition-all duration-200"
          title="More options"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('🟡 More options button clicked, current state:', showDropdown)
            setShowDropdown(!showDropdown)
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={(e) => {
                  console.log('🟡 Copy ID menu item clicked')
                  setShowDropdown(false)
                  handleCopyId(e)
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Test Case ID
              </button>
              
              {hasPermission(currentUser, 'canCreateTestCases') && (
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    console.log('🟡 Duplicate menu item clicked')
                    setShowDropdown(false)
                    handleDuplicate(e)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Duplicate Test Case
                </button>
              )}
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={(e) => {
                  console.log('🟡 Version History menu item clicked')
                  setShowDropdown(false)
                  if (onVersionHistory) {
                    onVersionHistory(testCase)
                  }
                }}
                title="View complete version history - See all changes, updates, and modifications made to this test case over time"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Version History
              </button>
              
              {hasPermission(currentUser, 'canExport') && (
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    console.log('🟡 Export menu item clicked')
                    setShowDropdown(false)
                    handleExportSingle(e)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
              )}
              
              {hasPermission(currentUser, 'canDeleteTestCases') && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 cursor-pointer"
                    onClick={(e) => {
                      console.log('🟡 Delete menu item clicked')
                      setShowDropdown(false)
                      handleDelete(e)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Test Case
                  </button>
                </>
              )}
              
              {/* Show message for guest users */}
              {isGuest(currentUser) && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <div className="px-4 py-3 text-xs text-gray-500 bg-gray-50">
                    <div className="flex items-center space-x-2">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Guest mode: Read-only access</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function DataGrid({ 
  data, 
  onSelectionChange, 
  onEdit, 
  onView, 
  onDelete, 
  onExport, 
  onBulkEdit, 
  onVersionHistory,
  loading = false,
  projects = {}
}: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showColumns, setShowColumns] = useState(false)

  // Debug logging for expandedRows changes
  useEffect(() => {
    console.log('🔵 DataGrid - expandedRows state changed:', Array.from(expandedRows))
  }, [expandedRows])

  // Debug logging for data changes
  useEffect(() => {
    console.log('🔵 DataGrid - data changed:', {
      length: data.length,
      ids: data.map(tc => tc.id).slice(0, 5),
      hasTestSteps: data.filter(tc => tc.testSteps && tc.testSteps.length > 0).length
    })
    
    // Log actual data structure for first few test cases
    if (data.length > 0) {
      console.log('🔵 DataGrid - First test case full structure:', data[0])
      console.log('🔵 DataGrid - Sample data structures:', data.slice(0, 3).map(tc => ({
        id: tc.id,
        enhancement: tc.enhancement,
        ticketId: tc.ticketId,
        tags: tc.tags,
        projectId: tc.projectId,
        data: tc.data ? {
          enhancement: tc.data.enhancement,
          ticketId: tc.data.ticketId,
          tags: tc.data.tags,
          projectId: tc.data.projectId
        } : null,
        allKeys: Object.keys(tc)
      })))
    }
  }, [data])


  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
        />
      ),
      enableSorting: false,
      size: 50
    }),
    columnHelper.accessor('id', {
      header: 'Test case ID',
      cell: (info) => (
        <span className="font-mono text-sm text-primary-600">
          {info.getValue()}
        </span>
      ),
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.title || row.testCase || 'Test Case', {
      id: 'title',
      header: 'Test Case Details',
      cell: (info) => {
        const testCase = info.row.original
        const isExpanded = expandedRows.has(testCase.id)
        
        return (
          <ExpandableRow 
            testCase={testCase}
            forceExpanded={isExpanded}
            onToggle={(id, expanded) => {
              console.log('🔵 ExpandableRow onToggle:', id, expanded)
              setExpandedRows(prev => {
                const newExpanded = new Set(prev)
                if (expanded) {
                  newExpanded.add(id)
                } else {
                  newExpanded.delete(id)
                }
                console.log('🔵 New expanded state:', Array.from(newExpanded))
                return newExpanded
              })
            }}
          />
        )
      },
      size: 500
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
          priorityColors[info.getValue()]
        )}>
          {info.getValue()}
        </span>
      ),
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const priority = testCase.priority || testCase.data?.priority || 'medium'
        console.log('🔍 Priority filter check:', { testCaseId: testCase.id, priority, filterValue: value, matches: priority.toLowerCase() === value.toLowerCase() })
        return priority.toLowerCase() === value.toLowerCase()
      },
      size: 100
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
          statusColors[info.getValue()]
        )}>
          {info.getValue()}
        </span>
      ),
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const status = testCase.status || testCase.data?.status || 'draft'
        console.log('🔍 Status filter check:', { testCaseId: testCase.id, status, filterValue: value, matches: status.toLowerCase() === value.toLowerCase() })
        return status.toLowerCase() === value.toLowerCase()
      },
      size: 100
    }),
    columnHelper.accessor((row) => row.data?.feature || row.feature || row.module || 'General', {
      id: 'feature',
      header: 'Feature',
      cell: (info) => {
        const feature = info.getValue()
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {feature}
          </span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const feature = testCase.data?.feature || testCase.feature || testCase.module || 'General'
        const matches = feature.toLowerCase().includes(value.toLowerCase())
        console.log('🔍 Feature filter check:', { testCaseId: testCase.id, feature, filterValue: value, matches })
        return matches
      },
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.projectId || row.projectId, {
      id: 'projectId',
      header: 'Project',
      cell: (info) => {
        const projectId = info.getValue()
        const projectName = projectId ? projects[projectId] : null
        return projectName ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
            {projectName}
          </span>
        ) : projectId ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {projectId}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const projectId = testCase.data?.projectId || testCase.projectId
        const matches = projectId === value
        console.log('🔍 Project filter check:', { testCaseId: testCase.id, projectId, filterValue: value, matches })
        return matches
      },
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.enhancement || row.enhancement, {
      id: 'enhancement',
      header: 'Enhancement',
      cell: (info) => {
        const enhancement = info.getValue()
        return enhancement ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {enhancement}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const enhancement = testCase.data?.enhancement || testCase.enhancement || ''
        const matches = enhancement.toLowerCase().includes(value.toLowerCase())
        console.log('🔍 Enhancement filter check:', { testCaseId: testCase.id, enhancement, filterValue: value, matches })
        return matches
      },
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.ticketId || row.ticketId, {
      id: 'ticketId',
      header: 'Ticket',
      cell: (info) => {
        const ticketId = info.getValue()
        return ticketId ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            {ticketId}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const ticketId = testCase.data?.ticketId || testCase.ticketId || ''
        const matches = ticketId.toLowerCase().includes(value.toLowerCase())
        console.log('🔍 Ticket filter check:', { testCaseId: testCase.id, ticketId, filterValue: value, matches })
        return matches
      },
      size: 100
    }),
    columnHelper.accessor((row) => row.data?.tags || row.tags, {
      id: 'tags',
      header: 'Tags',
      cell: (info) => {
        const tags = info.getValue() || []
        
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag: string, index: number) => (
              <span 
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-gray-400">
                +{tags.length - 2} more
              </span>
            )}
          </div>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const tags = testCase.data?.tags || testCase.tags || []
        const tagString = tags.join(' ').toLowerCase()
        const matches = tagString.includes(value.toLowerCase())
        console.log('🔍 Tags filter check:', { testCaseId: testCase.id, tags, filterValue: value, matches })
        return matches
      },
      enableSorting: false,
      size: 200
    }),
    columnHelper.accessor((row) => row.version || 1, {
      id: 'version',
      header: 'Version',
      cell: (info) => {
        const version = info.getValue()
        return (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
              v{version}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (onVersionHistory) {
                  onVersionHistory(info.row.original)
                }
              }}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
              title="View version history - See all changes and updates made to this test case over time"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )
      },
      size: 100
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Last Modified',
      cell: (info) => (
        <div className="text-sm text-gray-500">
          {formatDate(info.getValue())}
        </div>
      ),
      size: 150
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        return (
          <div className="action-cell" data-testid={`actions-${row.original.id}`}>
            <ActionButtons 
              testCase={row.original}
              onEdit={onEdit}
              onView={onView}
              onVersionHistory={onVersionHistory}
            />
          </div>
        )
      },
      enableSorting: false,
      size: 140
    })
  ], [onEdit, onView])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, value) => {
      if (!value || value.trim() === '') return true
      
      const searchTerm = value.toLowerCase().trim()
      const testCase = row.original
      
      // Function to safely extract all possible values from nested objects
      const getAllValues = (obj: any, visited = new Set()) => {
        if (!obj || visited.has(obj)) return []
        visited.add(obj)
        
        const values = []
        
        if (typeof obj === 'string' || typeof obj === 'number') {
          values.push(String(obj))
        } else if (Array.isArray(obj)) {
          obj.forEach(item => values.push(...getAllValues(item, visited)))
        } else if (typeof obj === 'object') {
          Object.values(obj).forEach(value => values.push(...getAllValues(value, visited)))
        }
        
        return values
      }
      
      // Get all searchable text from the entire test case object
      const allValues = getAllValues(testCase)
      const searchableText = allValues
        .filter(val => val && val.trim() !== '')
        .join(' ')
        .toLowerCase()
      
      const matches = searchableText.includes(searchTerm)
      
      // Only log when searching to reduce console spam
      if (searchTerm.length > 2) {
        console.log('🔍 Global search for "' + searchTerm + '":', {
          testCaseId: testCase.id,
          found: matches,
          sampleText: searchableText.substring(0, 300) + '...',
          enhancement: testCase.enhancement || testCase.data?.enhancement || 'none',
          ticketId: testCase.ticketId || testCase.data?.ticketId || 'none',
          tags: testCase.tags || testCase.data?.tags || 'none',
          projectId: testCase.projectId || testCase.data?.projectId || 'none'
        })
      }
      
      return matches
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = React.useMemo(() => {
    // Only get IDs from rows that are actually selected
    const ids = selectedRows
      .filter(row => row.getIsSelected())
      .map(row => row.original.id)
    
    // Debug logging to help identify the issue
    console.log('🔍 DataGrid Selection Debug:', {
      totalRows: data.length,
      selectedRowsCount: selectedRows.length,
      rowSelectionState: rowSelection,
      selectedIds: ids,
      selectedRows: selectedRows.map(row => ({
        id: row.original.id,
        isSelected: row.getIsSelected(),
        selectionKey: row.id
      }))
    })
    
    return ids
  }, [selectedRows, data.length, rowSelection])

  React.useEffect(() => {
    onSelectionChange?.(selectedIds)
  }, [selectedIds, onSelectionChange])

  // Fix for selection state management
  React.useEffect(() => {
    // Ensure rowSelection state is consistent with actual selections
    const currentSelection = Object.keys(rowSelection).filter(key => rowSelection[key])
    if (currentSelection.length !== selectedIds.length) {
      console.log('🔄 Fixing selection state mismatch:', {
        rowSelectionKeys: currentSelection,
        selectedIds: selectedIds,
        mismatch: Math.abs(currentSelection.length - selectedIds.length)
      })
      
      // Reset selection state if there's a mismatch
      setRowSelection({})
    }
  }, [rowSelection, selectedIds])

  // Additional safety check for selection consistency
  React.useEffect(() => {
    // Log selection changes for debugging
    console.log('🔍 DataGrid - Selection state changed:', {
      rowSelectionKeys: Object.keys(rowSelection).filter(key => rowSelection[key]),
      selectedIds: selectedIds,
      totalRows: data.length,
      isConsistent: Object.keys(rowSelection).filter(key => rowSelection[key]).length === selectedIds.length
    })
  }, [rowSelection, selectedIds, data.length])

  // Debug logging for data and state
  React.useEffect(() => {
    console.log('🔍 DataGrid - Data received:', { 
      dataLength: data.length,
      expandedRowsCount: expandedRows.size,
      firstTestCase: data[0] ? {
        id: data[0].id,
        hasTestSteps: !!data[0].testSteps,
        testStepsCount: data[0].testSteps?.length || 0
      } : null
    })
    
    if (data.length > 0) {
      console.log('🔍 DataGrid - Test case data structure:', data.slice(0, 2).map(tc => ({
        id: tc.id,
        rootTags: tc.tags,
        dataTags: tc.data?.tags,
        dataKeys: tc.data ? Object.keys(tc.data) : [],
        hasRootTags: tc.tags && tc.tags.length > 0,
        hasDataTags: tc.data?.tags && tc.data.tags.length > 0
      })))
    }
  }, [data, expandedRows])

  console.log('🔍 DataGrid rendering with data length:', data.length)
  
  return (
    <div className="space-y-4" key={`datagrid-${data.length}-${expandedRows.size}`}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search test cases... (ID, title, enhancement, ticket, etc.)"
              value={globalFilter}
              onChange={(e) => {
                const searchValue = e.target.value
                console.log('🔍 Search input changed:', searchValue)
                
                // Clear column filters when doing global search to avoid conflicts
                if (searchValue.trim() && columnFilters.length > 0) {
                  console.log('🔍 Clearing column filters for global search')
                  setColumnFilters([])
                }
                
                setGlobalFilter(searchValue)
                console.log('🔍 Global filter set to:', searchValue)
                console.log('🔍 Current column filters:', columnFilters)
                
                setTimeout(() => {
                  console.log('🔍 Table filter state after update:', table.getState().globalFilter)
                  console.log('🔍 Filtered rows count after update:', table.getFilteredRowModel().rows.length)
                }, 100)
              }}
              className="pl-10 pr-10 w-80"
            />
            {globalFilter && (
              <button
                onClick={() => {
                  setGlobalFilter('')
                  console.log('🔍 Search cleared')
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              console.log('🔍 Filters button clicked!')
              setShowFilters(!showFilters)
            }}
            className={showFilters ? 'bg-blue-100 text-blue-700' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              console.log('🔧 Columns button clicked!')
              setShowColumns(!showColumns)
            }}
            className={showColumns ? 'bg-blue-100 text-blue-700' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Columns
          </Button>
          
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedIds.length} selected
              </span>
              
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onExport?.(selectedIds)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              {onBulkEdit && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => onBulkEdit(selectedIds)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
              )}
              
              <Button 
                variant="danger" 
                size="sm"
                onClick={() => onDelete?.(selectedIds)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Priority filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'priority'), { id: 'priority', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'priority'))
                  }
                }}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Status filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'status'), { id: 'status', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'status'))
                  }
                }}
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="review">Review</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feature</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Feature filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'feature'), { id: 'feature', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'feature'))
                  }
                }}
              >
                <option value="">All Features</option>
                <option value="Authentication">Authentication</option>
                <option value="Shopping">Shopping</option>
                <option value="File Management">File Management</option>
                <option value="User Management">User Management</option>
                <option value="Payment">Payment</option>
                <option value="Reporting">Reporting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Project filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'projectId'), { id: 'projectId', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'projectId'))
                  }
                }}
              >
                <option value="">All Projects</option>
                {Object.entries(projects).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enhancement</label>
              <input 
                type="text"
                placeholder="Filter by enhancement..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Enhancement filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'enhancement'), { id: 'enhancement', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'enhancement'))
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ticket ID</label>
              <input 
                type="text"
                placeholder="Filter by ticket ID..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Ticket filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'ticketId'), { id: 'ticketId', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'ticketId'))
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input 
                type="text"
                placeholder="Filter by tags (comma-separated)..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  console.log('🔍 Tags filter changed:', e.target.value)
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'tags'), { id: 'tags', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'tags'))
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                setColumnFilters([])
                console.log('🔍 All filters cleared')
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Columns Panel */}
      {showColumns && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Column Visibility</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {table.getAllColumns()
              .filter(column => column.getCanHide())
              .map(column => {
                const columnId = column.id
                const isVisible = column.getIsVisible()
                return (
                  <label key={columnId} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => {
                        console.log('🔧 Column visibility changed:', columnId, !isVisible)
                        column.toggleVisibility()
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 capitalize">
                      {columnId === 'testCase' ? 'Test Case' :
                       columnId === 'testSteps' ? 'Test Steps' :
                       columnId === 'testResult' ? 'Result' :
                       columnId}
                    </span>
                  </label>
                )
              })}
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                table.toggleAllColumnsVisible(true)
                console.log('🔧 All columns shown')
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Show All
            </button>
            <button
              onClick={() => {
                table.toggleAllColumnsVisible(false)
                console.log('🔧 All columns hidden')
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Hide All
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center space-x-1',
                            header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-900'
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {header.column.getCanSort() && (
                            <span className="flex flex-col">
                              <ChevronUp 
                                className={cn(
                                  'h-3 w-3',
                                  header.column.getIsSorted() === 'asc' ? 'text-gray-900' : 'text-gray-400'
                                )}
                              />
                              <ChevronDown 
                                className={cn(
                                  'h-3 w-3 -mt-1',
                                  header.column.getIsSorted() === 'desc' ? 'text-gray-900' : 'text-gray-400'
                                )}
                              />
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-600">Loading test cases...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                    No test cases found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      row.getIsSelected() && 'bg-primary-50'
                    )}
                    style={{ pointerEvents: 'auto' }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className="px-4 py-3 text-sm"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from(
              { length: Math.min(table.getPageCount(), 5) },
              (_, i) => {
                const pageIndex = table.getState().pagination.pageIndex
                let pageNum
                
                if (table.getPageCount() <= 5) {
                  pageNum = i
                } else if (pageIndex < 3) {
                  pageNum = i
                } else if (pageIndex > table.getPageCount() - 4) {
                  pageNum = table.getPageCount() - 5 + i
                } else {
                  pageNum = pageIndex - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pageIndex ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => table.setPageIndex(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum + 1}
                  </Button>
                )
              }
            )}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}