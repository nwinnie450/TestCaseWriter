import { TestCase } from '@/types'

const STORAGE_KEY = 'testCaseWriter_generatedTestCases'

export interface TestCaseSession {
  id: string
  generatedAt: Date
  testCases: TestCase[]
  documentNames: string[]
  model: string
  totalCount: number
  projectId?: string
  projectName?: string
}

// Mock test cases with many steps for testing expand/collapse
const mockTestCasesForTesting: TestCase[] = [
  {
    id: 'TC-MOCK-001',
    testCase: 'Comprehensive User Login Flow Validation',
    module: 'Authentication',
    priority: 'high',
    status: 'active',
    testSteps: [
      { step: 1, description: 'Navigate to the application login page', testData: 'Browser URL: https://app.example.com/login', expectedResult: 'Login page loads with username and password fields visible' },
      { step: 2, description: 'Verify page elements are present', testData: 'N/A', expectedResult: 'Username field, password field, login button, and forgot password link are visible' },
      { step: 3, description: 'Enter valid username in username field', testData: 'username: testuser@company.com', expectedResult: 'Username is entered without validation errors' },
      { step: 4, description: 'Enter valid password in password field', testData: 'password: SecurePass123!', expectedResult: 'Password is masked with asterisks or dots' },
      { step: 5, description: 'Click the Login button', testData: 'N/A', expectedResult: 'Login button triggers authentication process with loading indicator' },
      { step: 6, description: 'Verify successful authentication', testData: 'N/A', expectedResult: 'User is redirected to dashboard page' },
      { step: 7, description: 'Check user session is established', testData: 'N/A', expectedResult: 'User profile menu displays logged-in user name' },
      { step: 8, description: 'Verify dashboard content loads', testData: 'N/A', expectedResult: 'Dashboard widgets and navigation menu are fully loaded' }
    ],
    testResult: 'Not Executed',
    qa: 'QA Team',
    remarks: 'Mock data for testing expand/collapse functionality',
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      title: 'Comprehensive User Login Flow Validation',
      description: 'This test validates the complete user login process from page load to successful authentication',
      tags: ['authentication', 'login', 'security', 'user-interface']
    }
  },
  {
    id: 'TC-MOCK-002',
    testCase: 'E-commerce Shopping Cart Full Workflow',
    module: 'Shopping',
    priority: 'critical',
    status: 'active',
    testSteps: [
      { step: 1, description: 'Navigate to product catalog page', testData: 'URL: /products', expectedResult: 'Product catalog displays with search and filter options' },
      { step: 2, description: 'Search for specific product', testData: 'search term: "wireless headphones"', expectedResult: 'Search results show relevant products with images and prices' },
      { step: 3, description: 'Select a product from search results', testData: 'product: Sony WH-1000XM4', expectedResult: 'Product detail page opens with specifications and reviews' },
      { step: 4, description: 'Choose product variant and quantity', testData: 'color: black, quantity: 2', expectedResult: 'Selected options are highlighted, price updates accordingly' },
      { step: 5, description: 'Add product to shopping cart', testData: 'N/A', expectedResult: 'Success message appears, cart icon shows updated item count' },
      { step: 6, description: 'Navigate to shopping cart page', testData: 'N/A', expectedResult: 'Cart page displays added items with correct quantities and prices' },
      { step: 7, description: 'Update item quantity in cart', testData: 'new quantity: 1', expectedResult: 'Quantity updates, total price recalculates automatically' },
      { step: 8, description: 'Apply discount coupon', testData: 'coupon code: SAVE10', expectedResult: 'Discount is applied, total price reduces by 10%' },
      { step: 9, description: 'Proceed to checkout', testData: 'N/A', expectedResult: 'Checkout page loads with order summary and payment options' },
      { step: 10, description: 'Complete payment process', testData: 'card: 4111111111111111, cvv: 123', expectedResult: 'Order confirmation page displays with order number' }
    ],
    testResult: 'Not Executed',
    qa: 'E-commerce Team',
    remarks: 'Mock data for testing expand/collapse functionality',
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      title: 'E-commerce Shopping Cart Full Workflow',
      description: 'End-to-end test of shopping cart functionality from product search to order completion',
      tags: ['e-commerce', 'shopping-cart', 'payment', 'checkout', 'integration']
    }
  },
  {
    id: 'TC-MOCK-003',
    testCase: 'File Upload and Processing System Test',
    module: 'File Management',
    priority: 'medium',
    status: 'active',
    testSteps: [
      { step: 1, description: 'Navigate to file upload section', testData: 'URL: /upload', expectedResult: 'Upload interface displays with drag-drop area and browse button' },
      { step: 2, description: 'Select multiple files for upload', testData: 'files: document.pdf, image.jpg, spreadsheet.xlsx', expectedResult: 'Selected files appear in upload queue with file details' },
      { step: 3, description: 'Validate file type restrictions', testData: 'forbidden file: executable.exe', expectedResult: 'Error message appears for unsupported file types' },
      { step: 4, description: 'Check file size limitations', testData: 'large file: 50MB video.mp4', expectedResult: 'Warning message for files exceeding size limit' },
      { step: 5, description: 'Start upload process', testData: 'N/A', expectedResult: 'Progress bars appear showing upload status for each file' },
      { step: 6, description: 'Monitor upload progress', testData: 'N/A', expectedResult: 'Progress updates in real-time, estimated time remaining shown' },
      { step: 7, description: 'Verify successful file upload', testData: 'N/A', expectedResult: 'Success checkmarks appear, uploaded files listed in file manager' },
      { step: 8, description: 'Test file preview functionality', testData: 'preview: document.pdf', expectedResult: 'PDF document opens in preview mode within the application' },
      { step: 9, description: 'Download uploaded file', testData: 'download: image.jpg', expectedResult: 'File downloads to default download location with original filename' }
    ],
    testResult: 'Not Executed',
    qa: 'File System Team',
    remarks: 'Mock data for testing expand/collapse functionality',
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      title: 'File Upload and Processing System Test',
      description: 'Comprehensive testing of file upload, validation, processing, and download features',
      tags: ['file-upload', 'validation', 'processing', 'download', 'ui-testing']
    }
  }
]

export function saveGeneratedTestCases(testCases: TestCase[], documentNames: string[] = [], model: string = 'gpt-4o', projectId?: string, projectName?: string): string {
  try {
    // Debug logging for test cases being saved
    console.log('🔍 Storage Debug - Saving test cases:', testCases.map(tc => ({
      id: tc.id,
      rootTags: tc.tags,
      dataTags: tc.data?.tags,
      hasRootTags: tc.tags && tc.tags.length > 0,
      hasDataTags: tc.data?.tags && tc.data.tags.length > 0
    })))
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session: TestCaseSession = {
      id: sessionId,
      generatedAt: new Date(),
      testCases,
      documentNames,
      model,
      totalCount: testCases.length,
      projectId,
      projectName
    }

    // Get existing sessions
    const existingSessions = getStoredTestCaseSessions()
    
    // Add new session (keep only last 10 sessions to avoid storage bloat)
    const updatedSessions = [session, ...existingSessions.slice(0, 9)]
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
    console.log('✅ Test cases saved to localStorage:', { sessionId, count: testCases.length })
    
    return sessionId
  } catch (error) {
    console.error('❌ Failed to save test cases to localStorage:', error)
    throw new Error('Failed to save test cases. Your browser storage may be full.')
  }
}

export function getStoredTestCaseSessions(): TestCaseSession[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const sessions = JSON.parse(stored) as TestCaseSession[]
    // Convert date strings back to Date objects with proper validation
    return sessions.map(session => ({
      ...session,
      generatedAt: session.generatedAt ? new Date(session.generatedAt) : new Date(),
      testCases: session.testCases.map(testCase => ({
        ...testCase,
        createdAt: testCase.createdAt ? new Date(testCase.createdAt) : new Date(),
        updatedAt: testCase.updatedAt ? new Date(testCase.updatedAt) : new Date()
      }))
    }))
  } catch (error) {
    console.error('❌ Failed to load test cases from localStorage:', error)
    return []
  }
}

export function getLatestTestCases(): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  if (sessions.length === 0) return []
  
  return sessions[0].testCases
}

export function getTestCasesBySessionId(sessionId: string): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  const session = sessions.find(s => s.id === sessionId)
  return session?.testCases || []
}

export function getAllStoredTestCases(): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  const allTestCases: TestCase[] = []
  
  sessions.forEach(session => {
    allTestCases.push(...session.testCases)
  })
  
  return allTestCases
}

export function deleteTestCasesByIds(testCaseIds: string[]): void {
  try {
    const sessions = getStoredTestCaseSessions()
    
    // Remove test cases with matching IDs from all sessions
    const updatedSessions = sessions.map(session => ({
      ...session,
      testCases: session.testCases.filter(tc => !testCaseIds.includes(tc.id)),
      totalCount: session.testCases.filter(tc => !testCaseIds.includes(tc.id)).length
    })).filter(session => session.testCases.length > 0) // Remove empty sessions
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
    console.log(`✅ Deleted ${testCaseIds.length} test cases from localStorage`)
  } catch (error) {
    console.error('❌ Failed to delete test cases:', error)
    throw new Error('Failed to delete test cases')
  }
}

export function clearStoredTestCases(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ Cleared all stored test cases')
  } catch (error) {
    console.error('❌ Failed to clear stored test cases:', error)
  }
}

export function getTestCasesByProjectId(projectId: string): TestCase[] {
  const sessions = getStoredTestCaseSessions()
  const testCasesForProject: TestCase[] = []
  
  sessions.forEach(session => {
    // Filter test cases that belong to this project (either from session or individual test case projectId)
    const matchingTestCases = session.testCases.filter(tc => 
      tc.projectId === projectId || session.projectId === projectId
    )
    testCasesForProject.push(...matchingTestCases)
  })
  
  return testCasesForProject
}

export function getProjectTestCaseStats(projectId: string): { total: number, byStatus: Record<string, number>, byPriority: Record<string, number> } {
  const testCases = getTestCasesByProjectId(projectId)
  
  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  
  testCases.forEach(tc => {
    byStatus[tc.status] = (byStatus[tc.status] || 0) + 1
    byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1
  })
  
  return {
    total: testCases.length,
    byStatus,
    byPriority
  }
}

export function getStorageStats(): { sessions: number, totalTestCases: number, storageSize: string } {
  const sessions = getStoredTestCaseSessions()
  const totalTestCases = getAllStoredTestCases().length
  const storageData = localStorage.getItem(STORAGE_KEY) || ''
  const storageSize = `${Math.round(storageData.length / 1024)} KB`
  
  return {
    sessions: sessions.length,
    totalTestCases,
    storageSize
  }
}

export function loadMockTestCases(): string {
  try {
    console.log('🎭 Loading mock test cases for expand/collapse testing...')
    return saveGeneratedTestCases(mockTestCasesForTesting, ['Mock Data'], 'mock-generator')
  } catch (error) {
    console.error('❌ Failed to load mock test cases:', error)
    throw new Error('Failed to load mock test cases')
  }
}

export function cleanupDuplicateTestCaseIds(): void {
  try {
    const sessions = getStoredTestCaseSessions()
    let hasDuplicates = false
    
    // Check for duplicate IDs across all sessions
    const allIds = new Set<string>()
    const duplicateIds = new Set<string>()
    
    sessions.forEach(session => {
      session.testCases.forEach(tc => {
        if (allIds.has(tc.id)) {
          duplicateIds.add(tc.id)
          hasDuplicates = true
        } else {
          allIds.add(tc.id)
        }
      })
    })
    
    if (hasDuplicates) {
      console.log('🔍 Found duplicate test case IDs:', Array.from(duplicateIds))
      
      // Regenerate IDs for test cases with duplicates
      const updatedSessions = sessions.map(session => ({
        ...session,
        testCases: session.testCases.map(tc => {
          if (duplicateIds.has(tc.id)) {
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 5)
            const newId = `TC-${timestamp}-${randomSuffix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            console.log(`🔄 Regenerating ID: ${tc.id} → ${newId}`)
            return { ...tc, id: newId }
          }
          return tc
        })
      }))
      
      // Save updated sessions
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
      console.log('✅ Cleaned up duplicate test case IDs')
    } else {
      console.log('✅ No duplicate test case IDs found')
    }
  } catch (error) {
    console.error('❌ Failed to cleanup duplicate test case IDs:', error)
  }
}