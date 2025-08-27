#!/usr/bin/env node

/**
 * TestCaseWriter API Local Test Script
 * 
 * This script tests the API endpoints on your local development server.
 * 
 * Usage: node test-local.js
 */

const http = require('http');

// Configuration for local development
const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'demo-api-key-123';

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestCaseWriter-API-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}. Raw response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testGetTemplates() {
  console.log('\n🔍 Testing GET /templates...');
  
  try {
    const response = await makeRequest('GET', '/templates');
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      console.log(`📋 Found ${response.data.data.templates.length} templates`);
      
      response.data.data.templates.forEach(template => {
        console.log(`   - ${template.name} (${template.id})`);
      });
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetAIProviders() {
  console.log('\n🤖 Testing GET /ai-providers...');
  
  try {
    const response = await makeRequest('GET', '/ai-providers');
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      console.log(`🤖 Found ${response.data.data.totalProviders} AI providers`);
      
      response.data.data.providers.forEach(provider => {
        console.log(`   - ${provider.name} (${provider.id})`);
        console.log(`     Models: ${provider.models.length}`);
      });
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGenerateTestCases() {
  console.log('\n🚀 Testing POST /generate-test-cases...');
  
  const testData = {
    documents: [
      {
        content: `User Authentication Requirements:
        
1. User Login
   - Users must be able to login with valid email and password
   - System should validate credentials against database
   - Successful login should redirect to dashboard
   - Failed login should show error message
   
2. Password Requirements
   - Password must be at least 8 characters long
   - Password must contain at least one uppercase letter
   - Password must contain at least one number
   - Password must contain at least one special character`,
        fileName: 'auth_requirements.txt'
      }
    ],
    template: {
      id: 'standard_test_case',
      name: 'Standard Test Case'
    },
    config: {
      coverage: 'comprehensive',
      includeNegativeTests: true,
      includeEdgeCases: true,
      maxTestCases: 10,
      customInstructions: 'Focus on security testing and edge cases'
    },
    aiConfig: {
      providerId: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 4000,
      documentFocused: true
    },
    metadata: {
      projectId: 'auth_project_001',
      enhancement: 'AUTH-001',
      ticketId: 'TICKET-123',
      tags: ['authentication', 'security', 'login']
    }
  };
  
  try {
    const response = await makeRequest('POST', '/generate-test-cases', testData);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const result = response.data.data;
      console.log(`🎯 Generated ${result.testCases.length} test cases`);
      console.log(`💰 Token usage: ${result.usage.totalTokens} tokens`);
      console.log(`💵 Cost: $${result.usage.cost.toFixed(6)}`);
      console.log(`⏱️  Generation time: ${result.generationTime}ms`);
      
      // Show first test case as example
      if (result.testCases.length > 0) {
        const firstTC = result.testCases[0];
        console.log(`\n📝 Example Test Case:`);
        console.log(`   ID: ${firstTC.id}`);
        console.log(`   Module: ${firstTC.module}`);
        console.log(`   Description: ${firstTC.testCase}`);
        console.log(`   Priority: ${firstTC.priority}`);
        console.log(`   Steps: ${firstTC.testSteps?.length || 0}`);
      }
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
      if (response.data.error?.details) {
        console.error(`   Details:`, response.data.error.details);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetTokenUsage() {
  console.log('\n📊 Testing GET /token-usage...');
  
  try {
    const response = await makeRequest('GET', '/token-usage');
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const stats = response.data.data.stats;
      console.log(`📈 Total tokens used: ${stats.totalTokens.toLocaleString()}`);
      console.log(`💰 Total cost: $${stats.totalCost.toFixed(6)}`);
      console.log(`📅 This month: ${stats.thisMonth.tokens.toLocaleString()} tokens, $${stats.thisMonth.cost.toFixed(6)}`);
      console.log(`📅 Today: ${stats.today.tokens.toLocaleString()} tokens, $${stats.today.cost.toFixed(6)}`);
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testExport() {
  console.log('\n📤 Testing POST /export...');
  
  const exportData = {
    testCaseIds: ['TC-0001', 'TC-0002'],
    format: 'csv',
    profile: {
      name: 'Standard Export',
      fieldMappings: [
        { sourceField: 'id', targetField: 'Test Case ID' },
        { sourceField: 'module', targetField: 'Module' },
        { sourceField: 'testCase', targetField: 'Description' }
      ]
    }
  };
  
  try {
    const response = await makeRequest('POST', '/export', exportData);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const result = response.data.data;
      console.log(`📤 Export completed: ${result.exportedCount} test cases`);
      console.log(`📁 Format: ${result.format.toUpperCase()}`);
      console.log(`📥 Download: ${result.downloadUrl}`);
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 TestCaseWriter API Local Test Suite');
  console.log('=======================================');
  console.log(`🌐 Testing against: ${API_BASE_URL}`);
  console.log(`🔑 Using API key: ${API_KEY}`);
  
  const tests = [
    { name: 'Get Templates', fn: testGetTemplates },
    { name: 'Get AI Providers', fn: testGetAIProviders },
    { name: 'Generate Test Cases', fn: testGenerateTestCases },
    { name: 'Get Token Usage', fn: testGetTokenUsage },
    { name: 'Export Test Cases', fn: testExport }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n${'='.repeat(50)}`);
    const success = await test.fn();
    if (success) passed++;
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  makeRequest,
  testGetTemplates,
  testGetAIProviders,
  testGenerateTestCases,
  testGetTokenUsage,
  testExport,
  runTests
};
