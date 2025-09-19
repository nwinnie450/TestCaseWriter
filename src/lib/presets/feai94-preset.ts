// FEAI-94 QA Department preset - adapts app to your exact Excel format
export const FEAI94_PRESET = {
  name: 'FEAI-94 (QA Department)',
  description: 'Optimized for FEAI-94.xlsx format with exact column matching',

  // Exact column name mappings from your Excel file
  columnMappings: {
    // Core test case fields
    id: ['Test Case ID', 'TestCase ID', 'ID'],
    module: ['Module', 'Section', 'Component'],
    title: ['Test Case', 'TestCase', 'Title', 'Test Case Title'],
    steps_description: ['Test Step Description', '*Test Steps', 'Steps', 'Test Steps Description'],
    test_data: ['Test Data', 'TestData', 'Data'],
    expected_result: ['Expected Result', 'Expected', 'Result'],

    // QA specific fields
    test_result: ['Test Result', 'Status', 'Result Status'],
    qa_owner: ['QA', 'QA Owner', 'Tester', 'Owner'],
    remarks: ['Remarks', 'Comments', 'Notes'],

    // Flags
    regression: ['Regression? Yes/No', 'Regression', 'Is Regression'],
    automation_enabled: ['Automation Yes/No', 'Automation', 'Auto'],
    priority: ['Priority', 'Prio'],

    // Automation fields
    automation_id: ['Automation ID', 'Auto ID'],
    automation_preset: ['Automation Preset Data', 'Auto Preset'],
    automation_loop: ['Automation Loop Data', 'Auto Loop'],
    automation_note: ['Automation Note', 'Auto Note'],

    // Additional step info
    step_count: ['*Test Steps', 'Step Count', 'Steps Count']
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
      'PASS': 'Passed',
      'PASSED': 'Passed',
      'FAIL': 'Failed',
      'FAILED': 'Failed',
      'BLOCK': 'Blocked',
      'BLOCKED': 'Blocked',
      'SKIP': 'Skipped',
      'SKIPPED': 'Skipped',
      'PENDING': 'Pending',
      'NOT RUN': 'Not Run',
      'NOT_RUN': 'Not Run',
      '': 'Not Run'
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

  // Export format (for round-trip compatibility)
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
export function extractFieldValue(row: any, fieldMappings: string[]): string {
  for (const fieldName of fieldMappings) {
    // Try exact match first
    if (row[fieldName] !== undefined && row[fieldName] !== null) {
      return String(row[fieldName]).trim();
    }

    // Try case-insensitive match
    const keys = Object.keys(row);
    const matchingKey = keys.find(key =>
      key.toLowerCase().trim() === fieldName.toLowerCase().trim()
    );

    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }

  return '';
}

export function normalizeValue(value: string, normalizer: Record<string, any>): any {
  const upperValue = value.toUpperCase().trim();
  return normalizer[upperValue] !== undefined ? normalizer[upperValue] : value;
}

export function parseStepsFromText(text: string, config = FEAI94_PRESET.stepParsing): Array<{
  step: number;
  description: string;
  expectedResult?: string;
  testData?: string;
}> {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const steps: Array<{ step: number; description: string; expectedResult?: string; testData?: string; }> = [];

  for (let i = 0; i < lines.length && steps.length < config.max_steps; i++) {
    const line = lines[i];

    if (line.length < config.min_step_length) {
      continue;
    }

    // Remove step prefixes (1., -, •, *, etc.)
    const cleanedLine = line.replace(config.step_prefixes, '').trim();

    if (cleanedLine.length >= config.min_step_length) {
      steps.push({
        step: steps.length + 1,
        description: cleanedLine,
        expectedResult: '',
        testData: ''
      });
    }
  }

  return steps.length > 0 ? steps : [{
    step: 1,
    description: config.default_action,
    expectedResult: '',
    testData: ''
  }];
}