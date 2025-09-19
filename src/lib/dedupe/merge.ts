import { TestCase } from '@/types';

export interface MergeResult {
  mergedCase: TestCase;
  changes: {
    fieldsModified: string[];
    stepsAdded: number;
    stepsModified: number;
    priorityChanged: boolean;
    statusChanged: boolean;
  };
  conflicts: Array<{
    field: string;
    baseValue: any;
    incomingValue: any;
    resolution: 'kept_base' | 'used_incoming' | 'merged';
  }>;
}

/**
 * Priority ranking for merge decisions (lower number = higher priority)
 */
const PRIORITY_RANK = {
  'Critical': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
  'P0': 0,
  'P1': 1,
  'P2': 2,
  'P3': 3
};

/**
 * Status ranking for merge decisions (lower number = higher importance)
 */
const STATUS_RANK = {
  'Failed': 0,
  'Blocked': 1,
  'Passed': 2,
  'Skipped': 3,
  'Not Run': 4,
  'Pending': 5
};

/**
 * Merge unique test steps, preserving order and removing duplicates
 */
function mergeTestSteps(baseSteps: any[] = [], incomingSteps: any[] = []): any[] {
  const stepMap = new Map<string, any>();
  const mergedSteps: any[] = [];

  // Add base steps first
  for (const step of baseSteps) {
    const normalizedDesc = (step.description || step.action || '').toLowerCase().trim();
    if (normalizedDesc && !stepMap.has(normalizedDesc)) {
      stepMap.set(normalizedDesc, step);
      mergedSteps.push(step);
    }
  }

  // Add incoming steps that aren't duplicates
  for (const step of incomingSteps) {
    const normalizedDesc = (step.description || step.action || '').toLowerCase().trim();
    if (normalizedDesc && !stepMap.has(normalizedDesc)) {
      stepMap.set(normalizedDesc, step);
      mergedSteps.push({
        ...step,
        step: mergedSteps.length + 1 // Re-number steps
      });
    }
  }

  return mergedSteps;
}

/**
 * Choose better priority between two values
 */
function chooseBetterPriority(basePriority?: string, incomingPriority?: string): string | undefined {
  if (!basePriority) return incomingPriority;
  if (!incomingPriority) return basePriority;

  const baseRank = PRIORITY_RANK[basePriority as keyof typeof PRIORITY_RANK] ?? 99;
  const incomingRank = PRIORITY_RANK[incomingPriority as keyof typeof PRIORITY_RANK] ?? 99;

  return baseRank <= incomingRank ? basePriority : incomingPriority;
}

/**
 * Choose better status between two values
 */
function chooseBetterStatus(baseStatus?: string, incomingStatus?: string): string | undefined {
  if (!baseStatus) return incomingStatus;
  if (!incomingStatus) return baseStatus;

  const baseRank = STATUS_RANK[baseStatus as keyof typeof STATUS_RANK] ?? 99;
  const incomingRank = STATUS_RANK[incomingStatus as keyof typeof STATUS_RANK] ?? 99;

  return baseRank <= incomingRank ? baseStatus : incomingStatus;
}

/**
 * Merge two test cases intelligently
 */
export function mergeTestCases(baseCase: TestCase, incomingCase: TestCase): MergeResult {

  const changes = {
    fieldsModified: [] as string[],
    stepsAdded: 0,
    stepsModified: 0,
    priorityChanged: false,
    statusChanged: false
  };

  const conflicts: MergeResult['conflicts'] = [];

  // Merge basic fields
  const mergedCase: TestCase = {
    ...baseCase,

    // Keep base ID and metadata
    id: baseCase.id,
    createdAt: baseCase.createdAt,
    createdBy: baseCase.createdBy,

    // Update timestamps
    updatedAt: new Date(),
    version: (baseCase.version || 1) + 1,

    // Title: prefer longer/more descriptive
    title: baseCase.title?.length >= (incomingCase.title?.length || 0)
      ? baseCase.title
      : incomingCase.title,

    testCase: baseCase.testCase?.length >= (incomingCase.testCase?.length || 0)
      ? baseCase.testCase
      : incomingCase.testCase,

    // Description: combine if different
    description: [baseCase.description, incomingCase.description]
      .filter((desc, index, arr) => desc && desc.trim() && arr.indexOf(desc) === index)
      .join(' | ') || baseCase.description,

    // Module/Category: prefer non-empty
    module: baseCase.module || incomingCase.module,
    category: baseCase.category || incomingCase.category,

    // Priority: choose higher priority
    priority: chooseBetterPriority(baseCase.priority, incomingCase.priority),

    // Status: choose more critical status
    status: chooseBetterStatus(baseCase.status, incomingCase.status),

    // Tags: merge unique tags
    tags: Array.from(new Set([
      ...(baseCase.tags || []),
      ...(incomingCase.tags || [])
    ])).filter(Boolean),

    // Test data: prefer non-empty, or combine
    testData: baseCase.testData || incomingCase.testData,
    testResult: baseCase.testResult || incomingCase.testResult,

    // QA fields: prefer non-empty
    qa: baseCase.qa || incomingCase.qa,

    // Remarks: combine if different
    remarks: [baseCase.remarks, incomingCase.remarks]
      .filter((remark, index, arr) => remark && remark.trim() && arr.indexOf(remark) === index)
      .join(' | ') || baseCase.remarks,

    // Merge test steps
    testSteps: mergeTestSteps(baseCase.testSteps, incomingCase.testSteps),

    // Merge data object
    data: {
      ...baseCase.data,
      ...incomingCase.data,

      // Combine specific fields intelligently
      title: baseCase.data?.title || incomingCase.data?.title,
      description: baseCase.data?.description || incomingCase.data?.description,
      expectedResult: baseCase.data?.expectedResult || incomingCase.data?.expectedResult,
      testData: baseCase.data?.testData || incomingCase.data?.testData,

      // Merge steps in data object
      steps: mergeTestSteps(baseCase.data?.steps, incomingCase.data?.steps),

      // FEAI-94 specific fields
      module: baseCase.data?.module || incomingCase.data?.module,
      qaOwner: baseCase.data?.qaOwner || incomingCase.data?.qaOwner,
      isRegression: baseCase.data?.isRegression || incomingCase.data?.isRegression,
      isAutomation: baseCase.data?.isAutomation || incomingCase.data?.isAutomation,

      // Automation fields: prefer non-empty
      automationId: baseCase.data?.automationId || incomingCase.data?.automationId,
      automationPreset: baseCase.data?.automationPreset || incomingCase.data?.automationPreset,
      automationLoop: baseCase.data?.automationLoop || incomingCase.data?.automationLoop,
      automationNote: [baseCase.data?.automationNote, incomingCase.data?.automationNote]
        .filter(Boolean)
        .join(' | ') || baseCase.data?.automationNote
    }
  };

  // Track changes
  if (baseCase.priority !== mergedCase.priority) {
    changes.priorityChanged = true;
    changes.fieldsModified.push('priority');
    conflicts.push({
      field: 'priority',
      baseValue: baseCase.priority,
      incomingValue: incomingCase.priority,
      resolution: 'used_incoming'
    });
  }

  if (baseCase.status !== mergedCase.status) {
    changes.statusChanged = true;
    changes.fieldsModified.push('status');
    conflicts.push({
      field: 'status',
      baseValue: baseCase.status,
      incomingValue: incomingCase.status,
      resolution: 'used_incoming'
    });
  }

  // Count step changes
  const originalStepCount = baseCase.testSteps?.length || 0;
  const newStepCount = mergedCase.testSteps?.length || 0;
  changes.stepsAdded = Math.max(0, newStepCount - originalStepCount);


  return {
    mergedCase,
    changes,
    conflicts
  };
}

/**
 * Check if merge would be safe (minimal conflicts)
 */
export function isSafeMerge(baseCase: TestCase, incomingCase: TestCase): boolean {
  // Check if core identity is the same
  const sameModule = (baseCase.module || '') === (incomingCase.module || '');
  const sameTitle = (baseCase.testCase || '').toLowerCase().trim() ===
                   (incomingCase.testCase || '').toLowerCase().trim();

  if (!sameModule || !sameTitle) {
    return false;
  }

  // Check for conflicting critical fields
  const basePriority = baseCase.priority;
  const incomingPriority = incomingCase.priority;

  if (basePriority && incomingPriority && basePriority !== incomingPriority) {
    const baseRank = PRIORITY_RANK[basePriority as keyof typeof PRIORITY_RANK];
    const incomingRank = PRIORITY_RANK[incomingPriority as keyof typeof PRIORITY_RANK];

    // Allow merge if priority difference is minimal (adjacent levels)
    if (Math.abs((baseRank || 99) - (incomingRank || 99)) > 1) {
      return false;
    }
  }

  return true;
}