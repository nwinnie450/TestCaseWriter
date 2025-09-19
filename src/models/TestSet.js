// Test Set Data Model
class TestSet {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || 'Functional';
        this.priority = data.priority || 'Medium';
        this.estimatedDuration = data.estimatedDuration || '';
        this.environment = data.environment || 'Staging';
        this.assignedTo = data.assignedTo || '';
        
        // Metadata
        this.createdBy = data.createdBy || '';
        this.createdDate = data.createdDate || new Date().toISOString();
        this.lastModified = data.lastModified || new Date().toISOString();
        this.version = data.version || '1.0';
        
        // Test Cases in this set
        this.testCases = data.testCases || []; // Array of {testCaseId, addedDate, addedBy, order, mandatory}
        
        // Execution tracking
        this.executionHistory = data.executionHistory || [];
        this.currentExecution = data.currentExecution || null;
        this.status = data.status || 'Not_Started'; // Not_Started, In_Progress, Completed, Blocked
        
        // Jira Integration
        this.jiraLinks = data.jiraLinks || [];
        this.sprint = data.sprint || '';
        this.epic = data.epic || '';
    }
    
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `TS${timestamp}${random}`.toUpperCase();
    }
    
    addTestCase(testCaseId, options = {}) {
        const existingIndex = this.testCases.findIndex(tc => tc.testCaseId === testCaseId);
        if (existingIndex !== -1) {
            throw new Error(`Test case ${testCaseId} already exists in this test set`);
        }
        
        const testCaseEntry = {
            testCaseId,
            addedDate: new Date().toISOString(),
            addedBy: options.addedBy || '',
            order: options.order || this.testCases.length + 1,
            mandatory: options.mandatory || true,
            estimatedTime: options.estimatedTime || ''
        };
        
        this.testCases.push(testCaseEntry);
        this.updateModifiedDate();
        return testCaseEntry;
    }
    
    removeTestCase(testCaseId) {
        const initialLength = this.testCases.length;
        this.testCases = this.testCases.filter(tc => tc.testCaseId !== testCaseId);
        
        if (this.testCases.length === initialLength) {
            throw new Error(`Test case ${testCaseId} not found in this test set`);
        }
        
        // Reorder remaining test cases
        this.testCases.forEach((tc, index) => {
            tc.order = index + 1;
        });
        
        this.updateModifiedDate();
    }
    
    reorderTestCases(newOrder) {
        // newOrder should be an array of testCaseIds in the desired order
        const reorderedTestCases = [];
        
        newOrder.forEach((testCaseId, index) => {
            const testCase = this.testCases.find(tc => tc.testCaseId === testCaseId);
            if (testCase) {
                testCase.order = index + 1;
                reorderedTestCases.push(testCase);
            }
        });
        
        // Add any test cases not in the new order at the end
        const remainingTestCases = this.testCases.filter(tc => !newOrder.includes(tc.testCaseId));
        remainingTestCases.forEach((tc, index) => {
            tc.order = reorderedTestCases.length + index + 1;
            reorderedTestCases.push(tc);
        });
        
        this.testCases = reorderedTestCases;
        this.updateModifiedDate();
    }
    
    assignTo(testerEmail) {
        this.assignedTo = testerEmail;
        this.updateModifiedDate();
    }
    
    startExecution(options = {}) {
        if (this.currentExecution && this.currentExecution.status === 'In_Progress') {
            throw new Error('Test set execution already in progress');
        }
        
        const execution = {
            executionId: this.generateExecutionId(),
            startDate: new Date().toISOString(),
            startedBy: options.startedBy || this.assignedTo,
            environment: options.environment || this.environment,
            status: 'In_Progress',
            testCaseResults: [],
            notes: options.notes || ''
        };
        
        this.currentExecution = execution;
        this.status = 'In_Progress';
        this.updateModifiedDate();
        
        return execution.executionId;
    }
    
    completeExecution(options = {}) {
        if (!this.currentExecution || this.currentExecution.status !== 'In_Progress') {
            throw new Error('No execution in progress to complete');
        }
        
        this.currentExecution.endDate = new Date().toISOString();
        this.currentExecution.completedBy = options.completedBy || this.currentExecution.startedBy;
        this.currentExecution.status = 'Completed';
        this.currentExecution.finalNotes = options.finalNotes || '';
        
        this.executionHistory.push({ ...this.currentExecution });
        this.currentExecution = null;
        this.status = 'Completed';
        this.updateModifiedDate();
    }
    
    generateExecutionId() {
        const timestamp = Date.now().toString(36);
        return `TSE${timestamp}`.toUpperCase();
    }
    
    updateModifiedDate() {
        this.lastModified = new Date().toISOString();
        this.version = this.incrementVersion(this.version);
    }
    
    incrementVersion(version) {
        const parts = version.split('.');
        const minor = parseInt(parts[1]) + 1;
        return `${parts[0]}.${minor}`;
    }
    
    // Get execution statistics
    getExecutionStats(testCaseManager) {
        const stats = {
            totalTestCases: this.testCases.length,
            executed: 0,
            passed: 0,
            failed: 0,
            blocked: 0,
            notExecuted: 0,
            estimatedDuration: 0,
            actualDuration: 0
        };
        
        this.testCases.forEach(tcEntry => {
            const testCase = testCaseManager.getTestCase(tcEntry.testCaseId);
            if (testCase) {
                const status = testCase.currentStatus;
                if (status === 'Not_Executed') {
                    stats.notExecuted++;
                } else {
                    stats.executed++;
                    switch (status) {
                        case 'Pass':
                            stats.passed++;
                            break;
                        case 'Fail':
                            stats.failed++;
                            break;
                        case 'Blocked':
                            stats.blocked++;
                            break;
                    }
                }
            }
        });
        
        stats.executionProgress = stats.totalTestCases > 0 ? 
            ((stats.executed / stats.totalTestCases) * 100).toFixed(1) : 0;
        stats.passRate = stats.executed > 0 ? 
            ((stats.passed / stats.executed) * 100).toFixed(1) : 0;
        
        return stats;
    }
    
    // Clone test set
    clone(newName, options = {}) {
        const clonedData = {
            ...this.toJSON(),
            id: undefined, // Will generate new ID
            name: newName,
            createdBy: options.clonedBy || '',
            createdDate: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            version: '1.0',
            executionHistory: [],
            currentExecution: null,
            status: 'Not_Started'
        };
        
        // Optionally include/exclude test cases
        if (options.includeTestCases === false) {
            clonedData.testCases = [];
        }
        
        return new TestSet(clonedData);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            priority: this.priority,
            estimatedDuration: this.estimatedDuration,
            environment: this.environment,
            assignedTo: this.assignedTo,
            createdBy: this.createdBy,
            createdDate: this.createdDate,
            lastModified: this.lastModified,
            version: this.version,
            testCases: this.testCases,
            executionHistory: this.executionHistory,
            currentExecution: this.currentExecution,
            status: this.status,
            jiraLinks: this.jiraLinks,
            sprint: this.sprint,
            epic: this.epic
        };
    }
    
    toCSV() {
        return {
            'Test Set ID': this.id,
            'Name': this.name,
            'Description': this.description,
            'Category': this.category,
            'Priority': this.priority,
            'Environment': this.environment,
            'Assigned To': this.assignedTo,
            'Status': this.status,
            'Test Cases Count': this.testCases.length,
            'Sprint': this.sprint,
            'Epic': this.epic,
            'Created By': this.createdBy,
            'Created Date': this.createdDate,
            'Last Modified': this.lastModified
        };
    }
}

module.exports = TestSet;