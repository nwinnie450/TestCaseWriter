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

interface DataGridProps {
  data: TestCase[]
  onSelectionChange?: (selectedIds: string[]) => void
  onEdit?: (testCase: TestCase) => void
  onView?: (testCase: TestCase) => void
  onDelete?: (testCaseIds: string[]) => void
  onExport?: (testCaseIds: string[]) => void
  onBulkEdit?: (testCaseIds: string[]) => void
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
function ActionButtons({ testCase, onEdit, onView }: { 
  testCase: TestCase, 
  onEdit?: (testCase: TestCase) => void,
  onView?: (testCase: TestCase) => void 
}) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  
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
          saveGeneratedTestCases([duplicateTestCase], [], 'manual-duplicate')
          alert(`✅ Test case duplicated and saved as a new session!`)
          window.location.reload()
        }
      } else {
        // No existing sessions, create a new one
        const { saveGeneratedTestCases } = require('@/lib/test-case-storage')
        saveGeneratedTestCases([duplicateTestCase], [], 'manual-duplicate')
        alert(`✅ Test case duplicated and saved!`)
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
      <button 
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md border border-gray-200 hover:border-blue-300 bg-white shadow-sm transition-all duration-200"
        onMouseDown={handleEdit}
        title="Edit test case"
        type="button"
      >
        <Edit className="h-4 w-4" />
      </button>
      
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

  // Add missing expandAll and collapseAll functions
  const expandAll = () => {
    const allIds = new Set(data.map(tc => tc.id))
    console.log('🔴 DataGrid - Expanding all rows:', { 
      totalRows: data.length, 
      allIds: Array.from(allIds),
      currentExpandedRows: Array.from(expandedRows)
    })
    setExpandedRows(allIds)
  }

  const collapseAll = () => {
    console.log('🔴 DataGrid - Collapsing all rows:', {
      currentExpandedRows: Array.from(expandedRows)
    })
    setExpandedRows(new Set())
  }

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
      header: 'Test ID',
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
        const title = testCase.data?.title || testCase.testCase || 'Test Case'
        const description = testCase.data?.description || testCase.testCase || 'No description'
        const steps = testCase.testSteps || []
        const stepCount = steps.length
        const isExpanded = expandedRows.has(testCase.id)
        
        // Debug logging for test case data
        console.log('🔍 DataGrid - Test case data:', {
          id: testCase.id,
          title,
          description,
          stepsLength: steps.length,
          testSteps: testCase.testSteps,
          hasTestSteps: !!testCase.testSteps,
          isExpanded
        })
        
        const toggleExpanded = (e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          console.log('🔵 DataGrid - toggleExpanded called for:', testCase.id, 'Current expanded:', Array.from(expandedRows))
          
          const newExpanded = new Set(expandedRows)
          if (isExpanded) {
            console.log('🔵 DataGrid - Collapsing row:', testCase.id)
            newExpanded.delete(testCase.id)
          } else {
            console.log('🔵 DataGrid - Expanding row:', testCase.id)
            newExpanded.add(testCase.id)
          }
          
          console.log('🔵 DataGrid - New expanded set:', Array.from(newExpanded))
          setExpandedRows(newExpanded)
        }
        
        return (
          <div className="max-w-2xl space-y-2">
            {/* Header with Title and Toggle Button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium text-gray-900", isExpanded ? "" : "line-clamp-2")}>
                  {title}
                </p>
                <p className={cn("text-sm text-gray-600", isExpanded ? "" : "line-clamp-1")}>
                  {description}
                </p>
              </div>
              
              {/* Toggle Button */}
              <button
                onClick={toggleExpanded}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Steps - Always show in collapsed state, show all when expanded */}
            {stepCount > 0 && (
              <div className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-700">
                    {stepCount} Test Step{stepCount !== 1 ? 's' : ''}:
                  </p>
                  {!isExpanded && stepCount > 2 && (
                    <button
                      onClick={(e) => {
                        console.log('🟡 View All button clicked for:', testCase.id)
                        e.stopPropagation()
                        e.preventDefault()
                        console.log('🟡 About to call toggleExpanded() from View All')
                        toggleExpanded(e)
                        console.log('🟡 toggleExpanded() from View All called successfully')
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View All
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  {(isExpanded ? steps : steps.slice(0, 2)).map((step, index) => (
                    <div key={index} className="text-gray-600">
                      <p className={isExpanded ? "" : "line-clamp-1"}>
                        <span className="font-medium">{step.step}.</span> {step.description}
                      </p>
                      
                      {/* Show test data and expected result when expanded */}
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {step.testData && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Test Data:</span> {step.testData}
                            </p>
                          )}
                          <p className="text-xs text-green-600">
                            <span className="font-medium">Expected:</span> {step.expectedResult}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!isExpanded && stepCount > 2 && (
                    <p className="text-gray-500 italic">
                      +{stepCount - 2} more steps...
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Expected Result Summary (only show when collapsed) */}
            {!isExpanded && testCase.testSteps?.[0]?.expectedResult && (
              <div className="text-xs">
                <span className="font-medium text-green-700">Expected: </span>
                <span className="text-green-600 line-clamp-1">
                  {testCase.testSteps[0].expectedResult}
                </span>
              </div>
            )}
            
            {/* Additional info when expanded */}
            {isExpanded && (
              <div className="space-y-2 text-xs border-t border-gray-200 pt-2">
                {testCase.qa && (
                  <div>
                    <span className="font-medium text-yellow-700">QA Notes: </span>
                    <span className="text-yellow-600">{testCase.qa}</span>
                  </div>
                )}
                {testCase.remarks && (
                  <div>
                    <span className="font-medium text-gray-700">Remarks: </span>
                    <span className="text-gray-600">{testCase.remarks}</span>
                  </div>
                )}
              </div>
            )}
          </div>
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
      size: 100
    }),
    columnHelper.accessor((row) => row.data?.feature || row.feature || row.module || 'General', {
      header: 'Feature',
      cell: (info) => {
        const feature = info.getValue()
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {feature}
          </span>
        )
      },
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.projectId || row.projectId, {
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
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.enhancement || row.enhancement, {
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
      size: 120
    }),
    columnHelper.accessor((row) => row.data?.ticketId || row.ticketId, {
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
      size: 100
    }),
    columnHelper.accessor((row) => row.data?.tags || row.tags, {
      header: 'Tags',
      cell: (info) => {
        const tags = info.getValue() || []
        
        // Debug logging for tags
        console.log('🔍 Tags Column Debug:', {
          testCaseId: info.row.original.id,
          rootTags: info.row.original.tags,
          dataTags: info.row.original.data?.tags,
          finalTags: tags,
          tagsLength: tags.length
        })
        
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
      enableSorting: false,
      size: 200
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
    globalFilterFn: 'includesString',
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
              placeholder="Search test cases..."
              value={globalFilter}
              onChange={(e) => {
                console.log('🔍 Search input changed:', e.target.value)
                setGlobalFilter(e.target.value)
                console.log('🔍 Global filter set to:', e.target.value)
              }}
              className="pl-10 w-64"
            />
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
          
          <div className="flex items-center space-x-1 border-l border-gray-200 pl-4">
            <button 
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onClick={(e) => {
                console.log('🟡 Expand All button clicked!')
                e.preventDefault()
                e.stopPropagation()
                console.log('🟡 About to call expandAll()')
                expandAll()
                console.log('🟡 expandAll() called successfully')
              }}
              title="Expand all test cases"
              type="button"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Expand All
            </button>
            <button 
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onClick={(e) => {
                console.log('🟡 Collapse All button clicked!')
                e.preventDefault()
                e.stopPropagation()
                console.log('🟡 About to call collapseAll()')
                collapseAll()
                console.log('🟡 collapseAll() called successfully')
              }}
              title="Collapse all test cases"
              type="button"
            >
              <Minimize2 className="h-3 w-3 mr-1" />
              Collapse All
            </button>
          </div>
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