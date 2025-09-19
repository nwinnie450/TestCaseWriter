// Project Data Model for Multi-Project Test Case Management
class Project {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || 'General'; // Web, Mobile, API, etc.
        this.status = data.status || 'Active'; // Active, Archived, On Hold
        this.priority = data.priority || 'Medium';
        
        // Project details
        this.version = data.version || '1.0.0';
        this.environment = data.environment || 'Development';
        this.platform = data.platform || 'Web'; // Web, Mobile, Desktop, API
        this.technology = data.technology || []; // React, Node.js, etc.
        
        // Team information
        this.projectManager = data.projectManager || '';
        this.qaLead = data.qaLead || '';
        this.teamMembers = data.teamMembers || [];
        
        // Requirements and test cases
        this.requirements = data.requirements || []; // Array of requirement IDs
        this.testCases = data.testCases || []; // Array of test case IDs
        this.testSets = data.testSets || []; // Array of test set IDs
        
        // Metadata
        this.createdBy = data.createdBy || '';
        this.createdDate = data.createdDate || new Date().toISOString();
        this.lastModified = data.lastModified || new Date().toISOString();
        
        // Statistics (calculated)
        this.stats = data.stats || {
            totalRequirements: 0,
            totalTestCases: 0,
            testCoverage: 0,
            passRate: 0,
            lastExecution: null
        };
        
        // Jira integration
        this.jiraProject = data.jiraProject || '';
        this.jiraComponents = data.jiraComponents || [];
    }
    
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `PROJ${timestamp}${random}`.toUpperCase();
    }
    
    // Requirements Management
    addRequirement(requirementId) {
        if (!this.requirements.includes(requirementId)) {
            this.requirements.push(requirementId);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    removeRequirement(requirementId) {
        const index = this.requirements.indexOf(requirementId);
        if (index > -1) {
            this.requirements.splice(index, 1);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    // Test Case Management
    addTestCase(testCaseId, linkedRequirements = []) {
        if (!this.testCases.includes(testCaseId)) {
            this.testCases.push(testCaseId);
            
            // Link to requirements if specified
            linkedRequirements.forEach(reqId => {
                if (this.requirements.includes(reqId)) {
                    // Store the relationship
                    this.addTestCaseRequirementLink(testCaseId, reqId);
                }
            });
            
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    removeTestCase(testCaseId) {
        const index = this.testCases.indexOf(testCaseId);
        if (index > -1) {
            this.testCases.splice(index, 1);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    // Test Set Management
    addTestSet(testSetId) {
        if (!this.testSets.includes(testSetId)) {
            this.testSets.push(testSetId);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    removeTestSet(testSetId) {
        const index = this.testSets.indexOf(testSetId);
        if (index > -1) {
            this.testSets.splice(index, 1);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    // Team Management
    addTeamMember(member) {
        const existingMember = this.teamMembers.find(m => m.email === member.email);
        if (!existingMember) {
            this.teamMembers.push({
                name: member.name,
                email: member.email,
                role: member.role || 'QA Tester',
                permissions: member.permissions || ['execute_tests', 'view_results'],
                joinDate: new Date().toISOString()
            });
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    removeTeamMember(email) {
        const index = this.teamMembers.findIndex(m => m.email === email);
        if (index > -1) {
            this.teamMembers.splice(index, 1);
            this.updateModifiedDate();
            return true;
        }
        return false;
    }
    
    // Statistics and Reporting
    updateStatistics(testCaseManager) {
        // Calculate test coverage
        const linkedTestCases = this.testCases.map(id => testCaseManager.getTestCase(id)).filter(tc => tc);
        const totalRequirements = this.requirements.length;
        const coveredRequirements = new Set();
        
        linkedTestCases.forEach(tc => {
            if (tc.linkedRequirements) {
                tc.linkedRequirements.forEach(reqId => coveredRequirements.add(reqId));
            }
        });
        
        this.stats = {
            totalRequirements: totalRequirements,
            totalTestCases: this.testCases.length,
            testCoverage: totalRequirements > 0 ? ((coveredRequirements.size / totalRequirements) * 100).toFixed(1) : 0,
            passRate: this.calculatePassRate(linkedTestCases),
            lastExecution: this.getLastExecutionDate(linkedTestCases),
            executedTests: linkedTestCases.filter(tc => tc.currentStatus !== 'Not_Executed').length,
            passedTests: linkedTestCases.filter(tc => tc.currentStatus === 'Pass').length,
            failedTests: linkedTestCases.filter(tc => tc.currentStatus === 'Fail').length,
            blockedTests: linkedTestCases.filter(tc => tc.currentStatus === 'Blocked').length
        };
        
        this.updateModifiedDate();
        return this.stats;
    }
    
    calculatePassRate(testCases) {
        const executedTests = testCases.filter(tc => tc.currentStatus !== 'Not_Executed');
        if (executedTests.length === 0) return 0;
        
        const passedTests = executedTests.filter(tc => tc.currentStatus === 'Pass');
        return ((passedTests.length / executedTests.length) * 100).toFixed(1);
    }
    
    getLastExecutionDate(testCases) {
        let lastDate = null;
        testCases.forEach(tc => {
            if (tc.lastExecution && tc.lastExecution.date) {
                const execDate = new Date(tc.lastExecution.date);
                if (!lastDate || execDate > lastDate) {
                    lastDate = execDate;
                }
            }
        });
        return lastDate ? lastDate.toISOString() : null;
    }
    
    // Requirement-Test Case Linking
    addTestCaseRequirementLink(testCaseId, requirementId) {
        if (!this.requirementLinks) {
            this.requirementLinks = {};
        }
        
        if (!this.requirementLinks[requirementId]) {
            this.requirementLinks[requirementId] = [];
        }
        
        if (!this.requirementLinks[requirementId].includes(testCaseId)) {
            this.requirementLinks[requirementId].push(testCaseId);
        }
    }
    
    getTestCasesForRequirement(requirementId) {
        return this.requirementLinks && this.requirementLinks[requirementId] ? 
               this.requirementLinks[requirementId] : [];
    }
    
    getRequirementsForTestCase(testCaseId) {
        if (!this.requirementLinks) return [];
        
        const requirements = [];
        Object.keys(this.requirementLinks).forEach(reqId => {
            if (this.requirementLinks[reqId].includes(testCaseId)) {
                requirements.push(reqId);
            }
        });
        return requirements;
    }
    
    // Project Health Assessment
    getProjectHealth() {
        const stats = this.stats;
        let health = 'Good';
        let issues = [];
        
        // Check test coverage
        if (stats.testCoverage < 70) {
            health = 'Warning';
            issues.push('Low test coverage');
        }
        
        // Check pass rate
        if (stats.passRate < 80) {
            health = 'Warning';
            issues.push('Low pass rate');
        }
        
        // Check blocked tests
        if (stats.blockedTests > 0) {
            health = 'Warning';
            issues.push(`${stats.blockedTests} blocked tests`);
        }
        
        // Check recent execution
        if (stats.lastExecution) {
            const daysSinceExecution = (Date.now() - new Date(stats.lastExecution)) / (1000 * 60 * 60 * 24);
            if (daysSinceExecution > 7) {
                health = 'Warning';
                issues.push('Tests not executed recently');
            }
        }
        
        if (issues.length > 2) {
            health = 'Critical';
        }
        
        return {
            status: health,
            issues: issues,
            score: this.calculateHealthScore()
        };
    }
    
    calculateHealthScore() {
        let score = 100;
        
        // Test coverage impact (30%)
        score -= (100 - parseFloat(this.stats.testCoverage)) * 0.3;
        
        // Pass rate impact (40%)
        score -= (100 - parseFloat(this.stats.passRate)) * 0.4;
        
        // Blocked tests impact (20%)
        if (this.stats.totalTestCases > 0) {
            const blockedPercentage = (this.stats.blockedTests / this.stats.totalTestCases) * 100;
            score -= blockedPercentage * 0.2;
        }
        
        // Recent execution impact (10%)
        if (this.stats.lastExecution) {
            const daysSinceExecution = (Date.now() - new Date(this.stats.lastExecution)) / (1000 * 60 * 60 * 24);
            if (daysSinceExecution > 7) {
                score -= Math.min(daysSinceExecution * 2, 20); // Max 20 point deduction
            }
        } else {
            score -= 10; // No execution history
        }
        
        return Math.max(0, Math.round(score));
    }
    
    updateModifiedDate() {
        this.lastModified = new Date().toISOString();
    }
    
    // Export project data
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            status: this.status,
            priority: this.priority,
            version: this.version,
            environment: this.environment,
            platform: this.platform,
            technology: this.technology,
            projectManager: this.projectManager,
            qaLead: this.qaLead,
            teamMembers: this.teamMembers,
            requirements: this.requirements,
            testCases: this.testCases,
            testSets: this.testSets,
            requirementLinks: this.requirementLinks,
            createdBy: this.createdBy,
            createdDate: this.createdDate,
            lastModified: this.lastModified,
            stats: this.stats,
            jiraProject: this.jiraProject,
            jiraComponents: this.jiraComponents
        };
    }
    
    // Export for reporting
    toCSV() {
        return {
            'Project ID': this.id,
            'Name': this.name,
            'Category': this.category,
            'Status': this.status,
            'Priority': this.priority,
            'Version': this.version,
            'Platform': this.platform,
            'QA Lead': this.qaLead,
            'Team Size': this.teamMembers.length,
            'Requirements': this.requirements.length,
            'Test Cases': this.testCases.length,
            'Test Coverage': `${this.stats.testCoverage}%`,
            'Pass Rate': `${this.stats.passRate}%`,
            'Health Score': this.calculateHealthScore(),
            'Created': this.createdDate,
            'Last Modified': this.lastModified
        };
    }
}

module.exports = Project;