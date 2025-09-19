import fs from 'fs';
import path from 'path';

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

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  qaLead: string;
  requirements: string[];
  testCases: string[];
  stats: {
    testCoverage: string;
    passRate: string;
    executedTests: number;
    totalTests: number;
    blockedTests: number;
    failedTests: number;
  };
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  projectId: string;
  testCases: string[];
  acceptanceCriteria: Array<{
    id: string;
    description: string;
    type: string;
    priority: string;
    testable: boolean;
  }>;
}

export class DataService {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
  }

  // Test Cases
  async getAllTestCases(): Promise<TestCase[]> {
    try {
      const testCasesDir = path.join(this.dataDir, 'test-cases');
      if (!fs.existsSync(testCasesDir)) {
        return [];
      }

      const files = fs.readdirSync(testCasesDir);
      const testCases: TestCase[] = [];

      for (const file of files.filter(f => f.endsWith('.json'))) {
        try {
          const filePath = path.join(testCasesDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          testCases.push(data);
        } catch (error) {
          console.warn(`Failed to load test case from ${file}:`, error);
        }
      }

      return testCases;
    } catch (error) {
      console.error('Failed to load test cases:', error);
      return [];
    }
  }

  async getTestCase(id: string): Promise<TestCase | null> {
    try {
      const filePath = path.join(this.dataDir, 'test-cases', `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (error) {
      console.error(`Failed to load test case ${id}:`, error);
      return null;
    }
  }

  async updateTestCaseExecution(
    testCaseId: string, 
    executionData: {
      status: 'Pass' | 'Fail' | 'Blocked' | 'Skip';
      tester: string;
      environment: string;
      duration: string;
      notes: string;
      jiraTicket?: string;
    }
  ): Promise<boolean> {
    try {
      const testCase = await this.getTestCase(testCaseId);
      if (!testCase) {
        return false;
      }

      // Create execution record
      const execution = {
        executionId: `EXEC${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString(),
        tester: executionData.tester,
        status: executionData.status,
        notes: executionData.notes,
        environment: executionData.environment,
        duration: executionData.duration,
        jiraTicket: executionData.jiraTicket
      };

      // Update test case
      testCase.currentStatus = executionData.status;
      testCase.lastExecution = {
        date: execution.date,
        tester: execution.tester,
        status: execution.status,
        notes: execution.notes
      };

      if (!testCase.executionHistory) {
        testCase.executionHistory = [];
      }
      testCase.executionHistory.push(execution);

      // Save back to file
      const filePath = path.join(this.dataDir, 'test-cases', `${testCaseId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(testCase, null, 2));

      return true;
    } catch (error) {
      console.error(`Failed to update test case execution for ${testCaseId}:`, error);
      return false;
    }
  }

  // Projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const projectsDir = path.join(this.dataDir, 'projects');
      if (!fs.existsSync(projectsDir)) {
        return [];
      }

      const files = fs.readdirSync(projectsDir);
      const projects: Project[] = [];

      for (const file of files.filter(f => f.endsWith('.json'))) {
        try {
          const filePath = path.join(projectsDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          projects.push(data);
        } catch (error) {
          console.warn(`Failed to load project from ${file}:`, error);
        }
      }

      return projects;
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const filePath = path.join(this.dataDir, 'projects', `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (error) {
      console.error(`Failed to load project ${id}:`, error);
      return null;
    }
  }

  // Requirements
  async getAllRequirements(): Promise<Requirement[]> {
    try {
      const requirementsDir = path.join(this.dataDir, 'requirements');
      if (!fs.existsSync(requirementsDir)) {
        return [];
      }

      const files = fs.readdirSync(requirementsDir);
      const requirements: Requirement[] = [];

      for (const file of files.filter(f => f.endsWith('.json'))) {
        try {
          const filePath = path.join(requirementsDir, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          requirements.push(data);
        } catch (error) {
          console.warn(`Failed to load requirement from ${file}:`, error);
        }
      }

      return requirements;
    } catch (error) {
      console.error('Failed to load requirements:', error);
      return [];
    }
  }

  async getRequirement(id: string): Promise<Requirement | null> {
    try {
      const filePath = path.join(this.dataDir, 'requirements', `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    } catch (error) {
      console.error(`Failed to load requirement ${id}:`, error);
      return null;
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const [testCases, projects, requirements] = await Promise.all([
        this.getAllTestCases(),
        this.getAllProjects(),
        this.getAllRequirements()
      ]);

      const stats = {
        totalTestCases: testCases.length,
        totalProjects: projects.length,
        totalRequirements: requirements.length,
        testExecution: {
          passed: testCases.filter(tc => tc.currentStatus === 'Pass').length,
          failed: testCases.filter(tc => tc.currentStatus === 'Fail').length,
          blocked: testCases.filter(tc => tc.currentStatus === 'Blocked').length,
          notExecuted: testCases.filter(tc => tc.currentStatus === 'Not_Executed').length,
          passRate: testCases.length > 0 ? 
            Math.round((testCases.filter(tc => tc.currentStatus === 'Pass').length / testCases.length) * 100) : 0
        },
        projects: {
          active: projects.filter(p => p.status === 'Active').length,
          completed: projects.filter(p => p.status === 'Completed').length,
          onHold: projects.filter(p => p.status === 'On Hold').length
        },
        requirements: {
          approved: requirements.filter(r => r.status === 'Approved').length,
          draft: requirements.filter(r => r.status === 'Draft').length,
          inDevelopment: requirements.filter(r => r.status === 'In Development').length
        }
      };

      return stats;
    } catch (error) {
      console.error('Failed to generate dashboard stats:', error);
      return {
        totalTestCases: 0,
        totalProjects: 0,
        totalRequirements: 0,
        testExecution: { passed: 0, failed: 0, blocked: 0, notExecuted: 0, passRate: 0 },
        projects: { active: 0, completed: 0, onHold: 0 },
        requirements: { approved: 0, draft: 0, inDevelopment: 0 }
      };
    }
  }
}

// Singleton instance
export const dataService = new DataService();