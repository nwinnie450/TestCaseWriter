# 🔍 Versioning Tooltips Verification Guide

This document lists all the versioning-related tooltips implemented in the Test Case Manager application. Use this guide to verify that all tooltips are working correctly and displaying the expected content.

## 📚 Test Case Library (`/library`)

### Version Column Info Button
- **Location**: Version column in the DataGrid
- **Element**: Small info icon (ℹ️) next to version number
- **Tooltip Text**: "View version history - See all changes and updates made to this test case over time"
- **How to Test**: 
  1. Navigate to `/library`
  2. Look for the Version column
  3. Hover over the small info icon next to any version number
  4. Verify tooltip appears with the exact text above

### Version History Dropdown Menu
- **Location**: Actions dropdown menu (three dots) for each test case
- **Element**: "Version History" menu item
- **Tooltip Text**: "View complete version history - See all changes, updates, and modifications made to this test case over time"
- **How to Test**:
  1. Navigate to `/library`
  2. Click the three dots (⋮) in the Actions column for any test case
  3. Hover over "Version History" menu item
  4. Verify tooltip appears with the exact text above

## 📊 Management Dashboard (`/management`)

### Statistics Tooltips

#### Total Versions Stat
- **Location**: Statistics overview cards
- **Element**: Small text below "Total Versions" number
- **Tooltip Text**: "Number of version snapshots created when test cases are modified - Each version tracks changes, author, and timestamp"
- **How to Test**:
  1. Navigate to `/management`
  2. Look for the "Total Versions" card
  3. Hover over the small descriptive text below the number
  4. Verify tooltip appears with the exact text above

#### Pending Changes Stat
- **Location**: Statistics overview cards
- **Element**: Small text below "Pending Changes" number
- **Tooltip Text**: "Change requests waiting for review and approval - These are proposed modifications to test cases that need to be reviewed before creating new versions"
- **How to Test**:
  1. Navigate to `/management`
  2. Look for the "Pending Changes" card
  3. Hover over the small descriptive text below the number
  4. Verify tooltip appears with the exact text above

### Recent Activity Empty State
- **Location**: Overview tab, Recent Activity section
- **Element**: Small text below "Version history provides complete audit trail"
- **Tooltip Text**: "Version history tracks all changes made to test cases including who made changes, when they were made, and what was modified - This provides a complete audit trail"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Overview tab
  3. Look for Recent Activity section (when no versions exist)
  4. Hover over the small descriptive text
  5. Verify tooltip appears with the exact text above

### Quick Actions Buttons

#### Create Change Request Button
- **Location**: Overview tab, Quick Actions section
- **Element**: "Create Change Request" button
- **Tooltip Text**: "Create a new change request to propose modifications to test cases - Change requests go through review and approval process before creating new versions"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Overview tab
  3. Look for Quick Actions section
  4. Hover over "Create Change Request" button
  5. Verify tooltip appears with the exact text above

#### View Version History Button
- **Location**: Overview tab, Quick Actions section
- **Element**: "View Version History" button
- **Tooltip Text**: "View complete version history for all test cases - See how test cases have evolved over time with detailed change tracking"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Overview tab
  3. Look for Quick Actions section
  4. Hover over "View Version History" button
  5. Verify tooltip appears with the exact text above

#### Review Change Requests Button
- **Location**: Overview tab, Quick Actions section
- **Element**: "Review Change Requests" button
- **Tooltip Text**: "Review and approve/reject proposed changes to test cases - Manage the change request workflow and ensure quality control"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Overview tab
  3. Look for Quick Actions section
  4. Hover over "Review Change Requests" button
  5. Verify tooltip appears with the exact text above

### Versions Tab Elements

#### Request Changes Button
- **Location**: Versions tab, individual test case sections
- **Element**: "Request Changes" button for each test case
- **Tooltip Text**: "Submit a change request for this test case - Propose modifications that will be reviewed before creating a new version"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Versions tab
  3. Look for any test case with a "Request Changes" button
  4. Hover over the button
  5. Verify tooltip appears with the exact text above

#### No Test Cases Found Message
- **Location**: Versions tab, when no test cases exist
- **Element**: Small text below "Versioning system provides complete change tracking and audit trail"
- **Tooltip Text**: "The versioning system tracks all changes made to test cases, creating a complete history of modifications, approvals, and updates - This ensures traceability and quality control"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Versions tab
  3. If no test cases exist, look for the empty state message
  4. Hover over the small descriptive text
  5. Verify tooltip appears with the exact text above

### Settings Tab Toggles

#### Auto-version on Changes Setting
- **Location**: Settings tab, Version Control Settings section
- **Element**: Small text below "Creates version history automatically"
- **Tooltip Text**: "When enabled, every modification to a test case automatically creates a new version with change tracking - This ensures complete audit trail of all changes"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Auto-version on changes" setting
  4. Hover over the small descriptive text below the toggle
  5. Verify tooltip appears with the exact text above

#### Require Approval for Changes Setting
- **Location**: Settings tab, Version Control Settings section
- **Element**: Small text below "Ensures quality control through review process"
- **Tooltip Text**: "When enabled, all test case modifications require review and approval before creating new versions - This ensures quality control and prevents unauthorized changes"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Require approval for changes" setting
  4. Hover over the small descriptive text below the toggle
  5. Verify tooltip appears with the exact text above

#### Version Retention Period Setting
- **Location**: Settings tab, Version Control Settings section
- **Element**: Small text below "Balances storage and historical preservation"
- **Tooltip Text**: "Defines how long to keep version history before archiving old versions - Helps manage storage while maintaining important historical data"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Version retention period" setting
  4. Hover over the small descriptive text below the setting
  5. Verify tooltip appears with the exact text above

#### Auto-assign Reviewers Setting
- **Location**: Settings tab, Change Request Settings section
- **Element**: Small text below "Streamlines review assignment process"
- **Tooltip Text**: "Automatically assigns change requests to appropriate reviewers based on project roles - Streamlines the review process and ensures timely feedback"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Auto-assign reviewers" setting
  4. Hover over the small descriptive text below the toggle
  5. Verify tooltip appears with the exact text above

#### Email Notifications Setting
- **Location**: Settings tab, Change Request Settings section
- **Element**: Small text below "Keeps team informed of pending actions"
- **Tooltip Text**: "Sends email alerts when change requests need review or when versions are created - Keeps team members informed of important changes"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Email notifications" setting
  4. Hover over the small descriptive text below the toggle
  5. Verify tooltip appears with the exact text above

#### Notify on Change Request Setting
- **Location**: Settings tab, Notification Settings section
- **Element**: Small text below "Ensures quick response to proposed changes"
- **Tooltip Text**: "Immediately notifies relevant team members when new change requests are submitted - Ensures quick response to proposed modifications"
- **How to Test**:
  1. Navigate to `/management`
  2. Go to Settings tab
  3. Look for "Notify on change request" setting
  4. Hover over the small descriptive text below the toggle
  5. Verify tooltip appears with the exact text above

## 🧪 Testing Checklist

### Test Case Library Tooltips
- [ ] Version column info button tooltip
- [ ] Version History dropdown menu tooltip

### Management Dashboard Tooltips
- [ ] Total Versions stat tooltip
- [ ] Pending Changes stat tooltip
- [ ] Recent Activity empty state tooltip
- [ ] Create Change Request button tooltip
- [ ] View Version History button tooltip
- [ ] Review Change Requests button tooltip
- [ ] Request Changes button tooltip (Versions tab)
- [ ] No Test Cases Found message tooltip
- [ ] Auto-version on changes setting tooltip
- [ ] Require approval for changes setting tooltip
- [ ] Version retention period setting tooltip
- [ ] Auto-assign reviewers setting tooltip
- [ ] Email notifications setting tooltip
- [ ] Notify on change request setting tooltip

## 🔧 How to Test Tooltips

1. **Navigate to the specified page**
2. **Look for elements with tooltips** (usually indicated by cursor changes on hover)
3. **Hover over the element** and wait for the tooltip to appear
4. **Verify the tooltip text** matches exactly what's listed above
5. **Check tooltip positioning** and styling
6. **Test on different screen sizes** to ensure responsiveness

## 📝 Notes

- All tooltips use the HTML `title` attribute for accessibility
- Tooltips appear on hover and provide helpful context for users
- Some tooltips are on small descriptive text below settings
- Tooltips help users understand the purpose and impact of different features
- All tooltips are designed to be informative but concise

## 🚀 Quick Test Commands

To quickly test all tooltips, you can run these commands in your browser console:

```javascript
// Test all tooltips on current page
const tooltips = document.querySelectorAll('[title]');
console.log(`Found ${tooltips.length} elements with tooltips`);
tooltips.forEach((el, i) => {
  console.log(`${i + 1}. ${el.tagName} - "${el.title}"`);
});
```

This will help you identify all elements with tooltips on the current page for verification. 