#!/usr/bin/env node

/**
 * Simple TestCaseWriter API Test
 * Tests basic endpoints without AI generation
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_KEY = 'demo-api-key-123';

function makeRequest(method, endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
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
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Simple TestCaseWriter API Test\n');
  
  try {
    // Test Templates
    console.log('📋 Testing Templates...');
    const templates = await makeRequest('GET', '/templates');
    console.log(`Status: ${templates.status}`);
    if (templates.data.success) {
      console.log(`Found ${templates.data.data.templates.length} templates`);
      templates.data.data.templates.forEach(t => {
        console.log(`  - ${t.name} (${t.id})`);
      });
    }
    console.log('');

    // Test AI Providers
    console.log('🤖 Testing AI Providers...');
    const providers = await makeRequest('GET', '/ai-providers');
    console.log(`Status: ${providers.status}`);
    if (providers.data.success) {
      console.log(`Found ${providers.data.data.totalProviders} providers`);
      providers.data.data.providers.forEach(p => {
        console.log(`  - ${p.name}: ${p.models.length} models`);
      });
    }
    console.log('');

    // Test Token Usage
    console.log('📊 Testing Token Usage...');
    const usage = await makeRequest('GET', '/token-usage');
    console.log(`Status: ${usage.status}`);
    if (usage.data.success) {
      const stats = usage.data.data.stats;
      console.log(`Total tokens: ${stats.totalTokens.toLocaleString()}`);
      console.log(`Total cost: $${stats.totalCost.toFixed(6)}`);
    }
    console.log('');

    // Test Export
    console.log('📤 Testing Export...');
    const exportData = {
      testCaseIds: ['TC-0001', 'TC-0002'],
      format: 'csv'
    };
    
    const exportReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/export',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(exportData).length
      }
    }, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          console.log(`Status: ${res.statusCode}`);
          if (result.success) {
            console.log(`Exported ${result.data.exportedCount} test cases`);
            console.log(`Format: ${result.data.format}`);
          }
        } catch (e) {
          console.log('Export response:', responseData);
        }
      });
    });
    
    exportReq.write(JSON.stringify(exportData));
    exportReq.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEndpoints();
