# Test Case Import Guide

The Test Case Manager now includes comprehensive import functionality that allows you to import test cases from CSV and JSON files with advanced field mapping capabilities.

## Features

- **Multiple File Formats**: Support for CSV and JSON files
- **Smart Field Mapping**: Automatic detection and mapping of common fields
- **Data Transformation**: Built-in transformations for test steps, tags, and more
- **Template System**: Import into specific project templates
- **Validation**: Data validation before import
- **Preview**: Review data before importing

## How to Import Test Cases

### 1. Access the Import Feature

1. Navigate to the **Test Case Library** page
2. Click the **Import** button in the top action bar
3. The Import Modal will open with a step-by-step wizard

### 2. Step 1: Upload and Configure

1. **Select Project**: Choose the project to import test cases into
2. **Select Template**: Choose the template that defines the test case structure
3. **File Format**: Select CSV or JSON format
4. **Upload File**: Drag and drop your file or click to browse
5. **Download Template**: Get a sample template to understand the expected format

### 3. Step 2: Field Mapping

The system will automatically suggest field mappings based on your file headers:

- **Source Field**: Column name from your import file
- **Target Field**: Field in the test case template or system field
- **Transformation**: Optional data transformation (uppercase, parse steps, etc.)
- **Required**: Mark fields as required

#### Common Field Mappings

| Source Field | Target Field | Description |
|--------------|--------------|-------------|
| Test Case Title | testCase | Main test case description |
| Test Steps | testSteps | Test execution steps |
| Expected Result | testResult | Expected outcome |
| Module | module | Component or area |
| Priority | priority | Test priority level |
| Status | status | Test case status |
| Tags | tags | Test case tags |
| Ticket ID | ticketId | Issue tracking ID |

#### Data Transformations

- **parseSteps**: Converts text to structured test steps
- **parseTags**: Splits comma-separated tags into arrays
- **uppercase/lowercase**: Text case conversion
- **trim**: Removes extra whitespace

### 4. Step 3: Preview and Import

1. **Review Data**: See a preview of your data with the applied mappings
2. **Import Options**: Configure duplicate handling and validation
3. **Import**: Execute the import process

## File Format Examples

### CSV Format

```csv
Test Case Title,Description,Test Steps,Expected Result,Module,Priority,Status,Tags
Login with valid credentials,Verify user can login,1. Navigate to login page,Login page loads,Authentication,High,Draft,"login,security"
```

### JSON Format

```json
{
  "testCases": [
    {
      "testCase": "Login with valid credentials",
      "description": "Verify user can login",
      "testSteps": [
        {
          "step": 1,
          "description": "Navigate to login page",
          "expectedResult": "Login page loads"
        }
      ],
      "module": "Authentication",
      "priority": "high",
      "status": "draft",
      "tags": ["login", "security"]
    }
  ]
}
```

## Best Practices

### 1. Prepare Your Data

- Use consistent column headers
- Ensure required fields are populated
- Use proper delimiters for CSV files
- Validate data before import

### 2. Field Mapping

- Review suggested mappings carefully
- Map critical fields first
- Use transformations for complex data
- Test with small datasets first

### 3. Import Process

- Start with a few test cases to validate
- Check validation errors before proceeding
- Use the preview to verify mappings
- Import in batches for large datasets

## Troubleshooting

### Common Issues

1. **File Format Errors**
   - Ensure file extension matches selected format
   - Check for proper CSV delimiters
   - Validate JSON syntax

2. **Field Mapping Issues**
   - Verify column headers match expected format
   - Check for extra spaces or special characters
   - Ensure required fields are mapped

3. **Data Validation Errors**
   - Review error messages for specific issues
   - Check data types and formats
   - Verify required field values

### Getting Help

- Use the sample templates as reference
- Check the validation errors in the mapping step
- Review the preview data before importing
- Start with small test files to validate the process

## Sample Files

- **Sample_Import_Test.csv**: Contains 3 sample test cases for testing
- **Template files**: Download from the import modal for reference

## Advanced Features

### Custom Transformations

For advanced users, custom JavaScript transformations can be applied to fields:

```javascript
// Example: Custom date formatting
function(value) {
  return new Date(value).toISOString().split('T')[0];
}
```

### Batch Processing

Large datasets are processed in batches to ensure performance and reliability.

### Duplicate Handling

Configure how to handle duplicate test cases during import.

---

The import functionality transforms the Test Case Manager into a comprehensive test case management system, allowing you to efficiently bring in existing test cases from various sources while maintaining data integrity and structure. 