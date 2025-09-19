const axios = require('axios');
const fs = require('fs');
const path = require('path');

class JiraService {
    constructor(options = {}) {
        this.configFile = options.configFile || './data/config/jira-config.json';
        this.config = this.loadConfig();
        this.client = null;
        
        if (this.config && this.config.baseUrl) {
            this.initializeClient();
        }
    }
    
    loadConfig() {
        try {
            if (fs.existsSync(this.configFile)) {
                return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
            }
        } catch (error) {
            console.warn(`Failed to load Jira config: ${error.message}`);
        }
        return null;
    }
    
    saveConfig(config) {
        try {
            const configDir = path.dirname(this.configFile);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
            this.config = config;
            this.initializeClient();
        } catch (error) {
            throw new Error(`Failed to save Jira config: ${error.message}`);
        }
    }
    
    initializeClient() {
        if (!this.config || !this.config.baseUrl) {
            throw new Error('Jira configuration not found');
        }
        
        const auth = this.config.auth;
        let authHeaders = {};
        
        if (auth.type === 'api_token') {
            authHeaders = {
                'Authorization': `Basic ${Buffer.from(`${auth.email}:${auth.token}`).toString('base64')}`
            };
        } else if (auth.type === 'bearer') {
            authHeaders = {
                'Authorization': `Bearer ${auth.token}`
            };
        }
        
        this.client = axios.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...authHeaders
            },
            timeout: 30000
        });
    }
    
    // Setup and Configuration
    async setupJira(config) {
        const jiraConfig = {
            baseUrl: config.url,
            projectKey: config.project,
            auth: {
                type: config.token ? 'api_token' : 'basic',
                email: config.email,
                token: config.token
            },
            mappings: {
                defectIssueType: config.defectIssueType || 'Bug',
                testExecutionIssueType: config.testExecutionIssueType || 'Test Execution',
                priorities: {
                    'Critical': 'Highest',
                    'High': 'High',
                    'Medium': 'Medium',
                    'Low': 'Low'
                },
                statuses: {
                    'Open': 'To Do',
                    'In Progress': 'In Progress',
                    'Resolved': 'Done',
                    'Closed': 'Done'
                }
            }
        };
        
        // Test connection
        try {
            await this.testConnection(jiraConfig);
            this.saveConfig(jiraConfig);
            return { success: true, message: 'Jira integration configured successfully' };
        } catch (error) {
            throw new Error(`Jira setup failed: ${error.message}`);
        }
    }
    
    async testConnection(config = null) {
        const testConfig = config || this.config;
        if (!testConfig) {
            throw new Error('No Jira configuration available');
        }
        
        // Create temporary client for testing
        const tempClient = axios.create({
            baseURL: testConfig.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${testConfig.auth.email}:${testConfig.auth.token}`).toString('base64')}`
            }
        });
        
        try {
            const response = await tempClient.get('/rest/api/2/myself');
            return { success: true, user: response.data };
        } catch (error) {
            if (error.response) {
                throw new Error(`Jira connection failed: ${error.response.status} - ${error.response.statusText}`);
            } else {
                throw new Error(`Jira connection failed: ${error.message}`);
            }
        }
    }
    
    // Issue Management
    async getIssue(issueKey) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        try {
            const response = await this.client.get(`/rest/api/2/issue/${issueKey}`);
            return this.formatIssue(response.data);
        } catch (error) {
            throw new Error(`Failed to get issue ${issueKey}: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }
    
    async createDefect(testCaseId, defectData) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        const issueData = {
            fields: {
                project: {
                    key: this.config.projectKey
                },
                summary: defectData.title || `Defect found in ${testCaseId}`,
                description: this.formatDefectDescription(testCaseId, defectData),
                issuetype: {
                    name: this.config.mappings.defectIssueType
                },
                priority: {
                    name: this.mapPriority(defectData.severity || 'Medium')
                },
                labels: [
                    'test-case-manager',
                    'automated-defect',
                    `test-case-${testCaseId}`
                ]
            }
        };
        
        // Add assignee if provided
        if (defectData.assignee) {
            issueData.fields.assignee = { name: defectData.assignee };
        }
        
        // Add custom fields if configured
        if (this.config.customFields) {
            Object.keys(this.config.customFields).forEach(customField => {
                issueData.fields[customField] = this.config.customFields[customField];
            });
        }
        
        try {
            const response = await this.client.post('/rest/api/2/issue', issueData);
            
            const createdIssue = {
                key: response.data.key,
                id: response.data.id,
                url: `${this.config.baseUrl}/browse/${response.data.key}`,
                created: new Date().toISOString()
            };
            
            // Add test case link as comment
            await this.addComment(response.data.key, `This defect was found during execution of test case: ${testCaseId}`);
            
            return createdIssue;
        } catch (error) {
            throw new Error(`Failed to create defect: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }
    
    async linkTestCase(testCaseId, jiraTicket, linkType = 'tests') {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        try {
            // Verify issue exists
            await this.getIssue(jiraTicket);
            
            // Add comment to link test case
            const comment = `Test Case ${testCaseId} has been linked to this issue.`;
            await this.addComment(jiraTicket, comment);
            
            return {
                success: true,
                testCaseId,
                jiraTicket,
                linkType,
                linked: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to link test case: ${error.message}`);
        }
    }
    
    async blockTestCase(testCaseId, jiraTicket, reason) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        try {
            // Get issue details
            const issue = await this.getIssue(jiraTicket);
            
            // Add blocking comment
            const comment = `Test Case ${testCaseId} is blocked by this issue. Reason: ${reason}`;
            await this.addComment(jiraTicket, comment);
            
            return {
                success: true,
                testCaseId,
                blockingTicket: jiraTicket,
                reason,
                issueStatus: issue.status,
                blocked: new Date().toISOString(),
                estimatedResolution: this.estimateResolution(issue)
            };
        } catch (error) {
            throw new Error(`Failed to block test case: ${error.message}`);
        }
    }
    
    async unblockTestCase(testCaseId, jiraTicket, resolution) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        try {
            const comment = `Test Case ${testCaseId} is no longer blocked. Resolution: ${resolution}`;
            await this.addComment(jiraTicket, comment);
            
            return {
                success: true,
                testCaseId,
                jiraTicket,
                resolution,
                unblocked: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to unblock test case: ${error.message}`);
        }
    }
    
    async addComment(issueKey, comment) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        const commentData = {
            body: comment
        };
        
        try {
            const response = await this.client.post(`/rest/api/2/issue/${issueKey}/comment`, commentData);
            return response.data;
        } catch (error) {
            throw new Error(`Failed to add comment: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }
    
    async updateTestExecution(testCaseId, executionData) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        // Find or create test execution issue
        try {
            const executionIssue = await this.findOrCreateTestExecution(testCaseId, executionData);
            
            // Update execution status
            const comment = this.formatExecutionComment(executionData);
            await this.addComment(executionIssue.key, comment);
            
            return executionIssue;
        } catch (error) {
            throw new Error(`Failed to update test execution: ${error.message}`);
        }
    }
    
    // Search and Query
    async searchIssues(jql, options = {}) {
        if (!this.client) {
            throw new Error('Jira client not initialized. Run setup first.');
        }
        
        const searchParams = {
            jql,
            startAt: options.startAt || 0,
            maxResults: options.maxResults || 50,
            fields: options.fields || ['summary', 'status', 'assignee', 'priority', 'created', 'updated']
        };
        
        try {
            const response = await this.client.post('/rest/api/2/search', searchParams);
            return {
                issues: response.data.issues.map(issue => this.formatIssue(issue)),
                total: response.data.total,
                startAt: response.data.startAt,
                maxResults: response.data.maxResults
            };
        } catch (error) {
            throw new Error(`Search failed: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }
    
    async getBlockingIssues(testCaseIds) {
        const jql = `labels in (${testCaseIds.map(id => `"test-case-${id}"`).join(', ')}) AND status != Done`;
        return await this.searchIssues(jql);
    }
    
    async getTestCaseDefects(testCaseId) {
        const jql = `labels = "test-case-${testCaseId}" AND issuetype = "${this.config.mappings.defectIssueType}"`;
        return await this.searchIssues(jql);
    }
    
    // Synchronization
    async syncTestCaseStatus(testCaseId, executionHistory) {
        if (!this.client) {
            return { success: false, message: 'Jira client not initialized' };
        }
        
        try {
            // Get related issues
            const defects = await this.getTestCaseDefects(testCaseId);
            const blocking = await this.getBlockingIssues([testCaseId]);
            
            // Update comments with latest execution
            const latestExecution = executionHistory[executionHistory.length - 1];
            if (latestExecution) {
                // Update defects with execution info
                for (const defect of defects.issues) {
                    const comment = `Latest execution: ${latestExecution.status} on ${latestExecution.date} by ${latestExecution.tester}`;
                    await this.addComment(defect.key, comment);
                }
            }
            
            return {
                success: true,
                updated: {
                    defects: defects.issues.length,
                    blocking: blocking.issues.length
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Helper Methods
    formatIssue(issueData) {
        return {
            key: issueData.key,
            id: issueData.id,
            summary: issueData.fields.summary,
            status: issueData.fields.status.name,
            assignee: issueData.fields.assignee?.displayName || 'Unassigned',
            priority: issueData.fields.priority?.name || 'Medium',
            issueType: issueData.fields.issuetype.name,
            created: issueData.fields.created,
            updated: issueData.fields.updated,
            url: `${this.config.baseUrl}/browse/${issueData.key}`
        };
    }
    
    formatDefectDescription(testCaseId, defectData) {
        let description = `*Defect found during test execution*\n\n`;
        description += `*Test Case:* ${testCaseId}\n`;
        description += `*Severity:* ${defectData.severity || 'Medium'}\n`;
        
        if (defectData.environment) {
            description += `*Environment:* ${defectData.environment}\n`;
        }
        
        if (defectData.tester) {
            description += `*Found by:* ${defectData.tester}\n`;
        }
        
        description += `\n*Description:*\n${defectData.description || 'No description provided'}\n`;
        
        if (defectData.stepsToReproduce) {
            description += `\n*Steps to Reproduce:*\n${defectData.stepsToReproduce}\n`;
        }
        
        if (defectData.expectedResult) {
            description += `\n*Expected Result:*\n${defectData.expectedResult}\n`;
        }
        
        if (defectData.actualResult) {
            description += `\n*Actual Result:*\n${defectData.actualResult}\n`;
        }
        
        return description;
    }
    
    formatExecutionComment(executionData) {
        let comment = `*Test Execution Update*\n\n`;
        comment += `*Status:* ${executionData.status}\n`;
        comment += `*Executed by:* ${executionData.tester}\n`;
        comment += `*Environment:* ${executionData.environment}\n`;
        comment += `*Date:* ${executionData.date || new Date().toISOString()}\n`;
        
        if (executionData.duration) {
            comment += `*Duration:* ${executionData.duration}\n`;
        }
        
        if (executionData.notes) {
            comment += `\n*Notes:*\n${executionData.notes}`;
        }
        
        return comment;
    }
    
    mapPriority(testPriority) {
        return this.config.mappings.priorities[testPriority] || testPriority;
    }
    
    estimateResolution(issue) {
        // Simple estimation based on issue type and priority
        const priorityDays = {
            'Highest': 1,
            'High': 2,
            'Medium': 5,
            'Low': 10
        };
        
        const days = priorityDays[issue.priority] || 5;
        const resolutionDate = new Date();
        resolutionDate.setDate(resolutionDate.getDate() + days);
        
        return resolutionDate.toISOString();
    }
    
    async findOrCreateTestExecution(testCaseId, executionData) {
        // Search for existing test execution
        const jql = `labels = "test-case-${testCaseId}" AND issuetype = "${this.config.mappings.testExecutionIssueType}"`;
        const existing = await this.searchIssues(jql, { maxResults: 1 });
        
        if (existing.issues.length > 0) {
            return existing.issues[0];
        }
        
        // Create new test execution issue
        const issueData = {
            fields: {
                project: { key: this.config.projectKey },
                summary: `Test Execution: ${testCaseId}`,
                description: `Automated test execution tracking for test case ${testCaseId}`,
                issuetype: { name: this.config.mappings.testExecutionIssueType },
                labels: [`test-case-${testCaseId}`, 'test-execution', 'automated']
            }
        };
        
        const response = await this.client.post('/rest/api/2/issue', issueData);
        return {
            key: response.data.key,
            id: response.data.id,
            url: `${this.config.baseUrl}/browse/${response.data.key}`
        };
    }
}

module.exports = JiraService;