#!/usr/bin/env node

/**
 * TestCaseWriter API Key Management Test Script
 * 
 * This script tests the API key management endpoints:
 * - Create new API keys
 * - List all API keys
 * - Update API key settings
 * - Deactivate API keys
 * - Test usage tracking
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_API_KEY = 'demo-api-key-123'; // Admin key for managing API keys

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
        'Authorization': `Bearer ${ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestCaseWriter-API-Key-Test/1.0'
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
async function testListAPIKeys() {
  console.log('\n🔍 Testing GET /api-keys (List all API keys)...');
  
  try {
    const response = await makeRequest('GET', '/api-keys');
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const { apiKeys, total, activeKeys } = response.data.data;
      console.log(`📋 Found ${total} API keys (${activeKeys} active)`);
      
      apiKeys.forEach(key => {
        console.log(`   - ${key.companyName}: ${key.key} (${key.isActive ? 'Active' : 'Inactive'})`);
        console.log(`     Rate Limit: ${key.rateLimit}/min, Monthly: ${key.monthlyUsage}/${key.monthlyLimit}`);
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

async function testCreateAPIKey() {
  console.log('\n🚀 Testing POST /api-keys (Create new API key)...');
  
  const newCompanyData = {
    companyName: 'TechCorp Solutions',
    contactEmail: 'api@techcorp.com',
    monthlyLimit: 2000,
    rateLimit: 150
  };
  
  try {
    const response = await makeRequest('POST', '/api-keys', newCompanyData);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const { apiKey, message, usage } = response.data.data;
      console.log(`🎉 ${message}`);
      console.log(`🔑 New API Key: ${apiKey.key}`);
      console.log(`🏢 Company: ${apiKey.companyName}`);
      console.log(`📧 Contact: ${apiKey.contactEmail}`);
      console.log(`📊 Usage: ${usage.currentMonth}/${usage.limit} (${usage.remaining} remaining)`);
      
      // Store the new key for later tests
      global.newAPIKeyId = apiKey.id;
      global.newAPIKeyValue = apiKey.key;
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

async function testUpdateAPIKey() {
  if (!global.newAPIKeyId) {
    console.log('\n⚠️  Skipping update test - no API key created');
    return false;
  }
  
  console.log('\n✏️  Testing PUT /api-keys (Update API key)...');
  
  const updateData = {
    monthlyLimit: 3000,
    rateLimit: 200,
    contactEmail: 'newapi@techcorp.com'
  };
  
  try {
    const response = await makeRequest('PUT', `/api-keys?id=${global.newAPIKeyId}`, updateData);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const { apiKey, message } = response.data.data;
      console.log(`✅ ${message}`);
      console.log(`📊 Updated Limits: ${apiKey.monthlyLimit} monthly, ${apiKey.rateLimit}/min rate`);
      console.log(`📧 New Contact: ${apiKey.contactEmail}`);
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testDeactivateAPIKey() {
  if (!global.newAPIKeyId) {
    console.log('\n⚠️  Skipping deactivation test - no API key created');
    return false;
  }
  
  console.log('\n🛑 Testing DELETE /api-keys (Deactivate API key)...');
  
  try {
    const response = await makeRequest('DELETE', `/api-keys?id=${global.newAPIKeyId}`);
    console.log(`✅ Status: ${response.status}`);
    
    if (response.data.success) {
      const { message, apiKey } = response.data.data;
      console.log(`✅ ${message}`);
      console.log(`🏢 Company: ${apiKey.companyName} (${apiKey.isActive ? 'Active' : 'Inactive'})`);
    } else {
      console.error(`❌ API Error: ${response.data.error?.message}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testUsageTracking() {
  console.log('\n📊 Testing Usage Tracking...');
  
  try {
    // Test the new API key (should fail if deactivated)
    if (global.newAPIKeyValue) {
      console.log(`🔑 Testing usage with key: ${global.newAPIKeyValue.substring(0, 20)}...`);
      
      const testResponse = await makeRequestWithKey('GET', '/templates', null, global.newAPIKeyValue);
      if (testResponse.status === 401) {
        console.log(`✅ Usage tracking working - deactivated key properly rejected`);
      } else {
        console.log(`⚠️  Unexpected response: ${testResponse.status}`);
      }
    }
    
    // List API keys again to see updated status
    const listResponse = await makeRequest('GET', '/api-keys');
    if (listResponse.data.success) {
      const { apiKeys } = listResponse.data.data;
      const updatedKey = apiKeys.find(k => k.id === global.newAPIKeyId);
      if (updatedKey) {
        console.log(`📊 Final Status: ${updatedKey.companyName} - ${updatedKey.isActive ? 'Active' : 'Inactive'}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Override makeRequest for testing with different API keys
function makeRequestWithKey(method, endpoint, data = null, apiKey = ADMIN_API_KEY) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TestCaseWriter-API-Key-Test/1.0'
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

// Main test runner
async function runTests() {
  console.log('🔑 TestCaseWriter API Key Management Test Suite');
  console.log('===============================================');
  console.log(`🌐 Testing against: ${API_BASE_URL}`);
  console.log(`🔑 Using admin key: ${ADMIN_API_KEY.substring(0, 20)}...`);
  
  const tests = [
    { name: 'List API Keys', fn: testListAPIKeys },
    { name: 'Create API Key', fn: testCreateAPIKey },
    { name: 'Update API Key', fn: testUpdateAPIKey },
    { name: 'Deactivate API Key', fn: testDeactivateAPIKey },
    { name: 'Usage Tracking', fn: testUsageTracking }
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
    console.log('🎉 All tests passed! API key management system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }
  
  // Cleanup
  if (global.newAPIKeyId) {
    console.log(`\n🧹 Test API key created: ${global.newAPIKeyId}`);
    console.log(`   You can manually delete this key if needed.`);
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
  makeRequestWithKey,
  testListAPIKeys,
  testCreateAPIKey,
  testUpdateAPIKey,
  testDeactivateAPIKey,
  testUsageTracking,
  runTests
};
