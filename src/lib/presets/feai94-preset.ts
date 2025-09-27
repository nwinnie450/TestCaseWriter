// FEAI-94 QA Department preset - adapts app to your exact Excel format
export const FEAI94_PRESET = {
  name: 'FEAI-94 (QA Department)',
  description: 'Optimized for FEAI-94.xlsx format with exact column matching',

  // Exact column name mappings from your Excel file
  columnMappings: {
    // Core test case fields - exact matches from FEAI-94-short.xlsx
    id: ['Test Case ID', 'ID', 'Test_Case_ID'],
    module: ['Module', 'Component', 'Category'],
    title: ['Test Case', 'Test Case Title', 'Title'],
    description: ['Test Case Description', 'Description', 'Summary', 'Test Description'],
    steps_description: ['Test Step Description', 'Steps', 'Test Steps Description', 'Step Description'],
    test_data: ['Test Data', 'Data', 'Input Data'],
    expected_result: ['Expected Result', 'Expected', 'Result', 'Overall Expected Result'],
    step_expected_results: ['Step Expected Results', 'Individual Expected Results', 'Step Results'],

    // QA specific fields - exact matches
    test_result: ['Test Result', 'Result', 'Status', 'Execution Status'],
    qa_owner: ['QA', 'QA Owner', 'Assigned To', 'Owner'],
    remarks: ['Remarks', 'Notes', 'Comments'],

    // Flags - exact matches
    regression: ['Regression? Yes/No', 'Regression', 'Is Regression'],
    automation_enabled: ['Automation Yes/No', 'Automation', 'Is Automation'],
    priority: ['Priority', 'Prio', 'Level'],

    // Automation fields - exact matches
    automation_id: ['Automation ID', 'Auto ID', 'Automation_ID'],
    automation_preset: ['Automation Preset Data', 'Preset Data', 'Automation Preset'],
    automation_loop: ['Automation Loop Data', 'Loop Data', 'Automation Loop'],
    automation_note: ['Automation Note', 'Auto Note', 'Automation_Note'],

    // Additional step info - exact match with asterisk
    step_count: ['*Test Steps', 'Step Count', 'Number of Steps'],

    // Additional common fields
    project: ['Project', 'Project ID', 'Project Name'],
    feature: ['Feature', 'Feature Name'],
    enhancement: ['Enhancement', 'Enhancement ID'],
    ticket: ['Ticket', 'Ticket ID', 'JIRA ID'],
    tags: ['Tags', 'Labels'],
    complexity: ['Complexity', 'Difficulty'],
    estimate: ['Estimate', 'Estimated Time', 'Duration']
  },

  // Value normalizers for consistent data
  normalizers: {
    priority: {
      'HIGH': 'High',
      'MEDIUM': 'Medium',
      'LOW': 'Low',
      'CRITICAL': 'Critical',
      'P0': 'Critical',
      'P1': 'High',
      'P2': 'Medium',
      'P3': 'Low',
      'H': 'High',
      'M': 'Medium',
      'L': 'Low',
      '1': 'High',
      '2': 'Medium',
      '3': 'Low'
    },

    boolean: {
      'YES': true,
      'Y': true,
      'TRUE': true,
      '1': true,
      'ON': true,
      'ENABLED': true,
      'NO': false,
      'N': false,
      'FALSE': false,
      '0': false,
      'OFF': false,
      'DISABLED': false,
      '': false
    },

    status: {
      'PASS': 'active',
      'PASSED': 'active',
      'FAIL': 'review',
      'FAILED': 'review',
      'BLOCK': 'review',
      'BLOCKED': 'review',
      'SKIP': 'draft',
      'SKIPPED': 'draft',
      'PENDING': 'draft',
      'NOT RUN': 'draft',
      'NOT_RUN': 'draft',
      'DRAFT': 'draft',
      'ACTIVE': 'active',
      'REVIEW': 'review',
      'DEPRECATED': 'deprecated',
      '': 'draft'
    }
  },

  // Step parsing configuration
  stepParsing: {
    strategy: 'split_lines',
    line_separators: ['\n', '\r\n', ';', '|'],
    step_prefixes: /^\s*(?:\d+[\.\)]\s*|\-\s*|\•\s*|\*\s*)?/,
    max_steps: 50,
    min_step_length: 2,
    default_action: 'Execute test case'
  },

  // Export format (for round-trip compatibility) - exact FEAI-94 column names
  exportMapping: {
    'Test Case ID': 'id',
    'Module': 'module',
    'Test Case': 'title',
    '*Test Steps': 'stepCount',
    'Test Step Description': 'stepsText',
    'Test Data': 'testData',
    'Expected Result': 'expectedResult',
    'Test Result': 'status',
    'QA': 'qaOwner',
    'Remarks': 'remarks',
    'Regression? Yes/No': 'regressionFlag',
    'Automation Yes/No': 'automationFlag',
    'Priority': 'priority',
    'Automation ID': 'automationId',
    'Automation Preset Data': 'automationPreset',
    'Automation Loop Data': 'automationLoop',
    'Automation Note': 'automationNote'
  }
} as const;

// Helper functions for FEAI-94 specific processing
export function extractFieldValue(row: any, fieldMappings: readonly string[] | string): string {
  // Handle edge cases
  if (!fieldMappings || !row) {
    return '';
  }

  // Handle case where fieldMappings is a single string
  const mappings = Array.isArray(fieldMappings) ? fieldMappings : [fieldMappings];

  for (const fieldName of mappings) {
    // Skip invalid field names
    if (!fieldName || typeof fieldName !== 'string') {
      continue;
    }

    // Try exact match first
    if (row[fieldName] !== undefined && row[fieldName] !== null) {
      return String(row[fieldName]).trim();
    }

    // Try case-insensitive match
    const keys = Object.keys(row);
    const matchingKey = keys.find(key =>
      key && typeof key === 'string' &&
      fieldName && typeof fieldName === 'string' &&
      key.toLowerCase().trim() === fieldName.toLowerCase().trim()
    );

    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }

  return '';
}

export function normalizeValue(value: string, normalizer: Record<string, any>): any;
export function normalizeValue(value: string, defaultValue: string, validValues: string[]): string;
export function normalizeValue(value: string, normalizerOrDefault: Record<string, any> | string, validValues?: string[]): any {
  if (!value || typeof value !== 'string') {
    return validValues ? (typeof normalizerOrDefault === 'string' ? normalizerOrDefault : value) : value;
  }

  // Handle array-based validation (normalizeValue(value, default, validValues))
  if (validValues && Array.isArray(validValues)) {
    const upperValue = value.toUpperCase().trim();
    const matchedValue = validValues.find(v => v.toUpperCase() === upperValue);
    return matchedValue || (typeof normalizerOrDefault === 'string' ? normalizerOrDefault : value);
  }

  // Handle Record-based normalization (normalizeValue(value, normalizer))
  if (typeof normalizerOrDefault === 'object' && normalizerOrDefault !== null) {
    const upperValue = value.toUpperCase().trim();
    return normalizerOrDefault[upperValue] !== undefined ? normalizerOrDefault[upperValue] : value;
  }

  return value;
}

export function parseStepsFromText(
  text: string,
  stepExpectedResults?: string,
  config = FEAI94_PRESET.stepParsing
): Array<{
  step: number;
  description: string;
  expectedResult?: string;
  testData?: string;
}> {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Handle multiple line separators safely
  let processedText = text;
  if (config && config.line_separators && Array.isArray(config.line_separators)) {
    // Replace all separators with newlines
    config.line_separators.forEach(sep => {
      processedText = processedText.split(sep).join('\n');
    });
  }

  const lines = processedText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const steps: Array<{ step: number; description: string; expectedResult?: string; testData?: string; }> = [];

  // Parse individual expected results if provided
  let expectedResults: string[] = [];
  if (stepExpectedResults && typeof stepExpectedResults === 'string') {
    expectedResults = stepExpectedResults.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  for (let i = 0; i < lines.length && steps.length < config.max_steps; i++) {
    const line = lines[i];

    if (line.length < config.min_step_length) {
      continue;
    }

    // FEAI-94 specific: Handle numbered steps like "1) Login as Super Admin"
    const cleanedLine = line
      .replace(/^\d+\)\s*/, '') // Remove "1) ", "2) ", etc.
      .replace(/^\d+\.\s*/, '') // Remove "1. ", "2. ", etc.
      .replace(/^\d+\s+/, '') // Remove "1 ", "2 ", etc.
      .replace(/^[\-\•\*]\s*/, '') // Remove bullet points
      .trim();

    if (cleanedLine.length >= config.min_step_length) {
      // Check if line contains step and expected result in one line (e.g., "Login | User is logged in")
      const stepParts = cleanedLine.split(/\s*[\|\-\→\:]\s*Expected\s*:\s*/i);
      if (stepParts.length > 1) {
        // Step has inline expected result
        steps.push({
          step: steps.length + 1,
          description: stepParts[0].trim(),
          expectedResult: stepParts[1].trim(),
          testData: ''
        });
      } else {
        // Use individual expected result if available
        const stepIndex = steps.length;
        const stepExpected = expectedResults[stepIndex] || '';

        steps.push({
          step: steps.length + 1,
          description: cleanedLine,
          expectedResult: stepExpected,
          testData: ''
        });
      }
    }
  }

  return steps.length > 0 ? steps : [{
    step: 1,
    description: config.default_action,
    expectedResult: '',
    testData: ''
  }];
}