# TestCaseWriter API - Complete Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Sample Requests & Responses](#sample-requests--responses)
6. [Testing](#testing)
7. [Error Handling](#error-handling)
8. [Configuration](#configuration)
9. [Implementation Details](#implementation-details)
10. [Examples](#examples)

---

## 🎯 Overview

TheTestCaseWriter API enables AI-powered test case generation, template management, and test case export functionality. It supports multiple AI providers (OpenAI, Claude, Gemini, Grok) and provides comprehensive test case generation capabilities.

**Base URLs:**
- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://your-domain.com/api/v1`

---

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Basic Endpoints
```bash
# Test all endpoints
node test-local.js

# Test simple endpoints
node simple-test.js

# See mock data demo
node mock-test-cases.js
```

### 3. Quick cURL Test
```bash
# Test AI Providers (should work immediately)
curl -X GET "http://localhost:3001/api/v1/ai-providers" \
  -H "Authorization: Bearer demo-api-key-123"

# Test Templates
curl -X GET "http://localhost:3001/api/v1/templates" \
  -H "Authorization: Bearer demo-api-key-123"
```

### 4. Test API Key Management
```bash
# Test API key management system
node test-api-keys.js

# Or test individual endpoints:
# List all API keys
curl -X GET "http://localhost:3001/api/v1/api-keys" \
  -H "Authorization: Bearer demo-api-key-123"

# Create new API key
curl -X POST "http://localhost:3001/api/v1/api-keys" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "TechCorp Solutions",
    "contactEmail": "api@techcorp.com",
    "monthlyLimit": 2000,
    "rateLimit": 150
  }'
```

---

## 🔑 Authentication

All API endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer demo-api-key-123
```

**Default API Key**: `demo-api-key-123` (for development)

**Production**: Replace with your actual API key in environment variables.

---

## 🔑 API Key Management System

The TestCaseWriter API includes a comprehensive API key management system that allows you to:

### **Features:**
- **Create API Keys**: Generate unique keys for different companies/users
- **Rate Limiting**: Set per-minute request limits for each key
- **Usage Tracking**: Monitor monthly usage and costs per API key
- **Key Management**: Update, deactivate, and manage API keys
- **Usage Analytics**: Track endpoint usage, response times, and costs

### **How It Works:**
1. **Admin creates API keys** for different companies
2. **Companies use their keys** to access the API
3. **System tracks usage** per key (requests, tokens, costs)
4. **Rate limiting** prevents abuse
5. **Monthly limits** control costs per company

### **Default Admin Key**: `demo-api-key-123`
This key has full access to manage other API keys and test the system.

---

## 📡 API Endpoints

### 1. **GET /templates** - Get Available Templates
Retrieves test case templates for generating test cases.

**Query Parameters:**
- `projectId` (optional): Filter by project ID
- `isPublished` (optional): Filter by published status
- `limit` (optional): Number of templates (default: 50, max: 100)
- `offset` (optional): Number to skip (default: 0)

### 2. **GET /ai-providers** - Get AI Providers
Lists available AI providers, models, and pricing information.

**No parameters required.**

### 3. **POST /generate-test-cases** - Generate Test Cases
Generates test cases using AI based on requirements and configuration.

**Required Body Fields:**
- `documents`: Array of requirement documents
- `template`: Template configuration
- `config`: Generation settings
- `aiConfig`: AI provider configuration

### 4. **GET /token-usage** - Get Token Usage
Retrieves token usage statistics and cost information.

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `providerId` (optional): Filter by AI provider
- `operation` (optional): Filter by operation type
- `limit` (optional): Number of records (default: 100)
- `offset` (optional): Number to skip (default: 0)

### 5. **POST /export** - Export Test Cases
Exports test cases in various formats (CSV, JSON, Excel, TestRail, Jira).

**Required Body Fields:**
- `testCaseIds`: Array of test case IDs to export
- `format`: Export format

### 6. **GET /api-keys** - List API Keys (Admin Only)
Lists all API keys with usage information.

**Query Parameters:**
- `includeUsage` (optional): Include detailed usage history (default: false)

### 7. **POST /api-keys** - Create API Key
Creates a new API key for a company.

**Required Body Fields:**
- `companyName`: Company name
- `contactEmail`: Contact email address
- `monthlyLimit` (optional): Monthly request limit (default: 1000)
- `rateLimit` (optional): Requests per minute limit (default: 100)

### 8. **PUT /api-keys** - Update API Key
Updates API key settings.

**Query Parameters:**
- `id`: API key ID to update

**Body Fields:**
- `isActive` (optional): Enable/disable the key
- `monthlyLimit` (optional): Update monthly limit
- `rateLimit` (optional): Update rate limit
- `contactEmail` (optional): Update contact email

### 9. **DELETE /api-keys** - Deactivate API Key
Deactivates an API key (soft delete).

**Query Parameters:**
- `id`: API key ID to deactivate

---

## 📝 Sample Requests & Responses

### 1. **Get Templates**

#### Request
```bash
curl -X GET "http://localhost:3001/api/v1/templates?limit=5" \
  -H "Authorization: Bearer demo-api-key-123"
```

#### Response
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "standard_test_case",
        "name": "Standard Test Case",
        "description": "Basic test case template with essential fields",
        "fields": [
          {
            "id": "test_case_id",
            "type": "text",
            "label": "Test Case ID",
            "required": true
          },
          {
            "id": "module",
            "type": "text",
            "label": "Module",
            "required": true
          }
        ],
        "isPublished": true,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 4,
      "limit": 5,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### 2. **Get AI Providers**

#### Request
```bash
curl -X GET "http://localhost:3001/api/v1/ai-providers" \
  -H "Authorization: Bearer demo-api-key-123"
```

#### Response
```json
{
  "success": true,
  "data": {
    "providers": [
      {
        "id": "openai",
        "name": "OpenAI",
        "models": [
          {
            "id": "gpt-4o",
            "name": "GPT-4 Omni",
            "inputCostPer1kTokens": 0.005,
            "outputCostPer1kTokens": 0.015,
            "maxTokens": 128000
          }
        ]
      },
      {
        "id": "claude",
        "name": "Anthropic Claude",
        "models": [
          {
            "id": "claude-3-5-sonnet",
            "name": "Claude 3.5 Sonnet",
            "inputCostPer1kTokens": 0.003,
            "outputCostPer1kTokens": 0.015,
            "maxTokens": 200000
          }
        ]
      }
    ],
    "totalProviders": 4
  }
}
```

### 3. **Generate Test Cases**

#### Request
```bash
curl -X POST "http://localhost:3001/api/v1/generate-test-cases" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "User should be able to login with valid credentials and access the dashboard. Password must be at least 8 characters with uppercase, lowercase, number, and special character.",
        "fileName": "login_requirements.txt"
      }
    ],
    "template": {
      "id": "standard_test_case",
      "name": "Standard Test Case"
    },
    "config": {
      "coverage": "comprehensive",
      "includeNegativeTests": true,
      "includeEdgeCases": true,
      "maxTestCases": 10,
      "customInstructions": "Focus on security testing and edge cases"
    },
    "aiConfig": {
      "providerId": "claude",
      "model": "claude-3-5-sonnet",
      "temperature": 0.3,
      "maxTokens": 4000,
      "documentFocused": true
    },
    "metadata": {
      "projectId": "auth_project_001",
      "enhancement": "AUTH-001",
      "ticketId": "TICKET-123",
      "tags": ["authentication", "security", "login"]
    }
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "testCases": [
      {
        "id": "TC-0001",
        "module": "User Authentication",
        "testCase": "User Login with Valid Credentials",
        "testSteps": [
          {
            "step": 1,
            "description": "Navigate to login page",
            "testData": "URL: /login",
            "expectedResult": "Login page displays with email and password fields"
          },
          {
            "step": 2,
            "description": "Enter valid email address",
            "testData": "user@example.com",
            "expectedResult": "Email field accepts input without validation errors"
          }
        ],
        "priority": "high",
        "tags": ["login", "authentication", "positive"]
      }
    ],
    "usage": {
      "inputTokens": 1500,
      "outputTokens": 3000,
      "totalTokens": 4500,
      "cost": 0.0675
    },
    "generationTime": 2500
  }
}
```

### 4. **Get Token Usage**

#### Request
```bash
curl -X GET "http://localhost:3001/api/v1/token-usage?providerId=claude&limit=10" \
  -H "Authorization: Bearer demo-api-key-123"
```

#### Response
```json
{
  "success": true,
  "data": {
    "usageHistory": [
      {
        "id": "1",
        "date": "2024-12-01T10:00:00Z",
        "operation": "generate_test_cases",
        "providerId": "claude",
        "model": "claude-3-5-sonnet",
        "totalTokens": 4500,
        "cost": 0.0675,
        "testCasesGenerated": 15
      }
    ],
    "stats": {
      "totalTokens": 4500,
      "totalCost": 0.0675,
      "thisMonth": {"tokens": 4500, "cost": 0.0675},
      "today": {"tokens": 4500, "cost": 0.0675}
    }
  }
}
```

### 5. **Export Test Cases**

#### Request
```bash
curl -X POST "http://localhost:3001/api/v1/export" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "testCaseIds": ["TC-0001", "TC-0002"],
    "format": "csv",
    "profile": {
      "name": "Standard Export",
      "fieldMappings": [
        {"sourceField": "id", "targetField": "Test Case ID"},
        {"sourceField": "module", "targetField": "Module"},
        {"sourceField": "testCase", "targetField": "Description"}
      ]
    }
  }'
```

#### Response
```json
{
  "success": true,
  "data": {
    "exportJobId": "export_123456",
    "status": "completed",
    "format": "csv",
    "exportedCount": 2,
    "downloadUrl": "http://localhost:3001/api/v1/export/download/export_123456",
    "fileSize": "2.5KB"
  }
}
```

---

## 🧪 Testing

### **Quick Test Commands**

```bash
# 1. Start the server
npm run dev

# 2. Test all endpoints comprehensively
node test-local.js

# 3. Test basic functionality
node simple-test.js

# 4. See mock data examples
node mock-test-cases.js
```

### **Individual Endpoint Tests**

```bash
# Test Templates
curl -X GET "http://localhost:3001/api/v1/templates" \
  -H "Authorization: Bearer demo-api-key-123"

# Test AI Providers
curl -X GET "http://localhost:3001/api/v1/ai-providers" \
  -H "Authorization: Bearer demo-api-key-123"

# Test Token Usage
curl -X GET "http://localhost:3001/api/v1/token-usage" \
  -H "Authorization: Bearer demo-api-key-123"

# Test Export
curl -X POST "http://localhost:3001/api/v1/export" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{"testCaseIds": ["TC-0001"], "format": "csv"}'
```

### **Test Scripts Overview**

- **`test-local.js`**: Comprehensive test suite for all endpoints
- **`simple-test.js`**: Basic endpoint testing without AI generation
- **`mock-test-cases.js`**: Demonstrates expected output format

---

## ❌ Error Handling

### **Common Error Responses**

#### 400 Bad Request (Validation Error)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request body",
    "details": [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined",
        "path": ["documents", 0, "content"],
        "message": "Required"
      }
    ]
  }
}
```

#### 401 Unauthorized (Invalid API Key)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An internal error occurred",
    "details": "Error details here"
  }
}
```

### **Error Codes Reference**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `RATE_LIMITED` | 429 | Too many requests |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported |
| `INTERNAL_ERROR` | 500 | Server-side error |

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env.local` file in your project root:

```bash
# API Configuration
VALID_API_KEYS=demo-api-key-123,your-production-key-here

# AI Provider API Keys (for actual AI generation)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
GOOGLE_API_KEY=your-gemini-key-here
GROK_API_KEY=your-grok-key-here

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### **API Key Setup**

1. **Development**: Uses `demo-api-key-123` by default
2. **Production**: Set `VALID_API_KEYS` environment variable
3. **Multiple Keys**: Separate with commas: `key1,key2,key3`

---

## 🏗️ Implementation Details

### **File Structure**
```
src/app/api/v1/
├── generate-test-cases/route.ts    # AI test case generation
├── templates/route.ts              # Template management
├── ai-providers/route.ts           # AI provider info
├── token-usage/route.ts            # Usage tracking
└── export/route.ts                 # Test case export

src/lib/
├── api-auth.ts                     # Authentication middleware
├── ai-providers.ts                 # AI provider implementations
└── openai.ts                       # OpenAI integration
```

### **Key Technologies**
- **Next.js 14**: API routes and server-side rendering
- **Zod**: Request/response validation
- **TypeScript**: Type safety and interfaces
- **Mock Data**: Sample data for development/testing

### **Authentication Flow**
1. Extract Bearer token from Authorization header
2. Validate against configured API keys
3. Apply rate limiting (if enabled)
4. Process request with authenticated context

---

## 💡 Examples

### **JavaScript/Node.js Integration**

```javascript
class TestCaseWriterAPI {
  constructor(apiKey, baseUrl = 'http://localhost:3001/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async generateTestCases(requirements, template = 'standard_test_case') {
    const response = await fetch(`${this.baseUrl}/generate-test-cases`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents: [{ content: requirements, fileName: 'requirements.txt' }],
        template: { id: template, name: 'Standard Test Case' },
        config: {
          coverage: 'comprehensive',
          includeNegativeTests: true,
          maxTestCases: 10
        },
        aiConfig: {
          providerId: 'claude',
          model: 'claude-3-5-sonnet'
        }
      })
    });

    return response.json();
  }

  async getTemplates(limit = 50) {
    const response = await fetch(`${this.baseUrl}/templates?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async getAIProviders() {
    const response = await fetch(`${this.baseUrl}/ai-providers`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }
}

// Usage
const api = new TestCaseWriterAPI('demo-api-key-123');
const testCases = await api.generateTestCases('User login functionality');
```

### **Python Integration**

```python
import requests

class TestCaseWriterAPI:
    def __init__(self, api_key, base_url="http://localhost:3001/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {api_key}"}

    def generate_test_cases(self, requirements, template="standard_test_case"):
        payload = {
            "documents": [{"content": requirements, "fileName": "requirements.txt"}],
            "template": {"id": template, "name": "Standard Test Case"},
            "config": {
                "coverage": "comprehensive",
                "includeNegativeTests": True,
                "maxTestCases": 10
            },
            "aiConfig": {
                "providerId": "claude",
                "model": "claude-3-5-sonnet"
            }
        }
        
        response = requests.post(
            f"{self.base_url}/generate-test-cases",
            json=payload,
            headers=self.headers
        )
        return response.json()

    def get_templates(self, limit=50):
        response = requests.get(
            f"{this.base_url}/templates?limit={limit}",
            headers=self.headers
        )
        return response.json()

# Usage
api = TestCaseWriterAPI("demo-api-key-123")
test_cases = api.generate_test_cases("User login functionality")
```

### **cURL Examples for Different Scenarios**

#### **Simple Login Test Case Generation**
```bash
curl -X POST "http://localhost:3001/api/v1/generate-test-cases" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{"content": "User login with email and password", "fileName": "login.txt"}],
    "template": {"id": "standard_test_case", "name": "Standard Test Case"},
    "config": {"coverage": "basic", "maxTestCases": 5},
    "aiConfig": {"providerId": "claude", "model": "claude-3-5-sonnet"}
  }'
```

#### **API Testing Requirements**
```bash
curl -X POST "http://localhost:3001/api/v1/generate-test-cases" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{"content": "Test API endpoints: GET /users, POST /users, PUT /users/:id", "fileName": "api_requirements.txt"}],
    "template": {"id": "api_test_case", "name": "API Test Case"},
    "config": {"coverage": "comprehensive", "includeNegativeTests": true, "maxTestCases": 15},
    "aiConfig": {"providerId": "openai", "model": "gpt-4o"}
  }'
```

#### **Performance Testing**
```bash
curl -X POST "http://localhost:3001/api/v1/generate-test-cases" \
  -H "Authorization: Bearer demo-api-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [{"content": "Test system performance under 1000 concurrent users", "fileName": "performance_requirements.txt"}],
    "template": {"id": "performance_test", "name": "Performance Test Case"},
    "config": {"coverage": "exhaustive", "maxTestCases": 20},
    "aiConfig": {"providerId": "claude", "model": "claude-3-5-sonnet"}
  }'
```

---

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **1. "Port 3000 is in use"**
```bash
# The server will automatically try port 3001
# Update your API calls to use port 3001
curl -X GET "http://localhost:3001/api/v1/templates" \
  -H "Authorization: Bearer demo-api-key-123"
```

#### **2. "Invalid API key" Error**
```bash
# Check that you're using the correct API key
Authorization: Bearer demo-api-key-123

# For production, set VALID_API_KEYS environment variable
```

#### **3. "AI provider not configured" Error**
```bash
# Set up AI provider API keys in .env.local
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### **4. Test Scripts Not Working**
```bash
# Make sure the development server is running
npm run dev

# Check the correct port (3001 if 3000 is busy)
# Update test scripts to use the correct port
```

---

## 📚 Additional Resources

### **Related Files**
- **`API_DOCUMENTATION.md`**: Detailed API reference
- **`API_README.md`**: Quick start guide
- **`API_IMPLEMENTATION_SUMMARY.md`**: Technical overview

### **Test Scripts**
- **`test-local.js`**: Comprehensive API testing
- **`simple-test.js`**: Basic endpoint testing
- **`mock-test-cases.js`**: Mock data demonstration

### **API Routes**
- **`/api/v1/generate-test-cases`**: AI test case generation
- **`/api/v1/templates`**: Template management
- **`/api/v1/ai-providers`**: AI provider information
- **`/api/v1/token-usage`**: Usage tracking
- **`/api/v1/export`**: Test case export

---

## 🆘 Support & Next Steps

### **Getting Help**
1. **Check Error Responses**: Review the error codes and messages
2. **Test Scripts**: Use the provided test scripts to validate functionality
3. **Documentation**: Refer to the detailed documentation files
4. **Mock Data**: Use mock data for testing without AI API keys

### **Next Steps for Production**
1. **Database Integration**: Replace mock data with real database
2. **AI Provider Keys**: Set up actual AI provider API keys
3. **Rate Limiting**: Configure production rate limiting
4. **Monitoring**: Add logging and monitoring
5. **Security**: Implement proper API key management

### **Development Workflow**
1. **Start Server**: `npm run dev`
2. **Test Endpoints**: Use test scripts or cURL
3. **Modify Code**: Update API routes as needed
4. **Test Changes**: Validate with test scripts
5. **Deploy**: Move to production when ready

---

*This complete guide contains all API-related information in one place for easy management and reference.*

*Last updated: December 2024*
