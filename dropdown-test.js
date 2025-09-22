// Test script for dropdown functionality on /execution page
// Run this in browser console at http://localhost:3014/execution

console.log('🚀 Starting dropdown test script...');

// Wait for page to load
setTimeout(() => {
  console.log('🔍 Testing dropdown functionality after 3 seconds...');

  // 1. Check if dropdown exists
  const dropdown = document.querySelector('select');
  if (!dropdown) {
    console.error('❌ Dropdown not found!');
    return;
  }

  console.log('✅ Dropdown found with', dropdown.options.length, 'options');

  // 2. List all dropdown options
  for (let i = 0; i < dropdown.options.length; i++) {
    console.log(`   Option ${i}: "${dropdown.options[i].text}" (value: ${dropdown.options[i].value})`);
  }

  // 3. Find first real run option (not the default "Select..." option)
  let runOption = null;
  for (let i = 1; i < dropdown.options.length; i++) {
    if (dropdown.options[i].value && dropdown.options[i].value !== '') {
      runOption = dropdown.options[i];
      break;
    }
  }

  if (!runOption) {
    console.error('❌ No run options found in dropdown!');
    return;
  }

  console.log('🎯 Will test with run:', runOption.text, '(ID:', runOption.value + ')');

  // 4. Test dropdown selection
  console.log('🔄 Triggering dropdown change event...');
  dropdown.value = runOption.value;

  // Manually trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  dropdown.dispatchEvent(changeEvent);

  console.log('✅ Change event dispatched. Watch console for debugging logs...');

  // 5. Check if test cases appear after 3 seconds
  setTimeout(() => {
    const testCaseElements = document.querySelectorAll('.test-case, .test-case-item');
    console.log('📊 Test case elements found after selection:', testCaseElements.length);

    const testCasesList = document.querySelector('.test-cases');
    if (testCasesList) {
      console.log('✅ Test cases container found');
      console.log('📄 Container content length:', testCasesList.innerHTML.length);
    } else {
      console.log('❌ Test cases container not found');
    }

    // Check for loading indicator
    const loadingIndicator = document.querySelector('p:contains("Loading test cases...")');
    if (loadingIndicator) {
      console.log('⏳ Loading indicator still visible');
    }

  }, 3000);

}, 3000);

console.log('⏰ Script will run in 3 seconds...');