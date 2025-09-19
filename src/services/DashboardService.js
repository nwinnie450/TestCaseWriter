const Table = require('cli-table3');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class DashboardService {
    constructor(testCaseManager) {
        this.testManager = testCaseManager;
    }
    
    // Display interactive dashboard
    displayDashboard(options = {}) {
        console.clear();
        
        const stats = this.testManager.getOverallStatistics();
        
        // Header
        console.log(chalk.blue.bold('┌─────────────────────────────────────────────────────────────────┐'));
        console.log(chalk.blue.bold('│                    TEST CASE MANAGER DASHBOARD                  │'));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
        
        // Test Cases Overview
        this.displayTestCasesOverview(stats.testCases);
        
        // Test Sets Overview
        this.displayTestSetsOverview(stats.testSets);
        
        // Execution Summary
        this.displayExecutionSummary(stats.execution);
        
        // Status Breakdown
        this.displayStatusBreakdown(stats.testCases.byStatus);
        
        console.log(chalk.blue.bold('└─────────────────────────────────────────────────────────────────┘'));
        
        // Last updated
        console.log(chalk.gray(`\n⏰ Last updated: ${new Date().toLocaleString()}`));
        
        if (options.refreshInterval) {
            console.log(chalk.gray(`🔄 Auto-refresh every ${options.refreshInterval} seconds (Ctrl+C to stop)`));
        }
    }
    
    displayTestCasesOverview(testCaseStats) {
        console.log(chalk.blue.bold('│  📋 Test Cases Overview                                        │'));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
        
        const table = new Table({
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
                'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
                'left': '│', 'left-mid': '', 'mid': '', 'mid-mid': '',
                'right': '│', 'right-mid': ''
            },
            colWidths: [25, 15, 25],
            wordWrap: true
        });
        
        table.push(
            ['  Total Test Cases:', chalk.cyan.bold(testCaseStats.total), '  Automation Candidates:'],
            ['', '', chalk.yellow(testCaseStats.automation.candidates)],
            ['  By Priority:', '', '  By Type:'],
            [`    Critical: ${chalk.red(testCaseStats.byPriority.Critical || 0)}`, '', `    Manual: ${chalk.blue(testCaseStats.automation.manual)}`],
            [`    High: ${chalk.red(testCaseStats.byPriority.High || 0)}`, '', `    Automated: ${chalk.green(testCaseStats.automation.automated)}`],
            [`    Medium: ${chalk.yellow(testCaseStats.byPriority.Medium || 0)}`, '', ''],
            [`    Low: ${chalk.gray(testCaseStats.byPriority.Low || 0)}`, '', '']
        );
        
        console.log(table.toString());
    }
    
    displayTestSetsOverview(testSetStats) {
        console.log(chalk.blue.bold('│  🗂️  Test Sets Overview                                         │'));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
        
        const table = new Table({
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
                'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
                'left': '│', 'left-mid': '', 'mid': '', 'mid-mid': '',
                'right': '│', 'right-mid': ''
            },
            colWidths: [20, 15, 20, 15],
            wordWrap: true
        });
        
        table.push(
            ['  Total Sets:', chalk.cyan.bold(testSetStats.total), '  Active:', chalk.green(testSetStats.active)],
            ['  Completed:', chalk.blue(testSetStats.completed), '  Blocked:', chalk.red(testSetStats.blocked)]
        );
        
        console.log(table.toString());
    }
    
    displayExecutionSummary(executionStats) {
        console.log(chalk.blue.bold('│  ⚡ Execution Summary                                           │'));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
        
        const passRate = parseFloat(executionStats.passRate);
        const passRateColor = passRate >= 90 ? chalk.green : passRate >= 70 ? chalk.yellow : chalk.red;
        
        const table = new Table({
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
                'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
                'left': '│', 'left-mid': '', 'mid': '', 'mid-mid': '',
                'right': '│', 'right-mid': ''
            },
            colWidths: [25, 20, 25],
            wordWrap: true
        });
        
        table.push(
            ['  Total Executions:', chalk.cyan(executionStats.totalExecutions), '  Pass Rate:'],
            ['', '', passRateColor.bold(`${executionStats.passRate}%`)]
        );
        
        console.log(table.toString());
    }
    
    displayStatusBreakdown(statusStats) {
        console.log(chalk.blue.bold('│  📊 Status Breakdown                                           │'));
        console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────┤'));
        
        const total = Object.values(statusStats).reduce((sum, count) => sum + count, 0);
        
        if (total === 0) {
            console.log('│  No test executions yet                                        │');
            return;
        }
        
        const table = new Table({
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
                'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
                'left': '│', 'left-mid': '', 'mid': '', 'mid-mid': '',
                'right': '│', 'right-mid': ''
            },
            colWidths: [20, 10, 15, 20],
            wordWrap: true
        });
        
        const statusOrder = ['Pass', 'Fail', 'Blocked', 'Skip', 'Not_Executed'];
        const statusColors = {
            'Pass': chalk.green,
            'Fail': chalk.red,
            'Blocked': chalk.yellow,
            'Skip': chalk.gray,
            'Not_Executed': chalk.white
        };
        
        statusOrder.forEach(status => {
            const count = statusStats[status] || 0;
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const color = statusColors[status] || chalk.white;
            
            table.push([
                `  ${color('●')} ${status}:`,
                color.bold(count),
                color(`${percentage}%`),
                this.generateProgressBar(count, total, color)
            ]);
        });
        
        console.log(table.toString());
    }
    
    generateProgressBar(value, total, color, length = 15) {
        if (total === 0) return '';
        
        const percentage = value / total;
        const filled = Math.round(percentage * length);
        const empty = length - filled;
        
        return color('█'.repeat(filled)) + '░'.repeat(empty);
    }
    
    // Generate detailed statistics
    generateDetailedStats(options = {}) {
        const stats = this.testManager.getOverallStatistics();
        
        if (options.testSet) {
            const testSet = this.testManager.getTestSet(options.testSet);
            if (!testSet) {
                throw new Error(`Test set ${options.testSet} not found`);
            }
            
            const testSetStats = testSet.getExecutionStats(this.testManager);
            return this.formatTestSetStats(testSet, testSetStats);
        }
        
        return this.formatOverallStats(stats);
    }
    
    formatOverallStats(stats) {
        const output = [];
        
        output.push('📊 OVERALL STATISTICS');
        output.push('═'.repeat(50));
        output.push('');
        
        // Test Cases
        output.push('📋 Test Cases:');
        output.push(`   Total: ${stats.testCases.total}`);
        output.push(`   By Priority:`);
        Object.entries(stats.testCases.byPriority).forEach(([priority, count]) => {
            output.push(`     ${priority}: ${count}`);
        });
        output.push(`   By Category:`);
        Object.entries(stats.testCases.byCategory).forEach(([category, count]) => {
            output.push(`     ${category}: ${count}`);
        });
        output.push('');
        
        // Test Sets
        output.push('🗂️  Test Sets:');
        output.push(`   Total: ${stats.testSets.total}`);
        output.push(`   Active: ${stats.testSets.active}`);
        output.push(`   Completed: ${stats.testSets.completed}`);
        output.push(`   Blocked: ${stats.testSets.blocked}`);
        output.push('');
        
        // Execution
        output.push('⚡ Execution:');
        output.push(`   Total Executions: ${stats.execution.totalExecutions}`);
        output.push(`   Pass Rate: ${stats.execution.passRate}%`);
        output.push('');
        
        // Status Breakdown
        output.push('📈 Status Breakdown:');
        Object.entries(stats.testCases.byStatus).forEach(([status, count]) => {
            const total = Object.values(stats.testCases.byStatus).reduce((sum, c) => sum + c, 0);
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            output.push(`   ${status}: ${count} (${percentage}%)`);
        });
        
        return output.join('\n');
    }
    
    formatTestSetStats(testSet, stats) {
        const output = [];
        
        output.push(`📊 TEST SET STATISTICS: ${testSet.name}`);
        output.push('═'.repeat(50));
        output.push('');
        
        output.push('ℹ️  General Info:');
        output.push(`   ID: ${testSet.id}`);
        output.push(`   Category: ${testSet.category}`);
        output.push(`   Priority: ${testSet.priority}`);
        output.push(`   Status: ${testSet.status}`);
        output.push(`   Assigned To: ${testSet.assignedTo || 'Unassigned'}`);
        output.push('');
        
        output.push('📈 Execution Progress:');
        output.push(`   Total Test Cases: ${stats.totalTestCases}`);
        output.push(`   Executed: ${stats.executed} (${stats.executionProgress}%)`);
        output.push(`   Not Executed: ${stats.notExecuted}`);
        output.push('');
        
        output.push('✅ Results Breakdown:');
        output.push(`   Passed: ${stats.passed}`);
        output.push(`   Failed: ${stats.failed}`);
        output.push(`   Blocked: ${stats.blocked}`);
        output.push(`   Pass Rate: ${stats.passRate}%`);
        
        return output.join('\n');
    }
    
    // Generate HTML report
    generateHTMLReport(options = {}) {
        const stats = this.testManager.getOverallStatistics();
        const timestamp = new Date().toISOString();
        
        let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Case Manager - Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .timestamp { color: #666; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .stat-card h3 { margin: 0 0 15px 0; color: #333; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-list { list-style: none; padding: 0; margin: 10px 0; }
        .stat-list li { padding: 5px 0; display: flex; justify-content: space-between; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .status-item { padding: 15px; border-radius: 6px; text-align: center; color: white; font-weight: bold; }
        .status-pass { background: #28a745; }
        .status-fail { background: #dc3545; }
        .status-blocked { background: #ffc107; color: #212529; }
        .status-skip { background: #6c757d; }
        .status-not-executed { background: #e9ecef; color: #212529; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Case Manager - Execution Report</h1>
            <div class="timestamp">Generated on: ${new Date(timestamp).toLocaleString()}</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📋 Test Cases Overview</h3>
                <div class="stat-number">${stats.testCases.total}</div>
                <div>Total Test Cases</div>
                <ul class="stat-list">
                    ${Object.entries(stats.testCases.byPriority).map(([priority, count]) => 
                        `<li><span>${priority}:</span><span>${count}</span></li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="stat-card">
                <h3>🗂️ Test Sets</h3>
                <div class="stat-number">${stats.testSets.total}</div>
                <div>Total Test Sets</div>
                <ul class="stat-list">
                    <li><span>Active:</span><span>${stats.testSets.active}</span></li>
                    <li><span>Completed:</span><span>${stats.testSets.completed}</span></li>
                    <li><span>Blocked:</span><span>${stats.testSets.blocked}</span></li>
                </ul>
            </div>
            
            <div class="stat-card">
                <h3>⚡ Execution Summary</h3>
                <div class="stat-number">${stats.execution.passRate}%</div>
                <div>Pass Rate</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.execution.passRate}%"></div>
                </div>
                <div>Total Executions: ${stats.execution.totalExecutions}</div>
            </div>
        </div>
        
        <h3>📊 Status Breakdown</h3>
        <div class="status-grid">
            ${Object.entries(stats.testCases.byStatus).map(([status, count]) => {
                const statusClass = `status-${status.toLowerCase().replace('_', '-')}`;
                const total = Object.values(stats.testCases.byStatus).reduce((sum, c) => sum + c, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                return `<div class="status-item ${statusClass}">
                    <div style="font-size: 24px;">${count}</div>
                    <div>${status}</div>
                    <div>(${percentage}%)</div>
                </div>`;
            }).join('')}
        </div>
        
        <div class="footer">
            <p>Generated by Test Case Manager v1.0.0</p>
            <p>🚀 Making test case management effortless for engineering teams worldwide.</p>
        </div>
    </div>
</body>
</html>`;
        
        return htmlContent;
    }
    
    // Save report to file
    async saveReport(content, filePath, format = 'html') {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, content);
            return {
                success: true,
                filePath,
                format,
                size: Buffer.byteLength(content, 'utf8')
            };
        } catch (error) {
            throw new Error(`Failed to save report: ${error.message}`);
        }
    }
}

module.exports = DashboardService;