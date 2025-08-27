/**
 * Demo Management Features
 * 
 * This script helps you test the Test Case Management features by:
 * 1. Creating sample test cases with versions
 * 2. Creating sample change requests
 * 3. Demonstrating the versioning system
 * 
 * Run this in your browser console on the management page to populate it with demo data.
 */

console.log('🚀 Starting Test Case Management Demo...')

// Sample test cases for demonstration
const demoTestCases = [
  {
    id: 'TC-DEMO-001',
    templateId: 'template-demo',
    projectId: 'project-demo',
    data: {
      title: 'User Login Validation',
      description: 'Test user authentication flow',
      environment: 'Production'
    },
    status: 'active',
    priority: 'high',
    tags: ['authentication', 'login', 'security'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'demo-user',
    version: 2,
    module: 'User Authentication',
    testCase: 'Login with valid credentials',
    testSteps: [
      { step: 1, description: 'Navigate to login page', expectedResult: 'Login page loads' },
      { step: 2, description: 'Enter valid username', expectedResult: 'Username field accepts input' },
      { step: 3, description: 'Enter valid password', expectedResult: 'Password field accepts input' },
      { step: 4, description: 'Click login button', expectedResult: 'User is logged in successfully' }
    ],
    testResult: 'Passed',
    qa: 'Tested in Chrome and Firefox',
    remarks: 'Critical path test case'
  },
  {
    id: 'TC-DEMO-002',
    templateId: 'template-demo',
    projectId: 'project-demo',
    data: {
      title: 'Shopping Cart Functionality',
      description: 'Test e-commerce cart operations',
      environment: 'Staging'
    },
    status: 'draft',
    priority: 'medium',
    tags: ['e-commerce', 'shopping-cart', 'ui'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
    createdBy: 'demo-user',
    version: 1,
    module: 'E-commerce',
    testCase: 'Add items to shopping cart',
    testSteps: [
      { step: 1, description: 'Browse product catalog', expectedResult: 'Products are displayed' },
      { step: 2, description: 'Select a product', expectedResult: 'Product details are shown' },
      { step: 3, description: 'Click add to cart', expectedResult: 'Item appears in cart' }
    ],
    testResult: 'Not tested',
    qa: 'QA Team',
    remarks: 'Basic functionality test'
  }
]

// Sample versions for demonstration
const demoVersions = [
  {
    id: 'v-demo-001',
    testCaseId: 'TC-DEMO-001',
    version: 1,
    data: {
      title: 'User Login Validation',
      description: 'Test user authentication flow',
      environment: 'Production'
    },
    status: 'draft',
    priority: 'medium',
    tags: ['authentication', 'login'],
    testSteps: [
      { step: 1, description: 'Navigate to login page', expectedResult: 'Login page loads' },
      { step: 2, description: 'Enter valid username', expectedResult: 'Username field accepts input' }
    ],
    testResult: 'Not tested',
    changelog: 'Initial test case creation',
    changeType: 'create',
    changedFields: ['all'],
    createdAt: new Date('2024-01-01'),
    createdBy: 'demo-user',
    isApproved: true,
    approvedBy: 'demo-user',
    approvalDate: new Date('2024-01-01')
  },
  {
    id: 'v-demo-002',
    testCaseId: 'TC-DEMO-001',
    version: 2,
    data: {
      title: 'User Login Validation',
      description: 'Test user authentication flow',
      environment: 'Production'
    },
    status: 'active',
    priority: 'high',
    tags: ['authentication', 'login', 'security'],
    testSteps: [
      { step: 1, description: 'Navigate to login page', expectedResult: 'Login page loads' },
      { step: 2, description: 'Enter valid username', expectedResult: 'Username field accepts input' },
      { step: 3, description: 'Enter valid password', expectedResult: 'Password field accepts input' },
      { step: 4, description: 'Click login button', expectedResult: 'User is logged in successfully' }
    ],
    testResult: 'Passed',
    changelog: 'Added password step and updated priority to high',
    changeType: 'update',
    changedFields: ['testSteps', 'priority', 'tags'],
    createdAt: new Date('2024-01-15'),
    createdBy: 'demo-user',
    isApproved: true,
    approvedBy: 'demo-user',
    approvalDate: new Date('2024-01-16')
  }
]

// Sample change requests for demonstration
const demoChangeRequests = [
  {
    id: 'cr-demo-001',
    testCaseId: 'TC-DEMO-001',
    requestedBy: 'demo-user-2',
    requestedAt: new Date('2024-01-20'),
    currentVersion: 2,
    proposedChanges: [
      {
        field: 'testSteps',
        oldValue: 'Current test steps',
        newValue: 'Updated test steps with edge cases',
        reason: 'Need to cover more edge cases for better test coverage'
      }
    ],
    status: 'pending',
    priority: 'medium'
  }
]

// Function to populate localStorage with demo data
function populateDemoData() {
  try {
    // Store demo test cases
    const existingSessions = JSON.parse(localStorage.getItem('testCaseWriter_generatedTestCases') || '[]')
    const demoSession = {
      id: 'demo-session',
      generatedAt: new Date(),
      testCases: demoTestCases,
      documentNames: ['Demo Document'],
      model: 'demo-model',
      totalCount: demoTestCases.length,
      projectId: 'project-demo',
      projectName: 'Demo Project'
    }
    
    // Add demo session if it doesn't exist
    if (!existingSessions.find(s => s.id === 'demo-session')) {
      existingSessions.push(demoSession)
      localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(existingSessions))
      console.log('✅ Added demo test cases')
    }

    // Store demo versions
    localStorage.setItem('testCaseManager_versions', JSON.stringify(demoVersions))
    console.log('✅ Added demo versions')

    // Store demo change requests
    localStorage.setItem('testCaseManager_changeRequests', JSON.stringify(demoChangeRequests))
    console.log('✅ Added demo change requests')

    console.log('🎉 Demo data populated successfully!')
    console.log('📊 Demo includes:')
    console.log(`   - ${demoTestCases.length} test cases`)
    console.log(`   - ${demoVersions.length} versions`)
    console.log(`   - ${demoChangeRequests.length} change requests`)
    
    // Refresh the page to show the new data
    console.log('🔄 Refreshing page to show demo data...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('❌ Failed to populate demo data:', error)
  }
}

// Function to clear demo data
function clearDemoData() {
  try {
    // Remove demo session from test cases
    const existingSessions = JSON.parse(localStorage.getItem('testCaseWriter_generatedTestCases') || '[]')
    const filteredSessions = existingSessions.filter(s => s.id !== 'demo-session')
    localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(filteredSessions))
    
    // Clear management data
    localStorage.removeItem('testCaseManager_versions')
    localStorage.removeItem('testCaseManager_changeRequests')
    
    console.log('🧹 Demo data cleared successfully!')
    console.log('🔄 Refreshing page...')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
    
  } catch (error) {
    console.error('❌ Failed to clear demo data:', error)
  }
}

// Function to show demo status
function showDemoStatus() {
  const testCases = JSON.parse(localStorage.getItem('testCaseWriter_generatedTestCases') || '[]')
  const versions = JSON.parse(localStorage.getItem('testCaseManager_versions') || '[]')
  const changeRequests = JSON.parse(localStorage.getItem('testCaseManager_changeRequests') || '[]')
  
  console.log('📊 Current Demo Status:')
  console.log(`   Test Cases: ${testCases.reduce((acc, s) => acc + s.testCases.length, 0)}`)
  console.log(`   Versions: ${versions.length}`)
  console.log(`   Change Requests: ${changeRequests.length}`)
  
  if (testCases.find(s => s.id === 'demo-session')) {
    console.log('✅ Demo data is present')
  } else {
    console.log('❌ No demo data found')
  }
}

// Add functions to global scope for easy access
window.demoManagement = {
  populate: populateDemoData,
  clear: clearDemoData,
  status: showDemoStatus
}

console.log('🎯 Demo Management functions available:')
console.log('   - window.demoManagement.populate() - Add demo data')
console.log('   - window.demoManagement.clear() - Remove demo data')
console.log('   - window.demoManagement.status() - Show current status')
console.log('')
console.log('💡 Run window.demoManagement.populate() to start the demo!') 