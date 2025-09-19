// Requirement Data Model for Requirement-Based Test Case Generation
class Requirement {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.type = data.type || 'Functional'; // Functional, Non-Functional, Security, Performance, etc.
        this.priority = data.priority || 'Medium'; // Critical, High, Medium, Low
        this.status = data.status || 'Draft'; // Draft, Approved, In Development, Testing, Done
        
        // Requirement details
        this.acceptanceCriteria = data.acceptanceCriteria || [];
        this.businessValue = data.businessValue || '';
        this.userStory = data.userStory || '';
        this.epic = data.epic || '';
        this.feature = data.feature || '';
        
        // Technical details
        this.components = data.components || []; // UI components, APIs, etc.
        this.dependencies = data.dependencies || [];
        this.riskLevel = data.riskLevel || 'Low'; // Low, Medium, High, Critical
        
        // Project and team
        this.projectId = data.projectId || '';
        this.assignedTo = data.assignedTo || '';
        this.stakeholders = data.stakeholders || [];
        
        // Traceability
        this.parentRequirement = data.parentRequirement || '';
        this.childRequirements = data.childRequirements || [];
        this.relatedRequirements = data.relatedRequirements || [];
        
        // Test information
        this.testCases = data.testCases || []; // Generated/linked test cases
        this.testStrategy = data.testStrategy || ''; // How this should be tested
        this.testPriority = data.testPriority || 'Medium';
        this.estimatedTestEffort = data.estimatedTestEffort || '';
        
        // Document sources
        this.sourceDocuments = data.sourceDocuments || []; // PRDs, specs, designs
        this.figmaLinks = data.figmaLinks || [];
        
        // Metadata
        this.createdBy = data.createdBy || '';
        this.createdDate = data.createdDate || new Date().toISOString();
        this.lastModified = data.lastModified || new Date().toISOString();
        this.version = data.version || '1.0';
        
        // Jira integration
        this.jiraTicket = data.jiraTicket || '';
        this.jiraLabels = data.jiraLabels || [];
        
        // AI generation metadata
        this.generatedFrom = data.generatedFrom || ''; // Document, Figma, Manual
        this.generationConfidence = data.generationConfidence || 0; // 0-100
        this.reviewRequired = data.reviewRequired || true;
    }
    
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `REQ${timestamp}${random}`.toUpperCase();
    }
    
    // Acceptance Criteria Management
    addAcceptanceCriteria(criteria) {
        this.acceptanceCriteria.push({
            id: this.generateCriteriaId(),
            description: criteria.description,
            type: criteria.type || 'Given-When-Then', // Given-When-Then, Checklist, Scenario
            priority: criteria.priority || 'Must Have',
            testable: criteria.testable !== false,
            createdDate: new Date().toISOString()
        });
        this.updateModifiedDate();
    }
    
    removeAcceptanceCriteria(criteriaId) {
        this.acceptanceCriteria = this.acceptanceCriteria.filter(ac => ac.id !== criteriaId);
        this.updateModifiedDate();
    }
    
    generateCriteriaId() {
        return `AC${Date.now().toString(36)}`.toUpperCase();
    }
    
    // Test Case Generation
    generateTestCaseTemplates() {
        const templates = [];
        
        // Generate test cases from acceptance criteria
        this.acceptanceCriteria.forEach((criteria, index) => {
            if (criteria.testable) {
                templates.push({
                    title: `Test ${this.title} - ${criteria.description}`,
                    description: `Verify requirement: ${this.title}`,
                    category: this.getTestCategory(),
                    priority: this.mapPriorityToTest(criteria.priority),
                    type: 'Manual',
                    requirementId: this.id,
                    acceptanceCriteriaId: criteria.id,
                    steps: this.generateTestStepsFromCriteria(criteria),
                    expectedResult: criteria.description,
                    riskLevel: this.riskLevel,
                    estimatedTime: this.estimateTestTime(criteria),
                    tags: this.generateTestTags()
                });
            }
        });
        
        // Generate additional test cases based on requirement type
        templates.push(...this.generateTypeSpecificTests());
        
        return templates;
    }
    
    getTestCategory() {
        const categoryMap = {
            'Functional': 'Functional',
            'Non-Functional': 'Performance',
            'Security': 'Security',
            'Performance': 'Performance',
            'Usability': 'UI/UX',
            'Compatibility': 'Compatibility',
            'API': 'API'
        };
        return categoryMap[this.type] || 'Functional';
    }
    
    mapPriorityToTest(acceptancePriority) {
        const priorityMap = {
            'Must Have': 'Critical',
            'Should Have': 'High',
            'Could Have': 'Medium',
            'Won\'t Have': 'Low'
        };
        return priorityMap[acceptancePriority] || this.priority;
    }
    
    generateTestStepsFromCriteria(criteria) {
        const steps = [];
        
        if (criteria.type === 'Given-When-Then') {
            // Parse Given-When-Then format
            const parts = criteria.description.split(/(?:Given|When|Then|And)/i);
            parts.forEach((part, index) => {
                if (part.trim()) {
                    steps.push({
                        stepNumber: index + 1,
                        action: part.trim(),
                        expected: index === parts.length - 1 ? part.trim() : '',
                        actualResult: '',
                        status: ''
                    });
                }
            });
        } else {
            // Default steps
            steps.push({
                stepNumber: 1,
                action: `Navigate to the feature implementing: ${this.title}`,
                expected: 'Feature is accessible',
                actualResult: '',
                status: ''
            });
            
            steps.push({
                stepNumber: 2,
                action: `Execute the scenario: ${criteria.description}`,
                expected: criteria.description,
                actualResult: '',
                status: ''
            });
        }
        
        return steps;
    }
    
    estimateTestTime(criteria) {
        // Simple estimation based on complexity
        const baseTime = 5; // 5 minutes base
        let multiplier = 1;
        
        if (this.type === 'Performance') multiplier = 2;
        if (this.type === 'Security') multiplier = 1.5;
        if (this.riskLevel === 'High') multiplier *= 1.5;
        if (this.riskLevel === 'Critical') multiplier *= 2;
        
        return `${Math.round(baseTime * multiplier)} minutes`;
    }
    
    generateTestTags() {
        const tags = [this.type.toLowerCase(), `risk-${this.riskLevel.toLowerCase()}`];
        
        if (this.epic) tags.push(`epic-${this.epic.toLowerCase().replace(/\s+/g, '-')}`);
        if (this.feature) tags.push(`feature-${this.feature.toLowerCase().replace(/\s+/g, '-')}`);
        if (this.jiraTicket) tags.push(`jira-${this.jiraTicket}`);
        
        return tags;
    }
    
    generateTypeSpecificTests() {
        const templates = [];
        
        switch (this.type) {
            case 'Security':
                templates.push(...this.generateSecurityTests());
                break;
            case 'Performance':
                templates.push(...this.generatePerformanceTests());
                break;
            case 'API':
                templates.push(...this.generateAPITests());
                break;
            case 'UI/UX':
                templates.push(...this.generateUITests());
                break;
        }
        
        return templates;
    }
    
    generateSecurityTests() {
        return [
            {
                title: `Security Test - Authentication for ${this.title}`,
                category: 'Security',
                priority: 'Critical',
                description: 'Verify authentication and authorization requirements',
                requirementId: this.id
            },
            {
                title: `Security Test - Input Validation for ${this.title}`,
                category: 'Security', 
                priority: 'High',
                description: 'Verify input validation and injection prevention',
                requirementId: this.id
            }
        ];
    }
    
    generatePerformanceTests() {
        return [
            {
                title: `Performance Test - Load Testing for ${this.title}`,
                category: 'Performance',
                priority: 'High',
                description: 'Verify performance under expected load',
                requirementId: this.id
            },
            {
                title: `Performance Test - Response Time for ${this.title}`,
                category: 'Performance',
                priority: 'Medium',
                description: 'Verify response time requirements',
                requirementId: this.id
            }
        ];
    }
    
    generateAPITests() {
        return [
            {
                title: `API Test - Endpoint Validation for ${this.title}`,
                category: 'API',
                priority: 'Critical',
                description: 'Verify API endpoint functionality and data validation',
                requirementId: this.id
            },
            {
                title: `API Test - Error Handling for ${this.title}`,
                category: 'API',
                priority: 'High',
                description: 'Verify proper error responses and handling',
                requirementId: this.id
            }
        ];
    }
    
    generateUITests() {
        return [
            {
                title: `UI Test - User Interface for ${this.title}`,
                category: 'UI/UX',
                priority: 'High',
                description: 'Verify user interface elements and interactions',
                requirementId: this.id
            },
            {
                title: `UI Test - Responsive Design for ${this.title}`,
                category: 'UI/UX',
                priority: 'Medium',
                description: 'Verify responsive design across devices',
                requirementId: this.id
            }
        ];
    }
    
    // Test Coverage Analysis
    getTestCoverage(testCaseManager) {
        const linkedTestCases = this.testCases.map(id => testCaseManager.getTestCase(id)).filter(tc => tc);
        const totalCriteria = this.acceptanceCriteria.filter(ac => ac.testable).length;
        
        if (totalCriteria === 0) return 100; // No testable criteria
        
        const coveredCriteria = new Set();
        linkedTestCases.forEach(tc => {
            if (tc.acceptanceCriteriaId) {
                coveredCriteria.add(tc.acceptanceCriteriaId);
            }
        });
        
        return totalCriteria > 0 ? ((coveredCriteria.size / totalCriteria) * 100).toFixed(1) : 0;
    }
    
    // Requirement Status Management
    updateStatus(newStatus, updatedBy = '') {
        const validStatuses = ['Draft', 'Review', 'Approved', 'In Development', 'Testing', 'Done', 'Rejected'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
            this.lastModified = new Date().toISOString();
            
            // Add status history
            if (!this.statusHistory) this.statusHistory = [];
            this.statusHistory.push({
                status: newStatus,
                updatedBy,
                updatedDate: new Date().toISOString()
            });
        }
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
    
    // Export methods
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            type: this.type,
            priority: this.priority,
            status: this.status,
            acceptanceCriteria: this.acceptanceCriteria,
            businessValue: this.businessValue,
            userStory: this.userStory,
            epic: this.epic,
            feature: this.feature,
            components: this.components,
            dependencies: this.dependencies,
            riskLevel: this.riskLevel,
            projectId: this.projectId,
            assignedTo: this.assignedTo,
            stakeholders: this.stakeholders,
            parentRequirement: this.parentRequirement,
            childRequirements: this.childRequirements,
            relatedRequirements: this.relatedRequirements,
            testCases: this.testCases,
            testStrategy: this.testStrategy,
            testPriority: this.testPriority,
            estimatedTestEffort: this.estimatedTestEffort,
            sourceDocuments: this.sourceDocuments,
            figmaLinks: this.figmaLinks,
            createdBy: this.createdBy,
            createdDate: this.createdDate,
            lastModified: this.lastModified,
            version: this.version,
            jiraTicket: this.jiraTicket,
            jiraLabels: this.jiraLabels,
            generatedFrom: this.generatedFrom,
            generationConfidence: this.generationConfidence,
            reviewRequired: this.reviewRequired,
            statusHistory: this.statusHistory
        };
    }
    
    toCSV() {
        return {
            'Requirement ID': this.id,
            'Title': this.title,
            'Type': this.type,
            'Priority': this.priority,
            'Status': this.status,
            'Risk Level': this.riskLevel,
            'Project': this.projectId,
            'Epic': this.epic,
            'Feature': this.feature,
            'Acceptance Criteria Count': this.acceptanceCriteria.length,
            'Linked Test Cases': this.testCases.length,
            'Test Coverage': `${this.getTestCoverage()}%`,
            'Jira Ticket': this.jiraTicket,
            'Created By': this.createdBy,
            'Created Date': this.createdDate,
            'Last Modified': this.lastModified
        };
    }
}

module.exports = Requirement;