const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const Requirement = require('../models/Requirement');
const TestCase = require('../models/TestCase');

class ProjectManager {
    constructor(testCaseManager) {
        this.testCaseManager = testCaseManager;
        this.dataDir = testCaseManager.dataDir || './data';
        this.projectsDir = path.join(this.dataDir, 'projects');
        this.requirementsDir = path.join(this.dataDir, 'requirements');
        
        this.projects = new Map();
        this.requirements = new Map();
        
        this.initializeDirectories();
        this.loadExistingData();
    }
    
    initializeDirectories() {
        [this.projectsDir, this.requirementsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadExistingData() {
        try {
            // Load projects
            if (fs.existsSync(this.projectsDir)) {
                const files = fs.readdirSync(this.projectsDir);
                files.filter(file => file.endsWith('.json')).forEach(file => {
                    try {
                        const filePath = path.join(this.projectsDir, file);
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const project = new Project(data);
                        this.projects.set(project.id, project);
                    } catch (error) {
                        console.warn(`Failed to load project from ${file}: ${error.message}`);
                    }
                });
            }
            
            // Load requirements
            if (fs.existsSync(this.requirementsDir)) {
                const files = fs.readdirSync(this.requirementsDir);
                files.filter(file => file.endsWith('.json')).forEach(file => {
                    try {
                        const filePath = path.join(this.requirementsDir, file);
                        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        const requirement = new Requirement(data);
                        this.requirements.set(requirement.id, requirement);
                    } catch (error) {
                        console.warn(`Failed to load requirement from ${file}: ${error.message}`);
                    }
                });
            }
            
            console.log(`Loaded ${this.projects.size} projects and ${this.requirements.size} requirements`);
        } catch (error) {
            console.error(`Failed to load project data: ${error.message}`);
        }
    }
    
    // Project Management
    createProject(projectData) {
        const project = new Project(projectData);
        this.projects.set(project.id, project);
        this.saveProject(project);
        return project;
    }
    
    getProject(id) {
        return this.projects.get(id);
    }
    
    getAllProjects() {
        return Array.from(this.projects.values());
    }
    
    updateProject(id, updates) {
        const project = this.projects.get(id);
        if (!project) {
            throw new Error(`Project ${id} not found`);
        }
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                project[key] = updates[key];
            }
        });
        
        project.updateModifiedDate();
        this.saveProject(project);
        return project;
    }
    
    deleteProject(id) {
        const project = this.projects.get(id);
        if (!project) {
            throw new Error(`Project ${id} not found`);
        }
        
        // Clean up related data
        project.requirements.forEach(reqId => {
            this.deleteRequirement(reqId);
        });
        
        // Delete file
        const filePath = path.join(this.projectsDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        this.projects.delete(id);
        return true;
    }
    
    saveProject(project) {
        const filePath = path.join(this.projectsDir, `${project.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(project.toJSON(), null, 2));
    }
    
    // Requirement Management
    createRequirement(requirementData) {
        const requirement = new Requirement(requirementData);
        this.requirements.set(requirement.id, requirement);
        
        // Link to project if specified
        if (requirement.projectId) {
            const project = this.getProject(requirement.projectId);
            if (project) {
                project.addRequirement(requirement.id);
                this.saveProject(project);
            }
        }
        
        this.saveRequirement(requirement);
        return requirement;
    }
    
    getRequirement(id) {
        return this.requirements.get(id);
    }
    
    getAllRequirements() {
        return Array.from(this.requirements.values());
    }
    
    getRequirementsByProject(projectId) {
        return Array.from(this.requirements.values()).filter(req => req.projectId === projectId);
    }
    
    updateRequirement(id, updates) {
        const requirement = this.requirements.get(id);
        if (!requirement) {
            throw new Error(`Requirement ${id} not found`);
        }
        
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) {
                requirement[key] = updates[key];
            }
        });
        
        requirement.updateModifiedDate();
        this.saveRequirement(requirement);
        return requirement;
    }
    
    deleteRequirement(id) {
        const requirement = this.requirements.get(id);
        if (!requirement) {
            throw new Error(`Requirement ${id} not found`);
        }
        
        // Remove from project
        if (requirement.projectId) {
            const project = this.getProject(requirement.projectId);
            if (project) {
                project.removeRequirement(id);
                this.saveProject(project);
            }
        }
        
        // Delete file
        const filePath = path.join(this.requirementsDir, `${id}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        this.requirements.delete(id);
        return true;
    }
    
    saveRequirement(requirement) {
        const filePath = path.join(this.requirementsDir, `${requirement.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(requirement.toJSON(), null, 2));
    }
    
    // ✨ MAIN WORKFLOW: Generate Test Cases from Requirements
    generateTestCasesFromRequirement(requirementId, options = {}) {
        const requirement = this.getRequirement(requirementId);
        if (!requirement) {
            throw new Error(`Requirement ${requirementId} not found`);
        }
        
        // Generate test case templates
        const templates = requirement.generateTestCaseTemplates();
        const generatedTestCases = [];
        
        templates.forEach(template => {
            // Create actual test case
            const testCaseData = {
                ...template,
                linkedRequirements: [requirementId],
                generatedFrom: 'requirement',
                projectId: requirement.projectId,
                createdBy: options.createdBy || 'system'
            };
            
            const testCase = this.testCaseManager.createTestCase(testCaseData);
            generatedTestCases.push(testCase);
            
            // Link back to requirement
            requirement.testCases.push(testCase.id);
        });
        
        // Update requirement
        this.saveRequirement(requirement);
        
        // Add test cases to project
        if (requirement.projectId) {
            const project = this.getProject(requirement.projectId);
            if (project) {
                generatedTestCases.forEach(tc => {
                    project.addTestCase(tc.id, [requirementId]);
                });
                this.saveProject(project);
            }
        }
        
        return {
            requirement: requirement,
            generatedTestCases: generatedTestCases,
            summary: {
                requirementId: requirementId,
                totalGenerated: generatedTestCases.length,
                categories: this.groupBy(generatedTestCases, 'category'),
                priorities: this.groupBy(generatedTestCases, 'priority')
            }
        };
    }
    
    // Generate test cases for entire project
    generateTestCasesForProject(projectId, options = {}) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const results = [];
        const projectRequirements = this.getRequirementsByProject(projectId);
        
        projectRequirements.forEach(requirement => {
            try {
                const result = this.generateTestCasesFromRequirement(requirement.id, options);
                results.push(result);
            } catch (error) {
                console.warn(`Failed to generate tests for requirement ${requirement.id}: ${error.message}`);
            }
        });
        
        // Update project statistics
        project.updateStatistics(this.testCaseManager);
        this.saveProject(project);
        
        return {
            project: project,
            results: results,
            summary: {
                totalRequirements: projectRequirements.length,
                processedRequirements: results.length,
                totalTestCases: results.reduce((sum, r) => sum + r.generatedTestCases.length, 0),
                coverage: project.stats.testCoverage
            }
        };
    }
    
    // QA Test Result Management
    updateTestResult(testCaseId, executionData, options = {}) {
        // Use existing test case manager for execution
        const executionId = this.testCaseManager.executeTest(testCaseId, executionData);
        
        // Update project statistics
        const testCase = this.testCaseManager.getTestCase(testCaseId);
        if (testCase && testCase.projectId) {
            const project = this.getProject(testCase.projectId);
            if (project) {
                project.updateStatistics(this.testCaseManager);
                this.saveProject(project);
            }
        }
        
        // Update related requirements
        if (testCase && testCase.linkedRequirements) {
            testCase.linkedRequirements.forEach(reqId => {
                const requirement = this.getRequirement(reqId);
                if (requirement) {
                    // Could add requirement-level tracking here
                    this.saveRequirement(requirement);
                }
            });
        }
        
        return executionId;
    }
    
    // Project Health and Analytics
    getProjectDashboard(projectId) {
        const project = this.getProject(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        project.updateStatistics(this.testCaseManager);
        
        const requirements = this.getRequirementsByProject(projectId);
        const testCases = project.testCases.map(id => this.testCaseManager.getTestCase(id)).filter(tc => tc);
        
        return {
            project: {
                id: project.id,
                name: project.name,
                status: project.status,
                health: project.getProjectHealth(),
                stats: project.stats
            },
            requirements: {
                total: requirements.length,
                byStatus: this.groupBy(requirements, 'status'),
                byType: this.groupBy(requirements, 'type'),
                byPriority: this.groupBy(requirements, 'priority')
            },
            testCases: {
                total: testCases.length,
                byStatus: this.groupBy(testCases, 'currentStatus'),
                byCategory: this.groupBy(testCases, 'category'),
                byPriority: this.groupBy(testCases, 'priority')
            },
            team: {
                members: project.teamMembers.length,
                qaLead: project.qaLead,
                projectManager: project.projectManager
            }
        };
    }
    
    // Import requirements from documents
    async importRequirementsFromDocument(projectId, document, options = {}) {
        // This would integrate with AI to parse documents
        // For now, return a framework for future implementation
        return {
            projectId: projectId,
            document: document,
            extractedRequirements: [],
            generatedTestCases: [],
            message: 'Document analysis and requirement extraction - Feature ready for AI integration'
        };
    }
    
    // Search and filtering
    searchRequirements(query, filters = {}) {
        let requirements = this.getAllRequirements();
        
        if (query) {
            const lowerQuery = query.toLowerCase();
            requirements = requirements.filter(req =>
                req.title.toLowerCase().includes(lowerQuery) ||
                req.description.toLowerCase().includes(lowerQuery) ||
                req.userStory.toLowerCase().includes(lowerQuery)
            );
        }
        
        if (filters.projectId) {
            requirements = requirements.filter(req => req.projectId === filters.projectId);
        }
        
        if (filters.type) {
            requirements = requirements.filter(req => req.type === filters.type);
        }
        
        if (filters.status) {
            requirements = requirements.filter(req => req.status === filters.status);
        }
        
        if (filters.priority) {
            requirements = requirements.filter(req => req.priority === filters.priority);
        }
        
        return requirements;
    }
    
    searchProjects(query, filters = {}) {
        let projects = this.getAllProjects();
        
        if (query) {
            const lowerQuery = query.toLowerCase();
            projects = projects.filter(proj =>
                proj.name.toLowerCase().includes(lowerQuery) ||
                proj.description.toLowerCase().includes(lowerQuery)
            );
        }
        
        if (filters.status) {
            projects = projects.filter(proj => proj.status === filters.status);
        }
        
        if (filters.category) {
            projects = projects.filter(proj => proj.category === filters.category);
        }
        
        return projects;
    }
    
    // Utility methods
    groupBy(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            groups[key] = (groups[key] || 0) + 1;
            return groups;
        }, {});
    }
    
    // Report generation
    generateProjectReport(projectId) {
        const dashboard = this.getProjectDashboard(projectId);
        const project = this.getProject(projectId);
        
        return {
            reportDate: new Date().toISOString(),
            project: dashboard.project,
            summary: {
                requirementCoverage: `${dashboard.project.stats.testCoverage}%`,
                testExecution: `${dashboard.project.stats.passRate}%`,
                healthScore: dashboard.project.health.score,
                totalTestCases: dashboard.testCases.total,
                executedTests: dashboard.project.stats.executedTests
            },
            requirements: dashboard.requirements,
            testCases: dashboard.testCases,
            team: dashboard.team,
            recommendations: this.generateRecommendations(dashboard)
        };
    }
    
    generateRecommendations(dashboard) {
        const recommendations = [];
        
        if (parseFloat(dashboard.project.stats.testCoverage) < 80) {
            recommendations.push('Increase test coverage by adding more test cases for uncovered requirements');
        }
        
        if (parseFloat(dashboard.project.stats.passRate) < 90) {
            recommendations.push('Focus on fixing failing test cases to improve quality');
        }
        
        if (dashboard.project.stats.blockedTests > 0) {
            recommendations.push('Resolve blocked test cases to maintain testing velocity');
        }
        
        if (dashboard.requirements.byStatus['Draft'] > 0) {
            recommendations.push('Review and approve draft requirements to proceed with testing');
        }
        
        return recommendations;
    }
}

module.exports = ProjectManager;