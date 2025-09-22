// EXECUTION PAGE ANALYSIS - Key portions for GPT analysis
// Issue: Test cases not displaying when selecting active run from dropdown

'use client';
import React, { useState, useEffect } from 'react';

export default function TestExecutionPage() {
  console.log('🔄 TestExecutionPage component loaded with debugging');

  // STATE MANAGEMENT
  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [activeRunTestCases, setActiveRunTestCases] = useState<TestCase[]>([]);
  const [loadingActiveRunTestCases, setLoadingActiveRunTestCases] = useState(false);

  // INTERFACES
  interface ExecutionRun {
    id: string;
    name: string;
    project: string;
    tester: string;
    environment: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
    testCases: PrioritizedTestCase[];
    startTime: string;
    completedTests: number;
    totalTests: number;
    currentTest: PrioritizedTestCase | null;
  }

  interface TestCase {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    currentStatus: string;
    steps: any[];
    expectedResult: string;
    assignee?: string;
  }

  // SWITCH TO RUN FUNCTION
  const switchToRun = (runId: string) => {
    console.log('🔄 switchToRun called with runId:', runId);
    const run = executionRuns.find(r => r.id === runId);
    console.log('🔄 Found run:', run);
    if (run) {
      console.log('🔄 Setting activeRunId to:', runId);
      setActiveRunId(runId);
      setSelectedTest(run.currentTest);
      setExecutionData({
        tester: run.tester,
        environment: run.environment
      });
      console.log('🔄 switchToRun completed, should trigger useEffect now');
    }
  };

  // LOAD ACTIVE RUN TEST CASES - useEffect triggered when activeRunId changes
  useEffect(() => {
    console.log('🔄 useEffect for activeRunTestCases triggered. activeRunId:', activeRunId);

    const loadActiveRunTestCases = async () => {
      if (!activeRunId) {
        console.log('🔍 DEBUG: No activeRunId, clearing active run test cases');
        setActiveRunTestCases([]);
        setLoadingActiveRunTestCases(false);
        return;
      }

      console.log('🔍 DEBUG: Loading test cases for activeRunId:', activeRunId);
      setLoadingActiveRunTestCases(true);

      try {
        console.log('🔍 DEBUG: Calling RunsService.getRun with ID:', activeRunId);

        // Direct API call for debugging
        console.log('🔍 DEBUG: Making direct fetch to /api/runs/' + activeRunId);
        const directResponse = await fetch(`/api/runs/${activeRunId}`);
        const directData = await directResponse.json();
        console.log('🔍 DEBUG: Direct API response:', directData);
        console.log('🔍 DEBUG: Direct API runCases length:', directData?.run?.runCases?.length);

        const runDetails = await RunsService.getRun(activeRunId);
        console.log('🔍 DEBUG: runDetails response:', runDetails);
        console.log('🔍 DEBUG: runDetails.run:', runDetails?.run);
        console.log('🔍 DEBUG: runDetails.run.runCases length:', runDetails?.run?.runCases?.length);

        if (runDetails && runDetails.run && runDetails.run.runCases) {
          console.log('🔍 DEBUG: Found runCases:', runDetails.run.runCases.length, 'cases');

          // Transform runCases to test case format
          const runTestCases = runDetails.run.runCases.map((runCase: any) => {
            // Normalize status from database format to frontend format
            let normalizedStatus = runCase.status || 'Not_Executed';
            if (normalizedStatus === 'Not Run') {
              normalizedStatus = 'Not_Executed';
            }

            return {
              id: runCase.caseId,
              title: runCase.titleSnapshot,
              description: runCase.description || '',
              category: runCase.component || 'General',
              priority: runCase.priority || 'Medium',
              status: normalizedStatus,
              currentStatus: normalizedStatus,
              steps: runCase.stepsSnapshot || [],
              expectedResult: runCase.expectedResult || '',
              assignee: runCase.assignee,
            };
          });

          console.log('🔍 DEBUG: Setting activeRunTestCases:', runTestCases.length, 'cases');
          setActiveRunTestCases(runTestCases);
        } else {
          console.log('🔍 DEBUG: No runCases found in response');
          setActiveRunTestCases([]);
        }
      } catch (error) {
        console.error('🔍 DEBUG: Error loading active run test cases:', error);
        setActiveRunTestCases([]);
      } finally {
        setLoadingActiveRunTestCases(false);
      }
    };

    loadActiveRunTestCases();
  }, [activeRunId]);

  // LOAD EXECUTION RUNS FROM API
  const loadExecutionRuns = async () => {
    try {
      const result = await RunsService.getRuns({ limit: 50 });
      console.log('🔍 DEBUG: API result from getRuns:', result);

      const transformedRuns: ExecutionRun[] = result.runs.map(run => {
        console.log('🔍 DEBUG: Processing run:', run.id, 'stats:', run.stats);
        const completedTests = (run.stats?.passedCases || 0) + (run.stats?.failedCases || 0) + (run.stats?.blockedCases || 0);
        const totalTests = run.stats?.totalCases || 0;

        return {
          id: run.id,
          name: run.name,
          project: run.projectId,
          tester: run.createdBy,
          environment: run.environments?.[0] || 'SIT',
          status: run.status === 'completed' ? 'completed' : 'active',
          testCases: [],
          startTime: run.startedAt || run.createdAt,
          completedTests,
          totalTests,
          currentTest: null
        };
      });

      setExecutionRuns(transformedRuns);
    } catch (error) {
      console.error('Failed to load execution runs:', error);
    }
  };

  // LOAD RUNS ON COMPONENT MOUNT
  useEffect(() => {
    loadExecutionRuns();
  }, []);

  // FILTERED RUNS FOR DROPDOWN
  const filteredRuns = executionRuns.filter(run => {
    return userRole.canViewRuns(run);
  });

  // DROPDOWN RENDER WITH DEBUGGING
  const renderDropdown = () => (
    <select
      value={activeRunId || ''}
      onChange={(e) => {
        console.log('🔄 Dropdown onChange triggered with value:', e.target.value);
        switchToRun(e.target.value);
      }}
      className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="">Select an execution run...</option>
      {(() => {
        console.log('🔍 filteredRuns for dropdown:', filteredRuns.length, 'runs');
        console.log('🔍 filteredRuns data:', filteredRuns.map(r => ({ id: r.id, name: r.name })));
        return filteredRuns.map((run) => (
          <option key={run.id} value={run.id}>
            {run.name} ({run.completedTests}/{run.totalTests}) - {run.status}
          </option>
        ));
      })()}
    </select>
  );

  // ACTIVE RUN INFO
  const activeRun = executionRuns.find(r => r.id === activeRunId);

  return (
    <Layout>
      <div className="execution-page">
        {/* Run Selection Dropdown */}
        {filteredRuns.length > 0 && (
          <div className="border-b border-gray-200 p-4">
            <label className="text-sm font-medium text-gray-700">Active Run:</label>
            {renderDropdown()}
          </div>
        )}

        {/* Active Run Display */}
        {activeRun && (
          <div className="bg-gray-50 p-4">
            <h3>{activeRun.name}</h3>
            <p>Test Cases ({activeRunTestCases.length})</p>
            {loadingActiveRunTestCases && <p>Loading test cases...</p>}
          </div>
        )}

        {/* Test Cases List */}
        {activeRunTestCases.length > 0 && (
          <div className="test-cases">
            {activeRunTestCases.map(testCase => (
              <div key={testCase.id} className="test-case">
                <h4>{testCase.title}</h4>
                <p>Status: {testCase.currentStatus}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// PROBLEM DESCRIPTION:
// 1. Database has 3 run cases for "winnietest2" run (confirmed via direct DB query)
// 2. API endpoint /api/runs/[runId] correctly returns run with runCases included
// 3. When user selects run from dropdown, no console logs appear
// 4. activeRunTestCases remains empty array, showing "Test Cases (0)"
// 5. Progress shows 0/3 instead of correct values

// EXPECTED BEHAVIOR:
// 1. User selects "winnietest2" from dropdown
// 2. switchToRun() called with runId
// 3. activeRunId state updated
// 4. useEffect triggers API call to /api/runs/[runId]
// 5. RunCases transformed to test case format
// 6. activeRunTestCases updated with 3 test cases
// 7. UI shows "Test Cases (3)" and lists the test cases

// DEBUGGING ADDED:
// - Console logs in switchToRun function
// - Console logs in useEffect for activeRunTestCases
// - Console logs in dropdown rendering
// - Direct API fetch for comparison
// - Status normalization between database ("Not Run") and frontend ("Not_Executed")