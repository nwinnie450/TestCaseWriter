const fs = require('fs');
const path = require('path');
const TestCase = require('../models/TestCase');
const TestSet = require('../models/TestSet');
const ImportExportService = require('../services/ImportExportService');

class TestCaseManager {
    constructor(options = {}) {
        this.dataDir = options.dataDir || './data';
        this.testCasesDir = path.join(this.dataDir, 'test-cases');
        this.testSetsDir = path.join(this.dataDir, 'test-sets');
        this.executionsDir = path.join(this.dataDir, 'executions');
        this.configDir = path.join(this.dataDir, 'config');
        
        this.testCases = new Map();
        this.testSets = new Map();
        this.importExportService = new ImportExportService();
        
        this.initializeDirectories();
        this.loadExistingData();
    }
    
    initializeDirectories() {
        [this.dataDir, this.testCasesDir, this.testSetsDir, this.executionsDir, this.configDir]
            .forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            });
    }
    
    loadExistingData() {
        try {
            // Load test cases
            if (fs.existsSync(this.testCasesDir)) {
                const files = fs.readdirSync(this.testCasesDir);
                files.filter(file => file.endsWith('.json')).forEach(file => {
                    try {
                        const filePath = path.join(this.testCasesDir, file);
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const testCase = new TestCase(data);
                        this.testCases.set(testCase.id, testCase);
                    } catch (error) {
                        console.warn(`Failed to load test case from ${file}: ${error.message}`);
                    }
                });
            }
            
            // Load test sets
            if (fs.existsSync(this.testSetsDir)) {
                const files = fs.readdirSync(this.testSetsDir);
                files.filter(file => file.endsWith('.json')).forEach(file => {
                    try {
                        const filePath = path.join(this.testSetsDir, file);
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const testSet = new TestSet(data);
                        this.testSets.set(testSet.id, testSet);
                    } catch (error) {
                        console.warn(`Failed to load test set from ${file}: ${error.message}`);
                    }
                });
            }
            
            console.log(`Loaded ${this.testCases.size} test cases and ${this.testSets.size} test sets`);
        } catch (error) {
            console.error(`Failed to load existing data: ${error.message}`);
        }
    }
    
    // Test Case Management
    createTestCase(data) {
        const testCase = new TestCase(data);
        this.testCases.set(testCase.id, testCase);
        this.saveTestCase(testCase);
        return testCase;
    }
    
    getTestCase(id) {
        return this.testCases.get(id);
    }
    
    getAllTestCases() {
        return Array.from(this.testCases.values());
    }
    
    updateTestCase(id, updates) {
        const testCase = this.testCases.get(id);
        if (!testCase) {
            throw new Error(`Test case ${id} not found`);
        }
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                testCase[key] = updates[key];
            }
        });
        
        testCase.updateModifiedDate();
        this.saveTestCase(testCase);
        return testCase;
    }
    
    deleteTestCase(id) {
        const testCase = this.testCases.get(id);
        if (!testCase) {
            throw new Error(`Test case ${id} not found`);
        }
        
        // Remove from any test sets
        this.testSets.forEach(testSet => {
            try {
                testSet.removeTestCase(id);
                this.saveTestSet(testSet);
            } catch (error) {
                // Test case not in this set, continue
            }
        });
        
        // Delete file
        const filePath = path.join(this.testCasesDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        this.testCases.delete(id);
        return true;
    }
    
    saveTestCase(testCase) {
        const filePath = path.join(this.testCasesDir, `${testCase.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(testCase.toJSON(), null, 2));
    }
    
    // Test Set Management
    createTestSet(data) {
        const testSet = new TestSet(data);
        this.testSets.set(testSet.id, testSet);
        this.saveTestSet(testSet);
        return testSet;
    }
    
    getTestSet(id) {
        return this.testSets.get(id);
    }
    
    getAllTestSets() {
        return Array.from(this.testSets.values());
    }
    
    updateTestSet(id, updates) {
        const testSet = this.testSets.get(id);
        if (!testSet) {
            throw new Error(`Test set ${id} not found`);
        }
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                testSet[key] = updates[key];
            }
        });
        
        testSet.updateModifiedDate();
        this.saveTestSet(testSet);
        return testSet;
    }
    
    deleteTestSet(id) {
        const testSet = this.testSets.get(id);
        if (!testSet) {
            throw new Error(`Test set ${id} not found`);
        }
        
        // Delete file
        const filePath = path.join(this.testSetsDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        this.testSets.delete(id);
        return true;
    }
    
    saveTestSet(testSet) {
        const filePath = path.join(this.testSetsDir, `${testSet.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(testSet.toJSON(), null, 2));
    }
    
    // Test Set Operations
    addTestCasesToSet(testSetId, testCaseIds, options = {}) {
        const testSet = this.getTestSet(testSetId);
        if (!testSet) {
            throw new Error(`Test set ${testSetId} not found`);
        }
        
        const results = [];
        testCaseIds.forEach(testCaseId => {
            try {
                if (!this.testCases.has(testCaseId)) {
                    throw new Error(`Test case ${testCaseId} not found`);
                }
                
                const result = testSet.addTestCase(testCaseId, options);
                results.push({ testCaseId, success: true, result });
            } catch (error) {
                results.push({ testCaseId, success: false, error: error.message });
            }
        });
        
        this.saveTestSet(testSet);
        return results;
    }
    
    removeTestCasesFromSet(testSetId, testCaseIds) {
        const testSet = this.getTestSet(testSetId);
        if (!testSet) {
            throw new Error(`Test set ${testSetId} not found`);
        }
        
        const results = [];
        testCaseIds.forEach(testCaseId => {
            try {
                testSet.removeTestCase(testCaseId);
                results.push({ testCaseId, success: true });
            } catch (error) {
                results.push({ testCaseId, success: false, error: error.message });
            }
        });
        
        this.saveTestSet(testSet);
        return results;
    }
    
    cloneTestSet(testSetId, newName, options = {}) {
        const originalTestSet = this.getTestSet(testSetId);
        if (!originalTestSet) {
            throw new Error(`Test set ${testSetId} not found`);
        }
        
        const clonedTestSet = originalTestSet.clone(newName, options);
        this.testSets.set(clonedTestSet.id, clonedTestSet);
        this.saveTestSet(clonedTestSet);
        
        return clonedTestSet;
    }
    
    // Test Execution
    executeTest(testCaseId, executionData) {
        const testCase = this.getTestCase(testCaseId);
        if (!testCase) {
            throw new Error(`Test case ${testCaseId} not found`);
        }
        
        const executionId = testCase.addExecution(executionData);
        this.saveTestCase(testCase);
        
        // Log execution
        this.logExecution(testCaseId, executionId, executionData);
        
        return executionId;
    }
    
    bulkExecuteTests(testCaseIds, executionData) {
        const results = [];
        
        testCaseIds.forEach(testCaseId => {
            try {
                const executionId = this.executeTest(testCaseId, executionData);
                results.push({ testCaseId, success: true, executionId });
            } catch (error) {
                results.push({ testCaseId, success: false, error: error.message });
            }
        });
        
        return results;
    }
    
    logExecution(testCaseId, executionId, executionData) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            testCaseId,
            executionId,
            status: executionData.status,
            tester: executionData.tester,
            environment: executionData.environment
        };
        
        const logFile = path.join(this.executionsDir, `execution-log-${new Date().toISOString().split('T')[0]}.json`);
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    }
    
    // Search and Filter
    searchTestCases(query, filters = {}) {
        let testCases = this.getAllTestCases();
        
        // Text search
        if (query) {
            const lowerQuery = query.toLowerCase();
            testCases = testCases.filter(tc =>
                tc.title.toLowerCase().includes(lowerQuery) ||
                tc.description.toLowerCase().includes(lowerQuery) ||
                tc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        }
        
        // Apply filters
        if (filters.category) {
            testCases = testCases.filter(tc => tc.category === filters.category);
        }
        
        if (filters.priority) {
            testCases = testCases.filter(tc => tc.priority === filters.priority);
        }
        
        if (filters.status) {
            testCases = testCases.filter(tc => tc.currentStatus === filters.status);
        }
        
        if (filters.assignedTo) {
            // Find test sets assigned to user and get their test cases
            const userTestSets = this.getAllTestSets().filter(ts => ts.assignedTo === filters.assignedTo);
            const userTestCaseIds = new Set();
            userTestSets.forEach(ts => {
                ts.testCases.forEach(tc => userTestCaseIds.add(tc.testCaseId));
            });
            testCases = testCases.filter(tc => userTestCaseIds.has(tc.id));
        }
        
        if (filters.tags && filters.tags.length > 0) {
            testCases = testCases.filter(tc =>
                filters.tags.some(tag => tc.tags.includes(tag))
            );
        }
        
        return testCases;
    }
    
    // Import/Export
    async importTestCases(source, filePath, options = {}) {
        const result = await this.importExportService.importTestCases(source, filePath, options);
        
        if (result.success) {
            // Save imported test cases
            result.testCases.forEach(testCase => {
                this.testCases.set(testCase.id, testCase);
                this.saveTestCase(testCase);
            });
        }
        
        return result;
    }
    
    async exportTestCases(testCaseIds, format, outputPath, options = {}) {
        let testCases;
        
        if (testCaseIds === 'all') {
            testCases = this.getAllTestCases();
        } else if (Array.isArray(testCaseIds)) {
            testCases = testCaseIds.map(id => this.getTestCase(id)).filter(tc => tc);
        } else {
            throw new Error('testCaseIds must be "all" or an array of test case IDs');
        }
        
        return await this.importExportService.exportTestCases(testCases, format, outputPath, options);
    }
    
    // Statistics and Reporting
    getOverallStatistics() {
        const testCases = this.getAllTestCases();
        const testSets = this.getAllTestSets();
        
        const stats = {
            testCases: {
                total: testCases.length,
                byCategory: {},
                byPriority: {},
                byStatus: {},
                automation: {
                    candidates: 0,
                    manual: 0,
                    automated: 0
                }
            },
            testSets: {
                total: testSets.length,
                active: 0,
                completed: 0,
                blocked: 0
            },
            execution: {
                totalExecutions: 0,
                passRate: 0,
                avgExecutionTime: 0
            }
        };
        
        // Calculate test case statistics
        testCases.forEach(tc => {
            stats.testCases.byCategory[tc.category] = (stats.testCases.byCategory[tc.category] || 0) + 1;
            stats.testCases.byPriority[tc.priority] = (stats.testCases.byPriority[tc.priority] || 0) + 1;
            stats.testCases.byStatus[tc.currentStatus] = (stats.testCases.byStatus[tc.currentStatus] || 0) + 1;
            
            if (tc.automationCandidate) stats.testCases.automation.candidates++;
            if (tc.type === 'Manual') stats.testCases.automation.manual++;
            if (tc.type === 'Automated') stats.testCases.automation.automated++;
            
            stats.execution.totalExecutions += tc.executionHistory.length;
        });
        
        // Calculate test set statistics
        testSets.forEach(ts => {
            if (ts.status === 'In_Progress') stats.testSets.active++;
            if (ts.status === 'Completed') stats.testSets.completed++;
            if (ts.status === 'Blocked') stats.testSets.blocked++;
        });
        
        // Calculate pass rate
        const passedTests = stats.testCases.byStatus.Pass || 0;
        const executedTests = stats.execution.totalExecutions;
        stats.execution.passRate = executedTests > 0 ? 
            ((passedTests / executedTests) * 100).toFixed(1) : 0;
        
        return stats;
    }
}

module.exports = TestCaseManager;