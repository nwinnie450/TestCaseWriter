// Test Case Data Model
class TestCase {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.category = data.category || 'Functional';
        this.priority = data.priority || 'Medium'; // Critical, High, Medium, Low
        this.type = data.type || 'Manual'; // Manual, Automated
        this.tags = data.tags || [];
        this.prerequisites = data.prerequisites || [];
        this.steps = data.steps || [];
        this.expectedResult = data.expectedResult || '';
        this.estimatedTime = data.estimatedTime || '';
        this.automationCandidate = data.automationCandidate || false;
        
        // Metadata
        this.createdBy = data.createdBy || '';
        this.createdDate = data.createdDate || new Date().toISOString();
        this.lastModified = data.lastModified || new Date().toISOString();
        this.version = data.version || '1.0';
        
        // Jira Integration
        this.jiraLinks = data.jiraLinks || {
            stories: [],
            epics: [],
            defects: [],
            blocking: []
        };
        
        // Execution History
        this.executionHistory = data.executionHistory || [];
        this.currentStatus = data.currentStatus || 'Not_Executed';
        this.lastExecution = data.lastExecution || null;
    }
    
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `TC${timestamp}${random}`.toUpperCase();
    }
    
    addStep(action, expected) {
        const stepNumber = this.steps.length + 1;
        this.steps.push({
            stepNumber,
            action,
            expected,
            actualResult: '',
            status: ''
        });
        this.updateModifiedDate();
    }
    
    removeStep(stepNumber) {
        this.steps = this.steps.filter(step => step.stepNumber !== stepNumber);
        // Renumber remaining steps
        this.steps.forEach((step, index) => {
            step.stepNumber = index + 1;
        });
        this.updateModifiedDate();
    }
    
    addJiraLink(type, ticketId) {
        if (this.jiraLinks[type] && !this.jiraLinks[type].includes(ticketId)) {
            this.jiraLinks[type].push(ticketId);
            this.updateModifiedDate();
        }
    }
    
    removeJiraLink(type, ticketId) {
        if (this.jiraLinks[type]) {
            this.jiraLinks[type] = this.jiraLinks[type].filter(id => id !== ticketId);
            this.updateModifiedDate();
        }
    }
    
    addExecution(executionData) {
        const execution = {
            executionId: this.generateExecutionId(),
            date: new Date().toISOString(),
            status: executionData.status,
            tester: executionData.tester,
            environment: executionData.environment,
            duration: executionData.duration,
            notes: executionData.notes || '',
            screenshots: executionData.screenshots || [],
            logs: executionData.logs || [],
            blockingInfo: executionData.blockingInfo || null,
            defects: executionData.defects || []
        };
        
        this.executionHistory.push(execution);
        this.currentStatus = executionData.status;
        this.lastExecution = execution;
        this.updateModifiedDate();
        
        return execution.executionId;
    }
    
    generateExecutionId() {
        const timestamp = Date.now().toString(36);
        return `EX${timestamp}`.toUpperCase();
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
    getExecutionStats() {
        const statusCounts = this.executionHistory.reduce((acc, exec) => {
            acc[exec.status] = (acc[exec.status] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalExecutions: this.executionHistory.length,
            statusBreakdown: statusCounts,
            passRate: statusCounts.Pass ? ((statusCounts.Pass / this.executionHistory.length) * 100).toFixed(1) : 0,
            currentStatus: this.currentStatus,
            lastExecuted: this.lastExecution?.date || null
        };
    }
    
    // Export to different formats
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category,
            priority: this.priority,
            type: this.type,
            tags: this.tags,
            prerequisites: this.prerequisites,
            steps: this.steps,
            expectedResult: this.expectedResult,
            estimatedTime: this.estimatedTime,
            automationCandidate: this.automationCandidate,
            createdBy: this.createdBy,
            createdDate: this.createdDate,
            lastModified: this.lastModified,
            version: this.version,
            jiraLinks: this.jiraLinks,
            executionHistory: this.executionHistory,
            currentStatus: this.currentStatus,
            lastExecution: this.lastExecution
        };
    }
    
    toCSV() {
        const steps = this.steps.map(s => `${s.stepNumber}. ${s.action} | Expected: ${s.expected}`).join('; ');
        return {
            'Test Case ID': this.id,
            'Title': this.title,
            'Description': this.description,
            'Category': this.category,
            'Priority': this.priority,
            'Type': this.type,
            'Tags': this.tags.join(', '),
            'Prerequisites': this.prerequisites.join('; '),
            'Test Steps': steps,
            'Expected Result': this.expectedResult,
            'Estimated Time': this.estimatedTime,
            'Current Status': this.currentStatus,
            'Jira Stories': this.jiraLinks.stories.join(', '),
            'Created By': this.createdBy,
            'Created Date': this.createdDate,
            'Last Modified': this.lastModified
        };
    }
}

module.exports = TestCase;