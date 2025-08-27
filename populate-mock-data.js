#!/usr/bin/env node

/**
 * Populate Mock Data Script
 * This script populates the browser's localStorage with enhanced mock data
 * including projects, enhancements, and tickets for testing the filtering system.
 */

// Enhanced mock data structure
const mockData = {
  projects: [
    {
      id: "PROJ-001",
      name: "E-commerce Platform",
      description: "Main e-commerce application with user management and shopping features",
      status: "active",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      testCaseCount: 3,
      templateCount: 2,
      memberCount: 5,
      ownerId: "user-001",
      ownerName: "John Doe"
    },
    {
      id: "PROJ-002",
      name: "API Gateway",
      description: "Centralized API management and authentication service",
      status: "active",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
      testCaseCount: 2,
      templateCount: 1,
      memberCount: 3,
      ownerId: "user-002",
      ownerName: "Jane Smith"
    },
    {
      id: "PROJ-003",
      name: "Payment System",
      description: "Secure payment processing and transaction management",
      status: "active",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      testCaseCount: 1,
      templateCount: 1,
      memberCount: 4,
      ownerId: "user-003",
      ownerName: "Mike Johnson"
    },
    {
      id: "PROJ-004",
      name: "Document Management",
      description: "File upload, storage, and management system",
      status: "active",
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-10"),
      testCaseCount: 1,
      templateCount: 1,
      memberCount: 2,
      ownerId: "user-001",
      ownerName: "John Doe"
    }
  ],
  
  testCases: [
    {
      id: "TC-0001",
      templateId: "template-001",
      projectId: "PROJ-001",
      data: {
        title: "User Login with Valid Credentials",
        description: "Test user authentication with valid email and password",
        feature: "User Authentication",
        enhancement: "ENH-001",
        ticketId: "TICKET-001"
      },
      status: "active",
      priority: "high",
      tags: ["login", "authentication", "positive", "happy-path"],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
      createdBy: "user-001",
      lastModifiedBy: "user-001",
      estimatedTime: 15,
      actualTime: 12,
      enhancement: "ENH-001",
      ticketId: "TICKET-001",
      epic: "EPIC-001",
      feature: "User Authentication",
      module: "User Authentication",
      testCase: "User Login with Valid Credentials",
      testSteps: [
        {
          step: 1,
          description: "Navigate to login page",
          testData: "URL: /login",
          expectedResult: "Login page displays with email and password fields"
        },
        {
          step: 2,
          description: "Enter valid email address",
          testData: "user@example.com",
          expectedResult: "Email field accepts input without validation errors"
        },
        {
          step: 3,
          description: "Enter valid password",
          testData: "SecurePass123!",
          expectedResult: "Password field accepts input and masks characters"
        },
        {
          step: 4,
          description: "Click login button",
          testData: "Submit button",
          expectedResult: "System validates credentials and redirects to dashboard"
        }
      ],
      testResult: "Not Executed",
      qa: "Verify successful login and proper session creation",
      remarks: "Positive test case for valid user authentication"
    },
    {
      id: "TC-0002",
      templateId: "template-001",
      projectId: "PROJ-001",
      data: {
        title: "User Login with Invalid Password",
        description: "Test user authentication with invalid password",
        feature: "User Authentication",
        enhancement: "ENH-002",
        ticketId: "TICKET-002"
      },
      status: "active",
      priority: "medium",
      tags: ["login", "authentication", "negative", "security"],
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
      createdBy: "user-001",
      lastModifiedBy: "user-001",
      estimatedTime: 10,
      actualTime: 8,
      enhancement: "ENH-002",
      ticketId: "TICKET-002",
      epic: "EPIC-001",
      feature: "User Authentication",
      module: "User Authentication",
      testCase: "User Login with Invalid Password",
      testSteps: [
        {
          step: 1,
          description: "Navigate to login page",
          testData: "URL: /login",
          expectedResult: "Login page displays"
        },
        {
          step: 2,
          description: "Enter valid email address",
          testData: "user@example.com",
          expectedResult: "Email field accepts input"
        },
        {
          step: 3,
          description: "Enter invalid password",
          testData: "wrongpassword",
          expectedResult: "Password field accepts input"
        },
        {
          step: 4,
          description: "Click login button",
          testData: "Submit button",
          expectedResult: "System shows error message: 'Invalid credentials'"
        }
      ],
      testResult: "Not Executed",
      qa: "Verify proper error handling and security",
      remarks: "Negative test case for invalid authentication"
    },
    {
      id: "TC-0003",
      templateId: "template-002",
      projectId: "PROJ-002",
      data: {
        title: "Create New User via API",
        description: "Test user creation through REST API",
        feature: "User Management",
        enhancement: "ENH-004",
        ticketId: "TICKET-004"
      },
      status: "active",
      priority: "high",
      tags: ["api", "user-management", "post", "positive"],
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
      createdBy: "user-002",
      lastModifiedBy: "user-002",
      estimatedTime: 20,
      actualTime: 18,
      enhancement: "ENH-004",
      ticketId: "TICKET-004",
      epic: "EPIC-002",
      feature: "User Management",
      module: "User Management API",
      testCase: "Create New User via API",
      testSteps: [
        {
          step: 1,
          description: "Prepare valid user data",
          testData: '{"name": "John Doe", "email": "john@example.com", "role": "user"}',
          expectedResult: "Valid JSON payload prepared"
        },
        {
          step: 2,
          description: "Send POST request to /api/users",
          testData: "POST /api/users with valid payload",
          expectedResult: "HTTP 201 Created response with user ID"
        }
      ],
      testResult: "Not Executed",
      qa: "Verify API endpoint functionality and data persistence",
      remarks: "Positive test case for user creation API"
    },
    {
      id: "TC-0004",
      templateId: "template-003",
      projectId: "PROJ-003",
      data: {
        title: "Credit Card Payment with Valid Details",
        description: "Test payment processing with valid credit card",
        feature: "Payment Processing",
        enhancement: "ENH-006",
        ticketId: "TICKET-006"
      },
      status: "active",
      priority: "critical",
      tags: ["payment", "credit-card", "positive", "gateway"],
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      createdBy: "user-003",
      lastModifiedBy: "user-003",
      estimatedTime: 25,
      actualTime: 22,
      enhancement: "ENH-006",
      ticketId: "TICKET-006",
      epic: "EPIC-003",
      feature: "Payment Processing",
      module: "Payment Processing",
      testCase: "Credit Card Payment with Valid Details",
      testSteps: [
        {
          step: 1,
          description: "Navigate to payment page",
          testData: "URL: /payment",
          expectedResult: "Payment form displays with card fields"
        },
        {
          step: 2,
          description: "Enter valid credit card number",
          testData: "4111 1111 1111 1111",
          expectedResult: "Card number field accepts input"
        }
      ],
      testResult: "Not Executed",
      qa: "Verify payment gateway integration",
      remarks: "Positive test case for credit card payments"
    },
    {
      id: "TC-0005",
      templateId: "template-004",
      projectId: "PROJ-004",
      data: {
        title: "Upload Large File Successfully",
        description: "Test large file upload functionality",
        feature: "File Management",
        enhancement: "ENH-007",
        ticketId: "TICKET-007"
      },
      status: "active",
      priority: "medium",
      tags: ["file-upload", "large-files", "progress-tracking"],
      createdAt: new Date("2024-02-10"),
      updatedAt: new Date("2024-02-10"),
      createdBy: "user-001",
      lastModifiedBy: "user-001",
      estimatedTime: 15,
      actualTime: 13,
      enhancement: "ENH-007",
      ticketId: "TICKET-007",
      epic: "EPIC-004",
      feature: "File Management",
      module: "File Upload System",
      testCase: "Upload Large File Successfully",
      testSteps: [
        {
          step: 1,
          description: "Navigate to file upload page",
          testData: "URL: /upload",
          expectedResult: "Upload form displays with file input"
        },
        {
          step: 2,
          description: "Select large file (50MB)",
          testData: "large-document.pdf (50MB)",
          expectedResult: "File selected and size displayed"
        }
      ],
      testResult: "Not Executed",
      qa: "Verify large file handling and progress tracking",
      remarks: "Test case for large file upload functionality"
    }
  ]
};

// Function to populate localStorage
function populateLocalStorage() {
  console.log('🚀 Populating localStorage with enhanced mock data...\n');
  
  // Store projects
  localStorage.setItem('testCaseWriter_projects', JSON.stringify(mockData.projects));
  console.log(`✅ Stored ${mockData.projects.length} projects`);
  
  // Store test cases in the expected format
  const testCaseSessions = [
    {
      id: 'session-001',
      name: 'Mock Test Case Generation Session',
      description: 'Enhanced mock data for testing filtering system',
      createdAt: new Date().toISOString(),
      testCases: mockData.testCases
    }
  ];
  
  localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(testCaseSessions));
  console.log(`✅ Stored ${mockData.testCases.length} test cases in 1 session`);
  
  // Display summary
  console.log('\n📊 Mock Data Summary:');
  console.log('='.repeat(50));
  console.log(`🏗️ Projects: ${mockData.projects.length}`);
  mockData.projects.forEach(project => {
    console.log(`   - ${project.id}: ${project.name}`);
  });
  
  console.log(`\n📝 Test Cases: ${mockData.testCases.length}`);
  mockData.testCases.forEach(tc => {
    console.log(`   - ${tc.id}: ${tc.data?.title || tc.testCase}`);
    console.log(`     Project: ${tc.projectId}, Feature: ${tc.feature}, Enhancement: ${tc.enhancement}, Ticket: ${tc.ticketId}`);
  });
  
  console.log('\n🎯 Now you can test the enhanced filtering system in the Library!');
  console.log('   - Filter by Project, Feature, Enhancement, Ticket, and Tags');
  console.log('   - Use the expand/collapse functionality');
  console.log('   - Test the search functionality');
}

// Function to clear localStorage
function clearLocalStorage() {
  console.log('🧹 Clearing localStorage...');
  localStorage.removeItem('testCaseWriter_projects');
  localStorage.removeItem('testCaseWriter_generatedTestCases');
  console.log('✅ localStorage cleared');
}

// Function to check current localStorage content
function checkLocalStorage() {
  console.log('🔍 Checking current localStorage content...\n');
  
  const projects = localStorage.getItem('testCaseWriter_projects');
  const testCases = localStorage.getItem('testCaseWriter_generatedTestCases');
  
  if (projects) {
    const parsedProjects = JSON.parse(projects);
    console.log(`📁 Projects found: ${parsedProjects.length}`);
    parsedProjects.forEach(project => {
      console.log(`   - ${project.id}: ${project.name}`);
    });
  } else {
    console.log('📁 No projects found');
  }
  
  if (testCases) {
    const parsedTestCases = JSON.parse(testCases);
    console.log(`\n📝 Test case sessions found: ${parsedTestCases.length}`);
    parsedTestCases.forEach(session => {
      console.log(`   - ${session.name}: ${session.testCases.length} test cases`);
    });
  } else {
    console.log('\n📝 No test cases found');
  }
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.populateMockData = populateLocalStorage;
  window.clearMockData = clearLocalStorage;
  window.checkMockData = checkLocalStorage;
  
  console.log('🎭 Mock Data Functions Available:');
  console.log('   - populateMockData() - Populate with enhanced mock data');
  console.log('   - clearMockData() - Clear all mock data');
  console.log('   - checkMockData() - Check current localStorage content');
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  console.log('🎭 TestCaseWriter - Mock Data Population Script\n');
  console.log('This script populates localStorage with enhanced mock data for testing.\n');
  console.log('To use in browser:');
  console.log('1. Open browser console on your app');
  console.log('2. Run: populateMockData()');
  console.log('3. Refresh the Library page to see the data');
}

module.exports = {
  mockData,
  populateLocalStorage,
  clearLocalStorage,
  checkLocalStorage
};
