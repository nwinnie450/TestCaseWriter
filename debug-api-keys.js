#!/usr/bin/env node

/**
 * Debug API Key Management System
 */

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

async function debugAPIKeys() {
  console.log('🔍 Debugging API Key Management System\n');
  
  try {
    // 1. List current API keys
    console.log('1️⃣  Listing current API keys...');
    const listResponse = await makeRequest('GET', '/api-keys');
    console.log(`Status: ${listResponse.status}`);
    if (listResponse.data.success) {
      const { apiKeys, total } = listResponse.data.data;
      console.log(`Found ${total} API keys:`);
      apiKeys.forEach(key => {
        console.log(`   - ${key.companyName}: ${key.key} (${key.isActive ? 'Active' : 'Inactive'})`);
      });
    } else {
      console.log('Error:', listResponse.data.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Create a new API key
    console.log('2️⃣  Creating new API key...');
    const timestamp = Date.now();
    const createData = {
      companyName: `Debug Company ${timestamp}`,
      contactEmail: `debug${timestamp}@example.com`,
      monthlyLimit: 1500,
      rateLimit: 120
    };
    
    const createResponse = await makeRequest('POST', '/api-keys', createData);
    console.log(`Status: ${createResponse.status}`);
    if (createResponse.data.success) {
      const { apiKey } = createResponse.data.data;
      console.log(`✅ Created API key: ${apiKey.key}`);
      console.log(`   Company: ${apiKey.companyName}`);
      console.log(`   ID: ${apiKey.id}`);
      
      // Store for later use
      global.newKeyId = apiKey.id;
      global.newKeyValue = apiKey.key;
    } else {
      console.log('Error:', createResponse.data.error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. List API keys again to see if new one appears
    console.log('3️⃣  Listing API keys after creation...');
    try {
      const listResponse2 = await makeRequest('GET', '/api-keys');
      console.log(`Status: ${listResponse2.status}`);
      if (listResponse2.data.success) {
        const { apiKeys, total } = listResponse2.data.data;
        console.log(`Found ${total} API keys:`);
        apiKeys.forEach(key => {
          console.log(`   - ${key.companyName}: ${key.key} (${key.isActive ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log('Error:', listResponse2.data.error);
      }
    } catch (error) {
      console.log('❌ Error in step 3:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 4. Try to update the new key
    console.log(`\n🔍 Debug: global.newKeyId = ${global.newKeyId}`);
    if (global.newKeyId) {
      console.log('4️⃣  Updating the new API key...');
      console.log(`   Key ID: ${global.newKeyId}`);
      console.log(`   URL: /api-keys?id=${global.newKeyId}`);
      
      const updateData = {
        monthlyLimit: 2000,
        rateLimit: 150
      };
      
      const updateResponse = await makeRequest('PUT', `/api-keys?id=${global.newKeyId}`, updateData);
      console.log(`Status: ${updateResponse.status}`);
      if (updateResponse.data.success) {
        console.log('✅ API key updated successfully');
      } else {
        console.log('Error:', updateResponse.data.error);
      }
    } else {
      console.log('⚠️  Skipping update - no newKeyId found');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 5. Try to deactivate the new key
    if (global.newKeyId) {
      console.log('5️⃣  Deactivating the new API key...');
      console.log(`   Key ID: ${global.newKeyId}`);
      console.log(`   URL: /api-keys?id=${global.newKeyId}`);
      
      const deleteResponse = await makeRequest('DELETE', `/api-keys?id=${global.newKeyId}`);
      console.log(`Status: ${deleteResponse.status}`);
      if (deleteResponse.data.success) {
        console.log('✅ API key deactivated successfully');
      } else {
        console.log('Error:', deleteResponse.data.error);
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 6. Final list to see changes
    console.log('6️⃣  Final list of API keys...');
    const finalResponse = await makeRequest('GET', '/api-keys');
    console.log(`Status: ${finalResponse.status}`);
    if (finalResponse.data.success) {
      const { apiKeys, total } = finalResponse.data.data;
      console.log(`Found ${total} API keys:`);
      apiKeys.forEach(key => {
        console.log(`   - ${key.companyName}: ${key.key} (${key.isActive ? 'Active' : 'Inactive'})`);
      });
    } else {
      console.log('Error:', finalResponse.data.error);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run debug
debugAPIKeys().catch(console.error);
