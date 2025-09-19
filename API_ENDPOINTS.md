# 📚 TestCaseWriter API Endpoints

## 🗂️ Library Sub-Tabs & Their API Endpoints

### **1. Test Cases Library** (`/library`)
**Route**: `/library`
**Purpose**: Main test case management and browsing

#### API Endpoints:
```typescript
// Test Cases Management
GET    /api/test-cases              // Get all test cases
POST   /api/test-cases              // Create new test case
GET    /api/test-cases/[id]         // Get specific test case
PUT    /api/test-cases/[id]         // Update test case
DELETE /api/test-cases/[id]         // Delete test case

// Projects
GET    /api/projects                // Get all projects
POST   /api/projects                // Create new project
PUT    /api/projects/[id]           // Update project
DELETE /api/projects/[id]           // Delete project

// Requirements
GET    /api/requirements            // Get all requirements
POST   /api/requirements            // Create new requirement
PUT    /api/requirements/[id]       // Update requirement
DELETE /api/requirements/[id]       // Delete requirement

// Dashboard Stats
GET    /api/dashboard               // Get dashboard statistics
```

---

### **2. Execution Management** (`/library/execution`)
**Route**: `/library/execution`
**Purpose**: Test execution runs and progress tracking

#### API Endpoints:
```typescript
// Execution Runs
GET    /api/v1/execution-runs       // Get all execution runs
POST   /api/v1/execution-runs       // Create new execution run
GET    /api/v1/execution-runs/[id]  // Get specific execution run
PUT    /api/v1/execution-runs/[id]  // Update execution run
DELETE /api/v1/execution-runs/[id]  // Delete execution run

// Execution Results
POST   /api/v1/execution-runs/[id]/results  // Submit test results
GET    /api/v1/execution-runs/[id]/results  // Get execution results
PUT    /api/v1/execution-runs/[id]/results/[testId]  // Update test result

// Execution Analytics
GET    /api/v1/execution-runs/analytics     // Get execution analytics
GET    /api/v1/execution-runs/[id]/report   // Generate execution report
```

**Query Parameters**:
- `status`: Filter by status (Draft, Active, Completed, Blocked, Paused)
- `project`: Filter by project name
- `assignedTo`: Filter by assigned tester
- `environment`: Filter by environment

---

### **3. Test Generation** (`/generate`)
**Route**: `/generate`
**Purpose**: AI-powered test case generation

#### API Endpoints:
```typescript
// AI Generation
POST   /api/v1/generate-test-cases  // Generate test cases with AI
POST   /api/v1/generate-more        // Generate additional test cases
GET    /api/v1/ai-providers         // Get available AI providers
GET    /api/v1/templates            // Get test case templates

// Token Usage
GET    /api/v1/token-usage          // Get token usage statistics
POST   /api/v1/token-usage          // Update token usage

// Mock Data (Development)
GET    /api/v1/mock-data            // Get mock test cases for testing
```

---

### **4. Export & Import** (`/library` with export actions)
**Route**: `/library` (export functionality)
**Purpose**: Data export and import operations

#### API Endpoints:
```typescript
// Export
POST   /api/v1/export              // Export test cases (PDF, Excel, CSV, JSON)
GET    /api/v1/export/[id]         // Get export status/download

// Import (Future)
POST   /api/v1/import              // Import test cases from file
GET    /api/v1/import/[id]         // Get import status

// Reconcile Duplicates
POST   /api/v1/reconcile-duplicates  // Handle duplicate test cases
```

---

### **5. Settings & Configuration** (`/settings`)
**Route**: `/settings`
**Purpose**: System configuration and preferences

#### API Endpoints:
```typescript
// API Keys Management
GET    /api/v1/api-keys            // Get configured API keys
POST   /api/v1/api-keys            // Save/update API keys
DELETE /api/v1/api-keys/[provider] // Delete API key for provider

// AI Providers
GET    /api/v1/ai-providers        // Get available AI providers and models

// User Preferences (Future)
GET    /api/v1/user-settings       // Get user preferences
POST   /api/v1/user-settings       // Update user preferences
```

---

## 🔄 **Route Structure Benefits**

### **Before** (Single route with tabs):
```
/library → All functionality mixed in one page
```

### **After** (Separate routes per sub-tab):
```
/library           → Test cases browsing & management
/library/execution → Execution runs & progress tracking
/generate          → AI-powered generation
/settings          → Configuration & API keys
```

## ✨ **Advantages of Separate Routes**:

1. **Deep Linking**: Direct URLs to specific functionality
   - `/library/execution?status=Active` → Active execution runs
   - `/library?project=Mobile` → Mobile project test cases

2. **Better Navigation**: Browser back/forward works properly

3. **Cleaner State Management**: Each route manages its own data

4. **API Organization**: Logical grouping of endpoints by functionality

5. **Performance**: Load only data needed for current view

6. **SEO & Bookmarking**: Users can bookmark specific views

7. **Routing Flexibility**: Easy to add new sub-tabs as separate routes

---

## 📊 **API Response Formats**

### Success Response:
```json
{
  "success": true,
  "data": [...],
  "total": 42,
  "message": "Operation completed successfully"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 🔐 **Authentication** (Future)
All API endpoints will support:
- API Key authentication
- JWT token authentication
- Role-based access control

---

This structure provides much better organization and each sub-tab has its dedicated API endpoints for optimal functionality! 🚀