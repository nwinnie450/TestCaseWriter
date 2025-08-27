import { TestCase, TestCaseVersion, TestCaseChangeRequest, VersionComment } from '@/types'

/**
 * Creates a new version of a test case
 */
export function createTestCaseVersion(
  testCase: TestCase,
  changelog: string,
  changeType: TestCaseVersion['changeType'],
  changedFields: string[],
  userId: string,
  comments?: string
): TestCaseVersion {
  const now = new Date()
  
  return {
    id: crypto.randomUUID(),
    testCaseId: testCase.id,
    version: testCase.version + 1,
    data: { ...testCase.data },
    status: testCase.status,
    priority: testCase.priority,
    tags: [...testCase.tags],
    testSteps: testCase.testSteps ? [...testCase.testSteps] : undefined,
    testResult: testCase.testResult,
    changelog,
    changeType,
    changedFields,
    createdAt: now,
    createdBy: userId,
    isApproved: false,
    comments: comments ? [{
      id: crypto.randomUUID(),
      userId,
      userName: 'Current User', // This should come from auth context
      comment: comments,
      createdAt: now,
      isResolved: false
    }] : []
  }
}

/**
 * Compares two test case versions and returns the differences
 */
export function compareVersions(
  oldVersion: TestCaseVersion,
  newVersion: TestCaseVersion
): {
  addedFields: string[]
  removedFields: string[]
  modifiedFields: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
} {
  const addedFields: string[] = []
  const removedFields: string[] = []
  const modifiedFields: Array<{
    field: string
    oldValue: any
    newValue: any
  }> = []

  // Compare data fields
  const allFields = new Set([...Object.keys(oldVersion.data), ...Object.keys(newVersion.data)])
  
  for (const field of allFields) {
    if (!(field in oldVersion.data)) {
      addedFields.push(field)
    } else if (!(field in newVersion.data)) {
      removedFields.push(field)
    } else if (JSON.stringify(oldVersion.data[field]) !== JSON.stringify(newVersion.data[field])) {
      modifiedFields.push({
        field,
        oldValue: oldVersion.data[field],
        newValue: newVersion.data[field]
      })
    }
  }

  // Compare test steps
  if (oldVersion.testSteps && newVersion.testSteps) {
    if (JSON.stringify(oldVersion.testSteps) !== JSON.stringify(newVersion.testSteps)) {
      modifiedFields.push({
        field: 'testSteps',
        oldValue: oldVersion.testSteps,
        newValue: newVersion.testSteps
      })
    }
  } else if (oldVersion.testSteps && !newVersion.testSteps) {
    removedFields.push('testSteps')
  } else if (!oldVersion.testSteps && newVersion.testSteps) {
    addedFields.push('testSteps')
  }

  // Compare other fields
  const otherFields = ['status', 'priority', 'tags', 'testResult'] as const
  for (const field of otherFields) {
    if (oldVersion[field] !== newVersion[field]) {
      modifiedFields.push({
        field,
        oldValue: oldVersion[field],
        newValue: newVersion[field]
      })
    }
  }

  return { addedFields, removedFields, modifiedFields }
}

/**
 * Creates a change request for a test case
 */
export function createChangeRequest(
  testCase: TestCase,
  proposedChanges: Array<{
    field: string
    newValue: any
    reason: string
  }>,
  userId: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
): TestCaseChangeRequest {
  const now = new Date()
  
  return {
    id: crypto.randomUUID(),
    testCaseId: testCase.id,
    requestedBy: userId,
    requestedAt: now,
    currentVersion: testCase.version,
    proposedChanges: proposedChanges.map(change => ({
      field: change.field,
      oldValue: testCase.data[change.field] || testCase[change.field as keyof TestCase],
      newValue: change.newValue,
      reason: change.reason
    })),
    status: 'pending',
    priority
  }
}

/**
 * Applies a change request to create a new version
 */
export function applyChangeRequest(
  testCase: TestCase,
  changeRequest: TestCaseChangeRequest,
  approvedBy: string
): TestCaseVersion {
  const now = new Date()
  
  // Create new data object with applied changes
  const newData = { ...testCase.data }
  for (const change of changeRequest.proposedChanges) {
    if (change.field in testCase.data) {
      newData[change.field] = change.newValue
    }
  }

  // Create new test case with updated fields
  const updatedTestCase = {
    ...testCase,
    data: newData,
    version: testCase.version + 1,
    updatedAt: now,
    lastModifiedBy: changeRequest.requestedBy
  }

  // Apply changes to direct properties
  for (const change of changeRequest.proposedChanges) {
    if (change.field in testCase && change.field !== 'data') {
      (updatedTestCase as any)[change.field] = change.newValue
    }
  }

  // Create version record
  const version = createTestCaseVersion(
    updatedTestCase,
    `Applied change request #${changeRequest.id}`,
    'update',
    changeRequest.proposedChanges.map(c => c.field),
    changeRequest.requestedBy
  )

  // Mark as approved
  version.isApproved = true
  version.approvedBy = approvedBy
  version.approvalDate = now

  return version
}

/**
 * Generates a changelog summary for a version
 */
export function generateChangelog(
  oldVersion: TestCaseVersion,
  newVersion: TestCaseVersion
): string {
  const changes = compareVersions(oldVersion, newVersion)
  const parts: string[] = []

  if (changes.addedFields.length > 0) {
    parts.push(`Added: ${changes.addedFields.join(', ')}`)
  }

  if (changes.removedFields.length > 0) {
    parts.push(`Removed: ${changes.removedFields.join(', ')}`)
  }

  if (changes.modifiedFields.length > 0) {
    const fieldNames = changes.modifiedFields.map(f => f.field)
    parts.push(`Modified: ${fieldNames.join(', ')}`)
  }

  return parts.length > 0 ? parts.join('; ') : 'No changes detected'
}

/**
 * Checks if a test case can be reverted to a previous version
 */
export function canRevertToVersion(
  currentVersion: TestCaseVersion,
  targetVersion: TestCaseVersion
): boolean {
  // Can only revert to approved versions
  if (!targetVersion.isApproved) {
    return false
  }

  // Can only revert to older versions
  if (targetVersion.version >= currentVersion.version) {
    return false
  }

  // Check if target version is still valid (not too old)
  const maxRevertAge = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
  const age = Date.now() - targetVersion.createdAt.getTime()
  
  return age <= maxRevertAge
}

/**
 * Gets the version history for a test case
 */
export function getVersionHistory(versions: TestCaseVersion[]): TestCaseVersion[] {
  return versions.sort((a, b) => b.version - a.version)
}

/**
 * Gets the latest approved version
 */
export function getLatestApprovedVersion(versions: TestCaseVersion[]): TestCaseVersion | null {
  const approvedVersions = versions.filter(v => v.isApproved)
  if (approvedVersions.length === 0) return null
  
  return approvedVersions.sort((a, b) => b.version - a.version)[0]
} 