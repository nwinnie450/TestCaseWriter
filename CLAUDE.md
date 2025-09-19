# Test Case Manager - AI Assistant Guidelines

## Application Overview
This is a **Test Case Management System** for QA teams featuring:
- AI-powered test case generation
- Template-based import/export workflows
- Test execution and run management
- User management and permissions
- Project organization

## Core System Components

### 1. Test Case Generation (`/generate`)
- AI-powered test case creation using OpenAI/Claude
- Document-based analysis and test case extraction
- Multi-format output (Steps, Gherkin, etc.)
- Token usage tracking and limits

### 2. Test Case Generators (`/simple-templates`)
**NEW FEATURE** - Pre-built generation templates:
- **Simple Tab**: Beginner-friendly generators (Login, Sign-up, Search, Forms, API CRUD, Shopping Cart)
- **Advanced Tab**: Complex scenarios (Payment flows, User permissions)
- **Mine Tab**: User-saved custom generators
- **2-step wizard**: Fill basics → Preview → Export CSV or Create Run

### 3. Test Case Library (`/library`)
- Centralized test case storage and management
- Search and filtering capabilities
- Bulk operations and organization
- Integration with execution runs

### 4. Import/Export Templates (`/templates`)
- **Import Templates**: Define CSV column mappings for importing test cases
- **Export Templates**: Control output format and field selection
- Template builder with drag-and-drop interface
- Field validation and configuration

### 5. Test Execution (`/execution`)
- Create and manage test runs
- Assign test cases to runs
- Track execution status and results
- Generate execution reports

### 6. Project Management (`/projects`)
- Organize test cases by project
- Team collaboration features
- Project-specific settings and access control

### 7. User Management (`/users`, `/management`)
- Role-based access control (User, Lead, Admin, Super Admin)
- Team management and permissions
- User profiles and settings

## Key Terminology Distinctions

**IMPORTANT**: Use correct terminology to avoid confusion:

### Test Case Generation vs Import/Export
- **"Test Case Generators"** (`/simple-templates`) = Pre-built patterns that auto-generate test cases
- **"Import/Export Templates"** (`/templates`) = CSV column mapping definitions for data exchange

### Templates vs Generators
- **"Templates"** = Column mapping formats for import/export workflows
- **"Generators"** = Pattern-based test case creation tools

## Technical Implementation

### Framework & Technologies
- **Next.js 14.2.32** with TypeScript
- **React** with client-side rendering
- **TailwindCSS** for styling
- **Lucide React** for icons
- **CSV parsing/generation** for data exchange

### File Structure
```
src/
├── app/
│   ├── generate/                 # AI test case generation
│   ├── simple-templates/         # Test case generators
│   ├── library/                  # Test case management
│   ├── templates/                # Import/export templates
│   ├── execution/                # Test run management
│   ├── projects/                 # Project organization
│   └── users/                    # User management
├── components/
│   ├── layout/                   # Navigation, header, layout
│   ├── template/                 # Template builder components
│   └── ui/                       # Reusable UI components
└── lib/
    ├── templates.ts              # Generator definitions
    ├── templateTypes.ts          # Type definitions
    └── toCsv.ts                  # CSV export utilities
```

### Navigation Structure
Main navigation includes:
- **Dashboard** (`/`) - Overview and quick actions
- **Generate** (`/generate`) - AI-powered generation
- **Generators** (`/simple-templates`) - Pre-built generators ⚡
- **Test Cases** (`/library`) - Test case library
- **Export** (`/export`) - Data export tools
- **Projects** (`/projects`) - Project management
- **Templates** (`/templates`) - Import/export templates
- **Administration** - User management (admin only)

## User Workflows

### Workflow 1: AI Generation
1. Navigate to `/generate`
2. Upload documents or provide requirements
3. Configure generation settings
4. Review and refine generated test cases
5. Export to library or create run

### Workflow 2: Generator-Based Creation
1. Navigate to `/simple-templates` (Generators)
2. Choose from Simple/Advanced/Mine tabs
3. Select appropriate generator (Login, Search, etc.)
4. Fill basic information (Feature, Preconditions, etc.)
5. Preview generated test cases
6. Export CSV or create test run directly

### Workflow 3: Import/Export
1. Navigate to `/templates` for template management
2. Create or modify import/export templates
3. Use templates in `/library` for data exchange
4. Validate and process imported test cases

### Workflow 4: Test Execution
1. Create test run in `/execution`
2. Select test cases from library or generators
3. Assign to team members
4. Track execution progress
5. Generate reports and analysis

## AI Assistant Guidelines

### When Users Mention "Templates"
Ask for clarification:
- **Test Case Generators** for creating test cases?
- **Import/Export Templates** for data formatting?

### Development Tasks
- Follow existing code patterns and conventions
- Use proper TypeScript types from `templateTypes.ts`
- Maintain compatibility with CSV export/import system
- Test changes on development server (typically port 3012)

### Common Issues
- **Port conflicts**: Use ports 3011, 3012, etc. if 3010 is occupied
- **Import path issues**: Use `@/` prefix, not `@/src/`
- **Terminology**: Maintain clear distinction between generators and templates

## Access Control

### Permission Levels
- **User**: Basic test case creation and execution
- **Lead**: Team management and project oversight
- **Admin**: User management and system configuration
- **Super Admin**: Full system access and administration

### Feature Access
Some features require specific permissions:
- Settings page (admin+)
- User management (admin+)
- System administration (super admin)

---

## Current Status
- ✅ Test Case Generators system implemented and integrated
- ✅ Navigation updated with proper terminology
- ✅ CSV export compatibility maintained
- ✅ UI overlap issues resolved
- ✅ Development server running on port 3012

This system is production-ready for QA teams needing comprehensive test case management with AI-powered generation capabilities.