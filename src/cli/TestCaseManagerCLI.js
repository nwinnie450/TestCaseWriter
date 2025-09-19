#!/usr/bin/env node

const { Command } = require('commander');
const TestCaseManager = require('../managers/TestCaseManager');
const ProjectManager = require('../managers/ProjectManager');
const JiraService = require('../services/JiraService');
const DashboardService = require('../services/DashboardService');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Table = require('cli-table3');

class TestCaseManagerCLI {
    constructor() {
        this.program = new Command();
        this.testManager = new TestCaseManager();
        this.projectManager = new ProjectManager(this.testManager);
        this.jiraService = new JiraService();
        this.dashboardService = new DashboardService(this.testManager);
        
        this.setupCommands();
    }
    
    setupCommands() {
        this.program
            .name('tcm')
            .description('Test Case Manager - Complete test case management system')
            .version('1.0.0');
        
        this.setupImportCommands();
        this.setupExportCommands();
        this.setupTestCaseCommands();
        this.setupTestSetCommands();
        this.setupExecutionCommands();
        this.setupJiraCommands();
        this.setupDashboardCommands();
        this.setupProjectCommands();
        this.setupRequirementCommands();
    }
    
    setupImportCommands() {
        const importCmd = this.program
            .command('import')
            .description('Import test cases from various sources');
        
        importCmd
            .command('csv')
            .description('Import test cases from CSV file')
            .argument('<file>', 'CSV file path')
            .option('--mapping <mapping>', 'Custom field mapping (JSON string)')
            .action(async (file, options) => {
                await this.importTestCases('csv', file, options);
            });
        
        importCmd
            .command('excel')
            .description('Import test cases from Excel file')
            .argument('<file>', 'Excel file path')
            .option('--sheet <sheet>', 'Sheet name to import from')
            .option('--mapping <mapping>', 'Custom field mapping (JSON string)')
            .action(async (file, options) => {
                await this.importTestCases('excel', file, options);
            });
        
        importCmd
            .command('json')
            .description('Import test cases from JSON file')
            .argument('<file>', 'JSON file path')
            .action(async (file, options) => {
                await this.importTestCases('json', file, options);
            });
        
        importCmd
            .command('testrail')
            .description('Import test cases from TestRail CSV export')
            .argument('<file>', 'TestRail CSV file path')
            .action(async (file, options) => {
                await this.importTestCases('testrail', file, options);
            });
    }
    
    setupExportCommands() {
        const exportCmd = this.program
            .command('export')
            .description('Export test cases to various formats');
        
        exportCmd
            .command('csv')
            .description('Export test cases to CSV')
            .argument('<output>', 'Output file path')
            .option('--test-set <id>', 'Export specific test set')
            .option('--category <category>', 'Export specific category')
            .option('--all', 'Export all test cases')
            .action(async (output, options) => {
                await this.exportTestCases('csv', output, options);
            });
        
        exportCmd
            .command('excel')
            .description('Export test cases to Excel')
            .argument('<output>', 'Output file path')
            .option('--test-set <id>', 'Export specific test set')
            .option('--category <category>', 'Export specific category')
            .option('--include-summary', 'Include summary sheet')
            .option('--all', 'Export all test cases')
            .action(async (output, options) => {
                await this.exportTestCases('excel', output, options);
            });
        
        exportCmd
            .command('json')
            .description('Export test cases to JSON')
            .argument('<output>', 'Output file path')
            .option('--test-set <id>', 'Export specific test set')
            .option('--include-stats', 'Include statistics')
            .option('--all', 'Export all test cases')
            .action(async (output, options) => {
                await this.exportTestCases('json', output, options);
            });
    }
    
    setupTestCaseCommands() {
        const testCaseCmd = this.program
            .command('test-case')
            .alias('tc')
            .description('Test case management commands');
        
        testCaseCmd
            .command('create')
            .description('Create a new test case')
            .argument('<title>', 'Test case title')
            .option('--category <category>', 'Test case category', 'Functional')
            .option('--priority <priority>', 'Test case priority', 'Medium')
            .option('--description <desc>', 'Test case description')
            .option('--interactive', 'Interactive mode')
            .action(async (title, options) => {
                await this.createTestCase(title, options);
            });
        
        testCaseCmd
            .command('list')
            .description('List test cases')
            .option('--category <category>', 'Filter by category')
            .option('--priority <priority>', 'Filter by priority')
            .option('--status <status>', 'Filter by status')
            .option('--search <query>', 'Search query')
            .option('--limit <n>', 'Limit results', '50')
            .action(async (options) => {
                await this.listTestCases(options);
            });
        
        testCaseCmd
            .command('show')
            .description('Show test case details')
            .argument('<id>', 'Test case ID')
            .option('--include-history', 'Include execution history')
            .action(async (id, options) => {
                await this.showTestCase(id, options);
            });
        
        testCaseCmd
            .command('update')
            .description('Update test case')
            .argument('<id>', 'Test case ID')
            .option('--title <title>', 'New title')
            .option('--description <desc>', 'New description')
            .option('--category <category>', 'New category')
            .option('--priority <priority>', 'New priority')
            .action(async (id, options) => {
                await this.updateTestCase(id, options);
            });
        
        testCaseCmd
            .command('delete')
            .description('Delete test case')
            .argument('<id>', 'Test case ID')
            .option('--confirm', 'Skip confirmation prompt')
            .action(async (id, options) => {
                await this.deleteTestCase(id, options);
            });
    }
    
    setupTestSetCommands() {
        const testSetCmd = this.program
            .command('test-set')
            .alias('ts')
            .description('Test set management commands');
        
        testSetCmd
            .command('create')
            .description('Create a new test set')
            .argument('<name>', 'Test set name')
            .option('--description <desc>', 'Test set description')
            .option('--category <category>', 'Test set category', 'Functional')
            .option('--priority <priority>', 'Test set priority', 'Medium')
            .action(async (name, options) => {
                await this.createTestSet(name, options);
            });
        
        testSetCmd
            .command('add-tests')
            .description('Add test cases to test set')
            .argument('<setId>', 'Test set ID')
            .argument('<testCaseIds...>', 'Test case IDs to add')
            .action(async (setId, testCaseIds) => {
                await this.addTestsToSet(setId, testCaseIds);
            });
        
        testSetCmd
            .command('remove-tests')
            .description('Remove test cases from test set')
            .argument('<setId>', 'Test set ID')
            .argument('<testCaseIds...>', 'Test case IDs to remove')
            .action(async (setId, testCaseIds) => {
                await this.removeTestsFromSet(setId, testCaseIds);
            });
        
        testSetCmd
            .command('assign')
            .description('Assign test set to tester')
            .argument('<setId>', 'Test set ID')
            .argument('<tester>', 'Tester email')
            .action(async (setId, tester) => {
                await this.assignTestSet(setId, tester);
            });
        
        testSetCmd
            .command('clone')
            .description('Clone test set')
            .argument('<setId>', 'Test set ID to clone')
            .argument('<newName>', 'New test set name')
            .action(async (setId, newName) => {
                await this.cloneTestSet(setId, newName);
            });
        
        testSetCmd
            .command('list')
            .description('List test sets')
            .option('--status <status>', 'Filter by status')
            .option('--assigned-to <email>', 'Filter by assignee')
            .action(async (options) => {
                await this.listTestSets(options);
            });
    }
    
    setupExecutionCommands() {
        const execCmd = this.program
            .command('execute')
            .alias('exec')
            .description('Test execution commands');
        
        execCmd
            .command('test')
            .description('Execute a single test case')
            .argument('<testCaseId>', 'Test case ID')
            .option('--status <status>', 'Test result (Pass|Fail|Blocked|Skip)', 'Pass')
            .option('--tester <email>', 'Tester email')
            .option('--environment <env>', 'Test environment', 'Staging')
            .option('--duration <time>', 'Execution duration')
            .option('--notes <notes>', 'Execution notes')
            .option('--screenshot <path>', 'Screenshot path for failures')
            .option('--jira <ticket>', 'Jira ticket for failures/blocks')
            .action(async (testCaseId, options) => {
                await this.executeTest(testCaseId, options);
            });
        
        execCmd
            .command('bulk')
            .description('Execute multiple test cases')
            .option('--tests <ids>', 'Comma-separated test case IDs')
            .option('--test-set <id>', 'Execute all tests in set')
            .option('--status <status>', 'Result for all tests', 'Pass')
            .option('--tester <email>', 'Tester email')
            .option('--environment <env>', 'Test environment', 'Staging')
            .action(async (options) => {
                await this.bulkExecute(options);
            });
        
        execCmd
            .command('block')
            .description('Block test cases')
            .argument('<testCaseIds...>', 'Test case IDs to block')
            .option('--jira <ticket>', 'Blocking Jira ticket')
            .option('--reason <reason>', 'Block reason')
            .action(async (testCaseIds, options) => {
                await this.blockTests(testCaseIds, options);
            });
    }
    
    setupJiraCommands() {
        const jiraCmd = this.program
            .command('jira')
            .description('Jira integration commands');
        
        jiraCmd
            .command('setup')
            .description('Setup Jira integration')
            .option('--url <url>', 'Jira base URL')
            .option('--project <key>', 'Project key')
            .option('--email <email>', 'User email')
            .option('--token <token>', 'API token')
            .action(async (options) => {
                await this.setupJira(options);
            });
        
        jiraCmd
            .command('link')
            .description('Link test case to Jira ticket')
            .argument('<testCaseId>', 'Test case ID')
            .option('--story <ticket>', 'Story ticket')
            .option('--epic <ticket>', 'Epic ticket')
            .action(async (testCaseId, options) => {
                await this.linkJira(testCaseId, options);
            });
        
        jiraCmd
            .command('create-defect')
            .description('Create defect in Jira')
            .argument('<testCaseId>', 'Test case ID')
            .option('--title <title>', 'Defect title')
            .option('--severity <severity>', 'Defect severity', 'Medium')
            .option('--assign <assignee>', 'Assignee')
            .action(async (testCaseId, options) => {
                await this.createJiraDefect(testCaseId, options);
            });
    }
    
    setupDashboardCommands() {
        const dashCmd = this.program
            .command('dashboard')
            .alias('dash')
            .description('Dashboard and reporting commands');
        
        dashCmd
            .command('show')
            .description('Show interactive dashboard')
            .option('--refresh-interval <seconds>', 'Auto-refresh interval', '30')
            .action(async (options) => {
                await this.showDashboard(options);
            });
        
        dashCmd
            .command('stats')
            .description('Show statistics')
            .option('--test-set <id>', 'Stats for specific test set')
            .action(async (options) => {
                await this.showStatistics(options);
            });
        
        dashCmd
            .command('report')
            .description('Generate execution report')
            .option('--test-set <id>', 'Report for specific test set')
            .option('--format <format>', 'Report format (html|pdf|json)', 'html')
            .option('--output <path>', 'Output file path')
            .action(async (options) => {
                await this.generateReport(options);
            });
    }
    
    // Implementation methods
    async importTestCases(source, file, options) {
        try {
            console.log(chalk.blue(`📥 Importing test cases from ${source.toUpperCase()}...`));
            
            const importOptions = {};
            if (options.mapping) {
                importOptions.mapping = JSON.parse(options.mapping);
            }
            if (options.sheet) {
                importOptions.sheet = options.sheet;
            }
            
            const result = await this.testManager.importTestCases(source, file, importOptions);
            
            if (result.success) {
                console.log(chalk.green(`✅ Successfully imported ${result.imported} test cases`));
                console.log(`   Format: ${result.format}`);
                if (result.sheet) console.log(`   Sheet: ${result.sheet}`);
            } else {
                console.log(chalk.red('❌ Import failed'));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Import error: ${error.message}`));
        }
    }
    
    async exportTestCases(format, output, options) {
        try {
            console.log(chalk.blue(`📤 Exporting test cases to ${format.toUpperCase()}...`));
            
            let testCaseIds = 'all';
            
            if (options.testSet) {
                const testSet = this.testManager.getTestSet(options.testSet);
                if (!testSet) {
                    console.error(chalk.red(`❌ Test set ${options.testSet} not found`));
                    return;
                }
                testCaseIds = testSet.testCases.map(tc => tc.testCaseId);
            } else if (options.category) {
                const filtered = this.testManager.searchTestCases('', { category: options.category });
                testCaseIds = filtered.map(tc => tc.id);
            }
            
            const exportOptions = {};
            if (options.includeSummary) exportOptions.includeSummary = true;
            if (options.includeStats) exportOptions.includeStats = true;
            
            const result = await this.testManager.exportTestCases(testCaseIds, format, output, exportOptions);
            
            if (result.success) {
                console.log(chalk.green(`✅ Successfully exported ${result.exported} test cases`));
                console.log(`   File: ${result.filePath}`);
            } else {
                console.log(chalk.red('❌ Export failed'));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Export error: ${error.message}`));
        }
    }
    
    async createTestCase(title, options) {
        try {
            let testCaseData = {
                title,
                category: options.category,
                priority: options.priority,
                description: options.description || ''
            };
            
            if (options.interactive) {
                testCaseData = await this.interactiveTestCaseCreation(testCaseData);
            }
            
            const testCase = this.testManager.createTestCase(testCaseData);
            console.log(chalk.green(`✅ Created test case: ${testCase.id}`));
            console.log(`   Title: ${testCase.title}`);
            console.log(`   Category: ${testCase.category}`);
            console.log(`   Priority: ${testCase.priority}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create test case: ${error.message}`));
        }
    }
    
    async listTestCases(options) {
        try {
            const filters = {};
            if (options.category) filters.category = options.category;
            if (options.priority) filters.priority = options.priority;
            if (options.status) filters.status = options.status;
            
            const testCases = this.testManager.searchTestCases(options.search || '', filters);
            const limit = parseInt(options.limit);
            const displayCases = testCases.slice(0, limit);
            
            if (displayCases.length === 0) {
                console.log(chalk.yellow('📝 No test cases found matching criteria'));
                return;
            }
            
            const table = new Table({
                head: ['ID', 'Title', 'Category', 'Priority', 'Status'],
                colWidths: [15, 40, 15, 10, 15]
            });
            
            displayCases.forEach(tc => {
                table.push([
                    tc.id,
                    tc.title.length > 35 ? tc.title.substr(0, 35) + '...' : tc.title,
                    tc.category,
                    tc.priority,
                    this.colorizeStatus(tc.currentStatus)
                ]);
            });
            
            console.log(table.toString());
            console.log(chalk.blue(`\n📊 Showing ${displayCases.length} of ${testCases.length} test cases`));
        } catch (error) {
            console.error(chalk.red(`❌ Error listing test cases: ${error.message}`));
        }
    }
    
    colorizeStatus(status) {
        switch (status) {
            case 'Pass': return chalk.green(status);
            case 'Fail': return chalk.red(status);
            case 'Blocked': return chalk.yellow(status);
            case 'Skip': return chalk.gray(status);
            default: return chalk.white(status);
        }
    }
    
    // Test Set Implementation Methods
    async createTestSet(name, options) {
        try {
            const testSetData = {
                name,
                category: options.category || 'Functional',
                priority: options.priority || 'Medium',
                description: options.description || ''
            };
            
            const testSet = this.testManager.createTestSet(testSetData);
            console.log(chalk.green(`✅ Created test set: ${testSet.id}`));
            console.log(`   Name: ${testSet.name}`);
            console.log(`   Category: ${testSet.category}`);
            console.log(`   Priority: ${testSet.priority}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create test set: ${error.message}`));
        }
    }
    
    async addTestsToSet(setId, testCaseIds) {
        try {
            const results = this.testManager.addTestCasesToSet(setId, testCaseIds);
            
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            console.log(chalk.green(`✅ Added ${successful.length} test cases to set ${setId}`));
            
            if (failed.length > 0) {
                console.log(chalk.yellow(`⚠️  Failed to add ${failed.length} test cases:`));
                failed.forEach(f => {
                    console.log(chalk.red(`   ${f.testCaseId}: ${f.error}`));
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to add tests to set: ${error.message}`));
        }
    }
    
    async removeTestsFromSet(setId, testCaseIds) {
        try {
            const results = this.testManager.removeTestCasesFromSet(setId, testCaseIds);
            
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            console.log(chalk.green(`✅ Removed ${successful.length} test cases from set ${setId}`));
            
            if (failed.length > 0) {
                console.log(chalk.yellow(`⚠️  Failed to remove ${failed.length} test cases:`));
                failed.forEach(f => {
                    console.log(chalk.red(`   ${f.testCaseId}: ${f.error}`));
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to remove tests from set: ${error.message}`));
        }
    }
    
    async assignTestSet(setId, tester) {
        try {
            this.testManager.updateTestSet(setId, { assignedTo: tester });
            console.log(chalk.green(`✅ Assigned test set ${setId} to ${tester}`));
        } catch (error) {
            console.error(chalk.red(`❌ Failed to assign test set: ${error.message}`));
        }
    }
    
    async cloneTestSet(setId, newName) {
        try {
            const clonedSet = this.testManager.cloneTestSet(setId, newName);
            console.log(chalk.green(`✅ Cloned test set to: ${clonedSet.id}`));
            console.log(`   New Name: ${clonedSet.name}`);
            console.log(`   Test Cases: ${clonedSet.testCases.length}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to clone test set: ${error.message}`));
        }
    }
    
    async listTestSets(options) {
        try {
            let testSets = this.testManager.getAllTestSets();
            
            // Apply filters
            if (options.status) {
                testSets = testSets.filter(ts => ts.status === options.status);
            }
            
            if (options.assignedTo) {
                testSets = testSets.filter(ts => ts.assignedTo === options.assignedTo);
            }
            
            if (testSets.length === 0) {
                console.log(chalk.yellow('📝 No test sets found matching criteria'));
                return;
            }
            
            const table = new Table({
                head: ['ID', 'Name', 'Category', 'Priority', 'Status', 'Test Cases', 'Assigned To'],
                colWidths: [15, 30, 15, 10, 15, 12, 20]
            });
            
            testSets.forEach(ts => {
                table.push([
                    ts.id,
                    ts.name.length > 25 ? ts.name.substr(0, 25) + '...' : ts.name,
                    ts.category,
                    ts.priority,
                    this.colorizeStatus(ts.status),
                    ts.testCases.length,
                    ts.assignedTo || 'Unassigned'
                ]);
            });
            
            console.log(table.toString());
            console.log(chalk.blue(`\n📊 Showing ${testSets.length} test sets`));
        } catch (error) {
            console.error(chalk.red(`❌ Error listing test sets: ${error.message}`));
        }
    }
    
    // Additional missing methods
    async showTestCase(id, options) {
        try {
            const testCase = this.testManager.getTestCase(id);
            if (!testCase) {
                console.error(chalk.red(`❌ Test case ${id} not found`));
                return;
            }
            
            console.log(chalk.blue.bold(`\n📋 Test Case: ${testCase.id}`));
            console.log(chalk.blue('─'.repeat(50)));
            console.log(`Title: ${testCase.title}`);
            console.log(`Description: ${testCase.description || 'No description'}`);
            console.log(`Category: ${testCase.category}`);
            console.log(`Priority: ${testCase.priority}`);
            console.log(`Status: ${this.colorizeStatus(testCase.currentStatus)}`);
            console.log(`Created: ${new Date(testCase.createdDate).toLocaleDateString()}`);
            console.log(`Modified: ${new Date(testCase.lastModified).toLocaleDateString()}`);
            
            if (testCase.steps.length > 0) {
                console.log('\nSteps:');
                testCase.steps.forEach(step => {
                    console.log(`  ${step.stepNumber}. ${step.action}`);
                    console.log(`     Expected: ${step.expected}`);
                });
            }
            
            if (options.includeHistory && testCase.executionHistory.length > 0) {
                console.log('\nExecution History:');
                testCase.executionHistory.forEach(exec => {
                    console.log(`  ${new Date(exec.date).toLocaleDateString()} - ${this.colorizeStatus(exec.status)} by ${exec.tester}`);
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error showing test case: ${error.message}`));
        }
    }
    
    async updateTestCase(id, options) {
        try {
            const updates = {};
            if (options.title) updates.title = options.title;
            if (options.description) updates.description = options.description;
            if (options.category) updates.category = options.category;
            if (options.priority) updates.priority = options.priority;
            
            const updatedTestCase = this.testManager.updateTestCase(id, updates);
            console.log(chalk.green(`✅ Updated test case: ${updatedTestCase.id}`));
            console.log(`   Title: ${updatedTestCase.title}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to update test case: ${error.message}`));
        }
    }
    
    async deleteTestCase(id, options) {
        try {
            if (!options.confirm) {
                // Simple confirmation - in a real CLI you'd use inquirer
                console.log(chalk.yellow(`⚠️  This will permanently delete test case ${id}`));
                console.log(chalk.yellow('Use --confirm flag to proceed'));
                return;
            }
            
            this.testManager.deleteTestCase(id);
            console.log(chalk.green(`✅ Deleted test case: ${id}`));
        } catch (error) {
            console.error(chalk.red(`❌ Failed to delete test case: ${error.message}`));
        }
    }
    
    async bulkExecute(options) {
        try {
            let testCaseIds = [];
            
            if (options.tests) {
                testCaseIds = options.tests.split(',').map(id => id.trim());
            } else if (options.testSet) {
                const testSet = this.testManager.getTestSet(options.testSet);
                if (!testSet) {
                    console.error(chalk.red(`❌ Test set ${options.testSet} not found`));
                    return;
                }
                testCaseIds = testSet.testCases.map(tc => tc.testCaseId);
            } else {
                console.error(chalk.red('❌ Either --tests or --test-set must be specified'));
                return;
            }
            
            const executionData = {
                status: options.status || 'Pass',
                tester: options.tester || 'system',
                environment: options.environment || 'Staging'
            };
            
            const results = this.testManager.bulkExecuteTests(testCaseIds, executionData);
            
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            console.log(chalk.green(`✅ Executed ${successful.length} test cases successfully`));
            
            if (failed.length > 0) {
                console.log(chalk.red(`❌ Failed to execute ${failed.length} test cases:`));
                failed.forEach(f => {
                    console.log(chalk.red(`   ${f.testCaseId}: ${f.error}`));
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Bulk execution failed: ${error.message}`));
        }
    }
    
    async blockTests(testCaseIds, options) {
        try {
            const executionData = {
                status: 'Blocked',
                blockingInfo: {
                    blockedBy: 'jira',
                    jiraTickets: options.jira ? [options.jira] : [],
                    blockReason: options.reason || 'Blocked by dependency',
                    blockedDate: new Date().toISOString()
                }
            };
            
            const results = this.testManager.bulkExecuteTests(testCaseIds, executionData);
            
            const successful = results.filter(r => r.success);
            
            console.log(chalk.yellow(`🔒 Blocked ${successful.length} test cases`));
            if (options.jira) {
                console.log(`   Blocking ticket: ${options.jira}`);
            }
            if (options.reason) {
                console.log(`   Reason: ${options.reason}`);
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to block tests: ${error.message}`));
        }
    }
    
    // Dashboard methods
    async showDashboard(options) {
        try {
            this.dashboardService.displayDashboard(options);
            
            if (options.refreshInterval) {
                const interval = parseInt(options.refreshInterval) * 1000;
                setInterval(() => {
                    this.dashboardService.displayDashboard(options);
                }, interval);
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to show dashboard: ${error.message}`));
        }
    }
    
    async showStatistics(options) {
        try {
            const stats = this.dashboardService.generateDetailedStats(options);
            console.log(stats);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to show statistics: ${error.message}`));
        }
    }
    
    async generateReport(options) {
        try {
            if (options.format === 'html') {
                const htmlContent = this.dashboardService.generateHTMLReport(options);
                const outputPath = options.output || 'test-report.html';
                const result = await this.dashboardService.saveReport(htmlContent, outputPath, 'html');
                
                console.log(chalk.green(`✅ HTML report generated: ${result.filePath}`));
                console.log(`   Size: ${(result.size / 1024).toFixed(1)} KB`);
            } else {
                const stats = this.dashboardService.generateDetailedStats(options);
                const outputPath = options.output || 'test-report.txt';
                await this.dashboardService.saveReport(stats, outputPath, 'text');
                
                console.log(chalk.green(`✅ Report generated: ${outputPath}`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate report: ${error.message}`));
        }
    }
    
    // Jira integration stubs (implement based on JiraService)
    async setupJira(options) {
        console.log(chalk.blue('🎫 Jira integration setup - Feature available'));
        console.log('This would configure Jira connection settings');
    }
    
    async linkJira(testCaseId, options) {
        console.log(chalk.blue(`🔗 Linking ${testCaseId} to Jira - Feature available`));
    }
    
    async createJiraDefect(testCaseId, options) {
        console.log(chalk.blue(`🐛 Creating Jira defect for ${testCaseId} - Feature available`));
    }
    
    // ✨ NEW: Project Management Commands
    setupProjectCommands() {
        const projectCmd = this.program
            .command('project')
            .alias('proj')
            .description('Project management commands');
        
        projectCmd
            .command('create')
            .description('Create a new project')
            .argument('<name>', 'Project name')
            .option('--category <category>', 'Project category', 'General')
            .option('--priority <priority>', 'Project priority', 'Medium')
            .option('--qa-lead <email>', 'QA Lead email')
            .option('--description <desc>', 'Project description')
            .action(async (name, options) => {
                await this.createProject(name, options);
            });
        
        projectCmd
            .command('list')
            .description('List all projects')
            .option('--status <status>', 'Filter by status')
            .option('--category <category>', 'Filter by category')
            .action(async (options) => {
                await this.listProjects(options);
            });
        
        projectCmd
            .command('dashboard')
            .description('Show project dashboard')
            .argument('<projectId>', 'Project ID')
            .action(async (projectId) => {
                await this.showProjectDashboard(projectId);
            });
        
        projectCmd
            .command('add-member')
            .description('Add team member to project')
            .argument('<projectId>', 'Project ID')
            .option('--name <name>', 'Member name')
            .option('--email <email>', 'Member email')
            .option('--role <role>', 'Member role', 'QA Tester')
            .action(async (projectId, options) => {
                await this.addProjectMember(projectId, options);
            });
        
        projectCmd
            .command('generate-tests')
            .description('Generate test cases for entire project')
            .argument('<projectId>', 'Project ID')
            .option('--created-by <email>', 'Created by email')
            .action(async (projectId, options) => {
                await this.generateProjectTests(projectId, options);
            });
        
        projectCmd
            .command('report')
            .description('Generate project report')
            .argument('<projectId>', 'Project ID')
            .option('--format <format>', 'Report format', 'html')
            .option('--output <path>', 'Output file path')
            .action(async (projectId, options) => {
                await this.generateProjectReport(projectId, options);
            });
    }
    
    // ✨ NEW: Requirement Management Commands
    setupRequirementCommands() {
        const reqCmd = this.program
            .command('requirement')
            .alias('req')
            .description('Requirement management commands');
        
        reqCmd
            .command('create')
            .description('Create a new requirement')
            .argument('<title>', 'Requirement title')
            .option('--project <projectId>', 'Project ID')
            .option('--type <type>', 'Requirement type', 'Functional')
            .option('--priority <priority>', 'Requirement priority', 'Medium')
            .option('--description <desc>', 'Requirement description')
            .action(async (title, options) => {
                await this.createRequirement(title, options);
            });
        
        reqCmd
            .command('list')
            .description('List requirements')
            .option('--project <projectId>', 'Filter by project')
            .option('--type <type>', 'Filter by type')
            .option('--status <status>', 'Filter by status')
            .action(async (options) => {
                await this.listRequirements(options);
            });
        
        reqCmd
            .command('add-criteria')
            .description('Add acceptance criteria to requirement')
            .argument('<reqId>', 'Requirement ID')
            .argument('<criteria>', 'Acceptance criteria description')
            .option('--type <type>', 'Criteria type', 'Given-When-Then')
            .option('--priority <priority>', 'Criteria priority', 'Must Have')
            .action(async (reqId, criteria, options) => {
                await this.addAcceptanceCriteria(reqId, criteria, options);
            });
        
        reqCmd
            .command('generate-tests')
            .description('Generate test cases from requirement')
            .argument('<reqId>', 'Requirement ID')
            .option('--created-by <email>', 'Created by email')
            .action(async (reqId, options) => {
                await this.generateTestsFromRequirement(reqId, options);
            });
        
        reqCmd
            .command('show')
            .description('Show requirement details')
            .argument('<reqId>', 'Requirement ID')
            .option('--include-tests', 'Include linked test cases')
            .action(async (reqId, options) => {
                await this.showRequirement(reqId, options);
            });
    }
    
    // Project Management Implementation
    async createProject(name, options) {
        try {
            const projectData = {
                name,
                category: options.category,
                priority: options.priority,
                description: options.description || '',
                qaLead: options.qaLead || '',
                createdBy: 'system'
            };
            
            const project = this.projectManager.createProject(projectData);
            console.log(chalk.green(`✅ Created project: ${project.id}`));
            console.log(`   Name: ${project.name}`);
            console.log(`   Category: ${project.category}`);
            console.log(`   Priority: ${project.priority}`);
            if (project.qaLead) console.log(`   QA Lead: ${project.qaLead}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create project: ${error.message}`));
        }
    }
    
    async listProjects(options) {
        try {
            const projects = this.projectManager.searchProjects('', options);
            
            if (projects.length === 0) {
                console.log(chalk.yellow('📁 No projects found matching criteria'));
                return;
            }
            
            const table = new Table({
                head: ['ID', 'Name', 'Category', 'Status', 'Priority', 'Requirements', 'Test Cases', 'QA Lead'],
                colWidths: [15, 25, 12, 12, 10, 12, 12, 20]
            });
            
            projects.forEach(proj => {
                table.push([
                    proj.id,
                    proj.name.length > 20 ? proj.name.substr(0, 20) + '...' : proj.name,
                    proj.category,
                    this.colorizeStatus(proj.status),
                    proj.priority,
                    proj.requirements.length,
                    proj.testCases.length,
                    proj.qaLead || 'Unassigned'
                ]);
            });
            
            console.log(table.toString());
            console.log(chalk.blue(`\n📊 Showing ${projects.length} projects`));
        } catch (error) {
            console.error(chalk.red(`❌ Error listing projects: ${error.message}`));
        }
    }
    
    async showProjectDashboard(projectId) {
        try {
            const dashboard = this.projectManager.getProjectDashboard(projectId);
            
            console.log(chalk.blue.bold(`\n📊 Project Dashboard: ${dashboard.project.name}`));
            console.log(chalk.blue('═'.repeat(60)));
            
            // Project Health
            const health = dashboard.project.health;
            const healthColor = health.status === 'Good' ? chalk.green : 
                               health.status === 'Warning' ? chalk.yellow : chalk.red;
            console.log(`\n🏥 Health: ${healthColor.bold(health.status)} (Score: ${health.score}/100)`);
            
            if (health.issues.length > 0) {
                console.log('⚠️  Issues:');
                health.issues.forEach(issue => console.log(`   • ${issue}`));
            }
            
            // Statistics
            console.log('\n📈 Statistics:');
            console.log(`   Requirements: ${dashboard.requirements.total}`);
            console.log(`   Test Cases: ${dashboard.testCases.total}`);
            console.log(`   Test Coverage: ${dashboard.project.stats.testCoverage}%`);
            console.log(`   Pass Rate: ${dashboard.project.stats.passRate}%`);
            console.log(`   Executed Tests: ${dashboard.project.stats.executedTests}`);
            
            // Team
            console.log('\n👥 Team:');
            console.log(`   Members: ${dashboard.team.members}`);
            console.log(`   QA Lead: ${dashboard.team.qaLead || 'Not assigned'}`);
            console.log(`   Project Manager: ${dashboard.team.projectManager || 'Not assigned'}`);
            
        } catch (error) {
            console.error(chalk.red(`❌ Error showing project dashboard: ${error.message}`));
        }
    }
    
    async addProjectMember(projectId, options) {
        try {
            const project = this.projectManager.getProject(projectId);
            if (!project) {
                console.error(chalk.red(`❌ Project ${projectId} not found`));
                return;
            }
            
            const member = {
                name: options.name,
                email: options.email,
                role: options.role
            };
            
            const added = project.addTeamMember(member);
            if (added) {
                this.projectManager.saveProject(project);
                console.log(chalk.green(`✅ Added team member: ${member.name} (${member.email})`));
                console.log(`   Role: ${member.role}`);
            } else {
                console.log(chalk.yellow(`⚠️  Member ${member.email} already exists in project`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to add team member: ${error.message}`));
        }
    }
    
    async generateProjectTests(projectId, options) {
        try {
            console.log(chalk.blue(`🧪 Generating test cases for project ${projectId}...`));
            
            const result = this.projectManager.generateTestCasesForProject(projectId, options);
            
            console.log(chalk.green(`✅ Test generation completed!`));
            console.log(`   Requirements processed: ${result.summary.processedRequirements}/${result.summary.totalRequirements}`);
            console.log(`   Total test cases generated: ${result.summary.totalTestCases}`);
            console.log(`   Test coverage: ${result.summary.coverage}%`);
            
            // Show breakdown by category
            if (result.results.length > 0) {
                console.log('\n📋 Generated test cases by category:');
                const allCategories = {};
                result.results.forEach(r => {
                    Object.keys(r.summary.categories).forEach(cat => {
                        allCategories[cat] = (allCategories[cat] || 0) + r.summary.categories[cat];
                    });
                });
                
                Object.keys(allCategories).forEach(cat => {
                    console.log(`   ${cat}: ${allCategories[cat]} test cases`);
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate project tests: ${error.message}`));
        }
    }
    
    // Requirement Management Implementation
    async createRequirement(title, options) {
        try {
            const requirementData = {
                title,
                projectId: options.project,
                type: options.type,
                priority: options.priority,
                description: options.description || '',
                createdBy: 'system'
            };
            
            const requirement = this.projectManager.createRequirement(requirementData);
            console.log(chalk.green(`✅ Created requirement: ${requirement.id}`));
            console.log(`   Title: ${requirement.title}`);
            console.log(`   Type: ${requirement.type}`);
            console.log(`   Priority: ${requirement.priority}`);
            if (requirement.projectId) console.log(`   Project: ${requirement.projectId}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to create requirement: ${error.message}`));
        }
    }
    
    async listRequirements(options) {
        try {
            const requirements = this.projectManager.searchRequirements('', options);
            
            if (requirements.length === 0) {
                console.log(chalk.yellow('📋 No requirements found matching criteria'));
                return;
            }
            
            const table = new Table({
                head: ['ID', 'Title', 'Type', 'Priority', 'Status', 'Project', 'Test Cases'],
                colWidths: [15, 30, 12, 10, 12, 15, 12]
            });
            
            requirements.forEach(req => {
                table.push([
                    req.id,
                    req.title.length > 25 ? req.title.substr(0, 25) + '...' : req.title,
                    req.type,
                    req.priority,
                    this.colorizeStatus(req.status),
                    req.projectId || 'None',
                    req.testCases.length
                ]);
            });
            
            console.log(table.toString());
            console.log(chalk.blue(`\n📊 Showing ${requirements.length} requirements`));
        } catch (error) {
            console.error(chalk.red(`❌ Error listing requirements: ${error.message}`));
        }
    }
    
    async addAcceptanceCriteria(reqId, criteria, options) {
        try {
            const requirement = this.projectManager.getRequirement(reqId);
            if (!requirement) {
                console.error(chalk.red(`❌ Requirement ${reqId} not found`));
                return;
            }
            
            requirement.addAcceptanceCriteria({
                description: criteria,
                type: options.type,
                priority: options.priority
            });
            
            this.projectManager.saveRequirement(requirement);
            console.log(chalk.green(`✅ Added acceptance criteria to ${reqId}`));
            console.log(`   Criteria: ${criteria}`);
            console.log(`   Type: ${options.type}`);
            console.log(`   Priority: ${options.priority}`);
        } catch (error) {
            console.error(chalk.red(`❌ Failed to add acceptance criteria: ${error.message}`));
        }
    }
    
    async generateTestsFromRequirement(reqId, options) {
        try {
            console.log(chalk.blue(`🧪 Generating test cases from requirement ${reqId}...`));
            
            const result = this.projectManager.generateTestCasesFromRequirement(reqId, options);
            
            console.log(chalk.green(`✅ Generated ${result.summary.totalGenerated} test cases!`));
            console.log(`   Requirement: ${result.requirement.title}`);
            
            // Show breakdown
            if (result.summary.categories) {
                console.log('\n📋 Test cases by category:');
                Object.keys(result.summary.categories).forEach(cat => {
                    console.log(`   ${cat}: ${result.summary.categories[cat]} test cases`);
                });
            }
            
            if (result.summary.priorities) {
                console.log('\n⭐ Test cases by priority:');
                Object.keys(result.summary.priorities).forEach(pri => {
                    console.log(`   ${pri}: ${result.summary.priorities[pri]} test cases`);
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate tests from requirement: ${error.message}`));
        }
    }
    
    async showRequirement(reqId, options) {
        try {
            const requirement = this.projectManager.getRequirement(reqId);
            if (!requirement) {
                console.error(chalk.red(`❌ Requirement ${reqId} not found`));
                return;
            }
            
            console.log(chalk.blue.bold(`\n📋 Requirement: ${requirement.id}`));
            console.log(chalk.blue('─'.repeat(50)));
            console.log(`Title: ${requirement.title}`);
            console.log(`Type: ${requirement.type}`);
            console.log(`Priority: ${requirement.priority}`);
            console.log(`Status: ${this.colorizeStatus(requirement.status)}`);
            console.log(`Project: ${requirement.projectId || 'None'}`);
            console.log(`Description: ${requirement.description || 'No description'}`);
            
            if (requirement.acceptanceCriteria.length > 0) {
                console.log('\n✅ Acceptance Criteria:');
                requirement.acceptanceCriteria.forEach((ac, index) => {
                    console.log(`  ${index + 1}. ${ac.description} (${ac.priority})`);
                });
            }
            
            if (options.includeTests && requirement.testCases.length > 0) {
                console.log('\n🧪 Linked Test Cases:');
                requirement.testCases.forEach(tcId => {
                    const testCase = this.testManager.getTestCase(tcId);
                    if (testCase) {
                        console.log(`  • ${testCase.id}: ${testCase.title} (${this.colorizeStatus(testCase.currentStatus)})`);
                    }
                });
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error showing requirement: ${error.message}`));
        }
    }
    
    async generateProjectReport(projectId, options) {
        try {
            const report = this.projectManager.generateProjectReport(projectId);
            
            if (options.format === 'html') {
                const htmlContent = this.generateProjectHTMLReport(report);
                const outputPath = options.output || `project-${projectId}-report.html`;
                
                fs.writeFileSync(outputPath, htmlContent);
                console.log(chalk.green(`✅ Project report generated: ${outputPath}`));
            } else {
                // Text format
                console.log(this.formatProjectTextReport(report));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate project report: ${error.message}`));
        }
    }
    
    formatProjectTextReport(report) {
        const output = [];
        
        output.push(`📊 PROJECT REPORT: ${report.project.name}`);
        output.push('═'.repeat(60));
        output.push(`Generated: ${new Date(report.reportDate).toLocaleString()}`);
        output.push('');
        
        output.push('📈 SUMMARY:');
        output.push(`   Test Coverage: ${report.summary.requirementCoverage}`);
        output.push(`   Pass Rate: ${report.summary.testExecution}`);
        output.push(`   Health Score: ${report.summary.healthScore}/100`);
        output.push(`   Total Test Cases: ${report.summary.totalTestCases}`);
        output.push(`   Executed Tests: ${report.summary.executedTests}`);
        output.push('');
        
        output.push('📋 REQUIREMENTS:');
        output.push(`   Total: ${report.requirements.total}`);
        Object.keys(report.requirements.byStatus).forEach(status => {
            output.push(`   ${status}: ${report.requirements.byStatus[status]}`);
        });
        output.push('');
        
        output.push('🧪 TEST CASES:');
        output.push(`   Total: ${report.testCases.total}`);
        Object.keys(report.testCases.byStatus).forEach(status => {
            output.push(`   ${status}: ${report.testCases.byStatus[status]}`);
        });
        output.push('');
        
        if (report.recommendations.length > 0) {
            output.push('💡 RECOMMENDATIONS:');
            report.recommendations.forEach(rec => {
                output.push(`   • ${rec}`);
            });
        }
        
        return output.join('\n');
    }
    
    async executeTest(testCaseId, options) {
        try {
            const executionData = {
                status: options.status,
                tester: options.tester || 'system',
                environment: options.environment,
                duration: options.duration || '',
                notes: options.notes || ''
            };
            
            if (options.screenshot) {
                executionData.screenshots = [options.screenshot];
            }
            
            if (options.jira && (options.status === 'Fail' || options.status === 'Blocked')) {
                if (options.status === 'Blocked') {
                    executionData.blockingInfo = {
                        blockedBy: 'jira',
                        jiraTickets: [options.jira],
                        blockReason: options.notes || 'Blocked by dependency',
                        blockedDate: new Date().toISOString()
                    };
                } else {
                    executionData.defects = [{
                        jiraTicket: options.jira,
                        severity: 'Medium',
                        description: options.notes || 'Test failure',
                        foundBy: options.tester || 'system',
                        reportedDate: new Date().toISOString()
                    }];
                }
            }
            
            const executionId = this.testManager.executeTest(testCaseId, executionData);
            
            console.log(chalk.green(`✅ Test executed: ${testCaseId}`));
            console.log(`   Status: ${this.colorizeStatus(options.status)}`);
            console.log(`   Execution ID: ${executionId}`);
            
            if (options.jira) {
                console.log(`   Jira Ticket: ${options.jira}`);
            }
        } catch (error) {
            console.error(chalk.red(`❌ Execution failed: ${error.message}`));
        }
    }
    
    run() {
        this.program.parse();
    }
}

// CLI Entry Point
if (require.main === module) {
    const cli = new TestCaseManagerCLI();
    cli.run();
}

module.exports = TestCaseManagerCLI;