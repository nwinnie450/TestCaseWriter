// Core domain types for the Test Case Writer Agent

export interface User {
  id: string
  name: string
  email: string
  password: string
  avatar?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  testCaseCount: number
  templateCount: number
  memberCount: number
  status: 'active' | 'archived' | 'draft'
  ownerId?: string
  ownerName?: string
}

// Template System Types
export interface TemplateField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean' | 'file' | 'table'
  label: string
  placeholder?: string
  required: boolean
  maxLength?: number
  validation?: { pattern?: string } | string // regex pattern object or string
  defaultValue?: any
  options?: TemplateFieldOption[] | string[] // for select/multiselect
  width?: number // for layout
  order: number
  tableConfig?: TableFieldConfig // for table type fields
}

export interface TableFieldConfig {
  columns: TableColumn[]
}

export interface TableColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date'
  width?: string
  options?: string[]
}

export interface TemplateFieldOption {
  label: string
  value: string
}

export interface Template {
  id: string
  name: string
  description?: string
  fields: TemplateField[]
  version: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  parentTemplateId?: string // for inheritance
  projectId?: string
}

export interface TemplateVersion {
  id: string
  templateId: string
  version: number
  fields: TemplateField[]
  createdAt: Date
  createdBy: string
  changelog?: string
}

// Test Case Types
export interface TestCase {
  id: string
  templateId: string
  projectId: string
  data: Record<string, any> // field values
  status: 'draft' | 'active' | 'deprecated' | 'review'
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy?: string
  estimatedTime?: number // in minutes
  actualTime?: number // in minutes
  
  // Grouping and organization fields
  enhancement?: string // Enhancement ID or name
  ticketId?: string // Ticket/Issue ID
  epic?: string // Epic or larger initiative
  feature?: string // Feature category
  
  // Legacy fields (for backward compatibility)
  module?: string // Module/component
  testCase?: string // Test case description
  testSteps?: TestStep[] // Test steps
  testResult?: string // Test result
  qa?: string // QA notes
  remarks?: string // Additional remarks
}

export interface TestStep {
  step: number
  description: string
  testData?: string
  expectedResult: string
}

// Document Processing Types
export interface Document {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'md' | 'txt' | 'image'
  size: number
  content?: string
  extractedText?: string
  uploadedAt: Date
  status: 'uploading' | 'processing' | 'ready' | 'error'
  error?: string
  metadata?: Record<string, any>
}

// AI Generation Types
export interface GenerationConfig {
  templateId: string
  documents: string[] // document IDs
  coverage: 'comprehensive' | 'focused' | 'minimal'
  includeNegativeTests: boolean
  includeEdgeCases: boolean
  maxTestCases?: number
  customInstructions?: string
}

export interface GenerationJob {
  id: string
  config: GenerationConfig
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
  progress: number // 0-100
  currentStep?: string
  estimatedTimeRemaining?: number // seconds
  generatedTestCases: string[] // test case IDs
  error?: string
  startedAt: Date
  completedAt?: Date
}

// Export System Types
export interface ExportProfile {
  id: string
  name: string
  description?: string
  format: 'excel' | 'csv' | 'testrail' | 'jira' | 'confluence' | 'json'
  fieldMappings: FieldMapping[]
  connectionConfig?: ConnectionConfig
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FieldMapping {
  sourceField: string // template field ID or system field
  targetField: string
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'custom'
  customTransformation?: string // JS function
  defaultValue?: string
  required: boolean
}

export interface ConnectionConfig {
  type: 'testrail' | 'jira' | 'confluence'
  baseUrl: string
  username: string
  apiKey: string // encrypted
  projectKey?: string
  suiteId?: string
  customFields?: Record<string, string>
}

export interface ExportJob {
  id: string
  profileId: string
  testCaseIds: string[]
  status: 'pending' | 'exporting' | 'completed' | 'failed'
  progress: number
  resultUrl?: string
  error?: string
  exportedCount: number
  startedAt: Date
  completedAt?: Date
}

// UI State Types
export interface TableColumn<T> {
  key: keyof T
  title: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean'
  options?: { label: string; value: string }[]
  render?: (value: any, item: T) => React.ReactNode
}

export interface TableFilter {
  column: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'between'
  value: any
  values?: any[] // for between operator
}

export interface TableSort {
  column: string
  direction: 'asc' | 'desc'
}

export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Notification Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  actions?: NotificationAction[]
  createdAt: Date
  read: boolean
  autoClose?: boolean
  duration?: number
}

export interface NotificationAction {
  label: string
  action: () => void
}

// File Upload Types
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
  documentId?: string
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  status?: string[]
  priority?: string[]
  tags?: string[]
  createdDateRange?: [Date, Date]
  templateIds?: string[]
  projectIds?: string[]
}

// Activity and Audit Types
export interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'export' | 'generate'
  entityType: 'testcase' | 'template' | 'project' | 'document'
  entityId: string
  entityName: string
  userId: string
  userName: string
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}