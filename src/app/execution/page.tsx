'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  User,
  Calendar,
  FileText,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
  Target,
  Timer,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Zap,
  Bug,
  Shield,
  Eye,
  Download,
  Brain,
  Lightbulb,
  TrendingUp,
  Link,
  AlertCircle,
  CheckSquare,
  Clock4,
  Sparkles,
  TrendingDown,
  Activity,
  Gauge,
  Plus,
  Settings,
  Trash2,
  X,
  Users
} from 'lucide-react';
import { aiTestPrioritizer } from '@/lib/ai-test-prioritizer';
import { RunCreateWizard } from '@/components/execution/RunCreateWizard';
import { RunEditDialog } from '@/components/execution/RunEditDialog';
import { RunsService } from '@/lib/runs-service';
import { getAllUsers } from '@/lib/user-storage';

interface TestCase {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  currentStatus: string;
  steps: Array<{
    stepNumber: number;
    action: string;
    expected: string;
    actualResult?: string;
    status?: string;
  }>;
  expectedResult: string;
  linkedRequirements?: string[];
  projectId?: string;
  lastExecution?: {
    date: string;
    tester: string;
    status: string;
    notes: string;
  };
  executionHistory?: Array<{
    executionId: string;
    date: string;
    tester: string;
    status: string;
    notes: string;
    environment?: string;
    duration?: string;
    jiraTicket?: string;
  }>;
}

interface PrioritizedTestCase extends TestCase {
  aiScore?: {
    failureProbability: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    confidenceScore: number;
    priorityReason: string;
    recommendedOrder: number;
    insights: string[];
  };
}

// User Filter Dropdown Component with Search
interface UserFilterDropdownProps {
  users: Array<{
    id: string;
    name: string;
    email: string;
    username: string;
    role: string;
  }>;
  selectedUsers: string[];
  onSelectionChange: (selected: string[]) => void;
  roles: Record<string, { name: string }>;
}

const UserFilterDropdown: React.FC<UserFilterDropdownProps> = ({
  users,
  selectedUsers,
  onSelectionChange,
  roles
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user selection toggle
  const toggleUserSelection = (userName: string) => {
    if (selectedUsers.includes(userName)) {
      onSelectionChange(selectedUsers.filter(u => u !== userName));
    } else {
      onSelectionChange([...selectedUsers, userName]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear all selections
  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 border border-gray-300 rounded text-sm min-w-32 text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {selectedUsers.length === 0
            ? 'All Users'
            : selectedUsers.length === 1
              ? selectedUsers[0]
              : `${selectedUsers.length} users selected`
          }
        </span>
        <ChevronDown className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Clear all button */}
          {selectedUsers.length > 0 && (
            <div className="p-2 border-b border-gray-200">
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Clear all ({selectedUsers.length})
              </button>
            </div>
          )}

          {/* User list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-2 text-xs text-gray-500 text-center">
                {users.length === 0 ? 'Loading users...' : 'No users found'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user.id || user.name}
                  onClick={() => toggleUserSelection(user.name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-xs"
                >
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-gray-500">{roles[user.role]?.name || user.role}</div>
                  </div>
                  {selectedUsers.includes(user.name) && (
                    <CheckSquare className="w-3 h-3 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ExecutionData {
  status: 'Pass' | 'Fail' | 'Blocked' | 'Skip';
  tester: string;
  environment: string;
  duration: string;
  notes: string;
  jiraTicket?: string;
  screenshots?: string[];
}

export default function TestExecutionPage() {

  const router = useRouter();
  const [testCases, setTestCasesState] = useState<PrioritizedTestCase[]>([]);

  // Safe wrapper to ensure testCases is always an array
  const setTestCases = (data: PrioritizedTestCase[] | ((prev: PrioritizedTestCase[]) => PrioritizedTestCase[])) => {
    if (typeof data === 'function') {
      setTestCasesState(data);
    } else {
      setTestCasesState(Array.isArray(data) ? data : []);
    }
  };
  const [statusUpdateInProgress, setStatusUpdateInProgress] = useState<string | null>(null);
  const [lastStatusUpdate, setLastStatusUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const [aiPrioritizationEnabled, setAiPrioritizationEnabled] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [prioritizationAnalysis, setPrioritizationAnalysis] = useState<any>(null);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  const [selectedRelatedTests, setSelectedRelatedTests] = useState<string[]>([]);
  const [newTestCase, setNewTestCase] = useState<{
    title: string;
    description: string;
    category: string;
    priority: string;
    steps: Array<{ stepNumber: number; action: string; expected: string }>;
  }>({
    title: '',
    description: '',
    category: 'Functional',
    priority: 'Medium',
    steps: [{ stepNumber: 1, action: '', expected: '' }]
  });
  const [showAddTestCase, setShowAddTestCase] = useState(false);
  const [showImportTestCases, setShowImportTestCases] = useState(false);
  const [createTestCaseLoading, setCreateTestCaseLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [availableTestCases, setAvailableTestCases] = useState<any[]>([]);
  const [selectedImportTests, setSelectedImportTests] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'library' | 'file'>('library');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [selectedTest, setSelectedTest] = useState<PrioritizedTestCase | null>(null);

  // Default superadmin and available users for tester dropdown with roles
  const availableUsers = [
    {
      name: 'admin',
      email: 'admin@merquri.io',
      password: 'secure_password', // In production, this would be hashed
      role: 'super-admin',
      isDefault: true
    },
    { name: 'John Smith (Current User)', email: 'john.smith@company.com', role: 'super-admin' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'lead' },
    { name: 'Mike Chen', email: 'mike.chen@company.com', role: 'qa' },
    { name: 'Lisa Rodriguez', email: 'lisa.rodriguez@company.com', role: 'qa' },
    { name: 'David Kumar', email: 'david.kumar@company.com', role: 'lead' },
    { name: 'Emily Watson', email: 'emily.watson@company.com', role: 'qa' },
    { name: 'Alex Turner', email: 'alex.turner@company.com', role: 'qa' },
    { name: 'Maria Garcia', email: 'maria.garcia@company.com', role: 'qa' }
  ];

  // Get user role by name
  const getUserRole = (userName: string) => {
    const user = availableUsers.find(u => u.name === userName);
    return user ? roles[user.role] : null;
  };

  // Role-based access control system
  interface UserRole {
    name: string;
    level: number; // Higher number = more permissions
    permissions: string[];
    canViewRuns: (run: ExecutionRun) => boolean;
    canManageRuns: boolean;
    canViewAllProjects: boolean;
  }

  const roles: Record<string, UserRole> = {
    'qa': {
      name: 'QA Tester',
      level: 1,
      permissions: ['execute_tests', 'view_own_runs'],
      canViewRuns: (run) => run.tester === currentUser,
      canManageRuns: false,
      canViewAllProjects: false
    },
    'lead': {
      name: 'Lead (QA Manager)',
      level: 2,
      permissions: ['execute_tests', 'view_team_runs', 'create_runs', 'manage_team_runs', 'assign_testers'],
      canViewRuns: (run) => {
        // Lead can see runs from their team/project or their own runs
        return run.project === currentProject || run.tester === currentUser ||
               availableUsers.some(u => u.name === run.tester); // Can see team members' runs
      },
      canManageRuns: true,
      canViewAllProjects: false // Limited to their assigned projects
    },
    'super-admin': {
      name: 'Super Admin (Test Manager)',
      level: 3,
      permissions: ['*'], // All permissions including user management
      canViewRuns: () => true, // Can see all runs across all projects
      canManageRuns: true,
      canViewAllProjects: true
    }
  };

  // Current user configuration - Default to admin
  const [currentUserRole, setCurrentUserRole] = useState<string>('super-admin');
  const [currentUserId, setCurrentUserId] = useState<string>('admin');
  const currentUser = availableUsers.find(u => u.name === currentUserId)?.name || availableUsers[0].name;
  const currentProject = 'web-portal'; // User's primary project
  const userRole = roles[currentUserRole];

  // Get default superadmin credentials

  // Run filtering state for test leads
  const [runFilter, setRunFilter] = useState({
    status: 'all', // all, active, paused, completed
    tester: [] as string[], // array of selected user IDs/names, empty means show all runs
    project: 'all',
    timeframe: 'all' // all, today, this-week, this-month
  });

  // Initialize user filter with current user when component mounts
  useEffect(() => {
    if (currentUser && runFilter.tester.length === 0) {
      setRunFilter(prev => ({ ...prev, tester: [currentUser] }));
    }
  }, [currentUser]);

  // Multi-run execution system
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
    assignees?: string[];
  }

  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const [activeRunTestCases, setActiveRunTestCases] = useState<TestCase[]>([]);
  const [loadingActiveRunTestCases, setLoadingActiveRunTestCases] = useState(false);
  const [showCreateRun, setShowCreateRun] = useState(false);
  const [showRunWizard, setShowRunWizard] = useState(false);
  const [showEditRun, setShowEditRun] = useState(false);
  const [editingRun, setEditingRun] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRun, setDeletingRun] = useState<any>(null);

  // Edit assignees functionality
  const [showEditAssignees, setShowEditAssignees] = useState(false);
  const [editingAssignees, setEditingAssignees] = useState<string[]>([]);
  const [availableUsersForAssignment, setAvailableUsersForAssignment] = useState<Array<{
    id: string
    name: string
    email: string
    username: string
    avatar?: string
    role: string
  }>>([]);
  const [loadingUsersForAssignment, setLoadingUsersForAssignment] = useState(false);

  const [executionData, setExecutionData] = useState<ExecutionData>({
    status: 'Pass',
    tester: availableUsers[0].name, // Default to logged-in user
    environment: 'SIT',
    duration: 'Auto-tracked',
    notes: '',
    jiraTicket: ''
  });
  const [loading, setLoading] = useState(false);

  // Helper functions for execution runs
  const createNewRun = (name: string, project: string, selectedTests: PrioritizedTestCase[] = []) => {
    const newRun: ExecutionRun = {
      id: `run-${Date.now()}`,
      name,
      project,
      tester: executionData.tester,
      environment: executionData.environment,
      status: selectedTests.length > 0 ? 'active' : 'draft',
      testCases: selectedTests,
      startTime: new Date().toISOString(),
      completedTests: 0,
      totalTests: selectedTests.length,
      currentTest: selectedTests[0] || null
    };

    setExecutionRuns(prev => [...prev, newRun]);
    setActiveRunId(newRun.id);
    setSelectedTest(newRun.currentTest);
    setShowCreateRun(false);
  };

  // Function to add test cases to existing run
  const addTestCasesToRun = (runId: string, testCases: PrioritizedTestCase[]) => {
    setExecutionRuns(prev => prev.map(run => {
      if (run.id === runId) {
        const updatedTestCases = [...run.testCases, ...testCases];
        return {
          ...run,
          testCases: updatedTestCases,
          totalTests: updatedTestCases.length,
          currentTest: run.currentTest || (updatedTestCases.length > 0 ? updatedTestCases[0] : null),
          status: updatedTestCases.length > 0 && run.status === 'draft' ? 'active' : run.status
        };
      }
      return run;
    }));
  };


  const switchToRun = (runId: string) => {
    const run = executionRuns.find(r => r.id === runId);
    if (run) {
      setActiveRunId(runId);
      // setSelectedTest(run.currentTest); // Commented out - function not defined
      // setExecutionData(prev => ({ // Commented out - function not defined
      //   ...prev,
      //   tester: run.tester,
      //   environment: run.environment
      // }));
    }
  };

  const updateRunProgress = (runId: string, completedTest: PrioritizedTestCase) => {
    setExecutionRuns(prev => prev.map(run => {
      if (run.id === runId) {
        const newCompletedTests = run.completedTests + 1;
        const nextTestIndex = run.testCases.findIndex(t => t.id === completedTest.id) + 1;
        const nextTest = run.testCases[nextTestIndex] || null;

        return {
          ...run,
          completedTests: newCompletedTests,
          currentTest: nextTest,
          status: nextTest ? 'active' : 'completed' as const
        };
      }
      return run;
    }));
  };

  const activeRun = executionRuns.find(r => r.id === activeRunId);

  function normalizeStatus(status?: string | null) {
    if (!status) {
      return 'Not_Executed';
    }

    const normalized = status.toLowerCase();

    if (normalized === 'not run' || normalized === 'not_executed' || normalized === 'not executed') {
      return 'Not_Executed';
    }

    if (normalized === 'skipped' || normalized === 'skip') {
      return 'Skip';
    }

    if (normalized === 'blocked') {
      return 'Blocked';
    }

    if (normalized === 'fail' || normalized === 'failed') {
      return 'Fail';
    }

    if (normalized === 'pass' || normalized === 'passed') {
      return 'Pass';
    }

    return status;
  }

  function normalizePriority(priority?: string | null) {
    if (!priority) {
      return 'Medium';
    }

    switch (priority.toLowerCase()) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  function parseStepsSnapshot(runCase: any) {
    let parsedSteps: any[] = [];

    if (Array.isArray(runCase.stepsSnapshot)) {
      parsedSteps = runCase.stepsSnapshot;
    } else if (typeof runCase.stepsSnapshot === 'string' && runCase.stepsSnapshot.trim().length > 0) {
      try {
        parsedSteps = JSON.parse(runCase.stepsSnapshot);
      } catch (error) {
        console.warn('Failed to parse stepsSnapshot for runCase', runCase.id, error);
      }
    }

    if (!Array.isArray(parsedSteps)) {
      parsedSteps = [];
    }

    if (parsedSteps.length === 0 && Array.isArray(runCase.runSteps)) {
      parsedSteps = runCase.runSteps.map((step: any, index: number) => ({
        stepNumber: step.stepNumber ?? step.idx ?? index + 1,
        action: step.action ?? step.description ?? '',
        expected: step.expected ?? step.expectedResult ?? '',
      }));
    }

    return parsedSteps
      .map((step: any, index: number) => ({
        stepNumber: step.stepNumber ?? step.idx ?? index + 1,
        action: step.action ?? step.description ?? '',
        expected: step.expected ?? step.expectedResult ?? '',
      }))
      .filter(step => step.action || step.expected);
  }

  function parseRunCaseTags(tags: unknown) {
    const toStringArray = (values: unknown[]): string[] =>
      values
        .map(value => (typeof value === 'string' ? value : String(value)))
        .filter(value => value && value.trim().length > 0);

    if (Array.isArray(tags)) {
      return toStringArray(tags);
    }

    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? toStringArray(parsed) : [];
      } catch (error) {
        console.warn('Failed to parse tags for runCase', error);
      }
    }

    return [];
  }

  // Load test cases for active run
  const normalizeRunCase = useCallback((runCase: any) => {
    const normalizedStatus = normalizeStatus(runCase.status);
    const normalizedPriority = normalizePriority(runCase.priority);
    const normalizedSteps = parseStepsSnapshot(runCase);

    return {
      id: runCase.caseId,
      title: runCase.titleSnapshot ?? runCase.caseId,
      description: runCase.description || runCase.notes || '',
      category: runCase.component || 'General',
      priority: normalizedPriority,
      status: normalizedStatus,
      currentStatus: normalizedStatus,
      steps: normalizedSteps,
      expectedResult: runCase.expectedResult || '',
      assignee: runCase.assignee || '',
      linkedRequirements: parseRunCaseTags(runCase.tags),
    };
  }, []);

  const loadActiveRunTestCases = useCallback(async (runId: string) => {
    if (!runId) {
      return;
    }

    setLoadingActiveRunTestCases(true);

    try {
      let runPayload: any = null;
      let runStats: any = null;

      try {
        const response = await fetch(`/api/run-details/${runId}`, { cache: 'no-store' });
        if (response.ok) {
          const directData = await response.json();
          runPayload = directData?.run ?? null;
          runStats = directData?.stats ?? null;
        } else {
          console.warn('Direct fetch for run details returned non-OK status:', response.status);
        }
      } catch (directError) {
        console.warn('Direct fetch for run details failed:', directError);
      }

      if (!runPayload) {
        const serviceDetails = await RunsService.getRun(runId);
        runPayload = serviceDetails?.run ?? null;
        runStats = serviceDetails?.stats ?? null;
      }

      if (activeRunIdRef.current !== runId) {
        return;
      }


      if (runPayload?.runCases && runPayload.runCases.length > 0) {
        const runTestCases = runPayload.runCases.map(normalizeRunCase);

        setActiveRunTestCases(runTestCases);

        setExecutionRuns(prev => prev.map(run => {
          if (run.id !== runId) {
            return run;
          }

          const completedFromStats =
            (runStats?.passedCases || 0) +
            (runStats?.failedCases || 0) +
            (runStats?.blockedCases || 0);

          const completedFromCases = runTestCases.filter((tc: TestCase) =>
            !['Not_Executed', 'Not Run', 'Skip'].includes(tc.currentStatus)
          ).length;

          return {
            ...run,
            status: runPayload.status === 'completed' ? 'completed' : run.status,
            testCases: runTestCases,
            totalTests: runTestCases.length,
            completedTests: completedFromStats || completedFromCases,
          };
        }));
      } else {
        
        // Fallback: Try to get test cases from the run object itself
        const currentRun = executionRuns.find(run => run.id === runId);
        if (currentRun?.testCases && currentRun.testCases.length > 0) {
          const fallbackTestCases = currentRun.testCases.map(normalizeRunCase);
          setActiveRunTestCases(fallbackTestCases);
        } else {
        setActiveRunTestCases([]);
        }
      }
    } catch (error) {
      if (activeRunIdRef.current === runId) {
        console.error('Failed to load run test cases:', error);
        setActiveRunTestCases([]);
      }
    } finally {
      if (activeRunIdRef.current === runId) {
        setLoadingActiveRunTestCases(false);
      }
    }
  }, [normalizeRunCase]);

  useEffect(() => {
    if (!activeRunId) {
      activeRunIdRef.current = null;
      setActiveRunTestCases([]);
      setLoadingActiveRunTestCases(false);
      return;
    }

    activeRunIdRef.current = activeRunId;
    setActiveRunTestCases([]);
    void loadActiveRunTestCases(activeRunId);
  }, [activeRunId, loadActiveRunTestCases]);

  // Handle run creation from wizard
  const handleRunCreated = async (runId: string) => {
    console.log('Run created with ID:', runId)

    // Refresh the runs list to show the newly created run
    await loadExecutionRuns()

    // Set the new run as active to display its test cases
    setActiveRunId(runId)

    // Close wizard
    setShowRunWizard(false)
  }

  // Handle run editing
  const handleEditRun = (run: any) => {
    setEditingRun(run)
    setShowEditRun(true)
  }

  // Handle run updated
  const handleRunUpdated = async () => {
    // Refresh the runs list to show updated data
    await loadExecutionRuns()
  }

  // Load users for assignee editing
  const loadUsersForAssignment = async () => {
    try {
      setLoadingUsersForAssignment(true)

      // Use localStorage directly instead of API call
      const users = getAllUsers()

      // Transform users to match the expected format
      const userList = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.name, // Use name as username fallback
        avatar: user.avatar,
        role: user.role
      }))

      setAvailableUsersForAssignment(userList)
    } catch (error) {
      console.error('Failed to load users:', error)
      setAvailableUsersForAssignment([])
    } finally {
      setLoadingUsersForAssignment(false)
    }
  }

  // Handle editing run assignees
  const handleEditAssignees = async () => {
    if (!activeRun) return

    // Load current assignees (for now, simulate from activeRun.assignees or empty)
    const currentAssignees = activeRun.assignees || []
    setEditingAssignees(currentAssignees)

    // Load available users
    await loadUsersForAssignment()
    setShowEditAssignees(true)
  }

  // Save updated assignees
  const handleSaveAssignees = async () => {
    if (!activeRun) return

    try {
      // Update run assignees via API (will need to implement this)
      // For now, just update local state
      const updatedRuns = executionRuns.map(run =>
        run.id === activeRun.id
          ? { ...run, assignees: editingAssignees }
          : run
      )
      setExecutionRuns(updatedRuns)

      setShowEditAssignees(false)
      setEditingAssignees([])

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Run assignees updated successfully',
        show: true
      })
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)

    } catch (error) {
      console.error('Failed to update assignees:', error)
      setNotification({
        type: 'error',
        message: 'Failed to update assignees',
        show: true
      })
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
    }
  }

  // Add assignee to editing list
  const addAssigneeToEdit = (userId: string) => {
    if (!editingAssignees.includes(userId)) {
      setEditingAssignees([...editingAssignees, userId])
    }
  }

  // Remove assignee from editing list
  const removeAssigneeFromEdit = (userId: string) => {
    setEditingAssignees(editingAssignees.filter(id => id !== userId))
  }

  // Handle run deletion
  const handleDeleteRun = (run: any) => {
    setDeletingRun(run)
    setShowDeleteConfirm(true)
  }

  // Confirm run deletion
  const handleConfirmDelete = async () => {
    if (!deletingRun) return

    try {
      await RunsService.deleteRun(deletingRun.id)
      setShowDeleteConfirm(false)
      setDeletingRun(null)
      await loadExecutionRuns()

      // If the deleted run was active, clear it
      if (activeRunId === deletingRun.id) {
        setActiveRunId(null)
      }
    } catch (error) {
      console.error('Failed to delete run:', error)
      // You could show an error toast here
      alert(error instanceof Error ? error.message : 'Failed to delete run')
    }
  }

  // Filter execution runs based on role permissions and filters
  const getFilteredRuns = () => {
    return executionRuns.filter(run => {
      // Role-based visibility check first
      if (!userRole.canViewRuns(run)) {
        return false;
      }

      // Status filter
      if (runFilter.status !== 'all' && run.status !== runFilter.status) {
        return false;
      }

      // User filter (applies for all users, multiselect)
      if (runFilter.tester.length > 0) {
        // Check if any of the selected users are assigned to this run
        const hasMatchingAssignee = run.assignees &&
          run.assignees.some(assignee =>
            runFilter.tester.some(selectedUser =>
              assignee === selectedUser || // exact match
              assignee.includes(selectedUser) || // partial match (for email/name variations)
              selectedUser.includes(assignee)
            )
          );

        // Also check if the run tester matches any selected user
        const hasMatchingTester = runFilter.tester.some(selectedUser =>
          run.tester === selectedUser ||
          run.tester.includes(selectedUser) ||
          selectedUser.includes(run.tester)
        );

        if (!hasMatchingAssignee && !hasMatchingTester) {
          return false;
        }
      }

      // Project filter (if user doesn't have access to all projects)
      if (!userRole.canViewAllProjects && runFilter.project !== 'all' && run.project !== runFilter.project) {
        return false;
      }

      // Timeframe filter
      if (runFilter.timeframe !== 'all') {
        const runDate = new Date(run.startTime);
        const now = new Date();

        switch (runFilter.timeframe) {
          case 'today':
            if (runDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'this-week':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            if (runDate < weekStart) return false;
            break;
          case 'this-month':
            if (runDate.getMonth() !== now.getMonth() || runDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredRuns = getFilteredRuns();

  // This will be calculated after filteredTestCases is available

  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    project: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState('desc');
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    show: boolean;
  }>({ type: 'info', message: '', show: false });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadTestCases();
    loadProjects();
  }, []);

  // Load real execution runs from API with localStorage fallback
  const loadExecutionRuns = async () => {
    try {
      const result = await RunsService.getRuns({ limit: 50 });

      if (result.runs && result.runs.length > 0) {
      // Transform API runs to ExecutionRun format
      const transformedRuns: ExecutionRun[] = result.runs.map(run => {
        const environment = Array.isArray(run.environments) && run.environments.length > 0
          ? run.environments[0]
          : 'SIT';

        // Determine status based on run status
        let status: 'active' | 'paused' | 'completed' | 'draft' = 'active';
        if (run.status === 'completed') status = 'completed';
        else if (run.status === 'paused') status = 'paused';
        else if (run.status === 'failed') status = 'completed'; // Map failed to completed
        else if (run.status === 'draft') status = 'draft';

        const completedTests = (run.stats?.passedCases || 0) + (run.stats?.failedCases || 0) + (run.stats?.blockedCases || 0);
        const totalTests = run.stats?.totalCases || 0;


        return {
          id: run.id,
          name: run.name,
          project: run.projectId,
          tester: run.createdBy,
          environment,
          status,
          testCases: [], // Will be loaded separately if needed
          startTime: run.startedAt || run.createdAt,
          completedTests,
          totalTests,
          currentTest: null // Will be determined from run details if needed
        };
      });

      setExecutionRuns(transformedRuns);

      // Set the first active run as active if no active run is set
      if (!activeRunId && transformedRuns.length > 0) {
        const firstActiveRun = transformedRuns.find(run => run.status === 'active');
        if (firstActiveRun) {
          setActiveRunId(firstActiveRun.id);
        }
        }
      } else {
        // Fallback to localStorage for dev environment
        await loadExecutionRunsFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load execution runs from API, trying localStorage fallback:', error);
      // Fallback to localStorage for dev environment
      await loadExecutionRunsFromLocalStorage();
    }
  };

  // Load execution runs from localStorage (dev environment fallback)
  const loadExecutionRunsFromLocalStorage = async () => {
    try {
      
      // Check if there are any stored execution runs in localStorage
      const storedRuns = localStorage.getItem('testCaseWriter_executionRuns');
      if (storedRuns) {
        const parsedRuns = JSON.parse(storedRuns);
        
        const transformedRuns: ExecutionRun[] = parsedRuns.map((run: any) => ({
          id: run.id,
          name: run.name,
          project: run.project || 'Unknown Project',
          tester: run.tester || 'Unknown',
          environment: run.environment || 'SIT',
          status: run.status || 'active',
          testCases: run.testCases || [],
          startTime: run.startTime || new Date().toISOString(),
          totalTests: run.totalTests || 0,
          completedTests: run.completedTests || 0,
          currentTest: run.currentTest || null
        }));
        
        setExecutionRuns(transformedRuns);
        
        // Set the first active run as active if no active run is set
        if (!activeRunId && transformedRuns.length > 0) {
          const firstActiveRun = transformedRuns.find(run => run.status === 'active');
          if (firstActiveRun) {
            setActiveRunId(firstActiveRun.id);
          }
        }
      } else {
        setExecutionRuns([]);
      }
    } catch (error) {
      console.error('Failed to load execution runs from localStorage:', error);
      setExecutionRuns([]);
    }
  };


  useEffect(() => {
    loadExecutionRuns();
  }, []);

  // Load projects from localStorage
  const loadProjects = () => {
    try {
      const stored = localStorage.getItem('testCaseWriter_projects');
      if (stored) {
        const parsedProjects = JSON.parse(stored);
        const activeProjects = parsedProjects.filter((p: any) => p.status === 'active');
        setProjects(activeProjects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    }
  };

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Auto-refresh mechanism for real-time status updates
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const refreshInterval = setInterval(() => {
      // Refresh test cases
      loadTestCases();

      // Refresh active run test cases if there's an active run
      if (activeRunId) {
        loadActiveRunTestCases(activeRunId);
      }

      // Refresh execution runs
      loadExecutionRuns();

      setLastStatusUpdate(new Date());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, activeRunId]);

  // Countdown timer for auto-refresh
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setRefreshCountdown(0);
      return;
    }

    const countdownInterval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    // Initialize countdown
    setRefreshCountdown(30);

    return () => clearInterval(countdownInterval);
  }, [autoRefreshEnabled]);

  // Load users when a test is selected for execution
  useEffect(() => {
    if (selectedTest) {
      loadUsersForAssignment();
    }
  }, [selectedTest]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, show: true });
  };

  // AI-powered failure analysis
  const analyzeFailureWithAI = async (testCase: TestCase, failureDescription: string) => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testCaseId: testCase.id,
          failureDescription: failureDescription
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiAnalysis(result.analysis);
        setShowAiAnalysis(true);
        showNotification('success', `AI analyzed ${result.analysis.relatedTestCases.length} related test cases`);
      } else {
        throw new Error('Failed to analyze with AI');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      showNotification('error', 'AI analysis failed. Using local intelligence instead.');
      
      // Fallback to local analysis
      const localAnalysis = performLocalAnalysis(testCase, failureDescription);
      setAiAnalysis(localAnalysis);
      setShowAiAnalysis(true);
    } finally {
      setAiLoading(false);
    }
  };

  // Local fallback analysis
  const performLocalAnalysis = (testCase: TestCase, failureDescription: string) => {
    const relatedTests = testCases.filter(tc => 
      tc.id !== testCase.id && 
      (tc.category === testCase.category || 
       tc.linkedRequirements?.some(req => testCase.linkedRequirements?.includes(req)))
    ).slice(0, 5);

    return {
      relatedTestCases: relatedTests,
      riskLevel: testCase.priority === 'Critical' ? 'high' : 'medium',
      impactCategory: testCase.category,
      blockingRecommendation: {
        shouldBlock: relatedTests.length > 2,
        reason: `Found ${relatedTests.length} related test cases in the same category`,
        testCasesToBlock: relatedTests.slice(0, 3).map(tc => tc.id)
      },
      suggestedActions: [
        '🔍 Review related test cases for similar issues',
        '📝 Update test documentation',
        '🔄 Re-run after fix verification'
      ],
      rootCauseAnalysis: `Potential issue in ${testCase.category} component. Consider checking related functionality.`
    };
  };

  // Block related test cases based on AI recommendation
  const blockRelatedTests = async (testCasesToBlock: string[], reason: string) => {
    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testCasesToBlock,
          reason
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await loadTestCases(); // Refresh the test cases
        showNotification('success', `Successfully blocked ${result.summary.successful} test cases`);
        setShowAiAnalysis(false);
      } else {
        throw new Error('Failed to block test cases');
      }
    } catch (error) {
      console.error('Failed to block test cases:', error);
      showNotification('error', 'Failed to block related test cases');
    }
  };

  // Update status for selected related test cases
  const updateRelatedTestsStatus = async (testCaseIds: string[], newStatus: string, reason: string) => {
    setBulkUpdateLoading(true);
    try {
      const updatePromises = testCaseIds.map(async (testCaseId) => {
        const executionData = {
          status: newStatus as 'Pass' | 'Fail' | 'Blocked' | 'Skip',
          tester: 'AI-Assisted Update',
          environment: 'SIT',
          duration: '0 minutes',
          notes: reason,
          jiraTicket: ''
        };

        try {
          const response = await fetch('/api/test-cases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              testCaseId,
              executionData
            }),
          });

          if (response.ok) {
            return { testCaseId, success: true };
          } else {
            return { testCaseId, success: false };
          }
        } catch (error) {
          return { testCaseId, success: false };
        }
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;

      await loadTestCases(); // Refresh test cases
      showNotification('success', `Successfully updated ${successCount} test case(s) to ${newStatus}`);
      setSelectedRelatedTests([]);

    } catch (error) {
      console.error('Failed to update test cases:', error);
      showNotification('error', 'Failed to update related test cases');
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  // Toggle selection of related test case
  const toggleRelatedTestSelection = (testCaseId: string) => {
    setSelectedRelatedTests(prev =>
      prev.includes(testCaseId)
        ? prev.filter(id => id !== testCaseId)
        : [...prev, testCaseId]
    );
  };

  // Select all related test cases
  const selectAllRelatedTests = () => {
    if (aiAnalysis?.relatedTestCases) {
      const allIds = aiAnalysis.relatedTestCases.map((tc: any) => tc.id);
      setSelectedRelatedTests(allIds);
    }
  };

  // Clear all selections
  const clearRelatedTestSelections = () => {
    setSelectedRelatedTests([]);
  };

  // Add new test case functionality
  const addTestStep = () => {
    setNewTestCase(prev => ({
      ...prev,
      steps: [...prev.steps, {
        stepNumber: prev.steps.length + 1,
        action: '',
        expected: ''
      }]
    }));
  };

  const removeTestStep = (index: number) => {
    setNewTestCase(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 }))
    }));
  };

  const updateTestStep = (index: number, field: string, value: string) => {
    setNewTestCase(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const generateTestCaseId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TC_MANUAL_${timestamp}`;
  };

  // AI-powered test case suggestions
  const generateAISuggestions = async () => {
    if (!newTestCase.title) {
      showNotification('info', 'Please enter a test case title first');
      return;
    }

    setAiSuggestionsLoading(true);
    try {
      // Simulate AI suggestion generation (you can connect to a real AI service)
      const suggestions = generateIntelligentSuggestions(newTestCase.title, newTestCase.category);
      setAiSuggestions(suggestions);
      setShowAiSuggestions(true);
    } catch (error) {
      console.error('AI suggestions failed:', error);
      showNotification('error', 'Failed to generate AI suggestions');
    } finally {
      setAiSuggestionsLoading(false);
    }
  };

  // Generate intelligent suggestions based on title and category
  const generateIntelligentSuggestions = (title: string, category: string) => {
    const titleLower = title.toLowerCase();
    let suggestions: {
      descriptions: string[];
      testSteps: Array<{ action: string; expected: string }>;
      priorities: string[];
      categories: string[];
    } = {
      descriptions: [],
      testSteps: [],
      priorities: [],
      categories: []
    };

    // Smart description suggestions
    if (titleLower.includes('login')) {
      suggestions.descriptions = [
        'Verify that users can successfully authenticate with valid credentials',
        'Test the login functionality with various user types and scenarios',
        'Validate authentication flow and proper access control'
      ];
      suggestions.testSteps = [
        { action: 'Navigate to login page', expected: 'Login form is displayed with username and password fields' },
        { action: 'Enter valid username and password', expected: 'Credentials are accepted and validated' },
        { action: 'Click Login button', expected: 'User is redirected to dashboard/home page' },
        { action: 'Verify user session is active', expected: 'User remains logged in and can access protected features' }
      ];
    } else if (titleLower.includes('search')) {
      suggestions.descriptions = [
        'Verify search functionality returns accurate and relevant results',
        'Test search performance and filtering capabilities',
        'Validate search behavior with various input types and edge cases'
      ];
      suggestions.testSteps = [
        { action: 'Navigate to search page/section', expected: 'Search interface is displayed with input field' },
        { action: 'Enter search query', expected: 'Search input accepts and displays the query' },
        { action: 'Execute search', expected: 'Search results are displayed with relevant matches' },
        { action: 'Verify result accuracy', expected: 'Results match the search criteria and are properly formatted' }
      ];
    } else if (titleLower.includes('registration') || titleLower.includes('signup')) {
      suggestions.descriptions = [
        'Verify new user registration process works correctly',
        'Test user account creation with validation and confirmation',
        'Validate registration form handling and data processing'
      ];
      suggestions.testSteps = [
        { action: 'Navigate to registration page', expected: 'Registration form is displayed with required fields' },
        { action: 'Fill in user details', expected: 'Form accepts valid user information' },
        { action: 'Submit registration', expected: 'Account is created and confirmation is shown' },
        { action: 'Verify account activation', expected: 'User can login with new credentials' }
      ];
    } else if (titleLower.includes('cart') || titleLower.includes('shopping')) {
      suggestions.descriptions = [
        'Verify shopping cart functionality and item management',
        'Test add/remove items and cart persistence',
        'Validate cart calculations and checkout process integration'
      ];
      suggestions.testSteps = [
        { action: 'Navigate to product page', expected: 'Product details and Add to Cart button are visible' },
        { action: 'Add item to cart', expected: 'Item is added and cart counter updates' },
        { action: 'View cart contents', expected: 'Cart displays correct items, quantities, and pricing' },
        { action: 'Modify cart items', expected: 'Cart updates reflect changes accurately' }
      ];
    } else if (titleLower.includes('payment') || titleLower.includes('checkout')) {
      suggestions.descriptions = [
        'Verify payment processing and checkout functionality',
        'Test payment gateway integration and transaction handling',
        'Validate secure payment flow and order completion'
      ];
      suggestions.testSteps = [
        { action: 'Proceed to checkout', expected: 'Checkout page displays order summary and payment options' },
        { action: 'Select payment method', expected: 'Payment form is displayed for selected method' },
        { action: 'Enter payment details', expected: 'Payment information is validated and accepted' },
        { action: 'Complete transaction', expected: 'Payment is processed and confirmation is displayed' }
      ];
    } else {
      // Generic suggestions based on category
      suggestions.descriptions = [
        `Verify ${titleLower} functionality works as expected`,
        `Test ${titleLower} feature across different scenarios`,
        `Validate ${titleLower} behavior and user experience`
      ];
      suggestions.testSteps = [
        { action: 'Navigate to the feature/page', expected: 'Page/feature loads successfully' },
        { action: 'Perform the main action', expected: 'Action completes successfully' },
        { action: 'Verify the result', expected: 'Expected outcome is achieved' },
        { action: 'Test edge cases', expected: 'Feature handles edge cases properly' }
      ];
    }

    // Category-specific priorities
    if (category === 'Security') {
      suggestions.priorities = ['Critical', 'High'];
    } else if (category === 'Authentication') {
      suggestions.priorities = ['Critical', 'High'];
    } else if (category === 'API') {
      suggestions.priorities = ['High', 'Medium'];
    } else {
      suggestions.priorities = ['Medium', 'High'];
    }

    // Related category suggestions
    if (titleLower.includes('mobile') || titleLower.includes('responsive')) {
      suggestions.categories = ['Mobile', 'UI/UX'];
    } else if (titleLower.includes('api') || titleLower.includes('endpoint')) {
      suggestions.categories = ['API', 'Integration'];
    } else if (titleLower.includes('security') || titleLower.includes('auth')) {
      suggestions.categories = ['Security', 'Authentication'];
    }

    return suggestions;
  };

  // Apply AI suggestion to test case
  const applySuggestion = (type: string, suggestion: any, index?: number) => {
    switch (type) {
      case 'description':
        setNewTestCase(prev => ({ ...prev, description: suggestion }));
        break;
      case 'priority':
        setNewTestCase(prev => ({ ...prev, priority: suggestion }));
        break;
      case 'category':
        setNewTestCase(prev => ({ ...prev, category: suggestion }));
        break;
      case 'steps':
        setNewTestCase(prev => ({
          ...prev,
          steps: suggestion.map((step: any, i: number) => ({
            stepNumber: i + 1,
            action: step.action,
            expected: step.expected
          }))
        }));
        break;
      case 'step':
        if (index !== undefined) {
          setNewTestCase(prev => ({
            ...prev,
            steps: prev.steps.map((step, i) =>
              i === index ? { ...step, ...suggestion } : step
            )
          }));
        }
        break;
    }
  };

  const saveNewTestCase = async () => {
    try {
      setLoading(true);
      const testCaseId = generateTestCaseId();

      const testCaseData = {
        id: testCaseId,
        title: newTestCase.title,
        description: newTestCase.description,
        category: newTestCase.category,
        priority: newTestCase.priority,
        currentStatus: 'Not_Executed',
        steps: newTestCase.steps,
        expectedResult: `Test case should complete successfully with all steps passing`,
        linkedRequirements: [],
        projectId: 'PROJ_MANUAL_001',
        lastExecution: null,
        executionHistory: []
      };

      // Try to save via API
      const response = await fetch('/api/test-cases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCaseData),
      });

      if (response.ok) {
        await loadTestCases();
        showNotification('success', `Test case ${testCaseId} created successfully!`);
      } else {
        throw new Error('API creation failed');
      }
    } catch (error) {
      // Fallback: Add to local state
      const testCaseData = {
        id: generateTestCaseId(),
        title: newTestCase.title,
        description: newTestCase.description,
        category: newTestCase.category,
        priority: newTestCase.priority,
        currentStatus: 'Not_Executed',
        steps: newTestCase.steps,
        expectedResult: `Test case should complete successfully with all steps passing`,
        linkedRequirements: [],
        projectId: 'PROJ_MANUAL_001'
      };

      setTestCases(prev => [...prev, testCaseData as PrioritizedTestCase]);
      showNotification('success', `Test case ${testCaseData.id} created locally!`);
    } finally {
      setLoading(false);
      setNewTestCase({
        title: '',
        description: '',
        category: 'Functional',
        priority: 'Medium',
        steps: [{ stepNumber: 1, action: '', expected: '' }]
      });
    }
  };

  // Import test cases functionality
  const loadAvailableTestCases = async () => {
    try {
      // Try to fetch from test case generator API
      const response = await fetch('/api/v1/generate-test-cases?action=list');
      if (response.ok) {
        const generatedTests = await response.json();
        setAvailableTestCases(generatedTests);
      } else {
        throw new Error('No generated test cases available');
      }
    } catch (error) {
      // Fallback: Show sample importable test cases
      const sampleTests = [
        {
          id: 'GEN_001',
          title: 'User Registration Flow',
          description: 'Test new user registration process',
          category: 'Authentication',
          priority: 'High'
        },
        {
          id: 'GEN_002',
          title: 'Product Search Functionality',
          description: 'Verify product search with filters',
          category: 'Functional',
          priority: 'Medium'
        },
        {
          id: 'GEN_003',
          title: 'Mobile Responsive Design',
          description: 'Test mobile layout and interactions',
          category: 'UI/UX',
          priority: 'High'
        }
      ];
      setAvailableTestCases(sampleTests);
    }
  };

  const importSelectedTestCases = async () => {
    try {
      setLoading(true);
      let importedCount = 0;

      for (const testId of selectedImportTests) {
        const testCase = availableTestCases.find(tc => tc.id === testId);
        if (testCase) {
          const newId = `TC_IMPORT_${Date.now().toString(36).toUpperCase()}_${importedCount}`;
          const importedTestCase = {
            ...testCase,
            id: newId,
            currentStatus: 'Not_Executed',
            lastExecution: null,
            executionHistory: [],
            steps: testCase.steps || [
              { stepNumber: 1, action: 'Navigate to application', expected: 'Application loads successfully' },
              { stepNumber: 2, action: 'Perform test action', expected: 'Expected result occurs' }
            ]
          };

          setTestCases(prev => [...prev, importedTestCase as PrioritizedTestCase]);
          importedCount++;
        }
      }

      showNotification('success', `Successfully imported ${importedCount} test case(s)!`);
    } catch (error) {
      console.error('Import failed:', error);
      showNotification('error', 'Failed to import test cases');
    } finally {
      setLoading(false);
      setSelectedImportTests([]);
    }
  };

  const toggleImportTestSelection = (testId: string) => {
    setSelectedImportTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  // File upload and processing functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      let parsedData: any[] = [];

      if (fileExtension === 'csv') {
        const text = await file.text();
        parsedData = parseCSV(text);
      } else if (fileExtension === 'json') {
        const text = await file.text();
        parsedData = JSON.parse(text);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // For Excel files, we'll need to parse them
        parsedData = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format. Please use CSV, JSON, or Excel files.');
      }

      // Validate and normalize the data
      const normalizedData = normalizeImportData(parsedData);
      setFilePreview(normalizedData);
      setShowImportPreview(true);
      showNotification('success', `Parsed ${normalizedData.length} test cases from file`);

    } catch (error) {
      console.error('File parsing error:', error);
      showNotification('error', `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file must have header and at least one data row');

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    // For now, we'll return a placeholder - in a real implementation,
    // you'd use a library like xlsx or exceljs
    throw new Error('Excel import not yet implemented. Please use CSV or JSON format.');
  };

  const normalizeImportData = (data: any[]): any[] => {
    return data.map((item, index) => {
      // Try to map common field variations to our test case structure
      const normalized = {
        id: item.id || item.ID || item['Test ID'] || item['Test Case ID'] || `IMPORT_${Date.now()}_${index}`,
        title: item.title || item.Title || item['Test Case'] || item['Test Name'] || item.name || `Imported Test ${index + 1}`,
        description: item.description || item.Description || item['Test Description'] || item.summary || '',
        category: item.category || item.Category || item.Type || 'Functional',
        priority: item.priority || item.Priority || 'Medium',
        currentStatus: 'Not_Executed',
        steps: parseTestSteps(item),
        expectedResult: item.expectedResult || item['Expected Result'] || item.expected || 'Test should pass',
        linkedRequirements: parseRequirements(item),
        projectId: selectedProject !== 'all' ? selectedProject : item.projectId || item.project || undefined
      };

      return normalized;
    });
  };

  const parseTestSteps = (item: any): any[] => {
    // Try to parse test steps from various possible fields
    if (item.steps && Array.isArray(item.steps)) {
      return item.steps;
    }

    if (item['Test Steps'] || item.testSteps) {
      const stepsText = item['Test Steps'] || item.testSteps;
      const steps = stepsText.split('\n').filter((step: string) => step.trim());
      return steps.map((step: string, index: number) => ({
        stepNumber: index + 1,
        action: step.trim(),
        expected: 'Expected result not specified'
      }));
    }

    // Default step if none provided
    return [
      { stepNumber: 1, action: 'Execute test case', expected: 'Test should pass' }
    ];
  };

  const parseRequirements = (item: any): string[] => {
    const reqField = item.requirements || item.Requirements || item['Linked Requirements'] || '';
    if (!reqField) return [];

    if (typeof reqField === 'string') {
      return reqField.split(',').map(req => req.trim()).filter(req => req);
    }

    if (Array.isArray(reqField)) {
      return reqField.map(req => String(req).trim()).filter(req => req);
    }

    return [];
  };

  const confirmFileImport = async () => {
    if (filePreview.length === 0) return;

    setLoading(true);
    setImportProgress(0);

    try {
      let importedCount = 0;
      const totalItems = filePreview.length;

      for (const testCase of filePreview) {
        const newId = `TC_FILE_${Date.now().toString(36).toUpperCase()}_${importedCount}`;
        const importedTestCase = {
          ...testCase,
          id: newId,
          currentStatus: 'Not_Executed',
          lastExecution: null,
          executionHistory: []
        };

        setTestCases(prev => [...prev, importedTestCase as PrioritizedTestCase]);
        importedCount++;

        // Update progress
        setImportProgress(Math.round((importedCount / totalItems) * 100));

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      showNotification('success', `Successfully imported ${importedCount} test cases from file!`);

      // Reset states
      setShowImportPreview(false);
      setUploadedFile(null);
      setFilePreview([]);
      setImportProgress(0);

    } catch (error) {
      console.error('File import failed:', error);
      showNotification('error', 'Failed to import test cases from file');
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async () => {
    try {
      // Try to fetch from API first - prioritize MongoDB over localStorage
      const response = await fetch('/api/test-cases');
      if (response.ok) {
        const apiData = await response.json();
        console.log('📊 API response from MongoDB:', apiData);

        // Ensure we always have an array
        const testCases = Array.isArray(apiData) ? apiData : [];
        console.log('📊 API test cases loaded from MongoDB:', testCases.length);

        // Always use MongoDB data, even if empty - this is the source of truth
        setTestCases(testCases);

        if (testCases.length === 0) {
          console.log('📊 MongoDB has no test cases - showing empty state');
        }
        return;
      } else {
        console.warn('API request failed with status:', response.status);
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('MongoDB API not available, trying localStorage fallback:', error);
    }

    // Try localStorage fallback (only when MongoDB API is completely unavailable)
    try {
      console.log('⚠️ MongoDB API failed, falling back to localStorage');
      const { getAllStoredTestCases } = await import('@/lib/test-case-storage');
      const storedTestCases = getAllStoredTestCases();
      console.log('📊 localStorage fallback test cases found:', storedTestCases.length);
      
      if (storedTestCases.length > 0) {
        // Transform localStorage test cases to match the expected format
        const transformedTestCases = storedTestCases.map(tc => ({
          id: tc.id,
          title: tc.data?.title || tc.testCase || tc.id,
          description: tc.data?.description || '',
          category: tc.data?.module || tc.module || 'General',
          priority: tc.priority || 'medium',
          currentStatus: tc.status || 'active',
          steps: tc.testSteps?.map((step: any, index: number) => ({
            stepNumber: index + 1,
            action: step.description || step.action || '',
            expected: step.expectedResult || step.expected || ''
          })) || [],
          expectedResult: tc.data?.expectedResult || '',
          linkedRequirements: [],
          projectId: tc.projectId || 'default',
          lastExecution: undefined,
          executionHistory: []
        }));
        
        console.log('✅ Transformed localStorage test cases:', transformedTestCases.length);
        setTestCases(transformedTestCases);
        return;
      }
    } catch (localStorageError) {
      console.warn('localStorage not available:', localStorageError);
    }

    // No fallback test cases - show empty state when no test cases are available
    setTestCases([]);
  };

  // AI Prioritization Functions
  const enableAIPrioritization = async () => {
    setAiAnalysisLoading(true);
    try {
      const result = await aiTestPrioritizer.prioritizeTestCases(testCases);
      setTestCases(result.prioritizedTests as PrioritizedTestCase[]);
      setPrioritizationAnalysis(result.analysis);
      setAiPrioritizationEnabled(true);
      setSortBy('aiRecommended');
      showNotification('success', `? AI analyzed ${result.analysis.totalTests} tests. ${result.analysis.highRiskTests} high-risk cases identified.`);
    } catch (error) {
      console.error('AI prioritization failed:', error);
      showNotification('error', 'AI prioritization failed. Using standard sorting.');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const disableAIPrioritization = () => {
    setAiPrioritizationEnabled(false);
    setPrioritizationAnalysis(null);
    setSortBy('lastModified');
    showNotification('info', 'AI prioritization disabled. Using standard sorting.');
  };

  const getAIRiskIcon = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return <AlertTriangle className="w-3 h-3 text-danger" />;
      case 'high': return <TrendingUp className="w-3 h-3 text-warning" />;
      case 'medium': return <Activity className="w-3 h-3 text-info" />;
      case 'low': return <TrendingDown className="w-3 h-3 text-success" />;
      default: return null;
    }
  };

  const getAIRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'bg-neutral-light text-neutral-dark border-neutral';
    }
  };

  const handleExecuteTest = async () => {
    if (!selectedTest) return;

    setLoading(true);
    try {
      // If this is part of an active run, update the run case
      if (activeRunId) {
        try {
          // Find the run case for this test in the active run
          const response = await fetch(`/api/run-details/${activeRunId}`);
          const data = await response.json();
          const runCase = data.run?.runCases?.find((rc: any) => rc.caseId === selectedTest.id);

          if (runCase) {
            // Update the run case status
            const updateResponse = await fetch(`/api/run-cases/${runCase.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: executionData.status,
                notes: executionData.notes,
                assignee: executionData.tester
              })
            });

            if (updateResponse.ok) {
              // Set status update indicator
              setStatusUpdateInProgress(selectedTest.id);

              // Immediately update the UI state for better UX
              setActiveRunTestCases(prev => prev.map(tc =>
                tc.id === selectedTest.id
                  ? { ...tc, currentStatus: executionData.status, lastExecution: { date: new Date().toISOString(), tester: executionData.tester, status: executionData.status, notes: executionData.notes } }
                  : tc
              ));

              // Reload the active run test cases to reflect the update
              await loadActiveRunTestCases(activeRunId);

              // Mark status update as complete
              setStatusUpdateInProgress(null);
              setLastStatusUpdate(new Date());

              showNotification('success', `✅ Test ${selectedTest!.id} executed with status: ${executionData.status}`);
            } else {
              throw new Error('Failed to update run case');
            }
          } else {
            throw new Error('Run case not found');
          }
        } catch (runError) {
          console.error('Failed to update run case:', runError);
          showNotification('error', 'Failed to update test case status');
        }
      } else {
        // Not part of a run, update general test case
        try {
          const response = await fetch('/api/test-cases', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              testCaseId: selectedTest!.id,
              executionData: executionData
            }),
          });

          if (response.ok) {
            // Set status update indicator
            setStatusUpdateInProgress(selectedTest.id);

            // Immediately update the UI state for better UX
            setTestCases(prev => prev.map(tc =>
              tc.id === selectedTest.id
                ? { ...tc, currentStatus: executionData.status, lastExecution: { date: new Date().toISOString(), tester: executionData.tester, status: executionData.status, notes: executionData.notes } }
                : tc
            ));

            await loadTestCases();

            // Mark status update as complete
            setStatusUpdateInProgress(null);
            setLastStatusUpdate(new Date());

            showNotification('success', `✅ Test ${selectedTest!.id} executed successfully with status: ${executionData.status}`);
          } else {
            throw new Error('API call failed');
          }
        } catch (apiError) {
          console.warn('API not available, updating locally:', apiError);

          const updatedTestCases = testCases.map(tc => {
            if (tc.id === selectedTest!.id) {
              return {
                ...tc,
                currentStatus: executionData.status,
                lastExecution: {
                  date: new Date().toISOString(),
                  tester: executionData.tester,
                  status: executionData.status,
                  notes: executionData.notes
                }
              };
            }
            return tc;
          });

          setTestCases(updatedTestCases);
          setLastStatusUpdate(new Date());
          showNotification('info', `💾 Test ${selectedTest!.id} executed locally with status: ${executionData.status}`);
        }
      }
      
      // Trigger AI analysis for failures
      if (executionData.status === 'Fail' && executionData.notes.trim()) {
        showNotification('info', '🤖 AI is analyzing this failure for related test cases...');
        setTimeout(() => {
          analyzeFailureWithAI(selectedTest, executionData.notes);
        }, 1000);
      }

      // Update run progress if this test is part of an active run
      if (activeRunId && activeRun) {
        updateRunProgress(activeRunId, selectedTest);

        // If there's a next test in the run, select it automatically
        const updatedRun = executionRuns.find(r => r.id === activeRunId);
        if (updatedRun && updatedRun.currentTest) {
          setSelectedTest(updatedRun.currentTest);
          showNotification('info', `Moving to next test: ${updatedRun.currentTest.title}`);
        } else {
          setSelectedTest(null);
          showNotification('success', `✅ Run "${activeRun.name}" completed! All ${activeRun.totalTests} tests finished.`);
        }
      } else {
        setSelectedTest(null);
      }

      // Reset form but keep tester and environment for convenience
      setExecutionData(prev => ({
        status: 'Pass',
        tester: prev.tester,
        environment: prev.environment,
        duration: 'Auto-tracked',
        notes: '',
        jiraTicket: ''
      }));
      
    } catch (error) {
      console.error('Failed to execute test:', error);
      showNotification('error', 'Failed to execute test: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'Fail': return <XCircle className="w-4 h-4 text-danger" />;
      case 'Blocked': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'Skip': return <Clock className="w-4 h-4 text-neutral" />;
      default: return <Play className="w-4 h-4 text-info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'status-pass';
      case 'Fail': return 'status-fail';
      case 'Blocked': return 'status-blocked';
      case 'Skip': return 'status-skip';
      default: return 'status-pending';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'priority-critical';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return 'bg-neutral-light text-neutral-dark';
    }
  };

  const filteredTestCases = (Array.isArray(testCases) ? testCases : [])
    .filter(tc => {
      // Text search
      const searchMatch = searchQuery === '' ||
        tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter criteria
      const statusMatch = filter.status === 'all' || tc.currentStatus === filter.status;
      const categoryMatch = filter.category === 'all' || tc.category === filter.category;
      const priorityMatch = filter.priority === 'all' || tc.priority === filter.priority;
      const projectMatch = selectedProject === 'all' || tc.projectId === selectedProject;

      return searchMatch && statusMatch && categoryMatch && priorityMatch && projectMatch;
    })
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'aiRecommended':
          // AI prioritization sort - already sorted by AI, maintain order
          if (a.aiScore && b.aiScore) {
            return a.aiScore.recommendedOrder - b.aiScore.recommendedOrder;
          }
          // Fallback to risk level if no order
          const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const aRisk = a.aiScore ? riskOrder[a.aiScore.riskLevel] : 0;
          const bRisk = b.aiScore ? riskOrder[b.aiScore.riskLevel] : 0;
          return bRisk - aRisk;
        case 'riskLevel':
          const riskLevelOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
          const aRiskLevel = a.aiScore ? riskLevelOrder[a.aiScore.riskLevel] : 0;
          const bRiskLevel = b.aiScore ? riskLevelOrder[b.aiScore.riskLevel] : 0;
          aValue = aRiskLevel;
          bValue = bRiskLevel;
          break;
        case 'failureProbability':
          aValue = a.aiScore?.failureProbability || 0;
          bValue = b.aiScore?.failureProbability || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          aValue = a.currentStatus;
          bValue = b.currentStatus;
          break;
        default:
          aValue = a.lastExecution?.date || '2000-01-01';
          bValue = b.lastExecution?.date || '2000-01-01';
      }

      if (sortBy === 'aiRecommended') {
        return 0; // Already sorted above
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Use the state-managed activeRunTestCases or fall back to filteredTestCases
  // If we have an active run, prioritize its test cases, but if they're not loaded yet, show filteredTestCases
  const runScopedTestCases = activeRunTestCases.length > 0
    ? activeRunTestCases
    : (activeRun?.testCases ?? []);

  const displayTestCases = activeRunId
    ? (runScopedTestCases.length > 0 ? runScopedTestCases : filteredTestCases)
    : filteredTestCases;

  // Debug logging for test case display

  return (
    <Layout 
      title="Test Execution Center"
      breadcrumbs={[
        { label: 'Dashboard', href: '/' },
        { label: 'Test Execution' }
      ]}
    >
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-md transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-success-light border-success text-success-dark' :
          notification.type === 'error' ? 'bg-danger-light border-danger text-danger-dark' :
          'bg-info-light border-info text-info-dark'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-success" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-danger" />}
              {notification.type === 'info' && <AlertTriangle className="w-5 h-5 text-info" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(prev => ({ ...prev, show: false }))}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Enhanced Header Stats with Project Context */}
        <div className="space-y-4">
          {/* Project Context Header */}
          {selectedProject !== 'all' && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-800">
                    {projects.find(p => p.id === selectedProject)?.name || 'Selected Project'}
                  </h3>
                  <p className="text-sm text-primary-600">Execution Dashboard</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Statistics Grid - REMOVED */}
          {false && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredTestCases.length}</p>
                </div>
                <Target className="w-8 h-8 text-info" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-bold text-success">
                    {filteredTestCases.length > 0 ? Math.round((filteredTestCases.filter(tc => tc.currentStatus === 'Pass').length / filteredTestCases.length) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-danger">{filteredTestCases.filter(tc => tc.currentStatus === 'Fail').length}</p>
                </div>
                <XCircle className="w-8 h-8 text-danger" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-neutral">{filteredTestCases.filter(tc => ['Not_Executed', 'Blocked', 'Skip'].includes(tc.currentStatus)).length}</p>
                </div>
                <Clock className="w-8 h-8 text-neutral" />
              </div>
            </div>
          </div>}

        {/* Controls and Filters - REMOVED */}
        {false && <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Top Row: Search and Project Selection */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search test cases by title, description, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {/* Functionality removed */}}
                >
                  <Target className="w-4 h-4 mr-1" />
                  Add Test
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => {
                    loadAvailableTestCases();
                    {/* Functionality removed */}
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Import
                </Button>
                {/* Real-time Status Controls */}
                <div className="flex items-center space-x-2 border-l pl-2 ml-2">
                  <Button
                    variant={autoRefreshEnabled ? "success" : "ghost"}
                    size="sm"
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Auto</span>
                  </Button>
                  {autoRefreshEnabled && refreshCountdown > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {refreshCountdown}s
                    </span>
                  )}
                  {lastStatusUpdate && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      ✅ Updated {new Date(lastStatusUpdate).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filter.status}
                      onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Skip">Skip</option>
                      <option value="Not_Executed">Not Executed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={filter.category}
                      onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Categories</option>
                      <option value="Authentication">Authentication</option>
                      <option value="API">API</option>
                      <option value="UI/UX">UI/UX</option>
                      <option value="Performance">Performance</option>
                      <option value="Security">Security</option>
                      <option value="Integration">Integration</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Functional">Functional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={filter.priority}
                      onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="lastModified">Last Modified</option>
                      <option value="title">Title</option>
                      <option value="priority">Priority</option>
                      <option value="status">Status</option>
                      {aiPrioritizationEnabled && <option value="aiRecommended">AI Recommended</option>}
                      {aiPrioritizationEnabled && <option value="riskLevel">Risk Level</option>}
                      {aiPrioritizationEnabled && <option value="failureProbability">Failure Probability</option>}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>}


        {/* Multi-Run Execution Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Execution Runs</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredRuns.length} visible
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {userRole.name}
                </Badge>

                {/* User Switcher */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">User:</span>
                    <select
                      value={currentUserId}
                      onChange={(e) => {
                        setCurrentUserId(e.target.value);
                        const selectedUser = availableUsers.find(u => u.name === e.target.value);
                        if (selectedUser) {
                          setCurrentUserRole(selectedUser.role);
                        }
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      {availableUsers.map(user => (
                        <option key={user.name} value={user.name}>
                          {user.name} {user.isDefault ? '(Default Admin)' : ''} - {roles[user.role]?.name || user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {userRole.permissions.includes('create_runs') || userRole.permissions.includes('*') ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowRunWizard(true)}
                    className="flex items-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>New Run</span>
                  </Button>
                ) : null}

                {/* Add Test Cases button - show when there's an active run in draft status */}
                {activeRun && activeRun.status === 'draft' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {/* Add test cases functionality */}}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Test Cases</span>
                  </Button>
                )}

                {/* Execution mode buttons - show when there's an active run with test cases */}
                {activeRun && activeRun.totalTests > 0 && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(`/runs/${activeRun.id}/execute`, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Focus Mode</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Role-based Run Filters */}
            {(userRole.level >= 2) && executionRuns.length > 3 && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Filter:</span>
                </div>

                <select
                  value={runFilter.status}
                  onChange={(e) => setRunFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>

                {/* User filter (multiselect for all users) */}
                <UserFilterDropdown
                  users={availableUsersForAssignment}
                  selectedUsers={runFilter.tester}
                  onSelectionChange={(selected) => setRunFilter(prev => ({ ...prev, tester: selected }))}
                  roles={roles}
                />

                <select
                  value={runFilter.timeframe}
                  onChange={(e) => setRunFilter(prev => ({ ...prev, timeframe: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>

                <Badge variant="outline" className="text-xs">
                  {filteredRuns.length} visible
                </Badge>
              </div>
            )}
          </div>

          {/* Execution Run Dropdown Selection */}
          {filteredRuns.length > 0 && (
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Active Run:</label>
                <select
                  value={activeRunId || ''}
                  onChange={(e) => {
                    switchToRun(e.target.value);
                  }}
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select an execution run...</option>
                  {(() => {
                    return filteredRuns.map((run) => (
                      <option key={run.id} value={run.id}>
                        {run.name} ({run.completedTests}/{run.totalTests}) - {run.status} - {run.tester} ({getUserRole(run.tester)?.name || 'Unknown'})
                      </option>
                    ));
                  })()}
                </select>

                {/* Active Run Info Display */}
                {activeRun && (
                  <div className="flex items-center space-x-4 px-4 py-2 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        activeRun.status === 'active' ? 'bg-green-400' :
                        activeRun.status === 'paused' ? 'bg-yellow-400' :
                        activeRun.status === 'draft' ? 'bg-blue-400' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">{activeRun.name}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {activeRun.status === 'draft' && activeRun.totalTests === 0 ?
                        'No test cases added yet' :
                        (() => {
                          const totalCases = activeRunTestCases.length > 0 ? activeRunTestCases.length : activeRun.totalTests;
                          const completedCases = activeRunTestCases.length > 0
                            ? activeRunTestCases.filter(tc => tc.currentStatus !== 'Not_Executed' && tc.currentStatus !== 'Not Run').length
                            : activeRun.completedTests;
                          return `Progress: ${completedCases}/${totalCases}`;
                        })()
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      Tester: {activeRun.tester}
                      {getUserRole(activeRun.tester) && (
                        <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                          {getUserRole(activeRun.tester)?.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Environment: {activeRun.environment}
                    </div>
                    <div className="text-xs text-gray-500">
                      Assignees: {activeRun.assignees && activeRun.assignees.length > 0 ?
                        activeRun.assignees.map(userId => {
                          // First try to find in availableUsersForAssignment (dynamic users)
                          let user = availableUsersForAssignment.find(u => u.id === userId || u.name === userId || u.email === userId)
                          // Fallback to availableUsers (static users)
                          if (!user) {
                            user = availableUsers.find(u => u.name === userId || u.email === userId)
                          }
                          return user ? user.name : userId
                        }).join(', ') :
                        'None assigned'
                      }
                      <button
                        onClick={handleEditAssignees}
                        className="ml-2 text-blue-600 hover:text-blue-800 underline text-xs"
                      >
                        Edit
                      </button>
                    </div>
                    {activeRun.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {activeRun.totalTests > 0 && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => window.open(`/runs/${activeRun.id}/execute`, '_blank')}
                          className="text-xs px-2 py-1"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(`/runs/${activeRun.id}/burst`, '_blank')}
                          className="text-xs px-2 py-1"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          Burst
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEditRun(activeRun)}
                          className="text-xs px-2 py-1"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Edit Run
                        </Button>
                        {/* Only show delete if run hasn't started */}
                        {activeRun.completedTests === 0 && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRun(activeRun)}
                            className="text-xs px-2 py-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredRuns.length === 0 && executionRuns.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No execution runs yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Create your first execution run to start testing multiple projects simultaneously.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowRunWizard(true)}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Create First Run</span>
              </Button>
            </div>
          )}

          {/* No runs match filters */}
          {filteredRuns.length === 0 && executionRuns.length > 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Filter className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">No runs match your filters</h4>
              <p className="text-sm text-gray-500 mb-4">
                Try adjusting your filter criteria to see more execution runs.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRunFilter({ status: 'all', tester: 'all', project: 'all', timeframe: 'all' })}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Clear Filters</span>
              </Button>
            </div>
          )}
        </div>

        {/* Create New Run Modal */}
        {showCreateRun && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Execution Run</h3>
                <button
                  onClick={() => setShowCreateRun(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Run Name</label>
                  <Input
                    type="text"
                    placeholder="e.g., Sprint 24 - Login Tests"
                    id="run-name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    id="run-project"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Cases</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="empty-run"
                        name="runType"
                        value="empty"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        onChange={(e) => {
                          const preview = document.getElementById('test-cases-preview');
                          if (preview) {
                            preview.className = 'hidden max-h-32 overflow-y-auto border border-gray-200 rounded p-2 ml-7';
                          }
                        }}
                      />
                      <label htmlFor="empty-run" className="text-sm text-gray-700">
                        Create empty run (add test cases later)
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="with-tests"
                        name="runType"
                        value="with-tests"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        onChange={(e) => {
                          const preview = document.getElementById('test-cases-preview');
                          if (preview) {
                            preview.className = e.target.checked ?
                              'max-h-32 overflow-y-auto border border-gray-200 rounded p-2 ml-7' :
                              'hidden max-h-32 overflow-y-auto border border-gray-200 rounded p-2 ml-7';
                          }
                        }}
                      />
                      <label htmlFor="with-tests" className="text-sm text-gray-700">
                        Include available test cases ({filteredTestCases.length})
                      </label>
                    </div>
                    <div id="test-cases-preview" className="hidden max-h-32 overflow-y-auto border border-gray-200 rounded p-2 ml-7">
                      {filteredTestCases.slice(0, 5).map((test, index) => (
                        <div key={`${test.id}-preview-${index}`} className="text-xs text-gray-600 py-1">
                          &bull; {test.title}
                        </div>
                      ))}
                      {filteredTestCases.length > 5 && (
                        <div className="text-xs text-gray-400 py-1">
                          ... and {filteredTestCases.length - 5} more tests
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateRun(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const runName = (document.getElementById('run-name') as HTMLInputElement)?.value;
                      const runProject = (document.getElementById('run-project') as HTMLSelectElement)?.value;
                      const runType = (document.querySelector('input[name="runType"]:checked') as HTMLInputElement)?.value;

                      if (runName && runProject) {
                        const testsToAdd = runType === 'with-tests' ? filteredTestCases : [];
                        createNewRun(runName, runProject, testsToAdd);
                      }
                    }}
                    className="flex-1"
                  >
                    Create Run
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with Side Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-400px)]">
          {/* Test Cases List - Left/Main Area */}
          <div className={`${selectedTest ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-lg border border-gray-200 flex flex-col`}>
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeRun?.name || 'Test Cases'}
                </h2>
                <div className="flex items-center gap-3">
                  {!aiPrioritizationEnabled ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={enableAIPrioritization}
                      disabled={aiAnalysisLoading}
                    >
                      {aiAnalysisLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-1" />
                          AI Prioritize
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">AI Prioritization Active</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={disableAIPrioritization}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {loadingActiveRunTestCases ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading test cases...</h3>
                    <p className="text-gray-500">
                      Fetching test cases for the selected run
                    </p>
                  </div>
                ) : activeRunId && activeRunTestCases.length === 0 && !loadingActiveRunTestCases && displayTestCases.length === 0 ? (
                  <div className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases in this run</h3>
                    <p className="text-gray-500">
                      This run doesn't have any test cases assigned yet. Add test cases to get started.
                    </p>
                  </div>
                ) : displayTestCases.length === 0 ? (
                  <div className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
                    <p className="text-gray-500">
                      {activeRunId && activeRun?.status === 'draft'
                        ? 'Add test cases to this run to get started with execution.'
                        : searchQuery || filter.status !== 'all' || filter.category !== 'all' || filter.priority !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first test case'
                      }
                    </p>
                  </div>
                ) : (
                  displayTestCases.map((testCase, index) => (
                      <div
                        key={`${testCase.id}-${index}`}
                        className={`p-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer relative ${
                          selectedTest?.id === testCase.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        } ${
                          statusUpdateInProgress === testCase.id ? 'animate-pulse bg-green-50' : ''
                        }`}
                        onClick={() => setSelectedTest(testCase)}
                      >
                        {statusUpdateInProgress === testCase.id && (
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                              <span>Updating...</span>
                            </div>
                          </div>
                        )}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {aiPrioritizationEnabled && (testCase as PrioritizedTestCase).aiScore && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  #{(testCase as PrioritizedTestCase).aiScore?.recommendedOrder}
                                </span>
                                {getAIRiskIcon((testCase as PrioritizedTestCase).aiScore?.riskLevel)}
                              </div>
                            )}
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {testCase.title}
                            </h3>
                            <Badge className={`${getStatusColor(testCase.currentStatus)} transition-all duration-300`} size="sm">
                              {getStatusIcon(testCase.currentStatus)}
                              <span className="ml-1">{testCase.currentStatus}</span>
                              {lastStatusUpdate && testCase.lastExecution?.date &&
                               new Date(testCase.lastExecution.date).getTime() > lastStatusUpdate.getTime() - 5000 && (
                                <span className="ml-1 text-xs animate-bounce">✨</span>
                              )}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {testCase.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {testCase.id}
                            </span>
                            <Badge className={getPriorityColor(testCase.priority)} size="sm">
                              {testCase.priority}
                            </Badge>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {testCase.category}
                            </span>
                            {testCase.lastExecution && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(testCase.lastExecution.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* AI Score Compact Display */}
                          {aiPrioritizationEnabled && (testCase as PrioritizedTestCase).aiScore && (
                            <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Brain className="w-3 h-3 text-purple-600" />
                                  <Badge className={getAIRiskColor((testCase as PrioritizedTestCase).aiScore?.riskLevel)} size="sm">
                                    {(testCase as PrioritizedTestCase).aiScore?.riskLevel?.toUpperCase()}
                                  </Badge>
                                </div>
                                <span className="text-xs text-purple-700">
                                  Risk: {Math.round(((testCase as PrioritizedTestCase).aiScore?.failureProbability || 0) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedTest?.id !== testCase.id && (
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Test Case Detail Panel - Right Side */}
          {selectedTest && (
            <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Test Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Test Case Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTest!.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedTest!.description}</p>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span className="text-gray-900 font-mono">{selectedTest!.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-900">{selectedTest!.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <Badge className={getPriorityColor(selectedTest!.priority)} size="sm">
                        {selectedTest!.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Test Steps */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Test Steps</h4>
                  <div className="space-y-2">
                    {(selectedTest?.steps || []).map((step) => (
                      <div key={step.stepNumber} className="bg-gray-50 rounded p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full flex-shrink-0">
                            {step.stepNumber}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-1">{step.action}</p>
                            <p className="text-xs text-gray-500">{step.expected}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Last Execution */}
                {selectedTest?.lastExecution && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Last Execution</h4>
                    <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-900">{new Date(selectedTest!.lastExecution!.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tester:</span>
                        <span className="text-gray-900">{selectedTest!.lastExecution!.tester}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <Badge className={getStatusColor(selectedTest!.lastExecution!.status)} size="sm">
                          {getStatusIcon(selectedTest!.lastExecution!.status)}
                          <span className="ml-1">{selectedTest!.lastExecution!.status}</span>
                        </Badge>
                      </div>
                      {selectedTest!.lastExecution!.notes && (
                        <div>
                          <span className="text-gray-500 block mb-1">Notes:</span>
                          <p className="text-gray-900 text-xs bg-white p-2 rounded border">{selectedTest!.lastExecution!.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Execution Form */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Record New Execution</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={executionData.status}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Blocked">Blocked</option>
                        <option value="Skip">Skip</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tester</label>
                      {activeRun?.assignees && activeRun!.assignees!.length > 0 && (
                        <p className="text-xs text-blue-600 mb-2">
                          👥 Showing run assignees only (inherited from "{activeRun?.name}")
                        </p>
                      )}
                      <select
                        value={executionData.tester}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, tester: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {(() => {

                          const filteredUsers = (activeRun?.assignees && activeRun!.assignees!.length > 0 ?
                            // Filter availableUsersForAssignment to only show run assignees
                            availableUsersForAssignment.filter(user =>
                              activeRun!.assignees!.some(assigneeId =>
                                assigneeId === user.id || assigneeId === user.name || assigneeId === user.email
                              )
                            ) :
                            // If no run assignees, show all dynamic users as fallback
                            availableUsersForAssignment
                          );

                          return filteredUsers;
                        })().map((user) => (
                          <option key={user.name} value={user.name}>
                            {user.name} - {roles[user.role]?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                      <select
                        value={executionData.environment}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, environment: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="Development">Development</option>
                        <option value="SIT">SIT</option>
                        <option value="UAT">UAT</option>
                        <option value="Staging">Staging</option>
                        <option value="Production">Production</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <Input
                        type="text"
                        value={executionData.duration}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 5 minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea
                        value={executionData.notes}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add execution notes..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">JIRA Ticket</label>
                      <Input
                        type="text"
                        value={executionData.jiraTicket}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, jiraTicket: e.target.value }))}
                        placeholder="e.g., PROJ-123"
                      />
                    </div>

                    {/* AI Analysis Trigger */}
                    {executionData.status === 'Fail' && executionData.notes.trim() && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-900">Failure Detected</span>
                        </div>
                        <p className="text-xs text-red-700 mb-2">
                          AI will analyze this failure for related test cases.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => analyzeFailureWithAI(selectedTest!, executionData.notes)}
                          disabled={aiLoading}
                          className="text-red-700 hover:text-red-800"
                        >
                          {aiLoading ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="w-3 h-3 mr-1" />
                              Analyze Now
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={handleExecuteTest}
                      disabled={loading || !executionData.tester.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Execute Test
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* AI Analysis Modal */}
        {showAiAnalysis && aiAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">AI Failure Analysis</h2>
                      <p className="text-purple-100">Smart test case impact assessment</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiAnalysis(false)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Risk Assessment */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <h3 className="font-semibold text-red-900">Risk Level: {aiAnalysis.riskLevel?.toUpperCase()}</h3>
                        <p className="text-sm text-red-700">Impact Category: {aiAnalysis.impactCategory}</p>
                      </div>
                    </div>
                    <p className="text-sm text-red-800">{aiAnalysis.rootCauseAnalysis}</p>
                  </div>

                  {/* Related Test Cases */}
                  {aiAnalysis.relatedTestCases && aiAnalysis.relatedTestCases.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Related Test Cases ({aiAnalysis.relatedTestCases.length})
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={selectAllRelatedTests}
                            disabled={bulkUpdateLoading}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRelatedTestSelections}
                            disabled={bulkUpdateLoading}
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto mb-4">
                        {aiAnalysis.relatedTestCases.map((testCase: any, index: number) => (
                          <div
                            key={`${testCase.id}-related-${index}`}
                            className={`p-3 border rounded-lg transition-all cursor-pointer ${
                              selectedRelatedTests.includes(testCase.id)
                                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                                : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                            onClick={() => toggleRelatedTestSelection(testCase.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-sm font-medium text-gray-900">{testCase.title}</h4>
                                  <Badge className={getStatusColor(testCase.currentStatus)} size="sm">
                                    {testCase.currentStatus}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{testCase.description}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <span>{testCase.id}</span>
                                  <span>{testCase.category}</span>
                                  <Badge className={getPriorityColor(testCase.priority)} size="sm">
                                    {testCase.priority}
                                  </Badge>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedRelatedTests.includes(testCase.id)}
                                onChange={(e) => e.stopPropagation()}
                                className="ml-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bulk Actions */}
                      {selectedRelatedTests.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-blue-900">
                              Bulk Update ({selectedRelatedTests.length} selected)
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => updateRelatedTestsStatus(selectedRelatedTests, 'Blocked', 'Blocked due to related failure')}
                              disabled={bulkUpdateLoading}
                            >
                              Mark as Blocked
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => updateRelatedTestsStatus(selectedRelatedTests, 'Skip', 'Skipped due to related failure')}
                              disabled={bulkUpdateLoading}
                            >
                              Mark as Skip
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {aiAnalysis.suggestedActions && aiAnalysis.suggestedActions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                      <div className="space-y-2">
                        {aiAnalysis.suggestedActions.map((action: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-green-50 rounded">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-green-800">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blocking Recommendation */}
                  {aiAnalysis.blockingRecommendation?.shouldBlock && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-900 mb-1">Blocking Recommendation</h4>
                          <p className="text-sm text-orange-800 mb-3">{aiAnalysis.blockingRecommendation.reason}</p>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => blockRelatedTests(
                              aiAnalysis.blockingRecommendation.testCasesToBlock,
                              aiAnalysis.blockingRecommendation.reason
                            )}
                            disabled={bulkUpdateLoading}
                          >
                            {bulkUpdateLoading ? (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Blocking...
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Block Recommended Tests
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Test Case Modal - Simplified version */}
        {showAddTestCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-8 h-8" />
                    <div>
                      <h2 className="text-xl font-bold">Create New Test Case</h2>
                      <p className="text-green-100">Add a test case to your execution suite</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {/* Functionality removed */}}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Test Case Title *</label>
                        <Input
                          type="text"
                          value={newTestCase.title}
                          onChange={(e) => setNewTestCase(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter descriptive test case title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <Textarea
                          value={newTestCase.description}
                          onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe what this test case validates"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={newTestCase.category}
                          onChange={(e) => setNewTestCase(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Functional">Functional</option>
                          <option value="API">API</option>
                          <option value="UI/UX">UI/UX</option>
                          <option value="Performance">Performance</option>
                          <option value="Security">Security</option>
                          <option value="Integration">Integration</option>
                          <option value="Authentication">Authentication</option>
                          <option value="Mobile">Mobile</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={newTestCase.priority}
                          onChange={(e) => setNewTestCase(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={generateAISuggestions}
                          disabled={aiSuggestionsLoading || !newTestCase.title}
                        >
                          {aiSuggestionsLoading ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI Suggestions
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Test Steps */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">Test Steps</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addTestStep}
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Add Step
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(newTestCase.steps || []).map((step, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Step {step.stepNumber}</span>
                            {(newTestCase.steps || []).length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTestStep(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={step.action}
                              onChange={(e) => updateTestStep(index, 'action', e.target.value)}
                              placeholder="What action should be performed?"
                            />
                            <Input
                              type="text"
                              value={step.expected}
                              onChange={(e) => updateTestStep(index, 'expected', e.target.value)}
                              placeholder="What is the expected result?"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => {/* Functionality removed */}}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveNewTestCase}
                    disabled={loading || !newTestCase.title.trim()}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Create Test Case
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Run Creation Wizard */}
        <RunCreateWizard
          isOpen={showRunWizard}
          onClose={() => setShowRunWizard(false)}
          onRunCreated={handleRunCreated}
          selectedProjectId={currentProject}
        />

        {/* Run Edit Dialog */}
        <RunEditDialog
          isOpen={showEditRun}
          onClose={() => setShowEditRun(false)}
          onRunUpdated={handleRunUpdated}
          run={editingRun}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Test Run</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete the test run:
                </p>
                <p className="font-medium text-gray-900">
                  "{deletingRun?.name}"
                </p>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone. All test cases and associated data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletingRun(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleConfirmDelete}
                >
                  Delete Run
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Assignees Modal */}
        {showEditAssignees && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Run Assignees</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Manage assignees for: <span className="font-medium">{activeRun?.name}</span>
                </p>

                {loadingUsersForAssignment ? (
                  <div className="text-sm text-gray-500">Loading users...</div>
                ) : (
                  <>
                    {/* User Selection Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Assignee:
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value=""
                        onChange={(e) => {
                          const selectedUserId = e.target.value
                          if (selectedUserId && !editingAssignees.includes(selectedUserId)) {
                            addAssigneeToEdit(selectedUserId)
                          }
                        }}
                      >
                        <option value="">Select a user to assign...</option>
                        {availableUsersForAssignment
                          .filter(user => !editingAssignees.includes(user.id))
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Selected Assignees */}
                    {editingAssignees.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Assignees:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {editingAssignees.map((assigneeId) => {
                            const user = availableUsersForAssignment.find(u => u.id === assigneeId)
                            const displayName = user ? `${user.name} (${user.email})` : assigneeId
                            return (
                              <div
                                key={assigneeId}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {user?.avatar && (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                {displayName}
                                <X
                                  className="w-3 h-3 cursor-pointer hover:text-blue-900"
                                  onClick={() => removeAssigneeFromEdit(assigneeId)}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEditAssignees(false)
                    setEditingAssignees([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveAssignees}
                >
                  Save Assignees
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

