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
import { TestCase, TableColumn } from '@/types/index'
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

interface CustomAction {
  label: string
  icon: React.ComponentType<any>
  onClick: (testCase: TestCase) => void
  condition?: (testCase: TestCase) => boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

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
  customActions?: CustomAction[]
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
function ActionButtons({ testCase, onEdit, onView, onVersionHistory, customActions, isDropdownOpen, onToggleDropdown }: {
  testCase: TestCase,
  onEdit?: (testCase: TestCase) => void,
  onView?: (testCase: TestCase) => void,
  onVersionHistory?: (testCase: TestCase) => void,
  customActions?: CustomAction[],
  isDropdownOpen: boolean,
  onToggleDropdown: () => void
}) {
  const currentUser = getCurrentUser()
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Directly call the onEdit handler to open the edit modal
    if (onEdit) {
      onEdit(testCase)
    }
  }

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    // Call the onView handler to open the detail modal
    if (onView) {
      onView(testCase)
    } else {
      // Fallback: show basic info if modal isn't available
      alert(`Test Case: ${testCase.id}\nTitle: ${testCase.data?.title || testCase.testCase}\nSteps: ${testCase.testSteps?.length || 0}`)
    }
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigator.clipboard.writeText(testCase.id).then(() => {
      alert(`✅ Test case ID "${testCase.id}" copied to clipboard!`)
    }).catch(() => {
      alert(`Test case ID: ${testCase.id}`)
    })
  }

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    try {
      // Create a duplicate with proper ID format
      const modulePrefix = (testCase.module || testCase.category || 'general').replace(/\s+/g, '').toLowerCase()
      const runningNumber = Date.now().toString().slice(-6)
      const duplicateId = `tc_${modulePrefix}_${runningNumber}`
      const duplicateTitle = testCase.data?.title ? `${testCase.data.title} (Copy)` :
                             testCase.testCase ? `${testCase.testCase} (Copy)` : 'Test Case (Copy)'

      // Prepare the API payload for MongoDB
      const apiPayload = {
        id: duplicateId,
        title: duplicateTitle,
        description: testCase.data?.description || testCase.description || '',
        steps: testCase.testSteps?.map((step, index) => ({
          id: `step_${index + 1}`,
          step: step.description || step.step || `Step ${index + 1}`,
          expected: step.expectedResult || step.expected || 'Expected result'
        })) || [{ id: 'step_1', step: 'Step 1', expected: 'Expected result' }],
        priority: (testCase.priority || 'medium').toLowerCase(),
        type: 'manual',
        tags: testCase.tags || [],
        projectId: testCase.projectId || null,
        enhancement: testCase.data?.enhancement || '',
        ticketId: testCase.data?.ticketId || '',
        testData: testCase.testData || testCase.data?.testData || '',
        module: testCase.module || testCase.data?.module || '',
        feature: testCase.data?.feature || '',
        requirements: testCase.data?.requirements || ''
      }


      // Save directly to MongoDB via API
      const response = await fetch('/api/test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload)
      })

      if (response.ok) {
        alert(`✅ Test case "${duplicateTitle}" has been duplicated successfully!`)

        // Refresh the page to show the new test case
        window.location.reload()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate test case')
      }

    } catch (error) {
      console.error('❌ Error duplicating test case:', error)
      alert(`❌ Error duplicating test case: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const testCaseTitle = testCase.data?.title || testCase.testCase || testCase.id

    // Check if test case is in any active execution runs
    try {
      const response = await fetch('/api/test-cases/check-run-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testCaseIds: [testCase.id] }),
      })

      if (response.ok) {
        const runUsageInfo = await response.json()
        const runsInUse = runUsageInfo.testCasesInRuns[testCase.id] || []
        const canDelete = runUsageInfo.canDelete[testCase.id]

        // Check if test case is in active runs (cannot delete)
        if (runsInUse.length > 0 && !canDelete) {
          const activeRuns = runsInUse.filter((run: any) => run.runStatus === 'active')
          const runNames = activeRuns.map((run: any) => `"${run.runName}"`).join(', ')
          alert(
            `🚫 Cannot Delete Test Case\n\nThis test case is currently part of active execution run(s): ${runNames}\n\nTest cases cannot be deleted while they are part of active execution runs. Please complete or cancel the execution runs first.`
          )
          return
        }

        // Warn if test case is in draft runs (can delete but with warning)
        if (runsInUse.length > 0) {
          const runNames = runsInUse.map((run: any) => `"${run.runName}" (${run.runStatus})`).join(', ')
          const shouldProceed = confirm(
            `⚠️ Warning: This test case is currently part of the following execution run(s):\n\n${runNames}\n\nDeleting this test case will remove it from these runs. Are you sure you want to proceed?`
          )

          if (!shouldProceed) {
            return
          }
        }
      }
    } catch (error) {
      console.error('Failed to check run usage:', error)
      // Continue with deletion if check fails (non-critical)
    }

    if (confirm(`⚠️ Are you sure you want to delete test case "${testCaseTitle}"?\n\nThis action cannot be undone.`)) {
      try {
        // Delete via API
        const response = await fetch(`/api/test-cases?id=${testCase.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          alert(`✅ Test case "${testCaseTitle}" has been deleted successfully!`)
          // Refresh the page to update the list
          window.location.reload()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete test case')
        }
      } catch (error) {
        console.error('Error deleting test case:', error)
        alert(`❌ Error deleting test case: ${error instanceof Error ? error.message : 'Please try again.'}`)
      }
    }
  }

  return (
    <div 
      className="flex items-center gap-1" 
      onClick={(e) => e.stopPropagation()}
      style={{ 
        position: 'relative', 
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {hasPermission(currentUser, 'canEditTestCases') && (
        <button 
          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded border border-gray-200 hover:border-blue-300 bg-white shadow-sm transition-all duration-200 flex items-center justify-center"
          onMouseDown={handleEdit}
          title="Edit test case"
          type="button"
        >
          <Edit className="h-3 w-3" />
        </button>
      )}
      
      <button
        className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded border border-gray-200 hover:border-green-300 bg-white shadow-sm transition-all duration-200 flex items-center justify-center"
        onMouseDown={handleView}
        title="View test case"
        type="button"
      >
        <Eye className="h-3 w-3" />
      </button>

      {/* Custom Actions */}
      {customActions?.map((action, index) => {
        const shouldShow = !action.condition || action.condition(testCase)
        if (!shouldShow) return null

        const Icon = action.icon
        return (
          <button
            key={index}
            className={`p-1 rounded border bg-white shadow-sm transition-all duration-200 flex items-center justify-center ${
              action.variant === 'primary' ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300' :
              action.variant === 'danger' ? 'text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300' :
              'text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
            }`}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
              action.onClick(testCase)
            }}
            title={action.label}
            type="button"
          >
            <Icon className="h-3 w-3" />
          </button>
        )
      })}

      <div className="relative">
        <button
          className={`p-2 rounded border shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer ${
            isDropdownOpen
              ? 'text-white bg-orange-600 border-orange-600'
              : 'text-gray-600 hover:text-orange-600 hover:bg-orange-100 border-gray-200 hover:border-orange-300 bg-white'
          }`}
          style={{
            minWidth: '32px',
            minHeight: '32px',
            position: 'relative',
            zIndex: 1000
          }}
          title="More options"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onToggleDropdown()
          }}
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
        
        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200"
            data-dropdown-menu
            style={{ zIndex: 9999 }}
          >
            <div className="py-1">
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                onClick={(e) => {
                  onToggleDropdown()
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
                    onToggleDropdown()
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
                  onToggleDropdown()
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
                    onToggleDropdown()
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
                      onToggleDropdown()
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
  projects = {},
  customActions
}: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [showColumns, setShowColumns] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // Click outside handler for dropdowns - optimized for immediate response
  useEffect(() => {
    if (!openDropdownId) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Immediately close if clicking outside dropdown areas
      if (!target.closest('.action-cell') && !target.closest('[data-dropdown-menu]')) {
        setOpenDropdownId(null)
      }
    }

    // Add listener immediately and use capture phase for faster response
    document.addEventListener('mousedown', handleClickOutside, { capture: true })
    return () => document.removeEventListener('mousedown', handleClickOutside, { capture: true })
  }, [openDropdownId])




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
      header: 'Test Case ID',
      cell: (info) => (
        <div className="max-w-[100px]">
          <span
            className="font-mono text-xs text-primary-600 break-all leading-tight block"
            title={`Test Case ID: ${info.getValue()}`}
          >
            {info.getValue()}
          </span>
        </div>
      ),
      size: 100
    }),
    columnHelper.accessor((row) => row.title || row.data?.title || row.testCase || 'Test Case', {
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
              setExpandedRows(prev => {
                const newExpanded = new Set(prev)
                if (expanded) {
                  newExpanded.add(id)
                } else {
                  newExpanded.delete(id)
                }
                return newExpanded
              })
            }}
          />
        )
      },
      size: 500
    }),

    // Expected Result Column (placed right after Test Case Details)
    columnHelper.accessor((row) => row.expectedResult || row.testResult || row.data?.expectedResult || '', {
      id: 'expectedResult',
      header: 'Expected Result',
      cell: (info) => {
        const expectedResult = info.getValue()
        if (!expectedResult) {
          return <span className="text-xs text-gray-400">-</span>
        }

        const truncated = expectedResult.length > 120 ?
          expectedResult.substring(0, 120) + '...' :
          expectedResult

        return (
          <div
            className="text-xs text-gray-700 max-w-sm"
            title={expectedResult}
          >
            {truncated}
          </div>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const expectedResult = testCase.expectedResult || testCase.testResult || testCase.data?.expectedResult || ''
        return expectedResult.toLowerCase().includes(value.toLowerCase())
      },
      size: 250
    }),

    // 1. Project Column
    columnHelper.accessor((row) => {
      const projectId = row.projectId || row.data?.projectId
      return projectId && projects[projectId] ? projects[projectId] : ''
    }, {
      id: 'projectId',
      header: 'Project',
      cell: (info) => {
        const projectName = info.getValue()
        return projectName ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
            {projectName}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const projectId = testCase.projectId || testCase.data?.projectId
        const projectName = projectId && projects[projectId] ? projects[projectId] : ''
        return projectName.toLowerCase().includes(value.toLowerCase())
      },
      size: 120
    }),

    // 2. Module Column
    columnHelper.accessor((row) => row.module || row.category || row.data?.module || 'General', {
      id: 'module',
      header: 'Module',
      cell: (info) => {
        const module = info.getValue()
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            {module}
          </span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const module = testCase.module || testCase.category || testCase.data?.module || 'General'
        const matches = module.toLowerCase().includes(value.toLowerCase())
        return matches
      },
      size: 120
    }),

    // 3. Feature Column
    columnHelper.accessor((row) => row.feature || row.data?.feature || '', {
      id: 'feature',
      header: 'Feature',
      cell: (info) => {
        const feature = info.getValue()
        return feature ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {feature}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const feature = testCase.feature || testCase.data?.feature || ''
        const matches = feature.toLowerCase().includes(value.toLowerCase())
        return matches
      },
      size: 120
    }),

    // 4. Enhancement/Ticket Column
    columnHelper.accessor((row) => row.enhancement || row.ticketId || row.data?.enhancement || row.data?.ticketId, {
      id: 'enhancement',
      header: 'Enhancement/Ticket',
      cell: (info) => {
        const value = info.getValue()
        return value ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {value}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )
      },
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const enhancement = testCase.enhancement || testCase.data?.enhancement || ''
        const ticket = testCase.ticketId || testCase.data?.ticketId || ''
        const matches = enhancement.toLowerCase().includes(value.toLowerCase()) ||
                       ticket.toLowerCase().includes(value.toLowerCase())
        return matches
      },
      size: 140
    }),

    // 5. Tags Column
    columnHelper.accessor((row) => {
      const allTags = row.tags || row.data?.tags || []
      // Filter out default tags (module, priority, etc.) to show only meaningful tags
      const meaningfulTags = allTags.filter((tag: string) =>
        tag &&
        tag !== row.module &&
        tag !== row.priority &&
        tag !== row.category &&
        tag !== 'medium' &&
        tag !== 'high' &&
        tag !== 'low' &&
        tag !== 'critical' &&
        tag !== 'Department' // Filter out module names
      )
      return meaningfulTags
    }, {
      id: 'tags',
      header: 'Tags',
      cell: (info) => {
        const tags = info.getValue() || []

        if (tags.length === 0) {
          return <span className="text-xs text-gray-400">-</span>
        }

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
        const tags = testCase.tags || testCase.data?.tags || []
        const tagString = tags.join(' ').toLowerCase()
        const matches = tagString.includes(value.toLowerCase())
        return matches
      },
      enableSorting: false,
      size: 200
    }),

    // 6. Status Column
    columnHelper.accessor((row) => row.status || row.currentStatus || row.data?.status || 'draft', {
      id: 'status',
      header: 'Status',
      cell: (info) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
          statusColors[info.getValue() as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        )}>
          {info.getValue()}
        </span>
      ),
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const status = testCase.status || testCase.currentStatus || testCase.data?.status || 'draft'
        return status.toLowerCase() === value.toLowerCase()
      },
      size: 100
    }),

    // 7. Priority Column
    columnHelper.accessor((row) => row.priority || row.data?.priority || 'medium', {
      id: 'priority',
      header: 'Priority',
      cell: (info) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
          priorityColors[info.getValue() as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'
        )}>
          {info.getValue()}
        </span>
      ),
      filterFn: (row, columnId, value) => {
        const testCase = row.original
        const priority = testCase.priority || testCase.data?.priority || 'medium'
        return priority.toLowerCase() === value.toLowerCase()
      },
      size: 100
    }),

    // 8. Author Column (Last Modified By / Created By)
    columnHelper.accessor((row) => row.lastModifiedBy || row.createdByName || row.createdBy || 'Unknown', {
      id: 'author',
      header: 'Author',
      cell: (info) => {
        const testCase = info.row.original
        const createdBy = testCase.createdByName || testCase.createdBy || 'Unknown'
        const updatedBy = testCase.lastModifiedBy || testCase.updatedBy || createdBy
        const createdAt = testCase.createdAt ? new Date(testCase.createdAt).toLocaleDateString() : ''
        const updatedAt = testCase.updatedAt ? new Date(testCase.updatedAt).toLocaleDateString() : ''

        // Get initials from name
        const getInitials = (name: string) => {
          if (!name || name === 'Unknown') return '??'
          if (name === 'dev-user') return 'DEV'
          return name.split(' ').map(n => n.charAt(0).toUpperCase()).join('').substring(0, 2)
        }

        const primaryUser = updatedBy !== createdBy ? updatedBy : createdBy
        const primaryDate = updatedBy !== createdBy ? updatedAt : createdAt
        const primaryInitials = getInitials(primaryUser)
        const isUpdated = updatedBy !== createdBy

        return (
          <div
            className="flex items-center justify-center"
            title={`${isUpdated ? 'Last modified by' : 'Created by'}: ${primaryUser} (${primaryDate})${isUpdated ? `\nOriginally created by: ${createdBy} (${createdAt})` : ''}`}
          >
            <div className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center ${
              isUpdated
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {primaryInitials}
            </div>
          </div>
        )
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const aUser = rowA.original.lastModifiedBy || rowA.original.createdByName || rowA.original.createdBy || ''
        const bUser = rowB.original.lastModifiedBy || rowB.original.createdByName || rowB.original.createdBy || ''
        return aUser.localeCompare(bUser)
      },
      size: 60
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
        const version = row.original.version || 1
        return (
          <div className="action-cell relative" data-testid={`actions-${row.original.id}`}>
            {version > 1 && (
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium z-10">
                {version}
              </div>
            )}
            <ActionButtons
              testCase={row.original}
              onEdit={onEdit}
              onView={onView}
              onVersionHistory={onVersionHistory}
              customActions={customActions}
              isDropdownOpen={openDropdownId === row.original.id}
              onToggleDropdown={() => {
                // Always close current dropdown if one is open
                if (openDropdownId && openDropdownId !== row.original.id) {
                  // Close the currently open dropdown and open the new one
                  setOpenDropdownId(row.original.id)
                } else if (openDropdownId === row.original.id) {
                  // Close the current dropdown if it's the same one
                  setOpenDropdownId(null)
                } else {
                  // Open the dropdown if none is open
                  setOpenDropdownId(row.original.id)
                }
              }}
            />
          </div>
        )
      },
      enableSorting: false,
      size: 120
    })
  ], [onEdit, onView, customActions])

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
      // Reset selection state if there's a mismatch
      setRowSelection({})
    }
  }, [rowSelection, selectedIds])

  
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
                
                // Clear column filters when doing global search to avoid conflicts
                if (searchValue.trim() && columnFilters.length > 0) {
                  setColumnFilters([])
                }
                
                setGlobalFilter(searchValue)
              }}
              className="pl-10 pr-10 w-80"
            />
            {globalFilter && (
              <button
                onClick={() => {
                  setGlobalFilter('')
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Project Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
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

            {/* 2. Module Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'module'), { id: 'module', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'module'))
                  }
                }}
              >
                <option value="">All Modules</option>
                {Array.from(new Set(data.map(tc => tc.module || tc.category || tc.data?.module).filter(Boolean))).map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            {/* 3. Feature Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Feature</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'feature'), { id: 'feature', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'feature'))
                  }
                }}
              >
                <option value="">All Features</option>
                {Array.from(new Set(data.map(tc => tc.feature || tc.data?.feature || tc.module).filter(Boolean))).map(feature => (
                  <option key={feature} value={feature}>{feature}</option>
                ))}
              </select>
            </div>

            {/* 4. Enhancement/Ticket Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enhancement/Ticket</label>
              <input
                type="text"
                placeholder="Filter by enhancement or ticket..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'enhancement'), { id: 'enhancement', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'enhancement'))
                  }
                }}
              />
            </div>

            {/* 5. Tag Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input 
                type="text"
                placeholder="Filter by tags (comma-separated)..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'tags'), { id: 'tags', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'tags'))
                  }
                }}
              />
            </div>

            {/* 6. Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
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

            {/* 7. Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
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

            {/* 8. Expected Result Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Result</label>
              <input
                type="text"
                placeholder="Filter by expected result..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    setColumnFilters([...columnFilters.filter(f => f.id !== 'expectedResult'), { id: 'expectedResult', value: e.target.value }])
                  } else {
                    setColumnFilters(columnFilters.filter(f => f.id !== 'expectedResult'))
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => {
                setColumnFilters([])
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
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Show All
            </button>
            <button
              onClick={() => {
                table.toggleAllColumnsVisible(false)
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