#!/usr/bin/env node

const http = require('http');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_API_KEY = 'demo-api-key-123';

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

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPIKeys() {
  console.log('🧪 Simple API Key Test\n');
  
  try {
    // Step 1: List current keys
    console.log('1️⃣  Listing current API keys...');
    const listResponse = await makeRequest('GET', '/api-keys');
    console.log(`Status: ${listResponse.status}`);
    if (listResponse.data.success) {
      const { apiKeys } = listResponse.data.data;
      console.log(`Found ${apiKeys.length} keys`);
      apiKeys.forEach(key => {
        console.log(`   - ${key.companyName}: ${key.key.substring(0, 20)}...`);
      });
    }
    
    console.log('\n' + '='.repeat(40));
    
    // Step 2: Create a new key
    console.log('2️⃣  Creating new API key...');
    const createData = {
      companyName: `Test Company ${Date.now()}`,
      contactEmail: `test${Date.now()}@example.com`,
      monthlyLimit: 1000,
      rateLimit: 100
    };
    
    const createResponse = await makeRequest('POST', '/api-keys', createData);
    console.log(`Status: ${createResponse.status}`);
    if (createResponse.data.success) {
      const { apiKey } = createResponse.data.data;
      console.log(`✅ Created: ${apiKey.key.substring(0, 20)}...`);
      console.log(`   ID: ${apiKey.id}`);
      
      // Store for next steps
      global.testKeyId = apiKey.id;
    } else {
      console.log('❌ Create failed:', createResponse.data.error);
      return;
    }
    
    console.log('\n' + '='.repeat(40));
    
    // Step 3: Update the key
    if (global.testKeyId) {
      console.log('3️⃣  Updating API key...');
      console.log(`   Key ID: ${global.testKeyId}`);
      
      const updateData = { monthlyLimit: 2000 };
      const updateResponse = await makeRequest('PUT', `/api-keys?id=${global.testKeyId}`, updateData);
      console.log(`Status: ${updateResponse.status}`);
      
      if (updateResponse.data.success) {
        console.log('✅ Update successful');
      } else {
        console.log('❌ Update failed:', updateResponse.data.error);
      }
    }
    
    console.log('\n' + '='.repeat(40));
    
    // Step 4: Deactivate the key
    if (global.testKeyId) {
      console.log('4️⃣  Deactivating API key...');
      console.log(`   Key ID: ${global.testKeyId}`);
      
      const deleteResponse = await makeRequest('DELETE', `/api-keys?id=${global.testKeyId}`);
      console.log(`Status: ${deleteResponse.status}`);
      
      if (deleteResponse.data.success) {
        console.log('✅ Deactivation successful');
      } else {
        console.log('❌ Deactivation failed:', deleteResponse.data.error);
      }
    }
    
    console.log('\n' + '='.repeat(40));
    
    // Step 5: Final list
    console.log('5️⃣  Final list...');
    const finalResponse = await makeRequest('GET', '/api-keys');
    console.log(`Status: ${finalResponse.status}`);
    if (finalResponse.data.success) {
      const { apiKeys } = finalResponse.data.data;
      console.log(`Found ${apiKeys.length} keys`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAPIKeys();
