import { TestCase, TestCaseVersion, TestCaseChangeRequest, VersionComment } from '@/types'
import { getAllStoredTestCases, getTestCasesByProjectId } from './test-case-storage'

// Storage keys for management features
const VERSION_STORAGE_KEY = 'testCaseManager_versions'
const CHANGE_REQUEST_STORAGE_KEY = 'testCaseManager_changeRequests'

// Version Management Functions
function saveTestCaseVersion(version: TestCaseVersion): void {
  try {
    const versions = getTestCaseVersions()
    versions.push(version)
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions))
    console.log(`✅ Saved version ${version.version} for test case ${version.testCaseId}`)
  } catch (error) {
    console.error('❌ Failed to save test case version:', error)
    throw new Error('Failed to save test case version')
  }
}

function getTestCaseVersions(): TestCaseVersion[] {
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY)
    if (!stored) return []
    
    const versions = JSON.parse(stored)
    // Convert date strings back to Date objects
    return versions.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
      approvalDate: v.approvalDate ? new Date(v.approvalDate) : undefined,
      comments: v.comments?.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined
      })) || []
    }))
  } catch (error) {
    console.error('❌ Failed to get test case versions:', error)
    return []
  }
}

function getVersionsForTestCase(testCaseId: string): TestCaseVersion[] {
  const allVersions = getTestCaseVersions()
  return allVersions.filter(v => v.testCaseId === testCaseId)
}

function getLatestVersionForTestCase(testCaseId: string): TestCaseVersion | null {
  const versions = getVersionsForTestCase(testCaseId)
  if (versions.length === 0) return null
  
  return versions.sort((a, b) => b.version - a.version)[0]
}

// Change Request Management Functions
function saveChangeRequest(changeRequest: TestCaseChangeRequest): void {
  try {
    const requests = getChangeRequests()
    requests.push(changeRequest)
    localStorage.setItem(CHANGE_REQUEST_STORAGE_KEY, JSON.stringify(requests))
    console.log(`✅ Saved change request ${changeRequest.id}`)
  } catch (error) {
    console.error('❌ Failed to save change request:', error)
    throw new Error('Failed to save change request')
  }
}

function getChangeRequests(): TestCaseChangeRequest[] {
  try {
    const stored = localStorage.getItem(CHANGE_REQUEST_STORAGE_KEY)
    if (!stored) return []
    
    const requests = JSON.parse(stored)
    // Convert date strings back to Date objects
    return requests.map((r: any) => ({
      ...r,
      requestedAt: new Date(r.requestedAt),
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined
    }))
  } catch (error) {
    console.error('❌ Failed to get change requests:', error)
    return []
  }
}

function getChangeRequestsForTestCase(testCaseId: string): TestCaseChangeRequest[] {
  const allRequests = getChangeRequests()
  return allRequests.filter(r => r.testCaseId === testCaseId)
}

function updateChangeRequestStatus(
  changeRequestId: string, 
  status: TestCaseChangeRequest['status'],
  reviewedBy?: string,
  reviewComments?: string
): void {
  try {
    const requests = getChangeRequests()
    const requestIndex = requests.findIndex(r => r.id === changeRequestId)
    
    if (requestIndex === -1) {
      throw new Error('Change request not found')
    }
    
    requests[requestIndex] = {
      ...requests[requestIndex],
      status,
      reviewedBy,
      reviewComments,
      reviewedAt: new Date()
    }
    
    localStorage.setItem(CHANGE_REQUEST_STORAGE_KEY, JSON.stringify(requests))
    console.log(`✅ Updated change request ${changeRequestId} status to ${status}`)
  } catch (error) {
    console.error('❌ Failed to update change request status:', error)
    throw new Error('Failed to update change request status')
  }
}

// Statistics and Analytics Functions
function getManagementStats() {
  const testCases = getAllStoredTestCases()
  const versions = getTestCaseVersions()
  const changeRequests = getChangeRequests()
  
  // Calculate version statistics
  const totalVersions = versions.length
  const approvedVersions = versions.filter(v => v.isApproved).length
  const pendingVersions = versions.filter(v => !v.isApproved).length
  
  // Calculate change request statistics
  const pendingChangeRequests = changeRequests.filter(r => r.status === 'pending').length
  const approvedChangeRequests = changeRequests.filter(r => r.status === 'approved').length
  const rejectedChangeRequests = changeRequests.filter(r => r.status === 'rejected').length
  const mergedChangeRequests = changeRequests.filter(r => r.status === 'merged').length
  
  // Calculate test case statistics
  const activeTestCases = testCases.filter(tc => tc.status === 'active').length
  const draftTestCases = testCases.filter(tc => tc.status === 'draft').length
  const reviewTestCases = testCases.filter(tc => tc.status === 'review').length
  const deprecatedTestCases = testCases.filter(tc => tc.status === 'deprecated').length
  
  return {
    testCases: {
      total: testCases.length,
      active: activeTestCases,
      draft: draftTestCases,
      review: reviewTestCases,
      deprecated: deprecatedTestCases
    },
    versions: {
      total: totalVersions,
      approved: approvedVersions,
      pending: pendingVersions
    },
    changeRequests: {
      total: changeRequests.length,
      pending: pendingChangeRequests,
      approved: approvedChangeRequests,
      rejected: rejectedChangeRequests,
      merged: mergedChangeRequests
    }
  }
}

function getProjectManagementStats(projectId: string) {
  const testCases = getTestCasesByProjectId(projectId)
  const versions = getTestCaseVersions()
  const changeRequests = getChangeRequests()
  
  // Filter versions and change requests for this project
  const projectVersions = versions.filter(v => 
    testCases.some(tc => tc.id === v.testCaseId)
  )
  const projectChangeRequests = changeRequests.filter(r => 
    testCases.some(tc => tc.id === r.testCaseId)
  )
  
  return {
    testCases: {
      total: testCases.length,
      byStatus: testCases.reduce((acc, tc) => {
        acc[tc.status] = (acc[tc.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPriority: testCases.reduce((acc, tc) => {
        acc[tc.priority] = (acc[tc.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    },
    versions: {
      total: projectVersions.length,
      approved: projectVersions.filter(v => v.isApproved).length,
      pending: projectVersions.filter(v => !v.isApproved).length
    },
    changeRequests: {
      total: projectChangeRequests.length,
      pending: projectChangeRequests.filter(r => r.status === 'pending').length,
      approved: projectChangeRequests.filter(r => r.status === 'approved').length,
      rejected: projectChangeRequests.filter(r => r.status === 'rejected').length
    }
  }
}

// Utility Functions
function initializeTestCasesWithVersioning(): void {
  try {
    const testCases = getAllStoredTestCases()
    const versions = getTestCaseVersions()
    
    // For each test case without versions, create an initial version
    testCases.forEach(testCase => {
      const existingVersions = versions.filter(v => v.testCaseId === testCase.id)
      
      if (existingVersions.length === 0) {
        // Create initial version
        const initialVersion: TestCaseVersion = {
          id: crypto.randomUUID(),
          testCaseId: testCase.id,
          version: 1,
          data: testCase.data || {},
          status: testCase.status,
          priority: testCase.priority,
          tags: testCase.tags || [],
          testSteps: testCase.testSteps,
          testResult: testCase.testResult,
          changelog: 'Initial test case creation',
          changeType: 'create',
          changedFields: ['all'],
          createdAt: testCase.createdAt,
          createdBy: testCase.createdBy,
          isApproved: true,
          approvedBy: testCase.createdBy,
          approvalDate: testCase.createdAt
        }
        
        saveTestCaseVersion(initialVersion)
        
        // Update test case with version number
        testCase.version = 1
      }
    })
    
    console.log('✅ Initialized test cases with versioning')
  } catch (error) {
    console.error('❌ Failed to initialize test cases with versioning:', error)
  }
}

function cleanupManagementData(): void {
  try {
    localStorage.removeItem(VERSION_STORAGE_KEY)
    localStorage.removeItem(CHANGE_REQUEST_STORAGE_KEY)
    console.log('✅ Cleaned up management data')
  } catch (error) {
    console.error('❌ Failed to cleanup management data:', error)
  }
}

// Export all functions
export {
  saveTestCaseVersion,
  getTestCaseVersions,
  getVersionsForTestCase,
  getLatestVersionForTestCase,
  saveChangeRequest,
  getChangeRequests,
  getChangeRequestsForTestCase,
  updateChangeRequestStatus,
  getManagementStats,
  getProjectManagementStats,
  initializeTestCasesWithVersioning,
  cleanupManagementData
} 