'use client';

import React, { useState, useEffect } from 'react';
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
  Gauge
} from 'lucide-react';
import { aiTestPrioritizer } from '@/lib/ai-test-prioritizer';

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
  const [testCases, setTestCases] = useState<PrioritizedTestCase[]>([]);
  const [aiPrioritizationEnabled, setAiPrioritizationEnabled] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [prioritizationAnalysis, setPrioritizationAnalysis] = useState<any>(null);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
  const [selectedRelatedTests, setSelectedRelatedTests] = useState<string[]>([]);
  const [showAddTestCase, setShowAddTestCase] = useState(false);
  const [showImportTestCases, setShowImportTestCases] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    title: '',
    description: '',
    category: 'Functional',
    priority: 'Medium',
    steps: [{ stepNumber: 1, action: '', expected: '' }]
  });
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
      email: 'admin@yopmail.com',
      password: 'Orion888!', // In production, this would be hashed
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
  const defaultAdmin = availableUsers.find(u => u.isDefault);
  const adminCredentials = {
    username: defaultAdmin?.name || 'admin',
    email: defaultAdmin?.email || 'admin@yopmail.com',
    password: defaultAdmin?.password || 'Password888!',
    role: defaultAdmin?.role || 'super-admin'
  };

  // Run filtering state for test leads
  const [runFilter, setRunFilter] = useState({
    status: 'all', // all, active, paused, completed
    tester: 'all', // all, my-runs, or specific tester
    project: 'all',
    timeframe: 'all' // all, today, this-week, this-month
  });

  // Multi-run execution system
  interface ExecutionRun {
    id: string;
    name: string;
    project: string;
    tester: string;
    environment: string;
    status: 'active' | 'paused' | 'completed';
    testCases: PrioritizedTestCase[];
    startTime: string;
    completedTests: number;
    totalTests: number;
    currentTest: PrioritizedTestCase | null;
  }

  const [executionRuns, setExecutionRuns] = useState<ExecutionRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [showCreateRun, setShowCreateRun] = useState(false);

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
      setSelectedTest(run.currentTest);
      setExecutionData(prev => ({
        ...prev,
        tester: run.tester,
        environment: run.environment
      }));
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

      // Tester filter
      if (runFilter.tester !== 'all') {
        if (runFilter.tester === 'my-runs' && run.tester !== currentUser) {
          return false;
        } else if (runFilter.tester !== 'my-runs' && run.tester !== runFilter.tester) {
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

  // Initialize sample execution runs for demonstration (Test Lead view)
  useEffect(() => {
    if (testCases.length > 0 && executionRuns.length === 0) {
      const now = Date.now();
      const sampleRuns: ExecutionRun[] = [
        // Current User's Runs
        {
          id: 'run-current-1',
          name: 'Sprint 24 - Auth Module',
          project: 'web-portal',
          tester: 'John Smith (Current User)',
          environment: 'SIT',
          status: 'active',
          testCases: testCases.slice(0, 4),
          startTime: new Date(now - 300000).toISOString(), // 5 min ago
          completedTests: 2,
          totalTests: 4,
          currentTest: testCases[2] || null
        },
        // Team Member Runs
        {
          id: 'run-sarah-1',
          name: 'Payment Gateway - Critical Path',
          project: 'payment-system',
          tester: 'Sarah Johnson',
          environment: 'UAT',
          status: 'active',
          testCases: testCases.slice(4, 7),
          startTime: new Date(now - 1800000).toISOString(), // 30 min ago
          completedTests: 1,
          totalTests: 3,
          currentTest: testCases[5] || null
        },
        {
          id: 'run-mike-1',
          name: 'API Integration Tests',
          project: 'backend-services',
          tester: 'Mike Chen',
          environment: 'SIT',
          status: 'active',
          testCases: testCases.slice(7, 12),
          startTime: new Date(now - 3600000).toISOString(), // 1 hour ago
          completedTests: 3,
          totalTests: 5,
          currentTest: testCases[10] || null
        },
        {
          id: 'run-lisa-1',
          name: 'Mobile App - Regression',
          project: 'mobile-app',
          tester: 'Lisa Rodriguez',
          environment: 'Staging',
          status: 'paused',
          testCases: testCases.slice(12, 16),
          startTime: new Date(now - 7200000).toISOString(), // 2 hours ago
          completedTests: 2,
          totalTests: 4,
          currentTest: testCases[14] || null
        },
        // Completed Runs
        {
          id: 'run-david-1',
          name: 'Security Tests - Q4',
          project: 'security-audit',
          tester: 'David Kumar',
          environment: 'Production',
          status: 'completed',
          testCases: testCases.slice(0, 3),
          startTime: new Date(now - 86400000).toISOString(), // Yesterday
          completedTests: 3,
          totalTests: 3,
          currentTest: null
        },
        {
          id: 'run-emily-1',
          name: 'User Interface - Sprint 23',
          project: 'frontend-app',
          tester: 'Emily Watson',
          environment: 'UAT',
          status: 'completed',
          testCases: testCases.slice(5, 9),
          startTime: new Date(now - 172800000).toISOString(), // 2 days ago
          completedTests: 4,
          totalTests: 4,
          currentTest: null
        }
      ];

      setExecutionRuns(sampleRuns);
      setActiveRunId('run-current-1');
    }
  }, [testCases]);

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
    let suggestions = {
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
      setShowAddTestCase(false);
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
      setShowImportTestCases(false);
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
      setShowImportTestCases(false);
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
      // Try to fetch from API first
      const response = await fetch('/api/test-cases');
      if (response.ok) {
        const testCases = await response.json();
        setTestCases(testCases);
        return;
      }
    } catch (error) {
      console.warn('API not available, using fallback data:', error);
    }

    // Comprehensive mock data for AI demo
    const fallbackTestCases: TestCase[] = [
      // Authentication Test Cases
      {
        id: 'TC_AUTH_001',
        title: 'User Login with Valid Credentials',
        description: 'Verify that users can successfully log in using valid username and password',
        category: 'Authentication',
        priority: 'Critical',
        currentStatus: 'Pass',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to login page',
            expected: 'Login form is displayed with username and password fields'
          },
          {
            stepNumber: 2,
            action: 'Enter valid username: testuser@example.com',
            expected: 'Username field accepts input'
          },
          {
            stepNumber: 3,
            action: 'Enter valid password: SecurePass123!',
            expected: 'Password field shows masked characters'
          },
          {
            stepNumber: 4,
            action: 'Click Login button',
            expected: 'User is redirected to dashboard'
          }
        ],
        expectedResult: 'User successfully logs in and accesses dashboard',
        linkedRequirements: ['REQ_AUTH_001', 'REQ_SECURITY_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:15:00Z',
          tester: 'alice.qa@company.com',
          status: 'Pass',
          notes: 'Login successful, redirected to dashboard within 2 seconds'
        }
      },
      {
        id: 'TC_AUTH_002',
        title: 'User Login with Invalid Credentials',
        description: 'Verify that login fails gracefully with invalid credentials',
        category: 'Authentication',
        priority: 'High',
        currentStatus: 'Fail',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to login page',
            expected: 'Login form is displayed'
          },
          {
            stepNumber: 2,
            action: 'Enter invalid username: wronguser@example.com',
            expected: 'Username field accepts input'
          },
          {
            stepNumber: 3,
            action: 'Enter invalid password: WrongPass123',
            expected: 'Password field shows masked characters'
          },
          {
            stepNumber: 4,
            action: 'Click Login button',
            expected: 'Error message is displayed'
          }
        ],
        expectedResult: 'Error message displayed: "Invalid username or password"',
        linkedRequirements: ['REQ_AUTH_002', 'REQ_SECURITY_002'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:20:00Z',
          tester: 'alice.qa@company.com',
          status: 'Fail',
          notes: 'Authentication service timeout after 10 seconds. Server returned 500 error instead of proper error message. Login button becomes unresponsive.'
        }
      },
      {
        id: 'TC_AUTH_003',
        title: 'Password Reset Functionality',
        description: 'Verify that users can reset their password via email',
        category: 'Authentication',
        priority: 'Medium',
        currentStatus: 'Blocked',
        steps: [
          {
            stepNumber: 1,
            action: 'Click "Forgot Password" link on login page',
            expected: 'Password reset form is displayed'
          },
          {
            stepNumber: 2,
            action: 'Enter valid email address',
            expected: 'Email field accepts input'
          },
          {
            stepNumber: 3,
            action: 'Click "Send Reset Link" button',
            expected: 'Confirmation message is displayed'
          }
        ],
        expectedResult: 'Reset email sent and confirmation shown',
        linkedRequirements: ['REQ_AUTH_003'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:25:00Z',
          tester: 'alice.qa@company.com',
          status: 'Blocked',
          notes: 'Email service is down. SMTP server connection failed. Blocked by ticket DEV-456.'
        }
      },
      {
        id: 'TC_AUTH_004',
        title: 'Two-Factor Authentication Setup',
        description: 'Verify users can enable and configure 2FA',
        category: 'Authentication',
        priority: 'High',
        currentStatus: 'Not_Executed',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to Security Settings',
            expected: '2FA setup option is available'
          },
          {
            stepNumber: 2,
            action: 'Click "Enable 2FA" button',
            expected: 'QR code is displayed'
          },
          {
            stepNumber: 3,
            action: 'Scan QR code with authenticator app',
            expected: 'App generates 6-digit code'
          }
        ],
        expectedResult: '2FA successfully enabled',
        linkedRequirements: ['REQ_AUTH_004', 'REQ_SECURITY_003'],
        projectId: 'PROJ_ECOMMERCE_001'
      },

      // API Test Cases
      {
        id: 'TC_API_001',
        title: 'User Profile API - GET Request',
        description: 'Verify that GET /api/users/profile returns correct user data',
        category: 'API',
        priority: 'Critical',
        currentStatus: 'Pass',
        steps: [
          {
            stepNumber: 1,
            action: 'Send GET request to /api/users/profile with valid auth token',
            expected: 'Request sent successfully'
          },
          {
            stepNumber: 2,
            action: 'Verify response status code',
            expected: 'Status code is 200'
          },
          {
            stepNumber: 3,
            action: 'Verify response contains user data',
            expected: 'Response includes id, name, email, preferences'
          }
        ],
        expectedResult: 'API returns complete user profile data',
        linkedRequirements: ['REQ_API_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:30:00Z',
          tester: 'bob.api@company.com',
          status: 'Pass',
          notes: 'API response time: 150ms. All fields present and correct.'
        }
      },
      {
        id: 'TC_API_002',
        title: 'User Profile API - Invalid Auth Token',
        description: 'Verify API properly handles invalid authentication tokens',
        category: 'API',
        priority: 'High',
        currentStatus: 'Fail',
        steps: [
          {
            stepNumber: 1,
            action: 'Send GET request to /api/users/profile with invalid token',
            expected: 'Request sent with invalid auth header'
          },
          {
            stepNumber: 2,
            action: 'Verify response status code',
            expected: 'Status code is 401 Unauthorized'
          },
          {
            stepNumber: 3,
            action: 'Verify error message in response',
            expected: 'Response contains "Invalid authentication token"'
          }
        ],
        expectedResult: 'API returns 401 with proper error message',
        linkedRequirements: ['REQ_API_002', 'REQ_SECURITY_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:35:00Z',
          tester: 'bob.api@company.com',
          status: 'Fail',
          notes: 'API endpoint returns 500 Internal Server Error instead of 401. Database connection timeout detected. Error handling is not working properly for invalid tokens.'
        }
      },
      {
        id: 'TC_API_003',
        title: 'Product Search API - Performance Test',
        description: 'Verify search API responds within acceptable time limits',
        category: 'API',
        priority: 'Medium',
        currentStatus: 'Not_Executed',
        steps: [
          {
            stepNumber: 1,
            action: 'Send GET request to /api/products/search?q=laptop',
            expected: 'Search request sent'
          },
          {
            stepNumber: 2,
            action: 'Measure response time',
            expected: 'Response received within 500ms'
          },
          {
            stepNumber: 3,
            action: 'Verify search results',
            expected: 'Relevant products returned'
          }
        ],
        expectedResult: 'Search API responds quickly with accurate results',
        linkedRequirements: ['REQ_API_003', 'REQ_PERFORMANCE_001'],
        projectId: 'PROJ_ECOMMERCE_001'
      },

      // UI/UX Test Cases
      {
        id: 'TC_UI_001',
        title: 'Homepage Layout Responsiveness',
        description: 'Verify homepage displays correctly on different screen sizes',
        category: 'UI/UX',
        priority: 'High',
        currentStatus: 'Pass',
        steps: [
          {
            stepNumber: 1,
            action: 'Open homepage on desktop (1920x1080)',
            expected: 'Page loads with full layout'
          },
          {
            stepNumber: 2,
            action: 'Resize to tablet view (768x1024)',
            expected: 'Layout adjusts responsively'
          },
          {
            stepNumber: 3,
            action: 'Resize to mobile view (375x667)',
            expected: 'Mobile layout with hamburger menu'
          }
        ],
        expectedResult: 'Homepage is fully responsive across all devices',
        linkedRequirements: ['REQ_UI_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:40:00Z',
          tester: 'carol.ui@company.com',
          status: 'Pass',
          notes: 'All breakpoints work correctly. Smooth transitions between layouts.'
        }
      },
      {
        id: 'TC_UI_002',
        title: 'Shopping Cart Button Visibility',
        description: 'Verify shopping cart button is visible and functional',
        category: 'UI/UX',
        priority: 'Critical',
        currentStatus: 'Fail',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to product page',
            expected: 'Product details displayed'
          },
          {
            stepNumber: 2,
            action: 'Locate "Add to Cart" button',
            expected: 'Button is clearly visible'
          },
          {
            stepNumber: 3,
            action: 'Click "Add to Cart" button',
            expected: 'Product added to cart with confirmation'
          }
        ],
        expectedResult: 'Cart functionality works smoothly',
        linkedRequirements: ['REQ_UI_002', 'REQ_CART_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:45:00Z',
          tester: 'carol.ui@company.com',
          status: 'Fail',
          notes: 'Add to Cart button is not visible on mobile devices due to CSS overflow issue. Button appears to be hidden behind product image. UI layout broken on screens smaller than 480px.'
        }
      },

      // Performance Test Cases
      {
        id: 'TC_PERF_001',
        title: 'Page Load Time - Homepage',
        description: 'Verify homepage loads within acceptable time limits',
        category: 'Performance',
        priority: 'High',
        currentStatus: 'Not_Executed',
        steps: [
          {
            stepNumber: 1,
            action: 'Clear browser cache',
            expected: 'Cache cleared'
          },
          {
            stepNumber: 2,
            action: 'Navigate to homepage',
            expected: 'Page starts loading'
          },
          {
            stepNumber: 3,
            action: 'Measure time to fully loaded',
            expected: 'Page loads within 3 seconds'
          }
        ],
        expectedResult: 'Homepage loads quickly for good user experience',
        linkedRequirements: ['REQ_PERFORMANCE_001'],
        projectId: 'PROJ_ECOMMERCE_001'
      },
      {
        id: 'TC_PERF_002',
        title: 'Database Query Performance',
        description: 'Verify database queries execute within acceptable timeframes',
        category: 'Performance',
        priority: 'Medium',
        currentStatus: 'Blocked',
        steps: [
          {
            stepNumber: 1,
            action: 'Execute complex product search query',
            expected: 'Query starts execution'
          },
          {
            stepNumber: 2,
            action: 'Measure query execution time',
            expected: 'Query completes within 1 second'
          },
          {
            stepNumber: 3,
            action: 'Verify result accuracy',
            expected: 'Correct products returned'
          }
        ],
        expectedResult: 'Database performs efficiently under load',
        linkedRequirements: ['REQ_PERFORMANCE_002'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:50:00Z',
          tester: 'david.perf@company.com',
          status: 'Blocked',
          notes: 'Database server is under maintenance. Performance testing cannot proceed until DB team completes index optimization. Blocked by ticket OPS-789.'
        }
      },

      // Security Test Cases
      {
        id: 'TC_SEC_001',
        title: 'SQL Injection Prevention',
        description: 'Verify application prevents SQL injection attacks',
        category: 'Security',
        priority: 'Critical',
        currentStatus: 'Pass',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to search form',
            expected: 'Search form is accessible'
          },
          {
            stepNumber: 2,
            action: 'Enter SQL injection payload: \' OR \'1\'=\'1',
            expected: 'Input is accepted'
          },
          {
            stepNumber: 3,
            action: 'Submit search request',
            expected: 'No database error or data exposure'
          }
        ],
        expectedResult: 'Application safely handles malicious input',
        linkedRequirements: ['REQ_SECURITY_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T09:55:00Z',
          tester: 'eve.security@company.com',
          status: 'Pass',
          notes: 'Input properly sanitized. No SQL injection vulnerability detected.'
        }
      },
      {
        id: 'TC_SEC_002',
        title: 'Cross-Site Scripting (XSS) Prevention',
        description: 'Verify application prevents XSS attacks in user input',
        category: 'Security',
        priority: 'Critical',
        currentStatus: 'Fail',
        steps: [
          {
            stepNumber: 1,
            action: 'Navigate to user profile edit page',
            expected: 'Profile form is displayed'
          },
          {
            stepNumber: 2,
            action: 'Enter XSS payload in name field: <script>alert("XSS")</script>',
            expected: 'Input is accepted'
          },
          {
            stepNumber: 3,
            action: 'Save profile and view public profile',
            expected: 'Script should be escaped, not executed'
          }
        ],
        expectedResult: 'Malicious scripts are safely escaped',
        linkedRequirements: ['REQ_SECURITY_002'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T10:00:00Z',
          tester: 'eve.security@company.com',
          status: 'Fail',
          notes: 'XSS vulnerability detected! Script tag executed when viewing profile. Input validation is insufficient. User input not properly escaped on display. Critical security issue requires immediate fix.'
        }
      },

      // Integration Test Cases
      {
        id: 'TC_INT_001',
        title: 'Payment Gateway Integration',
        description: 'Verify integration with external payment processor',
        category: 'Integration',
        priority: 'Critical',
        currentStatus: 'Not_Executed',
        steps: [
          {
            stepNumber: 1,
            action: 'Add item to cart and proceed to checkout',
            expected: 'Checkout page displays'
          },
          {
            stepNumber: 2,
            action: 'Enter payment details',
            expected: 'Payment form accepts input'
          },
          {
            stepNumber: 3,
            action: 'Submit payment',
            expected: 'Payment processed successfully'
          }
        ],
        expectedResult: 'Payment integration works seamlessly',
        linkedRequirements: ['REQ_PAYMENT_001'],
        projectId: 'PROJ_ECOMMERCE_001'
      },

      // Mobile-specific Test Cases
      {
        id: 'TC_MOB_001',
        title: 'Mobile Touch Navigation',
        description: 'Verify touch gestures work correctly on mobile devices',
        category: 'Mobile',
        priority: 'High',
        currentStatus: 'Pass',
        steps: [
          {
            stepNumber: 1,
            action: 'Open app on mobile device',
            expected: 'App loads in mobile view'
          },
          {
            stepNumber: 2,
            action: 'Swipe left to navigate between products',
            expected: 'Smooth swipe navigation'
          },
          {
            stepNumber: 3,
            action: 'Pinch to zoom on product images',
            expected: 'Zoom functionality works'
          }
        ],
        expectedResult: 'All touch gestures work smoothly',
        linkedRequirements: ['REQ_MOBILE_001'],
        projectId: 'PROJ_ECOMMERCE_001',
        lastExecution: {
          date: '2025-09-15T10:05:00Z',
          tester: 'frank.mobile@company.com',
          status: 'Pass',
          notes: 'Touch gestures responsive and intuitive. Good user experience on mobile.'
        }
      }
    ];
    
    setTestCases(fallbackTestCases);
  };

  // AI Prioritization Functions
  const enableAIPrioritization = async () => {
    setAiAnalysisLoading(true);
    try {
      const result = await aiTestPrioritizer.prioritizeTestCases(testCases);
      setTestCases(result.prioritizedTests);
      setPrioritizationAnalysis(result.analysis);
      setAiPrioritizationEnabled(true);
      setSortBy('aiRecommended');
      showNotification('success', `✨ AI analyzed ${result.analysis.totalTests} tests. ${result.analysis.highRiskTests} high-risk cases identified.`);
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
      // Try to call the API first
      try {
        const response = await fetch('/api/test-cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testCaseId: selectedTest.id,
            executionData: executionData
          }),
        });

        if (response.ok) {
          // API call successful, reload data
          await loadTestCases();
          showNotification('success', `Test ${selectedTest.id} executed successfully with status: ${executionData.status}`);
        } else {
          throw new Error('API call failed');
        }
      } catch (apiError) {
        console.warn('API not available, updating locally:', apiError);
        
        // Fallback: Update local state
        const updatedTestCases = testCases.map(tc => {
          if (tc.id === selectedTest.id) {
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
        showNotification('info', `Test ${selectedTest.id} executed locally with status: ${executionData.status}`);
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
          showNotification('success', `🎉 Run "${activeRun.name}" completed! All ${activeRun.totalTests} tests finished.`);
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
      showNotification('error', 'Failed to execute test: ' + error.message);
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

  const filteredTestCases = testCases
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
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
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

  // Calculate active run test cases (now that filteredTestCases is available)
  const activeRunTestCases = activeRun ? activeRun.testCases : filteredTestCases;

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

          {/* Enhanced Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                  onClick={() => setShowAddTestCase(true)}
                >
                  <Target className="w-4 h-4 mr-1" />
                  Add Test
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => {
                    loadAvailableTestCases();
                    setShowImportTestCases(true);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Import
                </Button>
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
        </div>

        {/* Default Admin Credentials Display */}
        {currentUserId === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Default Super Admin Account</h3>
                <p className="text-xs text-blue-700">Login credentials for system administration</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <span className="text-gray-500 text-xs">Username:</span>
                <div className="font-mono font-semibold text-gray-900">{adminCredentials.username}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="text-gray-500 text-xs">Email:</span>
                <div className="font-mono font-semibold text-gray-900">{adminCredentials.email}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="text-gray-500 text-xs">Password:</span>
                <div className="font-mono font-semibold text-gray-900">{adminCredentials.password}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center space-x-2 text-xs text-blue-600">
              <AlertTriangle className="w-4 h-4" />
              <span>⚠️ In production, passwords should be hashed and stored securely</span>
            </div>
          </div>
        )}

        {/* Multi-Run Execution Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">Execution Runs</h3>
                <Badge variant="info" className="text-xs">
                  {filteredRuns.length} visible
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {userRole.name}
                </Badge>

                {/* User & Role Switcher */}
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
                          {user.name} {user.isDefault ? '(Default Admin)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500">Role:</span>
                    <select
                      value={currentUserRole}
                      onChange={(e) => setCurrentUserRole(e.target.value)}
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="qa">QA Tester</option>
                      <option value="lead">Lead (QA Manager)</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>
              {userRole.permissions.includes('create_runs') || userRole.permissions.includes('*') ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateRun(true)}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>New Run</span>
                </Button>
              ) : null}
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

                <select
                  value={runFilter.tester}
                  onChange={(e) => setRunFilter(prev => ({ ...prev, tester: e.target.value }))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Testers</option>
                  <option value="my-runs">My Runs</option>
                  {availableUsers.filter(user => !user.name.includes('Current User')).map(user => (
                    <option key={user.name} value={user.name}>
                      {user.name} - {roles[user.role]?.name}
                    </option>
                  ))}
                </select>

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
                  onChange={(e) => switchToRun(e.target.value)}
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Select an execution run...</option>
                  {filteredRuns.map((run) => (
                    <option key={run.id} value={run.id}>
                      {run.name} ({run.completedTests}/{run.totalTests}) - {run.status} - {run.tester} ({getUserRole(run.tester)?.name || 'Unknown'})
                    </option>
                  ))}
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
                        `Progress: ${activeRun.completedTests}/${activeRun.totalTests}`
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
                    {activeRun.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    {activeRun.status === 'draft' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          // Navigate to library to select test cases
                          window.location.href = `/library?mode=execution&runId=${activeRun.id}`;
                        }}
                        className="text-xs px-2 py-1"
                      >
                        Add Test Cases
                      </Button>
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
                onClick={() => setShowCreateRun(true)}
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
                variant="outline"
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
                      {filteredTestCases.slice(0, 5).map(test => (
                        <div key={test.id} className="text-xs text-gray-600 py-1">
                          • {test.title}
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
                    variant="outline"
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
                  {activeRun ? `${activeRun.name} - Test Cases (${activeRunTestCases.length})` : `Test Cases (${filteredTestCases.length})`}
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
                {filteredTestCases.length === 0 ? (
                  <div className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No test cases found</h3>
                    <p className="text-gray-500">
                      {searchQuery || filter.status !== 'all' || filter.category !== 'all' || filter.priority !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by adding your first test case'
                      }
                    </p>
                  </div>
                ) : (
                  (activeRun ? activeRunTestCases : filteredTestCases).map((testCase, index) => (
                    <div
                      key={testCase.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedTest?.id === testCase.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTest(testCase)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            {aiPrioritizationEnabled && testCase.aiScore && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  #{testCase.aiScore.recommendedOrder}
                                </span>
                                {getAIRiskIcon(testCase.aiScore.riskLevel)}
                              </div>
                            )}
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {testCase.title}
                            </h3>
                            <Badge className={getStatusColor(testCase.currentStatus)} size="sm">
                              {getStatusIcon(testCase.currentStatus)}
                              <span className="ml-1">{testCase.currentStatus}</span>
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
                          {aiPrioritizationEnabled && testCase.aiScore && (
                            <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Brain className="w-3 h-3 text-purple-600" />
                                  <Badge className={getAIRiskColor(testCase.aiScore.riskLevel)} size="sm">
                                    {testCase.aiScore.riskLevel.toUpperCase()}
                                  </Badge>
                                </div>
                                <span className="text-xs text-purple-700">
                                  Risk: {Math.round(testCase.aiScore.failureProbability * 100)}%
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
                  <h4 className="font-medium text-gray-900 mb-2">{selectedTest.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedTest.description}</p>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span className="text-gray-900 font-mono">{selectedTest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="text-gray-900">{selectedTest.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Priority:</span>
                      <Badge className={getPriorityColor(selectedTest.priority)} size="sm">
                        {selectedTest.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Test Steps */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Test Steps</h4>
                  <div className="space-y-2">
                    {selectedTest.steps.map((step) => (
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
                {selectedTest.lastExecution && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Last Execution</h4>
                    <div className="bg-gray-50 rounded p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-900">{new Date(selectedTest.lastExecution.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tester:</span>
                        <span className="text-gray-900">{selectedTest.lastExecution.tester}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <Badge className={getStatusColor(selectedTest.lastExecution.status)} size="sm">
                          {getStatusIcon(selectedTest.lastExecution.status)}
                          <span className="ml-1">{selectedTest.lastExecution.status}</span>
                        </Badge>
                      </div>
                      {selectedTest.lastExecution.notes && (
                        <div>
                          <span className="text-gray-500 block mb-1">Notes:</span>
                          <p className="text-gray-900 text-xs bg-white p-2 rounded border">{selectedTest.lastExecution.notes}</p>
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
                      <select
                        value={executionData.tester}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, tester: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {availableUsers.map((user) => (
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
                          onClick={() => analyzeFailureWithAI(selectedTest, executionData.notes)}
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
                        {aiAnalysis.relatedTestCases.map((testCase: any) => (
                          <div
                            key={testCase.id}
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
                    onClick={() => setShowAddTestCase(false)}
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
                      {newTestCase.steps.map((step, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Step {step.stepNumber}</span>
                            {newTestCase.steps.length > 1 && (
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
                    onClick={() => setShowAddTestCase(false)}
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
      </div>
    </Layout>
  );
}
