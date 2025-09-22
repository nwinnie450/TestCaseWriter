// Simple script to test execution page functionality
// Run this in the browser console on http://localhost:3014/execution

console.log('🚀 Starting execution page test script...');

// Test 1: Check if page loaded
console.log('✅ Test 1: Page loaded - looking for TestExecutionPage log');

// Test 2: Check if runs are loaded
console.log('✅ Test 2: Checking for execution runs...');
setTimeout(() => {
  // Look for the runs in the global scope or React DevTools
  console.log('🔍 After 2 seconds, checking for execution data...');
}, 2000);

// Test 3: Manually trigger run loading
console.log('✅ Test 3: Testing API directly...');
fetch('/api/runs?limit=50')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Direct API call result:', data);
    console.log('📊 Number of runs:', data.runs?.length || 0);
    if (data.runs && data.runs.length > 0) {
      console.log('📊 First run:', data.runs[0]);
    }
  })
  .catch(error => {
    console.error('❌ API call failed:', error);
  });

// Test 4: Check for dropdown element
console.log('✅ Test 4: Looking for run dropdown...');
setTimeout(() => {
  const dropdown = document.querySelector('select');
  if (dropdown) {
    console.log('📊 Found dropdown with options:', dropdown.options.length);
    for (let i = 0; i < dropdown.options.length; i++) {
      console.log(`   Option ${i}: ${dropdown.options[i].text}`);
    }
  } else {
    console.log('❌ No dropdown found');
  }
}, 1000);

console.log('🔚 Test script setup complete. Watch console for results...');