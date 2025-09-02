import { NextRequest, NextResponse } from 'next/server'

// Mock data structure
const mockData = {
  projects: [
    {
      id: "PROJ-001",
      name: "E-commerce Platform",
      description: "Main e-commerce application with user management and shopping features",
      status: "active",
      createdAt: new Date("2024-01-15").toISOString(),
      updatedAt: new Date("2024-01-15").toISOString(),
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
      createdAt: new Date("2024-01-20").toISOString(),
      updatedAt: new Date("2024-01-20").toISOString(),
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
      createdAt: new Date("2024-02-01").toISOString(),
      updatedAt: new Date("2024-02-01").toISOString(),
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
      createdAt: new Date("2024-02-10").toISOString(),
      updatedAt: new Date("2024-02-10").toISOString(),
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
      createdAt: new Date("2024-01-15").toISOString(),
      updatedAt: new Date("2024-01-15").toISOString(),
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
      createdAt: new Date("2024-01-16").toISOString(),
      updatedAt: new Date("2024-01-16").toISOString(),
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
      createdAt: new Date("2024-01-20").toISOString(),
      updatedAt: new Date("2024-01-20").toISOString(),
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
      createdAt: new Date("2024-02-01").toISOString(),
      updatedAt: new Date("2024-02-01").toISOString(),
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
      createdAt: new Date("2024-02-10").toISOString(),
      updatedAt: new Date("2024-02-10").toISOString(),
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
}

export async function GET(request: NextRequest) {
  try {
    // Disable mock data in production
    if (process.env.NODE_ENV === 'production' || process.env.DISABLE_MOCK_DATA === 'true') {
      return NextResponse.json({
        success: false,
        message: "Mock data is disabled in production environment",
        data: { projects: [], testCases: [] }
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      message: "Mock data retrieved successfully",
      data: mockData
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to retrieve mock data", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Disable mock data in production
    if (process.env.NODE_ENV === 'production' || process.env.DISABLE_MOCK_DATA === 'true') {
      return NextResponse.json({
        success: false,
        message: "Mock data population is disabled in production environment",
        data: { projects: [], testCases: [] }
      }, { status: 403 })
    }

    const { action } = await request.json()
    
    if (action === 'populate') {
      // Return the data that should be stored in localStorage
      return NextResponse.json({
        success: true,
        message: "Mock data ready for localStorage population",
        data: {
          projects: mockData.projects,
          testCases: mockData.testCases,
          localStorageScript: `
// Run this in browser console to populate localStorage
const mockData = ${JSON.stringify(mockData, null, 2)};

// Store projects
localStorage.setItem('testCaseWriter_projects', JSON.stringify(mockData.projects));

// Store test cases in the expected format
const testCaseSessions = [{
  id: 'session-001',
  name: 'Mock Test Case Generation Session',
  description: 'Enhanced mock data for testing filtering system',
  createdAt: new Date().toISOString(),
  testCases: mockData.testCases
}];

localStorage.setItem('testCaseWriter_generatedTestCases', JSON.stringify(testCaseSessions));

console.log('✅ Mock data populated successfully!');
console.log(\`📁 Projects: \${mockData.projects.length}\`);
console.log(\`📝 Test Cases: \${mockData.testCases.length}\`);
          `
        }
      })
    }
    
    return NextResponse.json(
      { success: false, message: "Invalid action. Use 'populate' action." },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to process request", error: String(error) },
      { status: 500 }
    )
  }
}
