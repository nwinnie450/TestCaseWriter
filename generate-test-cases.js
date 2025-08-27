#!/usr/bin/env node

/**
 * Generate Test Cases Example
 * Demonstrates how to use the TestCaseWriter API to generate test cases
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'demo-api-key-123';

function generateTestCases(requirements, template = 'standard_test_case') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      documents: [
        {
          content: requirements,
          fileName: 'requirements.txt'
        }
      ],
      template: {
        id: template,
        name: 'Standard Test Case'
      },
      config: {
        coverage: 'comprehensive',
        includeNegativeTests: true,
        includeEdgeCases: true,
        maxTestCases: 10,
        customInstructions: 'Generate detailed test cases with clear steps and expected results'
      },
      aiConfig: {
        providerId: 'claude',
        model: 'claude-3-5-sonnet',
        temperature: 0.3,
        maxTokens: 5000,
        documentFocused: true
      },
      metadata: {
        projectId: 'demo_project',
        enhancement: 'DEMO-001',
        tags: ['demo', 'generated']
      }
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/generate-test-cases',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: result
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Example requirements
const loginRequirements = `
User Authentication System Requirements:

1. User Login
   - Users must be able to login with valid email and password
   - System should validate credentials against database
   - Successful login should redirect to dashboard
   - Failed login should show appropriate error message
   - System should lock account after 3 failed attempts

2. Password Requirements
   - Password must be at least 8 characters long
   - Password must contain at least one uppercase letter
   - Password must contain at least one number
   - Password must contain at least one special character
   - Password cannot be the same as the last 3 passwords

3. Session Management
   - Session should expire after 30 minutes of inactivity
   - User should be able to logout
   - Multiple devices should be supported
   - Session should be invalidated on password change
`;

const apiRequirements = `
API Endpoint Testing Requirements:

1. User Management API
   - GET /api/users - List all users (admin only)
   - POST /api/users - Create new user
   - GET /api/users/:id - Get user by ID
   - PUT /api/users/:id - Update user
   - DELETE /api/users/:id - Delete user (admin only)

2. Authentication API
   - POST /api/auth/login - User login
   - POST /api/auth/logout - User logout
   - POST /api/auth/refresh - Refresh token
   - POST /api/auth/forgot-password - Reset password

3. Response Requirements
   - All responses should be in JSON format
   - Success responses should include status 200-299
   - Error responses should include appropriate HTTP status codes
   - All endpoints should validate input data
   - Rate limiting: 100 requests per minute per user
`;

async function runExamples() {
  console.log('🚀 TestCaseWriter - Generate Test Cases Examples\n');

  try {
    // Example 1: Login System Test Cases
    console.log('📝 Example 1: Generating Login System Test Cases...');
    const loginResult = await generateTestCases(loginRequirements);
    
    if (loginResult.status === 200 && loginResult.data.success) {
      const result = loginResult.data.data;
      console.log(`✅ Generated ${result.testCases.length} test cases`);
      console.log(`💰 Token usage: ${result.usage.totalTokens} tokens`);
      console.log(`💵 Cost: $${result.usage.cost.toFixed(6)}`);
      console.log(`⏱️  Generation time: ${result.generationTime}ms`);
      
      // Show first test case
      if (result.testCases.length > 0) {
        const firstTC = result.testCases[0];
        console.log(`\n📋 Sample Test Case:`);
        console.log(`   ID: ${firstTC.id}`);
        console.log(`   Module: ${firstTC.module}`);
        console.log(`   Description: ${firstTC.testCase}`);
        console.log(`   Priority: ${firstTC.priority}`);
        console.log(`   Steps: ${firstTC.testSteps?.length || 0}`);
      }
    } else {
      console.log(`❌ Failed to generate login test cases: ${loginResult.data.error?.message}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Example 2: API Testing Test Cases
    console.log('📝 Example 2: Generating API Testing Test Cases...');
    const apiResult = await generateTestCases(apiRequirements);
    
    if (apiResult.status === 200 && apiResult.data.success) {
      const result = apiResult.data.data;
      console.log(`✅ Generated ${result.testCases.length} test cases`);
      console.log(`💰 Token usage: ${result.usage.totalTokens} tokens`);
      console.log(`💵 Cost: $${result.usage.cost.toFixed(6)}`);
      console.log(`⏱️  Generation time: ${result.generationTime}ms`);
      
      // Show first test case
      if (result.testCases.length > 0) {
        const firstTC = result.testCases[0];
        console.log(`\n📋 Sample Test Case:`);
        console.log(`   ID: ${firstTC.id}`);
        console.log(`   Module: ${firstTC.module}`);
        console.log(`   Description: ${firstTC.testCase}`);
        console.log(`   Priority: ${firstTC.priority}`);
        console.log(`   Steps: ${firstTC.testSteps?.length || 0}`);
      }
    } else {
      console.log(`❌ Failed to generate API test cases: ${apiResult.data.error?.message}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run examples if this script is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  generateTestCases
};
